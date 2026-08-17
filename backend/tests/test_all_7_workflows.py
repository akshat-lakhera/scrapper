import pytest
import asyncio
import json
from app.database import SessionLocal
from app.services.scrape_service import ScrapeService

WORKFLOW_TEST_CASES = [
    ("products", "https://www.amazon.com/dp/B09XS7JWHH"),
    ("jobs", "https://jobs.lever.co/stripe/staff-backend-engineer"),
    ("x", "https://x.com/FabrizioRomano/status/1683559267524136962"),
    ("linkedin", "https://www.linkedin.com/in/elad-moshe-05a90413/"),
    ("instagram", "https://www.instagram.com/cristiano/"),
    ("google_maps", "https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/"),
    ("reddit", "https://www.reddit.com/r/technology/comments/1example_thread/"),
]

@pytest.mark.asyncio
async def test_all_7_workflows_operational():
    db = SessionLocal()
    for wf, url in WORKFLOW_TEST_CASES:
        run = await ScrapeService.execute_scrape(
            db,
            target_url=url,
            workflow_type=wf,
            schema_name=wf
        )
        res_dict = json.loads(run.normalized_result) if isinstance(run.normalized_result, str) else (run.normalized_result or {})
        
        # Verify valid status and positive quality score
        assert run.status in ("success", "repaired"), f"Workflow {wf} failed with status: {run.status}, errors: {run.validation_errors}"
        assert run.data_quality_score >= 70, f"Workflow {wf} had sub-threshold score: {run.data_quality_score}%"
        print(f"PASS: {wf} (Quality: {run.data_quality_score}%, Status: {run.status})")
