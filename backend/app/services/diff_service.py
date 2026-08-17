from typing import Any, Dict, List, Optional
from app.models.field_change import FieldChangeDB
from app.models.schema import ScrapeSchema

class DiffService:
    """
    Advanced drift and root-cause classifier that analyzes field-level value deltas,
    selector-level breakdowns, template signature changes, and type mutations.
    """

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
        validation_errors: List[str],
        previous_template: Optional[str] = None,
        current_template: Optional[str] = None,
        broken_fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Classifies runtime changes into actionable failure classes:
        - selector_failure: A critical selector broke or stopped returning data
        - template_redesign: Structural HTML skeleton changed
        - extraction_degraded: Schema validation failed on required attributes
        - schema_drift: Type mutation or structural divergence
        - data_changed: Natural source data variance
        - stable: Perfectly consistent
        """
        # 1. Structural template redesign
        if previous_template and current_template and previous_template != current_template:
            return {
                "category": "template_redesign",
                "severity": "critical",
                "reason": f"DOM structure signature changed from {previous_template} to {current_template}. Full template refactor recommended."
            }

        # 2. Selector failure on previously working fields
        disappeared_fields = []
        for k in previous:
            if previous[k] is not None and current.get(k) is None:
                disappeared_fields.append(k)

        if disappeared_fields:
            return {
                "category": "selector_failure",
                "severity": "high",
                "broken_fields": disappeared_fields,
                "reason": f"Active selectors failed to extract previously available fields: {', '.join(disappeared_fields)}"
            }

        # 3. Validation failure
        if validation_errors:
            return {
                "category": "extraction_degraded",
                "severity": "high",
                "reason": f"Validation failures detected: {', '.join(validation_errors)}"
            }

        # 4. Type mutation
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

        # 5. Natural value updates
        val_diffs = [k for k in set(previous.keys()).intersection(current.keys()) if previous[k] != current[k] and k not in ["scraped_at", "source_url"]]
        if val_diffs:
            return {
                "category": "data_changed",
                "severity": "low",
                "reason": f"Natural data update for fields: {', '.join(val_diffs)}"
            }

        return {
            "category": "stable",
            "severity": "none",
            "reason": "No structural or data drift detected."
        }
