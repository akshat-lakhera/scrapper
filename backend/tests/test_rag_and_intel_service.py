import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from app.database import SessionLocal
from app.services.rag_service import RAGService
from app.services.intel_service import IntelService
from app.services.scrape_service import ScrapeService

@pytest.mark.asyncio
async def test_rag_service_query_and_grounded_citations():
    db = SessionLocal()
    # 1. Scrape product v1 into DB
    run = await ScrapeService.execute_scrape(
        db=db,
        target_url="https://demo.local/product_v1.html",
        workflow_type="products",
        schema_name="products"
    )
    assert run.status in ("success", "repaired")

    # 2. Query RAG across indexed scrape runs
    rag_res = await RAGService.chat_with_data(
        db=db,
        query="What is the price of the Wireless Headphones?",
        workflow_type="products"
    )
    assert rag_res["runs_analyzed"] >= 1
    assert "citations" in rag_res
    assert len(rag_res["citations"]) > 0
    assert rag_res["confidence"] > 0.70
    db.close()

@pytest.mark.asyncio
async def test_intel_service_domain_report_and_diffs():
    db = SessionLocal()
    # Scrape runs to generate history
    await ScrapeService.execute_scrape(
        db=db,
        target_url="https://demo.local/product_v1.html",
        workflow_type="products",
        schema_name="products"
    )

    report = await IntelService.get_domain_intel_report(db, domain="demo.local")
    assert report["total_tracked_runs"] >= 1
    assert report["domain"] == "demo.local"
    assert "executive_summary" in report
    assert isinstance(report["timeline_events"], list)
    db.close()

def test_rag_structured_market_insights():
    db = SessionLocal()
    insights = RAGService.get_structured_market_insights(db, workflow_type="products")
    assert "total_records" in insights
    assert "price_stats" in insights
    assert "availability_rate" in insights
    assert "top_domains" in insights
    assert isinstance(insights["top_domains"], list)
    db.close()
