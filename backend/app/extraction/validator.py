from typing import Any, Dict, List, Tuple
from app.models.schema import ScrapeSchema

class Validator:
    @staticmethod
    def validate_record(data: Dict[str, Any], schema: ScrapeSchema) -> Tuple[bool, List[str], List[str]]:
        """
        Validates a normalized record against a ScrapeSchema definition.
        Returns: (is_valid, missing_required_fields, validation_errors)
        """
        missing_fields: List[str] = []
        validation_errors: List[str] = []

        if not data:
            return False, schema.get_required_field_names(), ["Result data is empty"]

        for field_def in schema.fields:
            name = field_def.name
            val = data.get(name)

            # 1. Required field check
            if field_def.required:
                if val is None or (isinstance(val, str) and not val.strip()):
                    missing_fields.append(name)
                    validation_errors.append(f"Missing required field: '{name}'")
                    continue

            if val is None:
                continue

            # 2. Data type & range checks
            if field_def.data_type in ("number", "integer"):
                if not isinstance(val, (int, float)):
                    validation_errors.append(f"Field '{name}' expected {field_def.data_type}, got {type(val).__name__}")
                else:
                    if name == "price" and val <= 0:
                        validation_errors.append(f"Invalid price value: {val} (must be > 0)")
                    elif name == "rating" and (val < 0.0 or val > 5.0):
                        validation_errors.append(f"Invalid rating value: {val} (must be between 0 and 5)")
                    elif name == "review_count" and val < 0:
                        validation_errors.append(f"Invalid review count: {val} (must be >= 0)")

            elif field_def.data_type == "url":
                if not isinstance(val, str) or not (val.startswith("http://") or val.startswith("https://") or val.startswith("/")):
                    validation_errors.append(f"Invalid URL format for '{name}': {val}")

            elif field_def.data_type == "string":
                if not isinstance(val, str) or not val.strip():
                    validation_errors.append(f"Field '{name}' must be a non-empty string")

        is_valid = len(missing_fields) == 0 and len(validation_errors) == 0
        return is_valid, missing_fields, validation_errors

    @staticmethod
    def detect_missing_fields(data: Dict[str, Any], schema: ScrapeSchema) -> List[str]:
        missing = []
        for field in schema.get_required_field_names():
            val = data.get(field)
            if val is None or (isinstance(val, str) and not val.strip()):
                missing.append(field)
        return missing

    @staticmethod
    def detect_invalid_fields(data: Dict[str, Any], schema: ScrapeSchema) -> List[str]:
        invalid = []
        for field_def in schema.fields:
            name = field_def.name
            val = data.get(name)
            if val is None:
                continue
            if field_def.data_type in ("number", "integer") and isinstance(val, (int, float)):
                if name == "price" and val <= 0:
                    invalid.append(name)
                elif name == "rating" and (val < 0 or val > 5):
                    invalid.append(name)
                elif name == "review_count" and val < 0:
                    invalid.append(name)
        return invalid

    @staticmethod
    def calculate_quality_score(data: Dict[str, Any], schema: ScrapeSchema, is_valid: bool) -> int:
        if not is_valid:
            return 0

        total_fields = len(schema.fields)
        if total_fields == 0:
            return 100

        present_count = 0
        for f in schema.fields:
            val = data.get(f.name)
            if val is not None and (not isinstance(val, str) or val.strip()):
                present_count += 1

        score = int(round((present_count / total_fields) * 100))
        return min(max(score, 0), 100)
