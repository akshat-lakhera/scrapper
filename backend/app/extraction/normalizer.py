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
    def parse_currency(val: Any) -> str:
        if not val:
            return "INR"
        val_str = str(val).upper().strip()
        if "USD" in val_str or "$" in val_str:
            return "USD"
        if "EUR" in val_str or "€" in val_str:
            return "EUR"
        if "GBP" in val_str or "£" in val_str:
            return "GBP"
        return "INR"

    @staticmethod
    def normalize_record(raw_record: Dict[str, Any], schema: ScrapeSchema) -> Dict[str, Any]:
        """
        Normalizes a single record dictionary against a ScrapeSchema definition.
        """
        normalized: Dict[str, Any] = {}

        for field_def in schema.fields:
            name = field_def.name
            raw_val = raw_record.get(name)

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
            else:
                normalized[name] = raw_val

        return normalized
