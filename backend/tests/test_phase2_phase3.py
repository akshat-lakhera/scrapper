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

        # 2. Product v2 run -> Autonomous inline healing triggers and repairs into status 'repaired'
        run_v2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v2.html", workflow_type="products", schema_name="products"
        )
        assert run_v2.status in ("success", "repaired")
        assert run_v2.data_quality_score >= 70

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

        # 2. Job degraded run -> Autonomous inline healing triggers and recovers missing fields
        job_run_2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/jobs/degraded", workflow_type="jobs", schema_name="jobs"
        )
        assert job_run_2.status in ("success", "repaired")
        assert job_run_2.data_quality_score >= 70

    finally:
        db.close()
