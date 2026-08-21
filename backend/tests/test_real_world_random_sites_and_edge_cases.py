import pytest
import json
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA, TECH_DOCS_SCHEMA, get_schema_by_name
from app.models.extractor_rule import ExtractorRuleBundle, FieldRule
from app.extraction.multi_strategy_engine import MultiStrategyEngine
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.extraction.fingerprinter import TemplateFingerprinter
from app.services.repair_engine import RepairEngine
from app.services.regression_validator import RegressionValidator

# ── 1. REAL-WORLD NEXT.JS / TAILWIND E-COMMERCE WITH OBFUSCATED CLASSES ──
NEXTJS_MANGLED_STORE_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Apex ANC Pro Headphones | Apex Audio Official</title>
  <meta property="og:title" content="Apex ANC Pro Wireless Headphones" />
  <meta property="og:price:amount" content="299.00" />
  <meta property="og:price:currency" content="USD" />
</head>
<body class="bg-slate-900 text-slate-100 antialiased">
  <div id="__next">
    <main class="min-h-screen flex flex-col items-center justify-between p-6">
      <div class="css-1a8x9j c_99p_wrapper w-full max-w-5xl">
        <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">Apex ANC Pro Wireless Headphones</h1>
        <div class="flex items-center gap-4 mt-3">
          <div class="jsx-928374 pdp_price_container text-2xl font-bold text-emerald-400">$299.00</div>
          <div class="text-xs text-slate-400 uppercase tracking-wide bg-slate-800 px-2 py-1 rounded">In stock</div>
        </div>
        <div class="mt-4 text-slate-300">
          <p>High-fidelity studio wireless headphones with active noise cancellation and 50-hour battery life.</p>
        </div>
      </div>
    </main>
  </div>
  <script id="__NEXT_DATA__" type="application/json">
  {
    "props": {
      "pageProps": {
        "product": {
          "title": "Apex ANC Pro Wireless Headphones",
          "price": 299.00,
          "currency": "USD",
          "inStock": true,
          "rating": 4.8,
          "reviewCount": 3420,
          "seller": "Apex Audio Global"
        }
      }
    }
  }
  </script>
</body>
</html>
"""

# ── 2. E-COMMERCE WITH STRIKE-THROUGH DISCOUNT PRICING & MICRODATA ───────
NORDIC_STRIKE_PRICING_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Expedition Waterproof Parka — Nordic Gear</title>
</head>
<body>
  <div class="product-page" itemscope itemtype="http://schema.org/Product">
    <h1 itemprop="name" class="pdp-title">Expedition Waterproof Parka</h1>
    <div class="pricing-block" itemprop="offers" itemscope itemtype="http://schema.org/Offer">
      <span class="old-price strike text-gray-400 line-through">$249.00</span>
      <span class="sale-price font-bold text-red-600" itemprop="price">$169.00</span>
      <meta itemprop="priceCurrency" content="USD" />
      <span class="availability" itemprop="availability" content="http://schema.org/InStock">In Stock</span>
    </div>
    <div class="reviews-summary" itemprop="aggregateRating" itemscope itemtype="http://schema.org/AggregateRating">
      <span itemprop="ratingValue">4.7</span> out of 5 stars (<span itemprop="reviewCount">890</span> customer ratings)
    </div>
  </div>
</body>
</html>
"""

# ── 3. FINTECH CAREERS ADVERSARIAL DOM DRIFT ─────────────────────────────
FINTECH_CAREERS_REDESIGNED_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>Principal SRE - Infrastructure Platform | FinTech Global</title>
</head>
<body>
  <div class="modern-careers-layout">
    <div class="position-banner">
      <h1 class="career-position-headline">Principal SRE - Infrastructure Platform</h1>
      <span class="hiring-entity-name" data-company="FinTech Global">FinTech Global</span>
      <div class="workplace-pill" data-location="New York, NY (Hybrid)">New York, NY (Hybrid)</div>
    </div>
    <div class="compensation-section">
      <div class="comp-badge">$210,000 - $260,000 / yr + Equity</div>
    </div>
    <div class="role-overview-body">
      <p>Leading mission-critical low-latency distributed financial ledger infrastructure.</p>
    </div>
  </div>
</body>
</html>
"""

# ── 4. CLOUD API TECH DOCS WITH CODE SNIPPETS & VERSIONING ───────────────
CLOUD_API_DOCS_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>OAuth 2.0 Token Exchange API Reference — CloudScale Docs</title>
</head>
<body>
  <article class="doc-article">
    <header class="doc-header">
      <h1 class="doc-title">OAuth 2.0 Token Exchange API Reference</h1>
      <span class="doc-version-badge">v3.4.2</span>
      <time class="doc-updated-at">2026-08-15</time>
    </header>
    <section class="doc-section">
      <h2 class="section-heading">Authorization Grant Flow</h2>
      <div class="content-body">
        <p>Exchange temporary authorization codes for scoped short-lived JSON Web Tokens.</p>
      </div>
      <div class="code-snippet-box">
        <pre><code class="language-bash">POST /v3/oauth/token HTTP/1.1\nHost: api.cloudscale.io\nContent-Type: application/json</code></pre>
      </div>
    </section>
  </article>
</body>
</html>
"""

