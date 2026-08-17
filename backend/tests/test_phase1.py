import pytest
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA, get_schema_by_name
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.providers.local_provider import LocalProvider, OFFLINE_MODE_LABEL

def test_schemas():
    prod = get_schema_by_name("products")
    assert prod is not None
    assert prod.name == "products"
    assert "title" in prod.get_required_field_names()
    assert "price" in prod.get_required_field_names()

    job = get_schema_by_name("jobs")
    assert job is not None
    assert job.name == "jobs"
    assert "job_title" in job.get_required_field_names()
    assert "company" in job.get_required_field_names()


def test_normalizer_product():
    raw = {
        "title": "   Wireless Headphones  ",
        "price": "₹4,999",
        "currency": "INR",
        "availability": "In stock",
        "rating": "4.5 out of 5",
        "review_count": "1,280 reviews"
    }
    norm = Normalizer.normalize_record(raw, PRODUCT_SCHEMA)
    assert norm["title"] == "Wireless Headphones"
    assert norm["price"] == 4999.0
    assert norm["currency"] == "INR"
    assert norm["availability"] == "In stock"


def test_normalizer_job():
    raw = {
        "job_title": "Python Developer",
        "company": "TechCorp",
        "location": "Remote",
        "salary": "₹25,000,000"
    }
    norm = Normalizer.normalize_record(raw, JOB_SCHEMA)
    assert norm["job_title"] == "Python Developer"
    assert norm["company"] == "TechCorp"
    assert norm["location"] == "Remote"


def test_validator_product_valid():
    data = {
        "title": "Wireless Headphones",
        "price": 4999.0,
        "currency": "INR",
        "availability": "In stock",
        "product_url": "https://example.com/item"
    }
    is_valid, missing, errors = Validator.validate_record(data, PRODUCT_SCHEMA)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0


def test_validator_product_degraded():
    data = {
        "title": "Wireless Headphones",
        "price": None, # Missing required
        "currency": "INR",
        "availability": "In stock"
    }
    is_valid, missing, errors = Validator.validate_record(data, PRODUCT_SCHEMA)
    assert is_valid is False
    assert "price" in missing


@pytest.mark.asyncio
async def test_local_provider_offline_mode():
    provider = LocalProvider()
    res = await provider.run_scraper("local", "https://demo.local/product", PRODUCT_SCHEMA)
    assert res["status"] == "success"
    assert res["mode_label"] == OFFLINE_MODE_LABEL
    assert res["provider"] == "local"
