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
