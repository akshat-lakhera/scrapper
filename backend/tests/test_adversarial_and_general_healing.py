import pytest
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA
from app.models.extractor_rule import ExtractorRuleBundle, FieldRule
from app.extraction.multi_strategy_engine import MultiStrategyEngine
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.services.repair_engine import RepairEngine
from app.services.regression_validator import RegressionValidator

SHOPIFY_CUSTOM_STORE_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Minimalist Ceramic Mug — Studio Potters</title>
  <meta property="og:title" content="Minimalist Ceramic Mug" />
  <meta property="og:price:amount" content="34.50" />
  <meta property="og:price:currency" content="USD" />
</head>
<body>
  <div class="shopify-section product-template">
    <div class="product-single__meta">
      <h1 class="product-single__title">Minimalist Ceramic Mug</h1>
      <div class="price-container">
        <span class="price-item price-item--regular" data-regular-price>$34.50</span>
      </div>
      <div class="product-form__inventory">
        <span class="badge in-stock">Ready to ship</span>
      </div>
    </div>
  </div>
</body>
</html>
"""

GREENHOUSE_CUSTOM_JOB_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Staff Backend Engineer - CloudScale Inc</title>
</head>
<body>
  <div id="app-body">
    <div class="job-header">
      <h1 class="app-title">Staff Backend Engineer</h1>
      <span class="company">CloudScale Inc</span>
      <div class="location">San Francisco, CA (Hybrid)</div>
    </div>
    <div class="job-details">
      <div class="salary-pill">$180,000 - $220,000 / year</div>
      <div class="job-description">
        <p>Architecting distributed database systems and real-time streaming engines.</p>
      </div>
    </div>
  </div>
</body>
</html>
"""

def test_shopify_custom_store_extraction():
    record, traces = MultiStrategyEngine.extract(
        html=SHOPIFY_CUSTOM_STORE_HTML,
        schema=PRODUCT_SCHEMA,
        target_url="https://studiopotters.com/products/ceramic-mug"
    )
    assert record["title"] == "Minimalist Ceramic Mug"
    assert record["price"] == 34.50
    assert record["currency"] == "USD"
    assert record["availability"] is not None

def test_greenhouse_custom_job_extraction():
    record, traces = MultiStrategyEngine.extract(
        html=GREENHOUSE_CUSTOM_JOB_HTML,
        schema=JOB_SCHEMA,
        target_url="https://boards.greenhouse.io/cloudscale/jobs/45678"
    )
    assert record["job_title"] == "Staff Backend Engineer"
    assert record["company"] == "CloudScale Inc"
    assert "San Francisco" in str(record["location"])
    assert "180,000" in str(record["salary"])

def test_adaptive_fuzzy_normalizer():
    raw_payload = {
        "saleprice": "$89.99",
        "productname": "Active Noise Cancelling Earbuds",
        "stockstatus": "in_stock",
        "employer_name": "DeepMind Partner",
        "worklocation": "London, UK",
        "numreviews": "450"
    }

    norm_product = Normalizer.normalize_record(raw_payload, PRODUCT_SCHEMA)
    assert norm_product["price"] == 89.99
    assert norm_product["currency"] == "USD"
    assert norm_product["title"] == "Active Noise Cancelling Earbuds"

    norm_job = Normalizer.normalize_record(raw_payload, JOB_SCHEMA)
    assert norm_job["company"] == "DeepMind Partner"
    assert norm_job["location"] == "London, UK"

def test_deep_semantic_validator_catches_invalid_content():
    # 1. Blocked error page title
    bad_record = {
        "title": "404 Not Found - Server Error",
        "price": 29.99,
        "currency": "USD",
        "availability": "In stock",
        "product_url": "https://example.com/item"
    }
    is_valid, missing, errors = Validator.validate_record(bad_record, PRODUCT_SCHEMA)
    assert is_valid is False
    assert any("blocked/error" in e for e in errors)

    # 2. Negative price
    bad_price_record = {
        "title": "Valid Headset",
        "price": -50.0,
        "currency": "USD",
        "availability": "In stock",
        "product_url": "https://example.com/item"
    }
    is_valid, missing, errors = Validator.validate_record(bad_price_record, PRODUCT_SCHEMA)
    assert is_valid is False
    assert any("negative" in e for e in errors)

def test_adversarial_repair_synthesis_and_validation():
    # Simulate a site redesign where previous selector `#old-price` breaks, but `.price-item` exists
    bundle = ExtractorRuleBundle(
        domain="studiopotters.com",
        version=1,
        field_rules={
            "price": FieldRule(field_name="price", primary_css="#old-broken-price-tag")
        }
    )

    patch = RepairEngine.diagnose_and_synthesize_patch(
        html=SHOPIFY_CUSTOM_STORE_HTML,
        target_url="https://studiopotters.com/products/ceramic-mug",
        schema=PRODUCT_SCHEMA,
        active_bundle=bundle,
        broken_fields=["price"],
        field_traces=[],
        scrape_run_id=99
    )

    assert "price" in patch.selector_diff
    diff = patch.selector_diff["price"]
    assert diff.get("new_selector") is not None
    assert diff.get("status") == "candidate_synthesized"

    # Validate against regression suite
    val_patch = RegressionValidator.validate_patch(
        patch=patch,
        schema=PRODUCT_SCHEMA,
        failing_html=SHOPIFY_CUSTOM_STORE_HTML,
        failing_url="https://studiopotters.com/products/ceramic-mug"
    )
    assert val_patch.confidence_score >= 0.80
    assert val_patch.field_recovery_rate == 1.0
