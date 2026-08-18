import re
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup, Tag

class DOMInspectorService:
    """
    Service for interactive real-time DOM tree inspection, CSS selector evaluation,
    selector stability scoring, and autonomous candidate selector synthesis.
    """

    @staticmethod
    def _compute_stability_score(selector: str, match_count: int, tag_name: str) -> float:
        """
        Calculates a heuristic stability score (0-100) for a candidate CSS selector:
        - Penalizes volatile/random hash classes (e.g. .css-1a2b3c, ._3x8Y).
        - Rewards semantic class names (.product-title, .price-value).
        - Rewards single/unique match targets.
        - Penalizes deeply nested tag chains (> 4 levels).
        """
        score = 80.0

        # Uniqueness reward / penalty
        if match_count == 1:
            score += 15.0
        elif match_count > 5:
            score -= min(30.0, match_count * 2.0)

        # Volatile hash class penalty
        if re.search(r"\b[a-zA-Z0-9]{8,}\b", selector) or re.search(r"css-[a-z0-9]+", selector):
            score -= 25.0

        # Semantic keywords reward
        if any(term in selector.lower() for term in ["price", "title", "name", "desc", "cost", "heading", "rate", "author"]):
            score += 10.0

        # Depth penalty
        depth = len(selector.split(">")) + len(selector.split(" "))
        if depth > 4:
            score -= (depth - 4) * 5.0

        # ID selector bonus if clean
        if selector.startswith("#") and not re.search(r"\d{4,}", selector):
            score += 10.0

        return max(10.0, min(100.0, round(score, 1)))

    @staticmethod
    def _compute_element_path(elem: Tag) -> str:
        """Computes a clean CSS path for an element."""
        path_parts = []
        curr = elem
        while curr and curr.name not in ("[document]", "html", "body") and len(path_parts) < 4:
            part = curr.name
            classes = curr.get("class", [])
            if classes:
                clean_classes = [c for c in classes if not re.match(r"^[a-zA-Z0-9]{8,}$", c)]
                if clean_classes:
                    part += f".{clean_classes[0]}"
            elem_id = curr.get("id")
            if elem_id and not re.search(r"\d{4,}", elem_id):
                part = f"#{elem_id}"
                path_parts.insert(0, part)
                break
            path_parts.insert(0, part)
            curr = curr.parent

        return " > ".join(path_parts) if path_parts else elem.name

    @classmethod
    def evaluate_selector(cls, html: str, selector: str) -> Dict[str, Any]:
        """
        Evaluates a CSS selector against the provided HTML string.
        """
        if not html or not html.strip():
            return {
                "selector": selector,
                "match_count": 0,
                "stability_score": 0.0,
                "matches": [],
                "error": "Empty HTML content provided."
            }

        selector = selector.strip()
        if not selector:
            return {
                "selector": "",
                "match_count": 0,
                "stability_score": 0.0,
                "matches": []
            }

        try:
            soup = BeautifulSoup(html, "html.parser")
            matched_nodes = soup.select(selector)
            match_count = len(matched_nodes)

            matches: List[Dict[str, Any]] = []
            for idx, node in enumerate(matched_nodes[:15]):  # limit sample to top 15
                if not isinstance(node, Tag):
                    continue

                text_content = node.get_text(separator=" ", strip=True)
                attributes = {k: " ".join(v) if isinstance(v, list) else str(v) for k, v in node.attrs.items()}
                
                # Sanitize outer HTML preview (max 250 chars)
                outer_preview = str(node)[:250] + ("..." if len(str(node)) > 250 else "")

                matches.append({
                    "index": idx + 1,
                    "tag": node.name,
                    "text": text_content[:200] + ("..." if len(text_content) > 200 else ""),
                    "attributes": attributes,
                    "computed_path": cls._compute_element_path(node),
                    "html_preview": outer_preview
                })

            stability = cls._compute_stability_score(
                selector=selector,
                match_count=match_count,
                tag_name=matches[0]["tag"] if matches else "div"
            )

            return {
                "selector": selector,
                "match_count": match_count,
                "stability_score": stability,
                "is_unique": match_count == 1,
                "matches": matches,
                "error": None
            }
        except Exception as e:
            return {
                "selector": selector,
                "match_count": 0,
                "stability_score": 0.0,
                "matches": [],
                "error": f"Invalid CSS selector syntax: {str(e)}"
            }

    @classmethod
    def suggest_selectors(cls, html: str, target_field: str = "price") -> List[Dict[str, Any]]:
        """
        Suggests top candidate CSS selectors for a target attribute in the provided HTML.
        """
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        candidates: List[Dict[str, Any]] = []
        target_field = target_field.lower().strip()

        # Heuristic field mapping
        field_patterns = {
            "price": [
                (r"\$[\d,]+(?:\.\d{2})?|£[\d,]+(?:\.\d{2})?|€[\d,]+(?:\.\d{2})?|₹[\d,]+", [".price", ".product-price", ".price-current", "span.price", ".pdp-price", ".offer-price"]),
            ],
            "title": [
                (r".+", ["h1", "#productTitle", ".product-title", ".pdp-title", "h1.title", "span.title"]),
            ],
            "availability": [
                (r"(?i)in stock|available|out of stock", [".availability", ".stock-status", "#availability", ".in-stock", ".inventory"]),
            ],
            "rating": [
                (r"\d(?:\.\d)?\s*(?:out of|\/|\s*★|\s*stars)", [".rating", ".review-rating", ".star-rating", ".product-rating"]),
            ],
            "doc_body": [
                (r".+", ["article", ".doc-content", "main", ".markdown-body", "#content"]),
            ]
        }

        # Try predefined selector candidates
        tried_selectors: Set = set()
        test_selectors = []
        for f_key, plist in field_patterns.items():
            if f_key in target_field or target_field in f_key:
                for _, sels in plist:
                    test_selectors.extend(sels)

        # Also search for class names containing the target field
        for tag in soup.find_all(True):
            if not isinstance(tag, Tag):
                continue
            classes = tag.get("class", [])
            for c in classes:
                if target_field in c.lower() and c not in tried_selectors:
                    test_selectors.append(f".{c}")
                    tried_selectors.add(c)
            tag_id = tag.get("id", "")
            if tag_id and target_field in tag_id.lower() and tag_id not in tried_selectors:
                test_selectors.append(f"#{tag_id}")
                tried_selectors.add(tag_id)

        # Fallback default selectors if empty
        if not test_selectors:
            test_selectors = [f".{target_field}", f"#{target_field}", f"span.{target_field}", f"div.{target_field}"]

        # Evaluate each candidate
        evaluated_candidates = []
        for sel in list(dict.fromkeys(test_selectors))[:10]:
            eval_res = cls.evaluate_selector(html, sel)
            if eval_res["match_count"] > 0:
                evaluated_candidates.append({
                    "selector": sel,
                    "match_count": eval_res["match_count"],
                    "stability_score": eval_res["stability_score"],
                    "sample_text": eval_res["matches"][0]["text"] if eval_res["matches"] else "",
                    "computed_path": eval_res["matches"][0]["computed_path"] if eval_res["matches"] else sel
                })

        # Sort by stability score descending, then match count closeness to 1
        evaluated_candidates.sort(key=lambda x: (x["stability_score"], -abs(x["match_count"] - 1)), reverse=True)
        return evaluated_candidates[:5]
