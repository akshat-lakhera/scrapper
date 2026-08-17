import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from app.config import settings
from app.models.schema import ScrapeSchema
from app.providers.base import ScraperProvider
from app.extraction.dom_extractor import DOMExtractor

logger = logging.getLogger("marketscout.local")

OFFLINE_MODE_LABEL = "Offline test mode — not live Bright Data data"

class LocalProvider(ScraperProvider):
    """
    Offline Test Provider executing strictly against local HTML fixtures in fixtures/.
    Provides real HTML snapshots for MultiStrategyEngine, repair synthesis, and regression testing.
    Zero synthetic fallbacks, zero direct HTTP bypassing, and zero fabricated values.
    """

    def __init__(self):
        self.fixtures_dir = Path(settings.FIXTURES_DIR)
        self.mode_label = OFFLINE_MODE_LABEL

    async def search(
        self,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """Offline fixture-based search simulation."""
        results = []
        if workflow_type == "jobs":
            fixture_file = self.fixtures_dir / "jobs_v1.html"
            if fixture_file.exists():
                raw = DOMExtractor.extract_from_fixture(fixture_file, "jobs", "https://demo.local/jobs/python-dev-123")
                if raw:
                    results.append(raw)
        else:
            fixture_file = self.fixtures_dir / "product_v1.html"
            if fixture_file.exists():
                raw = DOMExtractor.extract_from_fixture(fixture_file, "products", "https://demo.local/product_v1.html")
                if raw:
                    results.append(raw)

        return {
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "status": "success" if results else "empty_result",
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
            "scraper_id": f"local_{schema.name}_collector",
            "mode_label": OFFLINE_MODE_LABEL,
            "raw_response": {
                "message": "Local fixture collector initialized (offline mode).",
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
        """
        Executes an offline scrape strictly against local HTML fixtures in fixtures/.
        Returns raw HTML snapshot for MultiStrategyEngine extraction and validation.
        """
        target_lower = target.lower()

        # 1. Resolve Job Workflow Fixtures
        if schema.name == "jobs":
            fixture_file = None
            if "jobs_v2.html" in target_lower:
                fixture_file = self.fixtures_dir / "jobs_v2.html"
                if not fixture_file.exists():
                    fixture_file = self.fixtures_dir / "jobs_v1.html"
            elif "jobs_degraded.html" in target_lower or "degraded" in target_lower:
                fixture_file = self.fixtures_dir / "jobs_degraded.html"
            elif "jobs_v1.html" in target_lower or "python-dev" in target_lower or "demo.local" in target_lower or "localhost" in target_lower:
                fixture_file = self.fixtures_dir / "jobs_v1.html"

            if fixture_file and fixture_file.exists():
                html_text = fixture_file.read_text(encoding="utf-8", errors="ignore")
                raw = DOMExtractor.extract_from_html(html_text, "jobs", target)
                return {
                    "status": "success",
                    "provider_run_id": f"local_run_jobs_{fixture_file.stem}",
                    "provider": "local",
                    "mode_label": OFFLINE_MODE_LABEL,
                    "fixture_name": fixture_file.name,
                    "raw_html": html_text,
                    "raw_result": raw
                }

            return {
                "status": "provider_error",
                "provider_run_id": "local_run_jobs_error",
                "provider": "local",
                "mode_label": OFFLINE_MODE_LABEL,
                "error": f"Target '{target}' is not an available local fixture.",
                "raw_html": None,
                "raw_result": {}
            }

        # 2. Resolve Product Workflow Fixtures
        fixture_file = None
        if "product_broken.html" in target_lower or "broken" in target_lower:
            fixture_file = self.fixtures_dir / "product_broken.html"
        elif "product_v2.html" in target_lower or "v2" in target_lower or "degraded" in target_lower:
            fixture_file = self.fixtures_dir / "product_v2.html"
        elif "product_v1.html" in target_lower or "v1" in target_lower or "headphones" in target_lower or "demo.local" in target_lower or "localhost" in target_lower:
            fixture_file = self.fixtures_dir / "product_v1.html"

        if fixture_file and fixture_file.exists():
            html_text = fixture_file.read_text(encoding="utf-8", errors="ignore")
            raw = DOMExtractor.extract_from_html(html_text, "products", target)
            return {
                "status": "success",
                "provider_run_id": f"local_run_products_{fixture_file.stem}",
                "provider": "local",
                "mode_label": OFFLINE_MODE_LABEL,
                "fixture_name": fixture_file.name,
                "raw_html": html_text,
                "raw_result": raw
            }

        return {
            "status": "provider_error",
            "provider_run_id": "local_run_products_error",
            "provider": "local",
            "mode_label": OFFLINE_MODE_LABEL,
            "error": f"Target '{target}' is not an available local fixture.",
            "raw_html": None,
            "raw_result": {}
        }

    async def heal_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema,
        failure_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        missing = failure_context.get("missing_fields", [])
        return {
            "status": "repair_requested",
            "repair_id": f"rep_local_{schema.name}_{scraper_id or 1}",
            "instruction": f"Offline Fixture Diagnostic Plan: Analyze markup and synthesize replacement selectors for missing fields: {missing}.",
            "provider_response": {
                "action": "offline_fixture_diagnosis",
                "target": target,
                "missing_fields": missing,
                "schema": schema.name
            }
        }

    async def approve_repair(
        self,
        scraper_id: str,
        repair_id: str
    ) -> Dict[str, Any]:
        return {
            "status": "repair_approved",
            "repair_id": repair_id,
            "provider_response": {
                "status": "approved",
                "action": "offline_repair_verification_ready"
            }
        }
