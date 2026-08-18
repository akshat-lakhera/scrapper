import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from app.config import settings
from app.database import SessionLocal
from app.models.schema import TECH_DOCS_SCHEMA, PRODUCT_SCHEMA
from app.providers.brightdata_provider import BrightDataProvider
from app.services.scrape_service import ScrapeService
from app.cli import cmd_status, cmd_run, cmd_ci_run
from argparse import Namespace

@pytest.mark.asyncio
async def test_tech_docs_schema_and_autonomous_healing():
    db = SessionLocal()
    # 1. Scrape initial docs v1
    run1 = await ScrapeService.execute_scrape(
        db=db,
        target_url="https://demo.local/tech_docs_v1.html",
        workflow_type="tech_docs",
        schema_name="tech_docs"
    )
    assert run1.status in ("success", "repaired")
    norm1 = json.loads(run1.normalized_result)
    assert "BrightData" in norm1.get("doc_title", "")
    assert "Triggering Custom Collectors" in norm1.get("section_heading", "")

    # 2. Scrape redesigned docs v2 (autonomous self-healing adapts to new CSS classes)
    run2 = await ScrapeService.execute_scrape(
        db=db,
        target_url="https://demo.local/tech_docs_redesign.html",
        workflow_type="tech_docs",
        schema_name="tech_docs"
    )
    assert run2.status in ("success", "repaired")
    norm2 = json.loads(run2.normalized_result)
    assert "BrightData" in norm2.get("doc_title", "")
    assert "Triggering Custom Collectors" in norm2.get("section_heading", "")
    db.close()

@pytest.mark.asyncio
async def test_dca_custom_collector_creation_and_healing():
    mock_create_res = MagicMock()
    mock_create_res.status_code = 201
    mock_create_res.json.return_value = {"collector_id": "c_custom_tech_docs_999", "status": "created"}

    mock_trigger_res = MagicMock()
    mock_trigger_res.status_code = 200
    mock_trigger_res.json.return_value = {"collection_id": "s_dca_col_123"}

    mock_dataset_res = MagicMock()
    mock_dataset_res.status_code = 200
    mock_dataset_res.json.return_value = [{
        "doc_title": "Bright Data Scraper Studio Custom Collector Guide",
        "section_heading": "DCA API Integration",
        "content_body": "Custom collectors dynamically extract structured data from long-tail websites.",
        "doc_url": "https://custom-docs.example.com/api"
    }]

    mock_refactor_res = MagicMock()
    mock_refactor_res.status_code = 200
    mock_refactor_res.json.return_value = {"repair_id": "rep_dca_999", "status": "refactor_queued"}

    mock_approve_res = MagicMock()
    mock_approve_res.status_code = 200
    mock_approve_res.json.return_value = {"status": "approved"}

    async def mock_post(url, **kwargs):
        if "/dca/collectors/" in url and "/refactor_template" in url:
            return mock_refactor_res
        elif "/dca/collectors/" in url and "/approve" in url:
            return mock_approve_res
        elif "/dca/collectors" in url:
            return mock_create_res
        elif "/dca/trigger" in url:
            return mock_trigger_res
        return MagicMock(status_code=404)

    async def mock_get(url, **kwargs):
        if "/dca/dataset" in url:
            return mock_dataset_res
        return MagicMock(status_code=404)

    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=mock_post)
    mock_client.get = AsyncMock(side_effect=mock_get)

    with patch("app.config.settings.BRIGHTDATA_API_KEY", "test_key_123"):
        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            provider = BrightDataProvider()

            # 1. Create custom collector
            create_out = await provider.create_scraper(
                target="https://custom-docs.example.com/api",
                schema=TECH_DOCS_SCHEMA,
                instructions="Extract title and section body"
            )
            assert create_out["status"] == "success"
            assert create_out["scraper_id"] == "c_custom_tech_docs_999"
            assert create_out["collector_type"] == "custom_scraper_studio"

            # 2. Run custom collector
            run_out = await provider.run_scraper(
                scraper_id="c_custom_tech_docs_999",
                target="https://custom-docs.example.com/api",
                schema=TECH_DOCS_SCHEMA
            )
            assert run_out["status"] == "success"
            assert run_out["provider_run_id"] == "s_dca_col_123"
            assert run_out["raw_result"]["doc_title"] == "Bright Data Scraper Studio Custom Collector Guide"

            # 3. Heal custom collector
            heal_out = await provider.heal_scraper(
                scraper_id="c_custom_tech_docs_999",
                target="https://custom-docs.example.com/api",
                schema=TECH_DOCS_SCHEMA,
                failure_context={"missing_fields": ["section_heading"], "validation_errors": []}
            )
            assert heal_out["status"] == "repair_requested"
            assert heal_out["repair_id"] == "rep_dca_999"

            # 4. Approve custom collector
            approve_out = await provider.approve_repair(
                scraper_id="c_custom_tech_docs_999",
                repair_id="rep_dca_999"
            )
            assert approve_out["status"] == "repair_approved"

@pytest.mark.asyncio
async def test_cli_execution_and_ci_runner():
    # 1. Test CLI status command
    status_args = Namespace(command="status")
    await cmd_status(status_args)

    # 2. Test CLI run command with JSON output
    run_args = Namespace(
        command="run",
        target="https://demo.local/tech_docs_v1.html",
        workflow="tech_docs",
        schema="tech_docs",
        auto_heal=True,
        json=True
    )
    await cmd_run(run_args)

    # 3. Test CLI CI runner
    ci_args = Namespace(
        command="ci-run",
        target="https://demo.local/product_v1.html",
        workflow="products",
        strict=True
    )
    with pytest.raises(SystemExit) as exc_info:
        await cmd_ci_run(ci_args)
    assert exc_info.value.code == 0
