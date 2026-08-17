import pytest
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA
from app.models.extractor_rule import ExtractorRuleBundle, FieldRule
from app.extraction.multi_strategy_engine import MultiStrategyEngine
from app.extraction.fingerprinter import TemplateFingerprinter
from app.extraction.normalizer import Normalizer
from app.services.repair_engine import RepairEngine
from app.services.regression_validator import RegressionValidator
from app.services.scrape_service import ScrapeService
from app.database import SessionLocal, init_db

SAMPLE_PRODUCT_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Premium Noise Cancelling Headphones - AudioStore</title>
  <meta property="og:title" content="Premium Noise Cancelling Headphones" />
  <meta property="og:price:amount" content="4999.00" />
  <meta property="og:price:currency" content="INR" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Premium Noise Cancelling Headphones",
    "offers": {
      "@type": "Offer",
      "price": 4999.00,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock"
    }
  }
  </script>
</head>
<body>
  <div class="product-container">
    <h1 id="productTitle">Premium Noise Cancelling Headphones</h1>
    <div class="price-box">
      <span class="a-price"><span class="a-offscreen">₹4,999.00</span></span>
    </div>
    <div id="availability">
      <span>In Stock</span>
    </div>
  </div>
</body>
</html>
"""

def test_template_fingerprinter():
    domain = TemplateFingerprinter.extract_domain("https://www.amazon.in/dp/B0CRMZHDG8")
    assert domain == "amazon.in"

    domain_custom = TemplateFingerprinter.extract_domain("https://demo.local/product_v1.html")
    assert domain_custom == "demo.local"

    sig = TemplateFingerprinter.compute_template_signature(SAMPLE_PRODUCT_HTML, "https://demo.local")
    assert sig.startswith("tpl_")

    ptype = TemplateFingerprinter.infer_page_type("https://jobs.lever.co/company/123", "jobs")
    assert ptype == "job_posting"

def test_multi_strategy_engine_json_ld_and_meta():
    record, traces = MultiStrategyEngine.extract(
        html=SAMPLE_PRODUCT_HTML,
        schema=PRODUCT_SCHEMA,
        target_url="https://demo.local/sample-item"
    )
    assert record["title"] == "Premium Noise Cancelling Headphones"
    assert record["price"] == 4999.0
    assert record["currency"] == "INR"
    assert record["availability"] is not None

    price_trace = next((t for t in traces if t.field_name == "price"), None)
    assert price_trace is not None
    assert price_trace.strategy_used in ("json_ld", "meta_tags", "semantic_dom")

def test_repair_engine_candidate_synthesis():
    broken_html = """
    <html><body>
      <div class="main-body">
        <h1 class="product-name">Updated Ultra Headphones</h1>
        <div class="pricing-section">
          <span class="offer-price">₹5,499.00</span>
        </div>
      </div>
    </body></html>
    """
    rule_bundle = ExtractorRuleBundle(
        domain="demo.local",
        version=1,
        field_rules={
            "price": FieldRule(field_name="price", primary_css="#old_broken_price_id")
        }
    )

    patch = RepairEngine.diagnose_and_synthesize_patch(
        html=broken_html,
        target_url="https://demo.local/product",
        schema=PRODUCT_SCHEMA,
        active_bundle=rule_bundle,
        broken_fields=["price"],
        field_traces=[],
        scrape_run_id=10
    )

    assert "price" in patch.broken_fields
    assert patch.to_version == 2
    assert "price" in patch.selector_diff
    diff = patch.selector_diff["price"]
    assert diff.get("new_selector") is not None
    assert diff.get("status") == "candidate_synthesized"

def test_regression_validator_confidence_score():
    rule_bundle = ExtractorRuleBundle(
        domain="demo.local",
        version=1,
        field_rules={}
    )
    patch = RepairEngine.diagnose_and_synthesize_patch(
        html=SAMPLE_PRODUCT_HTML,
        target_url="https://demo.local/sample",
        schema=PRODUCT_SCHEMA,
        active_bundle=rule_bundle,
        broken_fields=["price"],
        field_traces=[],
        scrape_run_id=1
    )

    validated_patch = RegressionValidator.validate_patch(
        patch=patch,
        schema=PRODUCT_SCHEMA,
        failing_html=SAMPLE_PRODUCT_HTML,
        failing_url="https://demo.local/sample"
    )

    assert len(validated_patch.regression_tests) > 0
    assert validated_patch.confidence_score >= 0.80
    assert validated_patch.field_recovery_rate >= 0.90

def test_same_domain_multiple_templates_isolation():
    """Verifies that two distinct page templates on the same domain have isolated rule bundles."""
    init_db()
    db = SessionLocal()
    try:
        domain = "multitemplate.store"
        bundle_a = ScrapeService.get_or_create_active_rule_bundle(db, domain, "products", "tpl_grid_layout")
        bundle_b = ScrapeService.get_or_create_active_rule_bundle(db, domain, "products", "tpl_table_layout")

        assert bundle_a.template_signature == "tpl_grid_layout"
        assert bundle_b.template_signature == "tpl_table_layout"
        assert bundle_a.id != bundle_b.id
        assert bundle_a.version == 1
        assert bundle_b.version == 1
    finally:
        db.close()

def test_no_html_available_structured_payload_graceful_handling():
    """Verifies graceful schema normalization and validation when only structured API JSON is available without raw HTML."""
    structured_api_payload = {
        "title": "Cloud Database Pro Subscription",
        "final_price": 299.99,
        "curr": "USD",
        "stock": "Available",
        "rating_score": 4.8,
        "reviews": "450"
    }

    normalized = Normalizer.normalize_record(structured_api_payload, PRODUCT_SCHEMA)
    assert normalized["title"] == "Cloud Database Pro Subscription"
    assert normalized["price"] == 299.99
    assert normalized["currency"] == "USD"
    assert normalized["availability"] == "Available"
    assert normalized["rating"] == 4.8
    assert normalized["review_count"] == 450
