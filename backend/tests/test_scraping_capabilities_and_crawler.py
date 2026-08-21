import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.schema import get_all_schemas, get_schema_by_name, PRODUCT_SCHEMA, JOB_SCHEMA
from app.services.crawler_service import CrawlerService
from app.services.scrape_service import ScrapeService
from app.extraction.multi_strategy_engine import MultiStrategyEngine
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator

client = TestClient(app)

# ── 1. ALL 8 PLATFORM SCHEMAS EXTRACTION CAPABILITY ──────────────────────
SAMPLE_HTML_PAYLOADS = {
    "products": """
    <html><head><title>Gaming Laptop RTX 4080</title></head><body>
      <h1>Gaming Laptop RTX 4080</h1>
      <span class="price">$1,899.99</span>
      <span class="stock">In stock</span>
      <div class="seller">TechStore Direct</div>
    </body></html>
    """,
    "jobs": """
    <html><head><title>Senior AI Engineer - ScaleAI</title></head><body>
      <h1>Senior AI Engineer</h1>
      <span class="company">ScaleAI</span>
      <span class="location">Remote, US</span>
      <div class="salary">$190,000 - $240,000 / yr</div>
      <div class="description"><p>Building LLM fine-tuning and evaluation pipelines.</p></div>
    </body></html>
    """,
    "tech_docs": """
    <html><head><title>Authentication Guide — CloudDocs</title></head><body>
      <h1 class="doc-title">Authentication Guide</h1>
      <span class="version">v2.1.0</span>
      <h2 class="section-heading">Bearer Tokens</h2>
      <div class="content-body"><p>Authenticate using standard bearer token headers in all REST API requests.</p></div>
      <pre><code>curl -H "Authorization: Bearer token" https://api.example.com</code></pre>
    </body></html>
    """,
    "x": """
    <html><head><title>Post by @samaltman / X</title></head><body>
      <div data-testid="tweetText">Excited to release our next generation autonomous agentic intelligence model today!</div>
      <div class="author-name">Sam Altman</div>
      <div class="author-handle">@samaltman</div>
    </body></html>
    """,
    "linkedin": """
    <html><head><title>Dr. Jane Doe - VP of AI Research | LinkedIn</title></head><body>
      <h1 class="profile-name">Dr. Jane Doe</h1>
      <div class="headline">VP of AI Research at NeuralTech</div>
      <div class="location">San Francisco Bay Area</div>
      <div class="about">Leading foundation model alignment and multimodal research teams.</div>
    </body></html>
    """,
    "facebook": """
    <html><head><title>Tech Community Updates</title></head><body>
      <h1 class="page-name">AI Developers Hub</h1>
      <div class="post-content">Join our quarterly open-source hackathon this weekend!</div>
      <span class="reaction-count">1.4K Likes</span>
    </body></html>
    """,
    "instagram": """
    <html><head><title>Visual Arts Studio (@studioarts) on Instagram</title></head><body>
      <h1 class="profile-name">Visual Arts Studio</h1>
      <span class="username">@studioarts</span>
      <div class="bio">Digital art gallery & design laboratory based in Tokyo.</div>
    </body></html>
    """,
    "google_maps": """
    <html><head><title>Artisan Coffee Lab - Google Maps</title></head><body>
      <h1 class="place-name">Artisan Coffee Lab</h1>
      <span class="rating">4.8</span>
      <span class="reviews-count">520 reviews</span>
      <div class="address">123 Market St, San Francisco, CA 94105</div>
    </body></html>
    """
}

def test_all_8_workflow_schemas_extraction_capability():
    """Validates that all 8 supported platform workflows extract valid normalized data."""
    schemas = get_all_schemas()
    schema_names = [s.name for s in schemas]
    
    assert "products" in schema_names
    assert "jobs" in schema_names
    assert "tech_docs" in schema_names
    assert "x" in schema_names
    assert "linkedin" in schema_names
    assert "facebook" in schema_names
    assert "instagram" in schema_names
    assert "google_maps" in schema_names

    for workflow, html in SAMPLE_HTML_PAYLOADS.items():
        schema = get_schema_by_name(workflow)
        assert schema is not None, f"Schema {workflow} must exist"
        
        record, traces = MultiStrategyEngine.extract(
            html=html,
            schema=schema,
            target_url=f"https://example.com/{workflow}/123"
        )
        assert record is not None
        assert isinstance(record, dict)
        assert len(traces) > 0

        # Validate extracted fields against schema
        is_valid, missing, errors = Validator.validate_record(record, schema)
        assert is_valid is True or len(missing) == 0, f"Workflow {workflow} failed validation: {errors}"


