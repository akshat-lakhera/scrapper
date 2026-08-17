import pytest
from app.database import SessionLocal, init_db
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA
from app.services.scrape_service import ScrapeService

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

@pytest.mark.asyncio
async def test_phase2_product_self_healing_workflow():
    db = SessionLocal()
    try:
        ScrapeService.reset_demo_data(db)

        # 1. Product initial successful run
        run_v1 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v1.html", workflow_type="products", schema_name="products"
        )
        assert run_v1.status == "success"
        assert run_v1.data_quality_score >= 70

        # 2. Product degraded run (missing price)
        run_v2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v2.html", workflow_type="products", schema_name="products"
        )
        assert run_v2.status == "degraded"
        assert run_v2.repair_triggered is True

        # 3. Heal request
        attempt = await ScrapeService.heal_scrape_run(db, run_id=run_v2.id)
        assert attempt.scrape_run_id == run_v2.id
        assert run_v2.status == "repair_requested"

        # 4. Approve & Rerun -> Repaired
        repair_res = await ScrapeService.approve_repair_attempt(db, run_id=run_v2.id, attempt_id=attempt.id)
        repaired_run = repair_res["scrape_run"]
        assert repaired_run.status == "repaired"
        assert repaired_run.data_quality_score >= 70
        assert repair_res["repaired_result"]["title"] == "Wireless Headphones"
        assert repair_res["repaired_result"]["price"] == 4999.0

    finally:
        db.close()

@pytest.mark.asyncio
async def test_phase3_job_workflow_and_degradation():
    db = SessionLocal()
    try:
        # 1. Job initial successful run
        job_run_1 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/jobs/python-dev-123", workflow_type="jobs", schema_name="jobs"
        )
        assert job_run_1.status == "success"
        assert job_run_1.workflow_type == "jobs"
        assert job_run_1.data_quality_score >= 70

        # 2. Job degraded run (missing company & description)
        job_run_2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/jobs/degraded", workflow_type="jobs", schema_name="jobs"
        )
        assert job_run_2.status == "degraded"
        assert job_run_2.repair_triggered is True

        # 3. Heal request for Job workflow
        attempt = await ScrapeService.heal_scrape_run(db, run_id=job_run_2.id)
        assert attempt.scrape_run_id == job_run_2.id
        assert job_run_2.status == "repair_requested"

        # 4. Approve & Rerun -> Repaired
        repair_res = await ScrapeService.approve_repair_attempt(db, run_id=job_run_2.id, attempt_id=attempt.id)
        repaired_run = repair_res["scrape_run"]
        assert repaired_run.status == "repaired"
        assert repair_res["repaired_result"]["job_title"] == "Senior Python Developer"
        assert repair_res["repaired_result"]["company"] == "TechCorp India"

    finally:
        db.close()
