from app.extraction.normalizer import Normalizer
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA

def test_parse_number_and_currency():
    assert Normalizer.parse_number("₹4,999") == 4999.0
    assert Normalizer.parse_integer("4,999") == 4999
    assert Normalizer.parse_currency("$99.99") == "USD"
    assert Normalizer.parse_currency("₹4,999") == "INR"

def test_normalize_product_record():
    raw = {
        "title": " Wireless Headphones ",
        "price": "₹4,999",
        "currency": "INR",
        "availability": "In stock",
        "rating": "4.5 out of 5",
        "review_count": "1,280"
    }
    norm = Normalizer.normalize_record(raw, PRODUCT_SCHEMA)
    assert norm["title"] == "Wireless Headphones"
    assert norm["price"] == 4999.0
    assert norm["currency"] == "INR"
    assert norm["availability"] == "In stock"
    assert norm["rating"] == 4.5
    assert norm["review_count"] == 1280

def test_normalize_job_record():
    raw = {
        "job_title": "Python Developer ",
        "company": "TechCorp ",
        "location": "Remote",
        "salary": "₹25,000,000"
    }
    norm = Normalizer.normalize_record(raw, JOB_SCHEMA)
    assert norm["job_title"] == "Python Developer"
    assert norm["company"] == "TechCorp"
    assert norm["location"] == "Remote"

def test_european_decimals_and_international_currencies():
    assert Normalizer.parse_number("1.499,00 €") == 1499.0
    assert Normalizer.parse_number("1499,50") == 1499.5
    assert Normalizer.parse_currency("£ 450.00") == "GBP"
    assert Normalizer.parse_currency("A$ 99.00") == "AUD"
    assert Normalizer.parse_currency("CHF 120.00") == "CHF"
    assert Normalizer.parse_currency("₩ 50,000") == "KRW"
    assert Normalizer.parse_number("4,8 / 5") == 4.8
