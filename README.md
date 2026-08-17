# MarketScout

**MarketScout** is an enterprise-grade web-data intelligence and autonomous self-healing scraping platform powered by **Bright Data** and a **Multi-Strategy Extractor Stack**. It provides automated schema extraction, versioned extractor rule bundles, continuous data quality gating, automated structural drift detection, candidate selector synthesis, and interactive human-in-the-loop repair workflows across e-commerce, talent markets, social media, and local business intelligence.

---

## Architecture & Autonomous Self-Healing Workflow

MarketScout implements a general, site-aware self-healing architecture:

1. **Multi-Strategy Extractor Engine (`MultiStrategyEngine`)**:
   - Executes ordered extraction methods with independent scoring:
     - **Strategy 1: JSON-LD**: Schema.org structured data (`Product`, `JobPosting`, `Person`, `LocalBusiness`).
     - **Strategy 2: Meta Tags**: OpenGraph (`og:*`), Twitter Cards (`twitter:*`), Dublin Core.
     - **Strategy 3: Versioned CSS/XPath Selectors**: Active rule bundle definitions per domain and template.
     - **Strategy 4: Semantic DOM Inference**: Microdata (`itemprop`), semantic tokens (`.product-title`, `.price`), label proximity.
     - **Strategy 5: LLM Fallback**: Downstream structured extraction via Groq when enabled.
2. **Versioned Extractor Rule Bundles (`ExtractorRuleBundleDB`)**:
   - Extraction rules are stored as versioned artifacts (`v1`, `v2`, etc.) grouped by `domain` and `template_signature` (structural DOM hash).
3. **Candidate Repair Engine (`RepairEngine`)**:
   - On field degradation (e.g. website redesign or broken selector), analyzes DOM markup, captures evidence, and synthesizes candidate replacement selectors with stability scores.
4. **Multi-Page Regression Validator (`RegressionValidator`)**:
   - Evaluates candidate patches across the failing page, holdout samples, and fixture test packs.
   - Calculates field recovery rate, non-regression rate, and composite confidence score.
5. **Human-in-the-Loop Promotion Gate**:
   - 1-click promotion updates the active rule bundle version, persists the regression test pack, and triggers verification rerun.

---

## Operating Modes

| Mode | Label in UI | Description |
|---|---|---|
| **Live Mode** | `Bright Data live mode` | Queries live web targets via Bright Data Datasets v3 and SERP APIs. Backend-only credentials. |
| **Offline Test Mode** | `Offline test mode — not live Bright Data data` | Executes against local HTML fixtures on disk (`fixtures/`) for automated CI testing and offline demonstration. |

---

## Supported Datasets & Schemas

| Workflow / Platform | Dataset ID | Schema | Fields Extracted |
|---|---|---|---|
| **E-Commerce (Amazon)** | `gd_l7q7dkf244hwjntr0` | `PRODUCT_SCHEMA` | `title`, `price`, `currency`, `availability`, `rating`, `review_count`, `seller`, `product_url` |
| **Talent & Jobs** | `BRIGHTDATA_JOB_DATASET_ID` | `JOB_SCHEMA` | `job_title`, `company`, `location`, `employment_type`, `salary`, `description`, `posted_date`, `application_url` |
| **X (Twitter)** | `gd_lwxkxvnf1cynvib9co` | `X_POST_SCHEMA` | `post_id`, `author_username`, `author_name`, `text`, `likes_count`, `retweets_count`, `replies_count`, `post_url` |
| **LinkedIn Profiles** | `gd_l1viktl72bvl7bjuj0` | `LINKEDIN_PROFILE_SCHEMA` | `full_name`, `headline`, `current_company`, `location`, `about`, `connections_count`, `profile_url` |
| **Facebook Posts** | `gd_lkaxegm826bjpoo9m5` | `FACEBOOK_POST_SCHEMA` | `post_id`, `page_name`, `content`, `likes_count`, `shares_count`, `comments_count`, `post_url` |
| **Instagram Profiles** | `gd_l1vikfch901nx3by4` | `INSTAGRAM_PROFILE_SCHEMA` | `username`, `full_name`, `bio`, `followers_count`, `following_count`, `posts_count`, `profile_url` |
| **Google Maps Places** | `gd_m8ebnr0q2qlklc02fz` | `GOOGLE_MAPS_SCHEMA` | `place_name`, `address`, `phone`, `rating`, `review_count`, `latitude`, `longitude`, `place_url` |

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your environment variables:
```env
SCRAPER_PROVIDER=brightdata
BRIGHTDATA_API_KEY=your_brightdata_api_key_here
BRIGHTDATA_BASE_URL=https://api.brightdata.com
BRIGHTDATA_PRODUCT_DATASET_ID=gd_l7q7dkf244hwjntr0
BRIGHTDATA_X_DATASET_ID=gd_lwxkxvnf1cynvib9co
BRIGHTDATA_LINKEDIN_DATASET_ID=gd_l1viktl72bvl7bjuj0
BRIGHTDATA_FACEBOOK_DATASET_ID=gd_lkaxegm826bjpoo9m5
BRIGHTDATA_INSTAGRAM_DATASET_ID=gd_l1vikfch901nx3by4
BRIGHTDATA_GOOGLE_MAPS_DATASET_ID=gd_m8ebnr0q2qlklc02fz
FRONTEND_ORIGIN=http://127.0.0.1:8000,http://localhost:5173
DATABASE_URL=sqlite:///./data/marketscout.db
ALLOW_DEMO_RESET=true
```

### 3. Build & Run (Single-Port Unified Mode)

```bash
# 1. Build the frontend production bundle
cd frontend
npm install
npm run build
cd ..

# 2. Start the unified FastAPI application
cd backend
python -m uvicorn app.main:app --port 8000 --host 127.0.0.1
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

---

## Testing & Quality Assurance

Run the automated backend test suite (42 unit and integration tests):
```bash
cd backend
pytest -q
```
Verify frontend compilation and type-checking:
```bash
cd frontend
npm run build
```
