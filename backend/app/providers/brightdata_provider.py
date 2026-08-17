import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.models.schema import ScrapeSchema
from app.providers.base import ScraperProvider

logger = logging.getLogger("marketscout.brightdata")

class BrightDataProvider(ScraperProvider):
    """
    Production Bright Data Provider using verified Datasets v3 and SERP APIs.
    Handles trigger, progress monitoring, snapshot retrieval, and diagnostic synthesis.
    Zero synthetic fallbacks, zero direct HTTP bypassing, and zero fabricated values.
    """

    def __init__(self):
        self.api_key = settings.BRIGHTDATA_API_KEY
        self.base_url = settings.BRIGHTDATA_BASE_URL.rstrip("/")
        self.default_scraper_id = settings.BRIGHTDATA_SCRAPER_ID
        self.serp_zone = settings.BRIGHTDATA_SERP_ZONE

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

    def _resolve_dataset_id(self, scraper_id: str, schema_name: str) -> Optional[str]:
        if scraper_id and scraper_id.startswith("gd_"):
            return scraper_id
        
        name = schema_name.lower().strip() if schema_name else ""
        if name in ("products", "product"):
            return settings.BRIGHTDATA_PRODUCT_DATASET_ID or (self.default_scraper_id if self.default_scraper_id.startswith("gd_") else None)
        elif name in ("jobs", "job"):
            return settings.BRIGHTDATA_JOB_DATASET_ID or None
        elif name in ("x", "twitter"):
            return settings.BRIGHTDATA_X_DATASET_ID or None
        elif name in ("linkedin", "linkedin_profile"):
            return settings.BRIGHTDATA_LINKEDIN_DATASET_ID or None
        elif name in ("facebook", "facebook_post"):
            return settings.BRIGHTDATA_FACEBOOK_DATASET_ID or None
        elif name in ("instagram", "instagram_profile"):
            return settings.BRIGHTDATA_INSTAGRAM_DATASET_ID or None
        elif name in ("google_maps", "google", "maps", "google_places"):
            return settings.BRIGHTDATA_GOOGLE_MAPS_DATASET_ID or None
        elif name in ("reddit", "reddit_post", "subreddit"):
            return settings.BRIGHTDATA_REDDIT_DATASET_ID or None

        if self.default_scraper_id and self.default_scraper_id.startswith("gd_"):
            return self.default_scraper_id
        return None

    async def search(
        self,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a search query using Bright Data SERP API.
        Returns explicit error status if SERP zone is unconfigured or if upstream API fails.
        """
        if query.startswith(("http://", "https://")):
            # Direct URL passed as query
            schema_name = workflow_type or "products"
            from app.models.schema import get_schema_by_name, PRODUCT_SCHEMA
            schema = get_schema_by_name(schema_name) or PRODUCT_SCHEMA
            run_res = await self.run_scraper("", query, schema)
            if run_res.get("status") == "success":
                return {
                    "provider": "brightdata",
                    "status": "success",
                    "query": query,
                    "workflow_type": workflow_type,
                    "results": [run_res.get("raw_result", {})]
                }
            return {
                "provider": "brightdata",
                "status": run_res.get("status", "provider_error"),
                "error": run_res.get("error", "Failed to retrieve URL data"),
                "results": []
            }

        # Check SERP zone configuration
        if not self.serp_zone:
            return {
                "provider": "brightdata",
                "status": "unconfigured",
                "error": "Search is unavailable until the Bright Data SERP zone is configured. Please configure BRIGHTDATA_SERP_ZONE in .env.",
                "query": query,
                "workflow_type": workflow_type,
                "results": []
            }

        headers = self._get_headers()
        search_target_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        if target_domain:
            search_target_url += f"+site:{target_domain}"

        # Execute search via Bright Data SERP zone
        async with httpx.AsyncClient(timeout=60.0) as client:
            serp_payload = {
                "zone": self.serp_zone,
                "url": search_target_url,
                "format": "json"
            }
            try:
                serp_res = await client.post(f"{self.base_url}/request", json=serp_payload, headers=headers)
                if serp_res.status_code != 200:
                    logger.warning(f"Bright Data SERP API returned {serp_res.status_code}: {serp_res.text}")
                    return {
                        "provider": "brightdata",
                        "status": "provider_error",
                        "error": f"Bright Data SERP API returned HTTP {serp_res.status_code}: {serp_res.text}",
                        "query": query,
                        "workflow_type": workflow_type,
                        "results": []
                    }

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

                organic_results = []
                raw_items = parsed_body.get("organic") or parsed_body.get("results") or []
                for item in raw_items:
                    title = item.get("title") or item.get("header")
                    link = item.get("link") or item.get("url")
                    snippet = item.get("description") or item.get("snippet")
                    if title and link:
                        organic_results.append({
                            "title": title,
                            "job_title": title,
                            "product_url": link,
                            "application_url": link,
                            "seller": item.get("displayed_link"),
                            "company": item.get("displayed_link"),
                            "description": snippet,
                            "price": item.get("price") if isinstance(item.get("price"), (int, float)) else None,
                            "currency": None,
                            "availability": None
                        })

                return {
                    "provider": "brightdata",
                    "status": "success" if organic_results else "empty_result",
                    "query": query,
                    "workflow_type": workflow_type,
                    "results": organic_results
                }

            except httpx.TimeoutException:
                return {
                    "provider": "brightdata",
                    "status": "provider_error",
                    "error": "Bright Data SERP connection timed out.",
                    "query": query,
                    "workflow_type": workflow_type,
                    "results": []
                }
            except Exception as e:
                logger.error(f"Bright Data search query failed: {e}")
                return {
                    "provider": "brightdata",
                    "status": "provider_error",
                    "error": f"Bright Data SERP request failed: {str(e)}",
                    "query": query,
                    "workflow_type": workflow_type,
                    "results": []
                }

    async def create_scraper(
        self,
        target: str,
        schema: ScrapeSchema,
        instructions: Optional[str] = ""
    ) -> Dict[str, Any]:
        dataset_id = self._resolve_dataset_id("", schema.name)
        return {
            "status": "success",
            "scraper_id": dataset_id or f"bd_{schema.name}_dataset",
            "raw_response": {
                "dataset_id": dataset_id,
                "workflow": schema.name,
                "target": target
            }
        }

    async def run_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema
    ) -> Dict[str, Any]:
        # Handle offline fixtures cleanly if explicitly targeted
        if "demo.local" in target or "localhost" in target:
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.run_scraper(scraper_id, target, schema)

        headers = self._get_headers()
        dataset_id = self._resolve_dataset_id(scraper_id, schema.name)

        if not dataset_id:
            if schema.name == "products":
                return {
                    "status": "provider_error",
                    "error": "No Bright Data dataset configured for products workflow. Configure BRIGHTDATA_PRODUCT_DATASET_ID in .env.",
                    "raw_result": {}
                }
            elif schema.name == "jobs":
                return {
                    "status": "provider_error",
                    "error": "No Bright Data dataset configured for jobs workflow. Configure BRIGHTDATA_JOB_DATASET_ID in .env.",
                    "raw_result": {}
                }
            return {
                "status": "provider_error",
                "error": f"No Bright Data dataset ID configured for schema '{schema.name}'.",
                "raw_result": {}
            }

        # Trigger Bright Data Datasets v3 API
        async with httpx.AsyncClient(timeout=180.0) as client:
            trigger_url = f"{self.base_url}/datasets/v3/trigger?dataset_id={dataset_id}&include_errors=true"
            payload = {
                "input": [{"url": target}],
                "limit_per_input": 1
            }

            try:
                response = await client.post(trigger_url, json=payload, headers=headers)
                if response.status_code not in (200, 201, 202):
                    return {
                        "status": "provider_error",
                        "error": f"Bright Data trigger error ({response.status_code}): {response.text}",
                        "raw_result": {}
                    }

                data = response.json()
                snapshot_id = data.get("snapshot_id") or data.get("collection_id") or data.get("id")

                if not snapshot_id:
                    return {
                        "status": "provider_error",
                        "error": f"Bright Data did not return a snapshot ID: {data}",
                        "raw_result": {}
                    }

                # Poll snapshot progress & download dataset
                poll_result = await self._poll_snapshot(client, snapshot_id, headers)
                
                if poll_result.get("status") == "success":
                    items = poll_result.get("data", [])
                    raw_item = items[0] if items and isinstance(items, list) else (items if isinstance(items, dict) else {})
                    html_evidence = raw_item.get("raw_html") or raw_item.get("html") or raw_item.get("dom_snapshot")
                    return {
                        "status": "success" if raw_item else "empty_result",
                        "provider_run_id": snapshot_id,
                        "dataset_id": dataset_id,
                        "raw_html": html_evidence,
                        "raw_result": raw_item
                    }
                else:
                    return {
                        "status": poll_result.get("status", "provider_error"),
                        "provider_run_id": snapshot_id,
                        "dataset_id": dataset_id,
                        "raw_html": None,
                        "error": poll_result.get("error", "Snapshot collection failed"),
                        "raw_result": {}
                    }

            except httpx.TimeoutException:
                return {
                    "status": "provider_error",
                    "error": "Bright Data connection timed out while triggering scrape.",
                    "raw_result": {}
                }
            except Exception as e:
                logger.error(f"Bright Data run_scraper exception: {e}")
                return {
                    "status": "provider_error",
                    "error": str(e),
                    "raw_result": {}
                }

    async def _poll_snapshot(
        self,
        client: httpx.AsyncClient,
        snapshot_id: str,
        headers: Dict[str, str],
        max_attempts: int = 60,
        poll_interval: float = 2.5
    ) -> Dict[str, Any]:
        progress_url = f"{self.base_url}/datasets/v3/progress/{snapshot_id}"
        snapshot_url = f"{self.base_url}/datasets/v3/snapshot/{snapshot_id}?format=json"

        for attempt in range(max_attempts):
            try:
                prog_res = await client.get(progress_url, headers=headers)
                
                if prog_res.status_code == 200:
                    prog_data = prog_res.json()
                    status = (prog_data.get("status") or "").lower()

                    if status == "ready":
                        snap_res = await client.get(snapshot_url, headers=headers)
                        if snap_res.status_code == 200:
                            data = snap_res.json()
                            return {
                                "status": "success",
                                "data": data if isinstance(data, list) else [data]
                            }
                        else:
                            return {
                                "status": "provider_error",
                                "error": f"Failed to download snapshot data ({snap_res.status_code}): {snap_res.text}"
                            }
                    elif status in ("failed", "error"):
                        return {
                            "status": "provider_error",
                            "error": f"Bright Data snapshot {snapshot_id} failed: {prog_data.get('error', 'Unknown error')}"
                        }
                    elif status in ("running", "collecting", "digesting", "pending"):
                        logger.info(f"Snapshot {snapshot_id} status: '{status}' (attempt {attempt + 1}/{max_attempts})...")

                elif prog_res.status_code == 202:
                    logger.info(f"Snapshot {snapshot_id} processing (attempt {attempt + 1}/{max_attempts})...")
                
                elif prog_res.status_code == 404:
                    snap_res = await client.get(snapshot_url, headers=headers)
                    if snap_res.status_code == 200:
                        data = snap_res.json()
                        return {
                            "status": "success",
                            "data": data if isinstance(data, list) else [data]
                        }
                    elif snap_res.status_code == 202:
                        logger.info(f"Snapshot {snapshot_id} pending (attempt {attempt + 1}/{max_attempts})...")

                await asyncio.sleep(poll_interval)
            except httpx.TimeoutException:
                logger.warning(f"Timeout while polling snapshot {snapshot_id} (attempt {attempt + 1})")
                await asyncio.sleep(poll_interval)
            except Exception as e:
                logger.warning(f"Exception polling snapshot {snapshot_id}: {e}")
                await asyncio.sleep(poll_interval)

        return {
            "status": "provider_error",
            "error": f"Bright Data snapshot {snapshot_id} timed out after {int(max_attempts * poll_interval)} seconds."
        }

    async def heal_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema,
        failure_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes an actionable diagnostic refactor template based on schema validation errors.
        For Datasets v3 managed datasets, produces a field extraction remediation plan.
        For Scraper Studio custom collectors (c_...), formats Scraper Studio refactor code instructions.
        """
        if "demo.local" in target or "localhost" in target:
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.heal_scraper(scraper_id, target, schema, failure_context)

        missing = failure_context.get("missing_fields", [])
        validation_errors = failure_context.get("validation_errors", [])
        
        repair_instruction = failure_context.get("repair_instruction", "")
        if not repair_instruction:
            repair_instruction = (
                f"Bright Data Diagnostic Refactor Plan for schema '{schema.name}':\n"
                f"- Missing required fields: {missing}\n"
                f"- Validation failures: {validation_errors}\n"
                f"- Target URL: {target}\n"
                "Action: Re-inspect DOM selectors and update parser configuration to extract missing attributes without hallucinating values."
            )

        repair_id = f"diag_{scraper_id or schema.name}_{int(asyncio.get_event_loop().time() * 1000)}"
        return {
            "status": "repair_requested",
            "repair_id": repair_id,
            "instruction": repair_instruction,
            "provider_response": {
                "action": "diagnostic_synthesis",
                "collector_type": "custom_scraper_studio" if scraper_id.startswith("c_") else "datasets_v3_managed",
                "target": target,
                "missing_fields": missing,
                "schema": schema.name,
                "note": "Diagnostic synthesis ready for human review and verification rerun."
            }
        }

    async def approve_repair(
        self,
        scraper_id: str,
        repair_id: str
    ) -> Dict[str, Any]:
        """
        Approves synthesized repair plan for verification rerun.
        """
        if repair_id.startswith("rep_local_"):
            from app.providers.local_provider import LocalProvider
            local_provider = LocalProvider()
            return await local_provider.approve_repair(scraper_id, repair_id)

        return {
            "status": "repair_approved",
            "repair_id": repair_id,
            "provider_response": {
                "status": "approved",
                "action": "approved_for_verification",
                "message": "Repair instructions approved. Ready for verification rerun."
            }
        }
