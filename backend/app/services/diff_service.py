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
