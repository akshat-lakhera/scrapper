from typing import Any, Dict, List
from app.models.field_change import FieldChangeDB

class DiffService:
    @staticmethod
    def calculate_diffs(scrape_run_id: int, previous: Dict[str, Any], current: Dict[str, Any]) -> List[FieldChangeDB]:
        changes: List[FieldChangeDB] = []

        all_keys = set(previous.keys()).union(set(current.keys()))
        all_keys.discard("scraped_at")
        all_keys.discard("source_url")

        for key in sorted(all_keys):
            prev_val = previous.get(key)
            curr_val = current.get(key)

            if prev_val is None and curr_val is not None:
                change_type = "added"
            elif prev_val is not None and curr_val is None:
                change_type = "removed"
            elif type(prev_val) != type(curr_val) and prev_val is not None and curr_val is not None:
                change_type = "type_changed"
            elif prev_val != curr_val:
                change_type = "changed"
            else:
                change_type = "unchanged"

            changes.append(FieldChangeDB(
                scrape_run_id=scrape_run_id,
                field_name=key,
                old_value=str(prev_val) if prev_val is not None else None,
                new_value=str(curr_val) if curr_val is not None else None,
                change_type=change_type
            ))

        return changes

    @staticmethod
    def classify_drift(
        previous: Dict[str, Any],
        current: Dict[str, Any],
        validation_errors: List[str]
    ) -> Dict[str, Any]:
        """
        Classifies runtime changes between runs into:
        - data_changed: Natural source data variance (price update, date changed)
        - extraction_degraded: Core selector breakdown, missing required attributes
        - schema_drift: Structural schema divergence or type mutation
        """
        if validation_errors:
            return {
                "category": "extraction_degraded",
                "severity": "high",
                "reason": f"Validation failures detected: {', '.join(validation_errors)}"
            }

        # Check for missing critical fields that were previously present
        critical_fields = ["title", "job_title", "price", "company", "seller"]
        missing_fields = []
        for field in critical_fields:
            if previous.get(field) is not None and current.get(field) is None:
                missing_fields.append(field)

        if missing_fields:
            return {
                "category": "extraction_degraded",
                "severity": "high",
                "reason": f"Critical fields disappeared: {', '.join(missing_fields)}"
            }

        # Check for type mutation
        type_mutations = []
        for k in set(previous.keys()).intersection(current.keys()):
            if previous[k] is not None and current[k] is not None:
                if type(previous[k]) != type(current[k]):
                    type_mutations.append(f"{k} changed from {type(previous[k]).__name__} to {type(current[k]).__name__}")

        if type_mutations:
            return {
                "category": "schema_drift",
                "severity": "medium",
                "reason": f"Type mutation observed: {', '.join(type_mutations)}"
            }

        # Value differences
        val_diffs = [k for k in set(previous.keys()).intersection(current.keys()) if previous[k] != current[k] and k not in ["scraped_at", "source_url"]]
        if val_diffs:
            return {
                "category": "data_changed",
                "severity": "low",
                "reason": f"Values updated for fields: {', '.join(val_diffs)}"
            }

        return {
            "category": "stable",
            "severity": "none",
            "reason": "No structural or data drift detected."
        }
