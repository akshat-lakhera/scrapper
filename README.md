# MarketScout

**MarketScout** is a production-grade web-data monitoring and self-healing scraping platform powered by **Bright Data**. It provides automated schema extraction, continuous extraction health monitoring, structural drift detection, and interactive self-healing workflows for both e-commerce and employment market intelligence.

---

## Architecture & Integration Modes

MarketScout supports 3 distinct operational modes:

1. **Bright Data Managed Datasets (`datasets/v3`)**:
   - Primary live e-commerce provider using Bright Data's verified Datasets v3 API (e.g. `gd_l7q7dkf244hwjntr0` for Amazon).
   - Asynchronous execution workflow:
     - `POST /datasets/v3/trigger?dataset_id={dataset_id}` (stores `snapshot_id`)
     - Poll `GET /datasets/v3/progress/{snapshot_id}` across `collecting`, `digesting`, and `ready` states
     - Download structured dataset via `GET /datasets/v3/snapshot/{snapshot_id}?format=json`
2. **Bright Data Custom Scraper Studio Collectors**:
   - Schema-driven collectors for custom target domains using instructions and field rules.
3. **Local Offline Test Provider**:
   - Executes against local HTML fixtures on disk (`fixtures/`) for automated CI testing and offline demonstration without network calls or API keys.

---

## Operating Modes

| Mode | Label in UI | Description |
|---|---|---|
| **Live Mode** | `Bright Data live mode` | Queries live web targets via Bright Data Datasets v3 and SERP APIs. Backend-only credentials. |
| **Offline Test Mode** | `Offline test mode — not live Bright Data data` | Executes against local HTML fixtures on disk (`fixtures/`) for automated CI testing and offline demonstration. |

---

## System Architecture

```
+------------------------------------------------------------------------+
|                          MarketScout Frontend                          |
|        (React 18 + Vite + Tailwind CSS + Lucide + Fluid UI)            |
+----------------------------------+-------------------------------------+
                                   | HTTP / JSON API
+----------------------------------v-------------------------------------+
|                          FastAPI Backend Core                          |
|   |-- Schema Registry (ProductSchema & JobSchema)                      |
|   |-- Groq Extractor (Downstream Field Normalization)                  |
|   |-- Normalizer & Validator (Type, Currency, Range & Schema Gates)    |
|   |-- DiffService (Drift Detection: data_changed vs degraded)          |
|   +-- ScrapeService (Execution Orchestration & Version Management)     |
+-------------------+----------------------------------+-----------------+
                    |                                  |
    +---------------v---------------+  +---------------v---------------+
    |     Bright Data Provider      |  |     Local Offline Provider    |
    |  - Datasets v3 Trigger/Snap   |  |  - DOM Fixture Parsing        |
    |  - Progress State Machine     |  |  - Synthetic Degradation Test |
    |  - Scraper Studio Healer      |  |  - Zero Network Dependency    |
    +-------------------------------+  +-------------------------------+
```

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
Fill in your credentials (kept strictly backend-only):
```env
SCRAPER_PROVIDER=brightdata
BRIGHTDATA_API_KEY=your_brightdata_api_key_here
BRIGHTDATA_BASE_URL=https://api.brightdata.com
BRIGHTDATA_PRODUCT_DATASET_ID=gd_l7q7dkf244hwjntr0
BRIGHTDATA_JOB_DATASET_ID=
FRONTEND_ORIGIN=http://127.0.0.1:8000,http://localhost:5173
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

Open your browser at:
```
http://127.0.0.1:8000/
```

---

## Running Automated Tests

Run the complete test suite with `pytest`:
```bash
cd backend
pytest -v
```

Run the end-to-end verification gate:
```bash
python verify_e2e.py
```
