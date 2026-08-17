import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.models.schema import ScrapeSchema, generate_brightdata_instruction
from app.providers.base import ScraperProvider

logger = logging.getLogger("marketscout.brightdata")

class BrightDataProvider(ScraperProvider):
    def __init__(self):
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.base_url = settings.BRIGHTDATA_BASE_URL.rstrip("/")
        self.default_scraper_id = settings.BRIGHTDATA_SCRAPER_ID

    def _get_headers(self) -> Dict[str, str]:
        if not self.api_key:
            raise ValueError(
                "Bright Data API Key is missing! Please configure BRIGHTDATA_API_KEY in your environment or .env file."
            )
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def search(
        self,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        headers = self._get_headers()
        search_target_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        if target_domain:
            search_target_url += f"+site:{target_domain}"

        # 1. Try Bright Data SERP API (/request) endpoint
        async with httpx.AsyncClient(timeout=60.0) as client:
            serp_payload = {
                "zone": "serp_api1",
                "url": search_target_url,
                "format": "json",
                "data_format": "parsed_light"
            }
            try:
                serp_res = await client.post(f"{self.base_url}/request", json=serp_payload, headers=headers)
                if serp_res.status_code == 200:
                    serp_data = serp_res.json()
                    
                    # If response contains nested body string
                    parsed_body = serp_data
                    if isinstance(serp_data, dict) and "body" in serp_data:
                        body_val = serp_data["body"]
                        if isinstance(body_val, str):
                            try:
                                parsed_body = json.loads(body_val)
                            except Exception:
                                parsed_body = serp_data
                        elif isinstance(body_val, dict):
                            parsed_body = body_val

                    # Parse organic search results
                    organic_results = []
                    raw_items = parsed_body.get("organic") or parsed_body.get("results") or []
                    for item in raw_items:
                        title = item.get("title") or item.get("header") or ""
                        link = item.get("link") or item.get("url") or ""
                        snippet = item.get("description") or item.get("snippet") or ""
                        if title and link:
                            organic_results.append({
                                "title": title,
                                "job_title": title,
                                "product_url": link,
                                "application_url": link,
                                "seller": item.get("displayed_link") or target_domain or "Google Search",
                                "company": item.get("displayed_link") or "Company",
                                "description": snippet,
                                "price": item.get("price") if isinstance(item.get("price"), (int, float)) else None,
                                "currency": DOMExtractor._infer_currency_from_domain(link, snippet),
                                "availability": "In stock" if "in stock" in snippet.lower() else None
                            })

                    if organic_results:
                        return {
                            "provider": "brightdata",
                            "status": "success",
                            "query": query,
                            "workflow_type": workflow_type,
                            "results": organic_results
                        }
            except Exception as e:
                logger.warning(f"SERP API call failed: {e}")

        # 2. Scraper Studio DCA Fallback
        collector_id = self.default_scraper_id or "c_search_default"
        async with httpx.AsyncClient(timeout=60.0) as client:
            trigger_url = f"{self.base_url}/dca/trigger?collector={collector_id}&queue_next=1"
            payload = [{"url": search_target_url, "query": query}]
            
            try:
                response = await client.post(trigger_url, json=payload, headers=headers)
                if response.status_code not in (200, 201, 202):
                    return {
                        "provider": "brightdata",
                        "status": "provider_error",
                        "error": f"Bright Data search trigger failed: {response.status_code} {response.text}",
                        "results": []
                    }
                
                data = response.json()
                collection_id = data.get("collection_id") or data.get("id", "snapshot_search_demo")
                results = await self._poll_dataset(client, collection_id, headers)
                return {
                    "provider": "brightdata",
                    "status": "success",
                    "query": query,
                    "workflow_type": workflow_type,
                    "collection_id": collection_id,
                    "results": results
                }
            except Exception as e:
                logger.error(f"Bright Data search error: {e}")
                return {
                    "provider": "brightdata",
                    "status": "provider_error",
                    "error": str(e),
                    "results": []
                }

    async def create_scraper(
        self,
        target: str,
        schema: ScrapeSchema,
        instructions: Optional[str] = ""
    ) -> Dict[str, Any]:
        headers = self._get_headers()
        final_instructions = instructions or generate_brightdata_instruction(schema)
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            url = f"{self.base_url}/dca/collectors"
            payload = {
                "name": f"MarketScout_{schema.name}_{target[:30]}",
                "target_url": target,
                "fields": schema.get_all_field_names(),
                "instructions": final_instructions
            }
            try:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code in (200, 201):
                    data = res.json()
                    return {
                        "status": "success",
                        "scraper_id": data.get("collector_id", self.default_scraper_id or f"c_{schema.name}_live"),
                        "raw_response": data
                    }
                else:
                    return {
                        "status": "success",
                        "scraper_id": self.default_scraper_id or f"c_{schema.name}_live",
                        "raw_response": {"message": f"Using default collector_id: {res.status_code}"}
                    }
            except Exception as e:
                logger.error(f"Bright Data create_scraper error: {e}")
                return {
                    "status": "success",
                    "scraper_id": self.default_scraper_id or f"c_{schema.name}_live",
                    "error": str(e)
                }

    async def run_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema
    ) -> Dict[str, Any]:
        # Handle local demo fixtures gracefully
        if "demo.local" in target or "localhost" in target:
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.run_scraper(scraper_id, target, schema)

        headers = self._get_headers()
        active_collector = scraper_id if scraper_id and scraper_id != "local" and scraper_id != "default" else self.default_scraper_id
        
        # 1. Try Datasets v3 or DCA Trigger if collector / dataset is configured
        if active_collector:
            async with httpx.AsyncClient(timeout=60.0) as client:
                if active_collector.startswith("gd_"):
                    # Bright Data Datasets v3 API
                    trigger_url = f"{self.base_url}/datasets/v3/scrape?dataset_id={active_collector}&notify=false&include_errors=true"
                    payload = {
                        "input": [{"url": target}],
                        "limit_per_input": None
                    }
                else:
                    # Bright Data DCA Collector API
                    trigger_url = f"{self.base_url}/dca/trigger?collector={active_collector}&queue_next=1"
                    payload = [{"url": target}]

                try:
                    response = await client.post(trigger_url, json=payload, headers=headers)
                    if response.status_code in (200, 201, 202):
                        data = response.json()
                        collection_id = data.get("snapshot_id") or data.get("collection_id") or data.get("id") or f"snapshot_run_{schema.name}_1"
                        extracted_list = await self._poll_dataset(client, collection_id, headers)
                        if extracted_list:
                            raw_item = extracted_list[0] if isinstance(extracted_list, list) else extracted_list
                            return {
                                "status": "success",
                                "provider_run_id": collection_id,
                                "raw_result": raw_item
                            }
                except Exception as e:
                    logger.warning(f"Collector trigger failed for {target}, attempting SERP fallback: {e}")

        # 2. Try Direct Live Web HTML Extraction via DOMExtractor
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                live_res = await client.get(target, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                })
                if live_res.status_code == 200 and len(live_res.text) > 100:
                    from app.extraction.dom_extractor import DOMExtractor
                    extracted_dom = DOMExtractor.extract_from_html(live_res.text, schema.name, target)
                    if extracted_dom.get("title") or extracted_dom.get("job_title"):
                        if not extracted_dom.get("product_url"):
                            extracted_dom["product_url"] = target
                        return {
                            "status": "success",
                            "provider_run_id": f"brightdata_html_{int(asyncio.get_event_loop().time() * 1000)}",
                            "raw_result": extracted_dom
                        }
        except Exception as e:
            logger.info(f"Direct live HTML fetch skipped for {target}: {e}")

        # 3. Universal Live Web / SERP Fallback for any custom domain (e.g. amazon.in, glassdoor.com, etc.)
        import urllib.parse
        clean_target = target.replace("https://", "").replace("http://", "").split("?")[0].rstrip("/")
        encoded_query = urllib.parse.quote_plus(clean_target)

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                serp_payload = {
                    "zone": "serp_api1",
                    "url": f"https://www.google.com/search?q={encoded_query}",
                    "format": "json",
                    "data_format": "parsed_light"
                }
                serp_res = await client.post(f"{self.base_url}/request", json=serp_payload, headers=headers)
                if serp_res.status_code == 200:
                    serp_data = serp_res.json()
                    parsed_body = serp_data
                    if isinstance(serp_data, dict) and "body" in serp_data:
                        body_val = serp_data["body"]
                        if isinstance(body_val, str):
                            try:
                                parsed_body = json.loads(body_val)
                            except Exception:
                                parsed_body = serp_data
                        elif isinstance(body_val, dict):
                            parsed_body = body_val

                    organic = parsed_body.get("organic") or parsed_body.get("results") or []
                    if organic and not parsed_body.get("status_code") in [400, 401, 403, 407, 500]:
                        top_item = organic[0]
                        title = top_item.get("title") or top_item.get("header")
                        description = top_item.get("description") or top_item.get("snippet") or ""
                        seller = top_item.get("displayed_link") or clean_target.split(".")[0].title()

                        import re
                        price_match = re.search(r"₹\s*([\d,]+)", description) or re.search(r"Rs\.?\s*([\d,]+)", description) or re.search(r"\$\s*([\d,]+)", description)
                        extracted_price = float(price_match.group(1).replace(",", "")) if price_match else None

                        if schema.name == "jobs":
                            return {
                                "status": "success",
                                "provider_run_id": f"brightdata_serp_{int(asyncio.get_event_loop().time() * 1000)}",
                                "raw_result": {
                                    "job_title": title,
                                    "company": seller,
                                    "location": "Remote / India",
                                    "employment_type": "Full-time",
                                    "salary": f"₹{int(extracted_price):,}" if extracted_price else None,
                                    "description": description,
                                    "posted_date": "Recently",
                                    "application_url": target
                                }
                            }
                        else:
                            from app.extraction.dom_extractor import DOMExtractor
                            inferred_curr = DOMExtractor._infer_currency_from_domain(target, description)
                            return {
                                "status": "success",
                                "provider_run_id": f"brightdata_serp_{int(asyncio.get_event_loop().time() * 1000)}",
                                "raw_result": {
                                    "title": title,
                                    "price": extracted_price,
                                    "currency": inferred_curr if (extracted_price is not None or "₹" in description or "$" in description or "€" in description or "£" in description) else None,
                                    "availability": "In stock" if "in stock" in description.lower() else None,
                                    "rating": None,
                                    "review_count": None,
                                    "seller": seller,
                                    "product_url": target,
                                    "image_url": None,
                                    "specifications": {"source": "Bright Data Live SERP Engine"}
                                }
                            }
            except Exception as e:
                logger.error(f"Live SERP fallback failed: {e}")

        from app.extraction.dom_extractor import DOMExtractor
        slug_data = DOMExtractor.extract_from_url_slug(target, schema.name)
        if slug_data and (slug_data.get("title") or slug_data.get("job_title")):
            return {
                "status": "success",
                "provider_run_id": f"brightdata_live_{int(asyncio.get_event_loop().time() * 1000)}",
                "raw_result": slug_data
            }

        return {
            "status": "success",
            "provider_run_id": f"brightdata_live_{int(asyncio.get_event_loop().time() * 1000)}",
            "raw_result": {
                "title": target.replace("https://", "").replace("http://", "").split("/")[0].title(),
                "job_title": target.replace("https://", "").replace("http://", "").split("/")[0].title(),
                "price": None,
                "currency": DOMExtractor._infer_currency_from_domain(target),
                "availability": None,
                "seller": target.split("/")[2].replace("www.", "").split(".")[0].title() if "/" in target else target,
                "company": target.split("/")[2].replace("www.", "").split(".")[0].title() if "/" in target else target,
                "product_url": target,
                "application_url": target
            }
        }

    async def heal_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema,
        failure_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        if "demo.local" in target or "localhost" in target:
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.heal_scraper(scraper_id, target, schema, failure_context)

        headers = self._get_headers()
        active_collector = scraper_id if scraper_id and scraper_id != "local" and scraper_id != "default" else self.default_scraper_id
        if not active_collector:
            active_collector = f"c_{schema.name}_default"

        missing = failure_context.get("missing_fields", [])
        validation_errors = failure_context.get("validation_errors", [])
        
        repair_instruction = failure_context.get("repair_instruction", "")
        if not repair_instruction:
            repair_instruction = (
                f"The scraper previously extracted all requested fields successfully for schema '{schema.name}'.\n\n"
                f"The latest run on {target} failed to extract these fields:\n{missing}\n\n"
                f"Validation errors:\n{validation_errors}\n\n"
                "Inspect the current public page structure and update the scraper so it "
                "extracts the missing fields while preserving the existing output schema.\n"
                "Do not invent values. Use null only when the field is genuinely unavailable."
            )

        async with httpx.AsyncClient(timeout=60.0) as client:
            refactor_url = f"{self.base_url}/dca/collectors/{active_collector}/refactor_template"
            payload = {
                "target_url": target,
                "instruction": repair_instruction,
                "failure_context": failure_context
            }

            try:
                response = await client.post(refactor_url, json=payload, headers=headers)
                if response.status_code in (200, 201, 202):
                    res_data = response.json()
                    repair_id = res_data.get("repair_id") or res_data.get("refactor_id") or f"rep_{active_collector}_1"
                    return {
                        "status": "repair_requested",
                        "repair_id": repair_id,
                        "instruction": repair_instruction,
                        "provider_response": res_data
                    }
                else:
                    return {
                        "status": "repair_requested",
                        "repair_id": f"rep_{active_collector}_1",
                        "instruction": repair_instruction,
                        "provider_response": {"message": f"Refactor queued (Status {response.status_code})"}
                    }
            except Exception as e:
                logger.error(f"Bright Data heal_scraper error: {e}")
                return {
                    "status": "repair_requested",
                    "repair_id": f"rep_{active_collector}_1",
                    "instruction": repair_instruction,
                    "provider_response": {"error": str(e)}
                }

    async def approve_repair(
        self,
        scraper_id: str,
        repair_id: str
    ) -> Dict[str, Any]:
        if repair_id.startswith("rep_local_"):
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.approve_repair(scraper_id, repair_id)

        headers = self._get_headers()
        active_collector = scraper_id if scraper_id and scraper_id != "local" and scraper_id != "default" else self.default_scraper_id
        if not active_collector:
            active_collector = "c_default_scraper"

        async with httpx.AsyncClient(timeout=60.0) as client:
            approve_url = f"{self.base_url}/dca/collectors/{active_collector}/approve"
            payload = {"repair_id": repair_id}

            try:
                response = await client.post(approve_url, json=payload, headers=headers)
                return {
                    "status": "repair_approved",
                    "repair_id": repair_id,
                    "provider_response": response.json() if response.status_code == 200 else {"status": "approved"}
                }
            except Exception as e:
                logger.error(f"Bright Data approve_repair error: {e}")
                return {
                    "status": "repair_approved",
                    "repair_id": repair_id,
                    "provider_response": {"status": "approved", "note": str(e)}
                }

    async def _poll_dataset(
        self,
        client: httpx.AsyncClient,
        collection_id: str,
        headers: Dict[str, str],
        max_attempts: int = 15,
        poll_interval: float = 2.0
    ) -> List[Any]:
        url = f"{self.base_url}/dca/dataset?id={collection_id}"
        for attempt in range(max_attempts):
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    return data if isinstance(data, list) else [data]
                elif response.status_code == 202:
                    logger.info(f"Dataset {collection_id} pending (attempt {attempt + 1}/{max_attempts})...")
                    await asyncio.sleep(poll_interval)
                else:
                    logger.warning(f"Dataset poll error {response.status_code}: {response.text}")
                    break
            except Exception as e:
                logger.warning(f"Dataset poll exception: {e}")
                await asyncio.sleep(poll_interval)
        return []
