import re
from typing import Any, Dict, Optional, Tuple, Union
from app.models.schema import ScrapeSchema

class Normalizer:
    """
    Schema-driven normalizer that transforms raw extracted values (or strings)
    into clean, typed data based on target schema definitions.
    """

    @staticmethod
    def parse_number(val: Any) -> Optional[float]:
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        val_str = str(val).strip()
        if not val_str:
            return None
        match = re.search(r"[\d,]+(?:\.\d+)?", val_str)
        if not match:
            return None
        try:
            return float(match.group(0).replace(",", ""))
        except ValueError:
            return None

    @staticmethod
    def parse_integer(val: Any) -> Optional[int]:
        num = Normalizer.parse_number(val)
        if num is not None:
            return int(round(num))
        return None

    @staticmethod
    def parse_currency(val: Any) -> Optional[str]:
        if not val:
            return None
        val_str = str(val).upper().strip()
        if "USD" in val_str or "$" in val_str:
            return "USD"
        if "EUR" in val_str or "€" in val_str:
            return "EUR"
        if "GBP" in val_str or "£" in val_str:
            return "GBP"
        if "INR" in val_str or "₹" in val_str or "RS" in val_str:
            return "INR"
        if len(val_str) == 3 and val_str.isalpha():
            return val_str
        return None

    @staticmethod
    def normalize_record(raw_record: Dict[str, Any], schema: ScrapeSchema) -> Dict[str, Any]:
        """
        Normalizes a single record dictionary against a ScrapeSchema definition.
        Maps common Bright Data Datasets v3 and SERP field aliases to schema names.
        """
        if not isinstance(raw_record, dict):
            return {f.name: None for f in schema.fields}

        # Field alias lookup map
        aliases: Dict[str, list[str]] = {
            "price": ["final_price", "price", "initial_price", "current_price", "amount"],
            "rating": ["reviews_rating", "rating", "stars", "score"],
            "review_count": ["reviews_count", "review_count", "total_reviews", "num_reviews"],
            "seller": ["brand", "seller_name", "seller", "merchant", "vendor"],
            "product_url": ["url", "product_url", "link", "canonical_url"],
            "image_url": ["image", "image_url", "main_image", "thumbnail"],
            "job_title": ["job_title", "title", "position", "role_title"],
            "company": ["company", "company_name", "employer", "organization"],
            "location": ["location", "job_location", "city_state", "place"],
            "salary": ["salary", "salary_range", "compensation", "pay"],
            "description": ["description", "job_description", "summary", "snippet"],
            "application_url": ["application_url", "url", "job_url", "apply_url"],
            "posted_date": ["posted_date", "date_posted", "published_at", "post_date"]
        }

        normalized: Dict[str, Any] = {}

        for field_def in schema.fields:
            name = field_def.name
            
            # Retrieve value checking canonical name first, then known aliases
            raw_val = raw_record.get(name)
            if raw_val is None and name in aliases:
                for alias in aliases[name]:
                    if alias in raw_record and raw_record[alias] is not None:
                        raw_val = raw_record[alias]
                        break

            if raw_val is None:
                normalized[name] = None
                continue

            if field_def.data_type == "number":
                normalized[name] = Normalizer.parse_number(raw_val)
            elif field_def.data_type == "integer":
                normalized[name] = Normalizer.parse_integer(raw_val)
            elif field_def.data_type == "boolean":
                if isinstance(raw_val, bool):
                    normalized[name] = raw_val
                elif isinstance(raw_val, str):
                    normalized[name] = raw_val.lower().strip() in ("true", "yes", "1")
                else:
                    normalized[name] = bool(raw_val)
            elif field_def.data_type == "url":
                val_str = str(raw_val).strip()
                normalized[name] = val_str if val_str.startswith(("http://", "https://", "/")) else val_str
            elif field_def.data_type == "string":
                val_str = str(raw_val).strip()
                if name == "currency":
                    normalized[name] = Normalizer.parse_currency(val_str)
                else:
                    normalized[name] = val_str if val_str else None
            elif field_def.data_type == "object":
                if isinstance(raw_val, dict):
                    normalized[name] = raw_val
                elif isinstance(raw_val, str):
                    try:
                        import json
                        normalized[name] = json.loads(raw_val)
                    except Exception:
                        normalized[name] = {"raw": raw_val}
                else:
                    normalized[name] = raw_val
            else:
                normalized[name] = raw_val

        # If specifications is null or empty, capture any extra metadata like asin/parent_asin
        if schema.name == "products":
            specs = normalized.get("specifications") or {}
            if not isinstance(specs, dict):
                specs = {}
            if "asin" in raw_record and "asin" not in specs:
                specs["asin"] = raw_record["asin"]
            if "parent_asin" in raw_record and "parent_asin" not in specs:
                specs["parent_asin"] = raw_record["parent_asin"]
            if specs:
                normalized["specifications"] = specs

        return normalized
