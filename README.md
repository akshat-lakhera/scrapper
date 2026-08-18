# MarketScout — Autonomous Self-Healing Scraper & Intelligence Platform

**MarketScout** is an enterprise-grade web intelligence and autonomous self-healing scraping platform powered by **Bright Data Scraper Studio & Datasets v3**, an **Autonomous Multi-Strategy Extraction Engine**, and a **Living RAG Knowledge Base**.

It provides automated schema extraction, versioned rule bundles partitioned by template signature, continuous data quality gating, automated structural drift detection, candidate selector synthesis, and interactive human-in-the-loop repair workflows across e-commerce, developer documentation, talent markets, social media, and local business intelligence.

---

## 🚀 Key Architectural Pillars

### 1. 🛡️ Autonomous Self-Healing Core (Idea #4)
- **Multi-Strategy Extractor Stack (`MultiStrategyEngine`)**:
  - **Strategy 1: Versioned CSS/XPath Rules**: Active rule bundle definitions per domain and template.
  - **Strategy 2: Schema.org JSON-LD**: Structured entity parsing (`Product`, `JobPosting`, `Person`, `LocalBusiness`).
  - **Strategy 3: OpenGraph & Twitter Meta Tags**: Standardized semantic web attributes.
  - **Strategy 4: Semantic DOM Inference**: Microdata (`itemprop`), semantic class heuristics, label proximity.
  - **Strategy 5: LLM Normalizer (Groq)**: Downstream structured extraction via `llama-3.3-70b-versatile`.
- **Candidate Repair Engine (`RepairEngine`)**:
  - Analyzes mutated DOM trees, captures broken selector traces, and synthesizes replacement selectors with stability scores.
- **Regression Validator (`RegressionValidator`)**:
  - Tests candidate patches against holdouts with composite confidence gating ($\ge 70\%$).
- **Autonomous Promotion**:
  - Automatically promotes candidate patches to `v(N+1)` and reruns extraction with **zero human intervention**.

### 2. 🧠 Living RAG Knowledge Base (Idea #6)
- Instant **"Chat with Scraped Web Data & Docs"** powered by Groq (`llama-3.3-70b-versatile`).
- Generates answers strictly grounded in extracted data with **exact source URLs and field citations**.
- **Zero-Rot Guarantee**: The knowledge base never rots because the ingestion scraper heals itself in real-time when websites redesign.

### 3. 📊 Competitive Intelligence & Semantic Diff Radar (Idea #7)
- Automatically compares the latest scrape runs against historical baselines on the same domain.
- Computes price fluctuations, stock status transitions, and newly added specifications.
- Generates automated AI executive briefings summarizing competitor movements.

### 4. 🤖 Headless CLI Bridge (`python -m app.cli`) (Idea #5)
- Designed for terminal agents (Claude Code, Cursor, Codex) and automated CI/CD runners:
  ```bash
  # Check system & Bright Data configuration
  python -m app.cli status

  # Scrape with autonomous self-healing and JSON output
  python -m app.cli run "https://demo.local/tech_docs_redesign.html" --workflow tech_docs --auto-heal --json

  # Headless CI runner (exits 0 on green, 1 on failure)
  python -m app.cli ci-run "https://demo.local/product_v1.html" --workflow products --strict

  # Ask questions against the scraped knowledge base (RAG)
  python -m app.cli ask "What is the price of the Portronics fan and is it in stock?"

  # Generate competitive intelligence briefing
  python -m app.cli intel --domain amazon.in
  ```

---

## 🌐 Supported Datasets & Schemas

| Workflow / Platform | Dataset / Collector Type | Schema | Fields Extracted |
|---|---|---|---|
| **E-Commerce (Amazon)** | `gd_l7q7dkf244hwjntr0` | `PRODUCT_SCHEMA` | `title`, `price`, `currency`, `availability`, `rating`, `review_count`, `seller`, `product_url` |
| **Tech Docs & API Specs** | `c_*` (Scraper Studio Custom) | `TECH_DOCS_SCHEMA` | `doc_title`, `section_heading`, `content_body`, `code_snippet`, `last_updated`, `doc_url` |
| **Talent & Jobs** | `BRIGHTDATA_JOB_DATASET_ID` | `JOB_SCHEMA` | `job_title`, `company`, `location`, `employment_type`, `salary`, `description`, `posted_date`, `application_url` |
| **X (Twitter)** | `gd_lwxkxvnf1cynvib9co` | `X_POST_SCHEMA` | `user_posted`, `description`, `likes`, `reposts`, `replies`, `views`, `date_posted`, `post_url` |
| **LinkedIn Profiles** | `gd_l1viktl72bvl7bjuj0` | `LINKEDIN_PROFILE_SCHEMA` | `name`, `headline`, `current_company`, `location`, `about`, `connections`, `education`, `profile_url` |
| **Instagram Profiles** | `gd_l1vikfch901nx3by4` | `INSTAGRAM_PROFILE_SCHEMA` | `username`, `full_name`, `biography`, `followers_count`, `following_count`, `posts_count`, `profile_url` |
| **Reddit Discussions** | `gd_lvz8ah06191smkebj4` | `REDDIT_POST_SCHEMA` | `title`, `subreddit`, `user_posted`, `description`, `upvotes`, `num_comments`, `date_posted`, `post_url` |
| **Google Maps Places** | `gd_m8ebnr0q2qlklc02fz` | `GOOGLE_MAPS_SCHEMA` | `title`, `address`, `phone`, `rating`, `reviews_count`, `category`, `latitude`, `longitude`, `place_url` |
| **Facebook Posts** | `gd_lkaxegm826bjpoo9m5` | `FACEBOOK_POST_SCHEMA` | `page_name`, `content`, `likes`, `shares`, `comments`, `date_posted`, `post_url` |

---

## ⚡ Quick Start Guide

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
BRIGHTDATA_REDDIT_DATASET_ID=gd_lvz8ah06191smkebj4
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./data/marketscout.db
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

## 🧪 Testing & Quality Assurance

Run the complete backend unit, integration, and adversarial test suite (**55/55 passing 100%**):
```bash
cd backend
pytest -v
```
```
======================== 55 passed, 1 warning in 5.25s ========================
```