# ── 2. BATCH SCRAPING EXECUTION CAPABILITY ──────────────────────────────
def test_batch_scraping_endpoint_concurrency_and_isolation():
    """Tests the concurrent multi-URL batch scraping endpoint."""
    batch_req = {
        "urls": [
            "https://demo.local/product_v1.html",
            "https://demo.local/product_v2.html",
            "https://demo.local/product_v1.html"
        ],
        "workflow_type": "products",
        "schema_name": "products"
    }

    response = client.post("/api/scrape/batch", json=batch_req)
    assert response.status_code == 200
    data = response.json()

    assert data["total_targets"] == 3
    assert data["successful"] == 3
    assert len(data["results"]) == 3

    for item in data["results"]:
        assert item["status"] in ("success", "repaired")
        assert item["quality_score"] >= 90
        assert "extracted_data" in item
        assert item["extracted_data"]["title"] == "Wireless Headphones"
        assert item["extracted_data"]["price"] == 4999.0


# ── 3. RECURSIVE SPIDERING & CRAWLER BOUNDARY CONTROLS ───────────────────
def test_crawler_link_extraction_normalization_and_deduplication():
    """Tests recursive crawler link extraction, URL normalization, query stripping, and asset filtering."""
    raw_html = """
    <html>
      <body>
        <!-- Valid internal links -->
        <a href="/products/item-1">Item 1</a>
        <a href="/products/item-2?ref=tracker#top">Item 2 with tracking & hash</a>
        <a href="https://myshop.com/products/item-1">Absolute internal link</a>
        
        <!-- Filtered external & asset links -->
        <a href="https://facebook.com/myshop">External Social Link</a>
        <a href="/downloads/catalog.pdf">PDF Asset</a>
        <a href="/assets/style.css">CSS Asset</a>
        <a href="javascript:void(0)">JS Void</a>
        <a href="tel:+18005550199">Phone Link</a>
      </body>
    </html>
    """
    base_url = "https://myshop.com/products"
    links = CrawlerService.extract_links(raw_html, base_url, "products")

    assert "https://myshop.com/products/item-1" in links
    assert "https://myshop.com/products/item-2" in links
    
    # Assert deduplication: item-1 only appears once
    assert len([l for l in links if "item-1" in l]) == 1

    # Assert external links and non-HTML assets are stripped
    assert not any("facebook.com" in l for l in links)
    assert not any(".pdf" in l for l in links)
    assert not any(".css" in l for l in links)
    assert not any("tel:" in l for l in links)


@pytest.mark.asyncio
async def test_crawler_deep_spidering_with_depth_and_page_limits():
    """Tests the deep recursive crawler enforcing max_depth and max_pages constraints."""
    db = SessionLocal()
    try:
        # Crawl fixture domain with depth limit
        crawl_result = await CrawlerService.crawl_recursive(
            db=db,
            start_url="https://demo.local/product_v1.html",
            workflow_type="products",
            schema_name="products",
            max_depth=1,
            max_pages=2
        )

        assert crawl_result["start_url"] == "https://demo.local/product_v1.html"
        assert crawl_result["total_pages_crawled"] >= 1
        assert crawl_result["total_pages_crawled"] <= 2
        assert len(crawl_result["crawled_pages"]) >= 1

        first_page = crawl_result["crawled_pages"][0]
        assert first_page["status"] == "success"
        assert first_page["extracted_data"]["title"] == "Wireless Headphones"
    finally:
        db.close()


# ── 4. LIVE RESILIENCE & ERROR RECOVERY IN SCRAPE PIPELINE ───────────────
@pytest.mark.asyncio
async def test_scrape_service_recovers_gracefully_on_network_timeout():
    """Ensures scrape pipeline handles network timeouts without unhandled server exceptions."""
    db = SessionLocal()
    try:
        with patch("app.providers.local_provider.LocalProvider.run_scraper", side_effect=Exception("Connection timed out after 30000ms")):
            run = await ScrapeService.execute_scrape(
                db=db,
                target_url="https://unresponsive-domain-slow.io/products/test",
                workflow_type="products",
                schema_name="products"
            )
            assert run.status in ("failed", "degraded")
            assert run.data_quality_score == 0
            assert "timeout" in str(run.validation_errors).lower() or "connection" in str(run.validation_errors).lower()
    finally:
        db.close()
