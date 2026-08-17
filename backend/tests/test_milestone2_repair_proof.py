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

        # 3. Run product_v2.html (Layout change -> Autonomous Self-Healing immediately repairs it)
        run_v2 = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_v2.html", workflow_type="products", schema_name="products"
        )
        assert run_v2.status in ("success", "repaired")
        assert run_v2.data_quality_score >= 70
        assert "Wireless Headphones" in run_v2.normalized_result

        # 4. Run product_broken.html (Corrupt fixture -> Autonomous Healing accurately reports healing_failed without hallucination)
        run_broken = await ScrapeService.execute_scrape(
            db, target_url="https://demo.local/product_broken.html", workflow_type="products", schema_name="products"
        )
        assert run_broken.status == "healing_failed"
        assert run_broken.data_quality_score == 0

    finally:
        db.close()
