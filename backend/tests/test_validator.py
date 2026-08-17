from app.extraction.validator import Validator
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA

def test_validity_gate_pass():
    valid_data = {
        "title": "Wireless Headphones",
        "price": 4999.0,
        "currency": "INR",
        "availability": "In stock",
        "product_url": "https://example.com/item",
        "rating": 4.4,
        "review_count": 1280
    }
    is_valid, missing, errors = Validator.validate_record(valid_data, PRODUCT_SCHEMA)
    assert is_valid is True
    assert len(missing) == 0
    assert len(errors) == 0
    score = Validator.calculate_quality_score(valid_data, PRODUCT_SCHEMA, is_valid)
    assert score >= 70


def test_validity_gate_fail_missing_title():
    invalid_data = {
        "title": "",
        "price": 4999.0,
        "currency": "INR",
        "availability": "In stock",
        "product_url": "https://example.com/item"
    }
    is_valid, missing, errors = Validator.validate_record(invalid_data, PRODUCT_SCHEMA)
    assert is_valid is False
    assert "title" in missing
    assert Validator.calculate_quality_score(invalid_data, PRODUCT_SCHEMA, is_valid) == 0


def test_validity_gate_fail_negative_price():
    invalid_data = {
        "title": "Wireless Headphones",
        "price": -500.0,
        "currency": "INR",
        "availability": "In stock",
        "product_url": "https://example.com/item"
    }
    is_valid, missing, errors = Validator.validate_record(invalid_data, PRODUCT_SCHEMA)
    assert is_valid is False
    assert any("price" in err.lower() for err in errors)
    assert Validator.calculate_quality_score(invalid_data, PRODUCT_SCHEMA, is_valid) == 0
