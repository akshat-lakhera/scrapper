import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings
from app.models.schema import ScrapeSchema
from app.providers.base import ScraperProvider
from app.extraction.dom_extractor import DOMExtractor

OFFLINE_MODE_LABEL = "Offline test mode — not live Bright Data data"

class LocalProvider(ScraperProvider):
    """
    Offline test provider for unit tests and local development.
    Extracts real data from local HTML fixtures via DOMExtractor.
    """

    def __init__(self):
        self.fixtures_dir = Path(settings.FIXTURES_DIR)

    async def search(
        self,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        results = []
        if workflow_type == "jobs":
            results = [
                {
                    "job_title": f"{query.title()} Engineer",
                    "company": target_domain or "Hiring Company",
                    "location": "Remote / Hybrid",
                    "employment_type": "Full-time",
                    "salary": None,
                    "description": f"Role matching query '{query}' in {target_domain or 'market'}.",
                    "posted_date": "Recently",
                    "application_url": f"https://{target_domain or 'demo.local'}/jobs/{query.lower().replace(' ', '-')}"
                }
            ]
        else:
            # Parse all real HTML fixtures in fixtures_dir dynamically
            for fixture_path in self.fixtures_dir.glob("*.html"):
                if "broken" in fixture_path.name:
                    continue
                extracted = DOMExtractor.extract_from_fixture(fixture_path, "products", f"https://demo.local/{fixture_path.name}")
                if extracted and extracted.get("title"):
                    results.append(extracted)

        return {
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "status": "success",
            "query": query,
            "workflow_type": workflow_type,
            "results": results
        }

    async def create_scraper(
        self,
        target: str,
        schema: ScrapeSchema,
        instructions: Optional[str] = ""
    ) -> Dict[str, Any]:
        return {
            "status": "success",
            "scraper_id": f"local_{schema.name}_scraper",
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL
        }

    async def run_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema
    ) -> Dict[str, Any]:
        # 1. Job workflow
        if schema.name == "jobs":
            if "repaired" in target:
                raw = {
                    "job_title": "Senior Python Developer",
                    "company": "TechCorp India",
                    "location": "Remote, India",
                    "employment_type": "Full-time",
                    "salary": "₹2,500,000 / yr",
                    "description": "Building high-throughput backend services.",
                    "posted_date": "2026-08-15",
                    "application_url": target
                }
            elif "degraded" in target or "broken" in target:
                raw = {
                    "job_title": "Senior Python Developer",
                    "company": None,
                    "location": "Remote, India",
                    "employment_type": "Full-time",
                    "salary": "₹2,500,000 / yr",
                    "description": None,
                    "posted_date": "2026-08-15",
                    "application_url": target
                }
            elif "demo.local" in target or "localhost" in target:
                raw = {
                    "job_title": "Senior Python Developer",
                    "company": "TechCorp India",
                    "location": "Remote, India",
                    "employment_type": "Full-time",
                    "salary": "₹2,500,000 - ₹3,500,000 / yr",
                    "description": "Building high-throughput backend services and web data extraction pipelines.",
                    "posted_date": "2026-08-15",
                    "application_url": target
                }
            else:
                # Live web scrape fallback for jobs
                try:
                    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                        resp = await client.get(target, headers={"User-Agent": "MarketScout/1.0 (Web Scraping Agent)"})
                        if resp.status_code == 200:
                            raw = DOMExtractor.extract_from_html(resp.text, "jobs", target)
                        else:
                            raw = {"job_title": target, "application_url": target}
                except Exception:
                    raw = {"job_title": target, "application_url": target}

            return {
                "status": "success",
                "provider_run_id": f"local_run_{schema.name}_1",
                "provider": "local",
                "mode_label": OFFLINE_MODE_LABEL,
                "raw_result": raw
            }

        # 2. Product workflow
        fixture_file = None
        if "product_broken.html" in target or "broken" in target:
            fixture_file = self.fixtures_dir / "product_broken.html"
        elif "product_v2.html" in target or "v2" in target:
            fixture_file = self.fixtures_dir / "product_v2.html"
        elif "product_v1.html" in target or "v1" in target or "headphones-123" in target or "demo.local" in target:
            fixture_file = self.fixtures_dir / "product_v1.html"

        # If fixture file exists, parse real HTML DOM directly
        if fixture_file and fixture_file.exists():
            if ("v2" in target or "product_v2.html" in target) and "repaired" not in target:
                raw = DOMExtractor.extract_from_fixture(fixture_file, "products", target)
                raw["price"] = None
                raw["currency"] = None
                raw["availability"] = None
            else:
                raw = DOMExtractor.extract_from_fixture(fixture_file, "products", target)
        else:
            # Live web scrape fallback for local provider
            try:
                async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                    resp = await client.get(target, headers={"User-Agent": "MarketScout/1.0 (Web Scraping Agent)"})
                    if resp.status_code == 200:
                        raw = DOMExtractor.extract_from_html(resp.text, "products", target)
                    else:
                        raw = {"title": target, "product_url": target}
            except Exception:
                raw = {"title": target, "product_url": target}

        return {
            "status": "success",
            "provider_run_id": f"local_run_{schema.name}_1",
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "raw_result": raw
        }

    async def heal_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema,
        failure_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        return {
            "status": "repair_requested",
            "repair_id": "rep_local_123",
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "instruction": failure_context.get("repair_instruction", "Repair missing fields"),
            "provider_response": {"message": "Bright Data Scraper Studio refactor_template triggered"}
        }

    async def approve_repair(
        self,
        scraper_id: str,
        repair_id: str
    ) -> Dict[str, Any]:
        return {
            "status": "repair_approved",
            "repair_id": repair_id,
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "provider_response": {"status": "approved"}
        }
