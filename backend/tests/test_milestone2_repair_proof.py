import pytest
from app.database import SessionLocal, init_db
from app.services.scrape_service import ScrapeService

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

@pytest.mark.asyncio
async def test_milestone2_repair_proof_v1_v2_broken():
    db = SessionLocal()
    try:
        # 1. Reset demo state
        ScrapeService.reset_demo_data(db)

        # 2. Run product_v1.html (Original layout -> Primary success)
        run_v1 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v1.html", workflow_type="products", schema_name="products"
        )
        assert run_v1.status == "success"
        assert run_v1.repair_triggered is False
        assert run_v1.data_quality_score >= 70

        # 3. Run product_v2.html (Layout change -> Primary degraded)
        run_v2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v2.html", workflow_type="products", schema_name="products"
        )
        assert run_v2.status == "degraded"
        assert run_v2.repair_triggered is True

        # 4. Trigger Repair (Self-healing request)
        attempt_v2 = await ScrapeService.heal_scrape_run(db, run_id=run_v2.id)
        assert attempt_v2.scrape_run_id == run_v2.id
        assert run_v2.status == "repair_requested"
        assert attempt_v2.instruction is not None

        # 5. Approve Repair & Rerun
        repair_res = await ScrapeService.approve_repair_attempt(db, run_id=run_v2.id, attempt_id=attempt_v2.id)
        repaired_run = repair_res["scrape_run"]
        assert repaired_run.status == "repaired"
        assert repaired_run.data_quality_score >= 70

        # 6. Run product_broken.html (Corrupt fixture -> Manual review fallback)
        run_broken = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_broken.html", workflow_type="products", schema_name="products"
        )
        assert run_broken.status == "degraded"
        
        attempt_broken = await ScrapeService.heal_scrape_run(db, run_id=run_broken.id)
        repair_res_broken = await ScrapeService.approve_repair_attempt(db, run_id=run_broken.id, attempt_id=attempt_broken.id)
        
        assert repair_res_broken["scrape_run"].status == "manual_review"
        assert repair_res_broken["repair_attempt"].result == "failed"

    finally:
        db.close()
