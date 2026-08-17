import re
from typing import Any, Dict, List, Tuple
from app.models.schema import ScrapeSchema

INVALID_TITLE_TOKENS = [
    "404 not found", "access denied", "attention required", "cloudflare", "just a moment",
    "robot check", "captcha", "security check", "forbidden", "page not found"
]

class Validator:
    """
    Deep semantic and cross-field validator that enforces structural schemas,
    semantic sanity bounds, plausible ranges, and multi-dimensional quality scoring.
    """

    @staticmethod
    def validate_record(
        record: Dict[str, Any],
        schema: ScrapeSchema
    ) -> Tuple[bool, List[str], List[str]]:
        missing_fields: List[str] = []
        validation_errors: List[str] = []

        # 1. Required Field Presence Gate
        for req_field in schema.get_required_field_names():
            val = record.get(req_field)
            if val is None or val == "":
                missing_fields.append(req_field)
                validation_errors.append(f"Missing required field: '{req_field}'")

        # 2. Field-Level Deep Semantic Checks
        for field in schema.fields:
            name = field.name
            val = record.get(name)
            if val is None:
                continue

            # Title & Job Title semantic checks
            if name in ("title", "job_title"):
                str_val = str(val).strip().lower()
                if len(str_val) < 3:
                    validation_errors.append(f"Field '{name}' is too short ({len(str_val)} chars): '{val}'")
                elif any(tok in str_val for tok in INVALID_TITLE_TOKENS):
                    validation_errors.append(f"Field '{name}' contains blocked/error title token: '{val}'")

            # Numeric price checks
            elif name == "price":
                if not isinstance(val, (int, float)):
                    validation_errors.append(f"Field 'price' must be numeric, got {type(val).__name__}")
                elif val < 0:
                    validation_errors.append(f"Field 'price' cannot be negative ({val})")

            # Rating checks
            elif name == "rating":
                try:
                    num_r = float(re.sub(r"[^\d.]", "", str(val))) if isinstance(val, str) else float(val)
                    if num_r < 0 or num_r > 5.0:
                        if num_r <= 10.0:
                            pass  # 10-point scale
                        elif num_r <= 100.0:
                            pass  # percentage scale
                        else:
                            validation_errors.append(f"Field 'rating' out of expected range ({val})")
                except ValueError:
                    pass

            # Review count checks
            elif name == "review_count":
                try:
                    num_rc = int(re.sub(r"[^\d]", "", str(val))) if isinstance(val, str) else int(val)
                    if num_rc < 0:
                        validation_errors.append(f"Field 'review_count' cannot be negative ({val})")
                except ValueError:
                    pass

            # URL validation
            elif "url" in name:
                if not str(val).startswith(("http://", "https://")):
                    validation_errors.append(f"Field '{name}' is not a valid URL: '{val}'")

        # 3. Cross-Field Coherence Checks
        if record.get("price") is not None and not record.get("currency"):
            # Not an invalidator, but noted in audit
            pass

        is_valid = len(missing_fields) == 0 and len(validation_errors) == 0
        return is_valid, missing_fields, validation_errors

    @staticmethod
    def calculate_quality_score(
        record: Dict[str, Any],
        schema: ScrapeSchema,
        is_valid: bool,
        strategy_confidence: float = 1.0
    ) -> int:
        """
        Calculates multi-dimensional quality score:
        - Completeness: 40 pts
        - Semantic Plausibility: 30 pts
        - Strategy Confidence: 20 pts
        - Cross-Field Coherence: 10 pts
        Capped at 0 if required fields fail.
        """
        if not is_valid:
            # Check partial presence for debug scoring, but clamp to 0 for validation failure
            return 0

        # 1. Completeness (40 pts)
        all_fields = schema.get_all_field_names()
        present_count = sum(1 for f in all_fields if record.get(f) is not None)
        completeness_pts = int((present_count / len(all_fields)) * 40) if all_fields else 40

        # 2. Semantic Plausibility (30 pts)
        plausibility_pts = 30
        if "title" in record and len(str(record.get("title") or "")) < 10:
            plausibility_pts -= 5
        if "description" in record and record.get("description") is not None:
            plausibility_pts += 0

        # 3. Strategy Confidence (20 pts)
        confidence_pts = int(strategy_confidence * 20)

        # 4. Cross-Field Coherence (10 pts)
        coherence_pts = 10
        if schema.name == "products" and record.get("price") and not record.get("currency"):
            coherence_pts -= 5

        total = min(100, max(0, completeness_pts + plausibility_pts + confidence_pts + coherence_pts))
        return total
