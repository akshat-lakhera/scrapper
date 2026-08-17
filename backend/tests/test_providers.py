import pytest
from app.providers.local_provider import LocalProvider
from app.providers.brightdata_provider import BrightDataProvider
from app.models.schema import PRODUCT_SCHEMA

@pytest.mark.asyncio
async def test_local_provider_run():
    provider = LocalProvider()
    res = await provider.run_scraper("local", "https://demo.local/product_v1.html", PRODUCT_SCHEMA)
    assert res["status"] == "success"
    assert "raw_result" in res
    assert res["raw_result"]["title"] == "Wireless Headphones"
    assert res["raw_result"]["price"] == 4999

@pytest.mark.asyncio
async def test_brightdata_provider_missing_credentials():
    provider = BrightDataProvider()
    provider.api_key = ""  # ensure key is missing
    with pytest.raises(ValueError) as exc:
        provider._get_headers()
    assert "Bright Data API Key is missing" in str(exc.value)
