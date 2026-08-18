import re
from typing import Any, Dict, List, Optional, Tuple
from bs4 import BeautifulSoup
from app.models.schema import ScrapeSchema
from app.models.extractor_rule import ExtractorRuleBundle, FieldRule, CandidateRulePatch, FieldTrace

class RepairEngine:
    """
    Autonomous repair engine that analyzes broken extraction traces,
    inspects DOM evidence, and synthesizes candidate replacement selectors.
    """

    @staticmethod
    def diagnose_and_synthesize_patch(
        html: str,
        target_url: str,
        schema: ScrapeSchema,
        active_bundle: ExtractorRuleBundle,
        broken_fields: List[str],
        field_traces: List[FieldTrace],
        scrape_run_id: int
    ) -> CandidateRulePatch:
        soup = BeautifulSoup(html, "html.parser")
        root_causes: Dict[str, Any] = {}
        selector_diff: Dict[str, Dict[str, Any]] = {}
        candidate_field_rules: Dict[str, FieldRule] = dict(active_bundle.field_rules)

        for field_name in broken_fields:
            field_def = schema.get_field(field_name)
            if not field_def:
                continue

            # Trace root cause of failure
            trace = next((t for t in field_traces if t.field_name == field_name), None)
            old_selector = trace.selector_used if trace else (
                active_bundle.field_rules.get(field_name).primary_css if field_name in active_bundle.field_rules else None
            )

            root_causes[field_name] = {
                "failed_strategy": trace.strategy_used if trace else "unknown",
                "broken_selector": old_selector,
                "reason": "DOM selector returned no matching element or null text"
            }

            # Synthesize replacement selector candidates from DOM evidence
            candidate_sel, candidate_val, stability = RepairEngine._synthesize_field_selector(
                soup, field_name, field_def.data_type
            )

            if candidate_sel:
                selector_diff[field_name] = {
                    "old_selector": old_selector or "None (heuristic)",
                    "new_selector": candidate_sel,
                    "extracted_sample": candidate_val,
                    "stability_score": stability,
                    "status": "candidate_synthesized"
                }

                # Construct new FieldRule
                existing_fallbacks = active_bundle.field_rules.get(field_name).fallback_css if field_name in active_bundle.field_rules else []
                new_fallbacks = [old_selector] if old_selector and old_selector not in existing_fallbacks else existing_fallbacks

                candidate_field_rules[field_name] = FieldRule(
                    field_name=field_name,
                    strategies=["versioned_css", "json_ld", "meta_tags", "semantic"],
                    primary_css=candidate_sel,
                    fallback_css=new_fallbacks,
                    confidence=stability
                )
            else:
                selector_diff[field_name] = {
                    "old_selector": old_selector,
                    "new_selector": None,
                    "reason": "No high-confidence DOM candidates found in current markup",
                    "status": "manual_review_needed"
                }

        patch = CandidateRulePatch(
            scrape_run_id=scrape_run_id,
            domain=active_bundle.domain,
            template_signature=active_bundle.template_signature,
            from_version=active_bundle.version,
            to_version=active_bundle.version + 1,
            broken_fields=broken_fields,
            root_cause_analysis=root_causes,
            selector_diff=selector_diff,
            candidate_rules=candidate_field_rules,
            confidence_score=0.92 if all(d.get("new_selector") for d in selector_diff.values()) else 0.65
        )

        return patch

    @staticmethod
    def _synthesize_field_selector(
        soup: BeautifulSoup,
        field_name: str,
        data_type: str
    ) -> Tuple[Optional[str], Optional[str], float]:
        """
        Scans DOM tree for matching candidate elements using semantic labels,
        keyword proximity, itemprop attributes, and class patterns.
        """
        # 1. Search for Schema.org microdata itemprop
        elem = soup.find(attrs={"itemprop": field_name})
        if elem:
            val = elem.get("content") or elem.get_text(strip=True)
            if val:
                return f"[itemprop='{field_name}']", val, 0.98

        # 2. Search for common data-* and data-testid attributes
        elem = soup.find(attrs={f"data-{field_name}": True}) or soup.find(attrs={"data-testid": re.compile(rf"{field_name}", re.I)})
        if elem:
            val = elem.get(f"data-{field_name}") or elem.get_text(strip=True)
            if val:
                testid = elem.get("data-testid")
                sel = f"[data-testid='{testid}']" if testid else f"[data-{field_name}]"
                return sel, val, 0.95

        # 3. Search for HTML5 Headings for Title / Job Title
        if field_name in ("title", "job_title"):
            h1 = soup.find("h1")
            if h1 and len(h1.get_text(strip=True)) > 2:
                return "h1", h1.get_text(strip=True), 0.95

        # 3. Label-based proximity search (e.g. finding "Price:", "Company:", "Location:", "Section:")
        label_keywords = {
            "price": ["price", "mrp", "cost", "our price", "sale price"],
            "company": ["company", "employer", "organization", "hiring"],
            "location": ["location", "place", "city", "region"],
            "salary": ["salary", "compensation", "pay", "stipend"],
            "title": ["product title", "item name", "heading", "guide title"],
            "job_title": ["job title", "position", "role"],
            "doc_title": ["documentation", "guide", "title", "api reference"],
            "section_heading": ["section", "topic", "chapter", "heading"],
            "last_updated": ["updated", "version", "revision", "released"]
        }

        keywords = label_keywords.get(field_name, [field_name])
        for kw in keywords:
            for tag in soup.find_all(["span", "div", "label", "th", "p", "dt", "h2", "h3", "h4"]):
                text = tag.get_text(strip=True).lower()
                if kw in text and len(text) < 30:
                    # Check next sibling or parent's next element
                    sibling = tag.find_next_sibling(["span", "div", "td", "dd", "p", "section"])
                    if sibling and sibling.get_text(strip=True):
                        val = sibling.get_text(strip=True)
                        sel = RepairEngine._generate_unique_css_selector(sibling)
                        if sel:
                            return sel, val, 0.88

        # 4. Keyword class/id pattern scans
        class_patterns = {
            "price": [re.compile(r"price", re.I), re.compile(r"amount", re.I), re.compile(r"cost", re.I), re.compile(r"rate", re.I), re.compile(r"billing", re.I), re.compile(r"tier", re.I)],
            "currency": [re.compile(r"currency", re.I), re.compile(r"valuta", re.I), re.compile(r"symbol", re.I), re.compile(r"code", re.I)],
            "title": [re.compile(r"title", re.I), re.compile(r"product.*name", re.I), re.compile(r"heading", re.I), re.compile(r"headline", re.I), re.compile(r"header", re.I)],
            "job_title": [re.compile(r"job.*title", re.I), re.compile(r"position", re.I), re.compile(r"heading", re.I)],
            "company": [re.compile(r"company", re.I), re.compile(r"employer", re.I), re.compile(r"org", re.I), re.compile(r"vendor", re.I)],
            "location": [re.compile(r"location", re.I), re.compile(r"city", re.I), re.compile(r"place", re.I)],
            "salary": [re.compile(r"salary", re.I), re.compile(r"pay", re.I), re.compile(r"compensation", re.I), re.compile(r"stipend", re.I)],
            "description": [re.compile(r"desc", re.I), re.compile(r"summary", re.I), re.compile(r"detail", re.I), re.compile(r"about", re.I), re.compile(r"spec", re.I)],
            "availability": [re.compile(r"availab", re.I), re.compile(r"stock", re.I), re.compile(r"inventory", re.I)],
            "rating": [re.compile(r"rating", re.I), re.compile(r"stars?", re.I), re.compile(r"score", re.I), re.compile(r"metric", re.I)],
            "review_count": [re.compile(r"review", re.I), re.compile(r"count", re.I), re.compile(r"audit", re.I)],
            "doc_title": [re.compile(r"doc.*title", re.I), re.compile(r"guide.*headline", re.I), re.compile(r"doc.*header", re.I), re.compile(r"title", re.I)],
            "section_heading": [re.compile(r"section.*title", re.I), re.compile(r"article.*heading", re.I), re.compile(r"topic", re.I)],
            "content_body": [re.compile(r"section.*body", re.I), re.compile(r"article.*body", re.I), re.compile(r"markdown.*body", re.I), re.compile(r"content", re.I)],
            "code_snippet": [re.compile(r"code", re.I), re.compile(r"snippet", re.I), re.compile(r"syntax", re.I)],
            "last_updated": [re.compile(r"version", re.I), re.compile(r"release", re.I), re.compile(r"updated", re.I)]
        }


        patterns = class_patterns.get(field_name, [])
        for pat in patterns:
            for el in soup.find_all(attrs={"class": pat}):
                txt = el.get_text(strip=True)
                if txt and len(txt) > 1:
                    # Check format if price or number
                    if data_type in ("number", "integer") and not re.search(r"\d", txt):
                        continue
                    sel = RepairEngine._generate_unique_css_selector(el)
                    if sel:
                        return sel, txt, 0.82

        # 5. Content-Aware Value Regex Pattern Scan (for obfuscated/hashed CSS classes)
        if field_name in ("price", "salary") or data_type in ("number", "integer"):
            price_pat = re.compile(r'^(?:[\$€£₹¥]\s?\d+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?\s?(?:USD|EUR|INR|GBP|CAD))$', re.I)
            for tag in soup.find_all(["span", "div", "p", "b", "strong"], limit=100):
                txt = tag.get_text(strip=True)
                if price_pat.match(txt):
                    parent = tag.parent
                    p_cls = " ".join(parent.get("class", [])) if parent else ""
                    if "strike" not in p_cls.lower() and "old" not in p_cls.lower():
                        sel = RepairEngine._generate_unique_css_selector(tag)
                        if sel:
                            return sel, txt, 0.85

        if field_name in ("availability", "stock"):
            avail_pat = re.compile(r'^(?:in stock|out of stock|available|sold out|pre-order)$', re.I)
            for tag in soup.find_all(["span", "div", "p"], limit=60):
                txt = tag.get_text(strip=True)
                if avail_pat.match(txt):
                    sel = RepairEngine._generate_unique_css_selector(tag)
                    if sel:
                        return sel, txt, 0.85

        return None, None, 0.0

    @staticmethod
    def _generate_unique_css_selector(elem) -> Optional[str]:
        """Generates a stable, minimal CSS selector for a BeautifulSoup element."""
        if not elem or not elem.name:
            return None

        # 1. ID selector
        elem_id = elem.get("id")
        if elem_id and not re.search(r"\d{6,}", elem_id):
            return f"#{elem_id}"

        # 2. Semantic class selector
        classes = elem.get("class", [])
        stable_classes = [c for c in classes if not re.search(r"[a-f0-9]{6,}", c) and len(c) > 2]
        if stable_classes:
            class_sel = f"{elem.name}.{stable_classes[0]}"
            return class_sel

        # 3. Parent-child selector
        parent = elem.parent
        if parent and parent.name != "[document]":
            parent_sel = RepairEngine._generate_unique_css_selector(parent)
            if parent_sel:
                return f"{parent_sel} > {elem.name}"

        return elem.name
