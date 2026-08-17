import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from app.models.schema import ScrapeSchema, PRODUCT_SCHEMA, JOB_SCHEMA, get_schema_by_name
from app.models.extractor_rule import ExtractorRuleBundle, FieldTrace
from app.extraction.multi_strategy_engine import MultiStrategyEngine

BLOCKED_TITLES = {
    "robot check", "access denied", "attention required", "cloudflare", "security verification",
    "just a moment...", "403 forbidden", "404 not found", "error", "bot check", "captcha"
}

class DOMExtractor:
    """
    General, website-agnostic DOM extractor that delegates to MultiStrategyEngine.
    Extracts structured data using Schema.org JSON-LD, OpenGraph meta tags,
    versioned rule bundles, and semantic DOM inference.
    Zero hardcoded site selectors. Zero synthetic URL slug fallbacks.
    """

    @staticmethod
    def extract_from_html(
        html_content: str,
        workflow_type: str = "products",
        target_url: str = "",
        rule_bundle: Optional[ExtractorRuleBundle] = None
    ) -> Dict[str, Any]:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Check for bot challenge / CAPTCHA / error pages
        page_title = (soup.title.string or "").strip().lower() if soup.title else ""
        if any(blocked in page_title for blocked in BLOCKED_TITLES):
            return {}

        schema = get_schema_by_name(workflow_type) or PRODUCT_SCHEMA
        record, traces = MultiStrategyEngine.extract(
            html=html_content,
            schema=schema,
            target_url=target_url,
            rule_bundle=rule_bundle
        )
        return record

    @staticmethod
    def extract_with_traces(
        html_content: str,
        schema: ScrapeSchema,
        target_url: str = "",
        rule_bundle: Optional[ExtractorRuleBundle] = None
    ) -> tuple[Dict[str, Any], List[FieldTrace]]:
        return MultiStrategyEngine.extract(
            html=html_content,
            schema=schema,
            target_url=target_url,
            rule_bundle=rule_bundle
        )

    @staticmethod
    def extract_from_fixture(
        fixture_path: Path,
        workflow_type: str = "products",
        target_url: str = "",
        rule_bundle: Optional[ExtractorRuleBundle] = None
    ) -> Dict[str, Any]:
        if not fixture_path.exists():
            return {}
        try:
            html = fixture_path.read_text(encoding="utf-8", errors="ignore")
            return DOMExtractor.extract_from_html(html, workflow_type, target_url, rule_bundle)
        except Exception:
            return {}
