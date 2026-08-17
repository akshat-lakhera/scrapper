# MarketScout

**MarketScout** is a production-grade web-data monitoring and self-healing scraping platform powered by **Bright Data Scraper Studio**. It provides automated schema extraction, continuous extraction health monitoring, structural drift detection, and interactive AI self-healing workflows for both e-commerce and employment market intelligence.

---

## Key Capabilities

1. **Dual Intelligence Workflows**:
   - **Product Discovery & Price Intelligence**: Real-time extraction of product titles, prices, currencies, stock availability, ratings, review counts, sellers, specs, and image assets across platforms like Amazon, Flipkart, Myntra, Walmart, and eBay.
   - **Job Listing Discovery & Market Compensation**: Structured extraction of job titles, hiring companies, locations, compensation brackets, descriptions, and application URLs.
2. **Bright Data Scraper Studio Integration**:
   - Primary live scraping provider using Bright Data SERP and DCA APIs.
   - Handles anti-bot challenges, dynamic JavaScript rendering, and geo-targeted data delivery.
3. **Automated Quality & Self-Healing Engine**:
   - **Degradation Detection**: Automatically differentiates between standard source-data variance (`data_changed`) and structural website redesigns (`extraction_degraded`).
   - **3-Stage Self-Healing Workstation**: Automated diagnostic audits, natural-language repair synthesis via Bright Data Scraper Studio, interactive approval gates, and verification testing with automated version rollback.
4. **Interactive Awwwards-Tier Dashboard**:
   - Translucent glassmorphism UI with Apple-grade fluid spring motion (`cubic-bezier(0.23, 1, 0.32, 1)`).
   - Mouse-tracking 3D spotlight illumination (`SpotlightCard`), kinetic alphanumeric decryption transitions, and 60 FPS interactive particle physics.

---

## Operating Modes

| Mode | Label in UI | Description |
|---|---|---|
| **Live Mode** | `Bright Data live mode` | Queries live web targets via Bright Data Scraper Studio APIs. Backend-only credentials. |
| **Offline Test Mode** | `Offline test mode — not live Bright Data data` | Executes against local HTML fixtures on disk (`fixtures/`) for automated CI testing and offline demonstration. |

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MarketScout Frontend                          │
│        (React 18 + Vite + Tailwind CSS + Lucide + Particle Engine)     │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTP / JSON API
┌──────────────────────────────────▼─────────────────────────────────────┐
│                          FastAPI Backend Core                          │
│   ├── Schema Registry (ProductSchema & JobSchema)                      │
│   ├── DOMExtractor (BeautifulSoup, JSON-LD, Microdata, OpenGraph)      │
│   ├── Normalizer & Validator (Type, Currency, Range & Schema Gates)    │
│   ├── DiffService (Drift Detection: data_changed vs degraded)          │
│   └── ScrapeService (Execution Orchestration & Version Management)     │
└───────────────────┬──────────────────────────────────┬─────────────────┘
                    │                                  │
    ┌───────────────▼───────────────┐  ┌───────────────▼───────────────┐
    │     Bright Data Provider      │  │     Local Offline Provider    │
    │  - Bright Data DCA Trigger    │  │  - DOM Fixture Parsing        │
    │  - Bright Data SERP Engine    │  │  - Synthetic Degradation Test │
    │  - Self-Healing Synthesis     │  │  - Zero Network Dependency    │
    └───────────────────────────────┘  └───────────────────────────────┘
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
Fill in your Bright Data credentials (kept strictly backend-only):
```env
SCRAPER_PROVIDER=brightdata
BRIGHTDATA_API_KEY=your_brightdata_api_key_here
BRIGHTDATA_BASE_URL=https://api.brightdata.com
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

MarketScout includes a test suite that passes 100% offline without live API credentials:

```bash
cd backend
pytest -v
python verify_e2e.py
```

---

## Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) — Comprehensive system architecture and data pipelines.
- [BRIGHTDATA_WORKFLOW.md](BRIGHTDATA_WORKFLOW.md) — Bright Data Scraper Studio API lifecycle and endpoints.
- [BRIGHTDATA_SETUP.md](BRIGHTDATA_SETUP.md) — Step-by-step setup for Bright Data API keys and zone permissions.
- [LIVE_TEST_CHECKLIST.md](LIVE_TEST_CHECKLIST.md) — Manual verification procedures for hackathon judges.
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) — Step-by-step demonstration walkthrough.
- [RECORDING_CHECKLIST.md](RECORDING_CHECKLIST.md) — Video demo guidelines and quality gates.
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production deployment instructions.
- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) — Hackathon submission compliance verification.
- [ATTRIBUTIONS.md](ATTRIBUTIONS.md) — Open-source citations and technical references.