# ── 5. SOCIAL MEDIA PROFILE WITH K/M SHORTHAND METRICS ───────────────────
SOCIAL_CREATOR_PROFILE_HTML = """
<!DOCTYPE html>
<html>
<head>
  <title>TechLead Pro (@techlead_real) / X</title>
</head>
<body>
  <div class="profile-card">
    <h1 class="profile-display-name">TechLead Pro</h1>
    <span class="profile-handle">@techlead_real</span>
    <div class="profile-bio">Principal Software Architect & AI Engineering Researcher.</div>
    <div class="stats-row">
      <span class="stat-followers"><strong data-count="2.4M">2.4M</strong> Followers</span>
      <span class="stat-following"><strong data-count="850">850</strong> Following</span>
      <span class="stat-posts"><strong data-count="14.2K">14.2K</strong> Posts</span>
    </div>
  </div>
</body>
</html>
"""

# ── 6. CORRUPT / MALFORMED HTML WITH EMOJIS AND XSS ATTEMPTS ─────────────
CORRUPT_ADVERSARIAL_HTML = """
<div class="product-banner">
  <h1>🔥 Limited Collector Edition - Neon Cyberpunk Deck ⚡</h1>
  <div class="price-box">
    <span>Price: <strong>$89.95</strong></span>
  </div>
  <div class="stock">In stock ready to ship!</div>
  <script>alert("xss attempt");</script>
  <!-- unclosed tags intentionally below -->
  <div><span><div><p>Deeply nested unclosed malformed body
"""


def test_nextjs_mangled_tailwind_ecommerce_store():
    """Verifies extraction from Next.js SPA with obfuscated CSS classes and hydration script."""
    record, traces = MultiStrategyEngine.extract(
        html=NEXTJS_MANGLED_STORE_HTML,
        schema=PRODUCT_SCHEMA,
        target_url="https://apex-audio.store/products/noise-cancelling-pro"
    )
    assert record["title"] == "Apex ANC Pro Wireless Headphones"
    assert record["price"] == 299.00
    assert record["currency"] == "USD"
    assert record["availability"] == "In stock"
    
    is_valid, missing, errors = Validator.validate_record(record, PRODUCT_SCHEMA)
    assert is_valid is True
    assert len(errors) == 0


def test_nordic_apparel_strike_through_discount_pricing():
    """Ensures sale price ($169.00) is prioritized over strike-through old price ($249.00)."""
    record, traces = MultiStrategyEngine.extract(
        html=NORDIC_STRIKE_PRICING_HTML,
        schema=PRODUCT_SCHEMA,
        target_url="https://nordicgear.co/products/waterproof-jacket"
    )
    assert record["title"] == "Expedition Waterproof Parka"
    assert record["price"] == 169.00
    assert record["currency"] == "USD"
    assert record["rating"] == 4.7
    assert record["review_count"] == 890


def test_fintech_careers_adversarial_redesign_self_healing():
    """Tests autonomous repair synthesis when an external job board updates its DOM class structure."""
    # Old broken rule bundle from before redesign
    old_bundle = ExtractorRuleBundle(
        domain="fintechcareers.dev",
        version=1,
        field_rules={
            "job_title": FieldRule(field_name="job_title", primary_css=".old_job_title_v1"),
            "company": FieldRule(field_name="company", primary_css=".old_company_tag_v1"),
            "location": FieldRule(field_name="location", primary_css=".old_location_v1"),
            "salary": FieldRule(field_name="salary", primary_css=".old_salary_v1")
        }
    )

    patch = RepairEngine.diagnose_and_synthesize_patch(
        html=FINTECH_CAREERS_REDESIGNED_HTML,
        target_url="https://fintechcareers.dev/jobs/principal-sre",
        schema=JOB_SCHEMA,
        active_bundle=old_bundle,
        broken_fields=["job_title", "company", "location", "salary"],
        field_traces=[],
        scrape_run_id=101
    )

    # Verify synthesized candidate rules
    assert "job_title" in patch.selector_diff
    assert patch.selector_diff["job_title"]["status"] == "candidate_synthesized"
    assert "career-position-headline" in patch.selector_diff["job_title"]["new_selector"] or "h1" in patch.selector_diff["job_title"]["new_selector"]

    assert "salary" in patch.selector_diff
    assert "comp-badge" in patch.selector_diff["salary"]["new_selector"]

    # Verify regression score
    assert patch.confidence_score >= 0.85


def test_cloud_api_tech_docs_with_embedded_json_specs():
    """Tests tech documentation extraction with code snippets and version metadata."""
    schema = get_schema_by_name("tech_docs") or TECH_DOCS_SCHEMA
    record, traces = MultiStrategyEngine.extract(
        html=CLOUD_API_DOCS_HTML,
        schema=schema,
        target_url="https://developer.cloudscale.io/docs/v3/authentication"
    )
    assert "OAuth 2.0" in str(record.get("doc_title"))
    assert "v3.4.2" in str(record.get("last_updated") or record.get("version") or "")
    assert "Authorization Grant" in str(record.get("section_heading"))


def test_social_influencer_profile_metrics_with_k_m_multipliers():
    """Tests numeric multiplier parsing for 2.4M followers and 14.2K posts."""
    assert Normalizer.parse_number("2.4M followers") == 2400000.0
    assert Normalizer.parse_number("850 Following") == 850.0
    assert Normalizer.parse_number("14.2K Posts") == 14200.0
    assert Normalizer.parse_integer("1.5M") == 1500000


def test_malformed_html_unclosed_tags_and_emojis():
    """Verifies that unclosed tags, emojis, and script injection strings are safely parsed."""
    record, traces = MultiStrategyEngine.extract(
        html=CORRUPT_ADVERSARIAL_HTML,
        schema=PRODUCT_SCHEMA,
        target_url="https://cyberdeck.shop/items/neon"
    )
    assert "Limited Collector Edition" in record["title"]
    assert record["price"] == 89.95
    assert record["currency"] == "USD"
    # Ensure script content is not extracted as product description or title
    assert "alert" not in str(record.get("title"))
