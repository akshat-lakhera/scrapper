import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.providers.brightdata_provider import BrightDataProvider
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.config import settings

@pytest.mark.asyncio
async def test_brightdata_missing_credentials():
    with patch("app.config.settings.BRIGHTDATA_API_KEY", ""):
        provider = BrightDataProvider()
        with pytest.raises(ValueError, match="Bright Data API Key is missing"):
            await provider.run_scraper("gd_test", "https://amazon.com/dp/B0123", PRODUCT_SCHEMA)

@pytest.mark.asyncio
async def test_brightdata_unsupported_products_without_dataset():
    with patch("app.config.settings.BRIGHTDATA_API_KEY", "test_key_123"):
        with patch("app.config.settings.BRIGHTDATA_PRODUCT_DATASET_ID", ""):
            with patch("app.config.settings.BRIGHTDATA_SCRAPER_ID", ""):
                provider = BrightDataProvider()
                res = await provider.run_scraper("", "https://amazon.com/dp/B0123", PRODUCT_SCHEMA)
                assert res["status"] == "provider_error"
                assert "No Bright Data dataset configured for products workflow" in res["error"]

@pytest.mark.asyncio
async def test_brightdata_unsupported_jobs_without_dataset():
    with patch("app.config.settings.BRIGHTDATA_API_KEY", "test_key_123"):
        with patch("app.config.settings.BRIGHTDATA_JOB_DATASET_ID", ""):
            with patch("app.config.settings.BRIGHTDATA_SCRAPER_ID", ""):
                provider = BrightDataProvider()
                res = await provider.run_scraper("", "https://linkedin.com/jobs/123", JOB_SCHEMA)
                assert res["status"] == "provider_error"
                assert "No Bright Data dataset configured for jobs workflow" in res["error"]

@pytest.mark.asyncio
async def test_brightdata_datasets_v3_successful_flow():
    mock_trigger_res = MagicMock()
    mock_trigger_res.status_code = 200
    mock_trigger_res.json.return_value = {"snapshot_id": "sd_test_123"}

    mock_progress_res = MagicMock()
    mock_progress_res.status_code = 200
    mock_progress_res.json.return_value = {"status": "ready"}

    mock_snapshot_res = MagicMock()
    mock_snapshot_res.status_code = 200
    mock_snapshot_res.json.return_value = [{
        "title": "STANLEY Quencher H2.0 Tumbler",
        "final_price": 38.99,
        "currency": "USD",
        "availability": "In Stock",
        "reviews_rating": 4.7,
        "reviews_count": 203978,
        "brand": "STANLEY",
        "parent_asin": "B0CRMZHDG8",
        "url": "https://www.amazon.com/dp/B0CRMZHDG8"
    }]

    async def mock_post(url, **kwargs):
        return mock_trigger_res

    async def mock_get(url, **kwargs):
        if "progress" in url:
            return mock_progress_res
        return mock_snapshot_res

    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=mock_post)
    mock_client.get = AsyncMock(side_effect=mock_get)

    with patch("app.config.settings.BRIGHTDATA_API_KEY", "test_key_123"):
        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            provider = BrightDataProvider()
            res = await provider.run_scraper("gd_test_dataset", "https://www.amazon.com/dp/B0CRMZHDG8", PRODUCT_SCHEMA)
            
            assert res["status"] == "success"
            assert res["provider_run_id"] == "sd_test_123"
            raw = res["raw_result"]
            assert raw["title"] == "STANLEY Quencher H2.0 Tumbler"

            # Normalize and validate with Pydantic
            normalized = Normalizer.normalize_record(raw, PRODUCT_SCHEMA)
            assert normalized["price"] == 38.99
            assert normalized["rating"] == 4.7
            assert normalized["review_count"] == 203978
            assert normalized["seller"] == "STANLEY"
            assert normalized["product_url"] == "https://www.amazon.com/dp/B0CRMZHDG8"

            is_valid, missing, errors = Validator.validate_record(normalized, PRODUCT_SCHEMA)
            assert is_valid
            assert len(missing) == 0

@pytest.mark.asyncio
async def test_brightdata_datasets_v3_failed_snapshot():
    mock_trigger_res = MagicMock()
    mock_trigger_res.status_code = 200
    mock_trigger_res.json.return_value = {"snapshot_id": "sd_failed_123"}

    mock_progress_res = MagicMock()
    mock_progress_res.status_code = 200
    mock_progress_res.json.return_value = {"status": "failed", "error": "Target page blocked by anti-bot challenge"}

    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_trigger_res)
    mock_client.get = AsyncMock(return_value=mock_progress_res)

    with patch("app.config.settings.BRIGHTDATA_API_KEY", "test_key_123"):
        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            provider = BrightDataProvider()
            res = await provider.run_scraper("gd_test_dataset", "https://example.com/blocked", PRODUCT_SCHEMA)
            
            assert res["status"] == "provider_error"
            assert "failed" in res["error"]
            assert res["raw_result"] == {}

def test_cors_origins_configuration():
    with patch("app.config.settings.FRONTEND_ORIGIN", "http://127.0.0.1:8000, http://localhost:5173"):
        origins = settings.get_cors_origins()
        assert "http://127.0.0.1:8000" in origins
        assert "http://localhost:5173" in origins
        assert "*" not in origins

def test_api_responses_never_leak_credentials():
    secret_key = "secret_brightdata_key_999"
    secret_groq = "secret_groq_key_888"
    
    with patch("app.config.settings.BRIGHTDATA_API_KEY", secret_key):
        with patch("app.config.settings.GROQ_API_KEY", secret_groq):
            client = TestClient(app)
            
            endpoints_to_test = [
                "/api/health",
                "/api/config/mode",
                "/api/schemas",
                "/api/scrapers",
                "/api/runs",
                "/api/metrics"
            ]
            
            for endpoint in endpoints_to_test:
                res = client.get(endpoint)
                assert res.status_code == 200
                text = res.text
                assert secret_key not in text, f"Credential leaked in {endpoint}"
                assert secret_groq not in text, f"Credential leaked in {endpoint}"
