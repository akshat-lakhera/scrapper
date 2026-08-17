# Public Source-Code References & Attributions

MarketScout was engineered in compliance with open-source licensing standards and hackathon requirements. The following public repositories and technical references were studied for architecture, self-healing strategies, item pipelines, and schema extraction patterns.

---

### 1. Bright Data Scraper Studio Node.js Boilerplate
- **Repository**: [brightdata/bright-data-scraper-studio-nodejs-project](https://github.com/brightdata/bright-data-scraper-studio-nodejs-project)
- **License**: MIT License
- **Concepts Used**:
  - Integration with Bright Data Scraper Studio, Data Collector API (DCA), and SERP API.
  - Collector trigger lifecycle (`/dca/trigger`), delivery webhook/polling models, and prompt-driven self-healing instruction payloads.
- **Usage**: Reference implementation for Bright Data API contracts and live mode authentication.

---

### 2. ScrapingBee AI Web Scraper
- **Repository**: [ScrapingBee/ai-web-scraper](https://github.com/ScrapingBee/ai-web-scraper)
- **License**: Apache 2.0 License
- **Concepts Used**:
  - Declarative natural-language field extraction schemas.
  - LLM and heuristic-guided DOM selector inference for e-commerce and job portals.
- **Usage**: Studied as conceptual reference for generic `ScrapeSchema` and attribute normalizers.

---

### 3. Crawloop Self-Healing Crawler
- **Repository**: [Jimmynycu/Crawloop](https://github.com/Jimmynycu/Crawloop)
- **License**: MIT License
- **Concepts Used**:
  - Automated selector degradation detection and missing-field scoring.
  - Multi-stage repair context generation, repair verification gates, and version rollback on failed recovery.
- **Usage**: Architecture pattern for the 3-stage Self-Healing Repair Center (`RepairCenter.tsx` + `ScrapeService.heal_scrape_run`).

---

### 4. Scrapy
- **Repository**: [scrapy/scrapy](https://github.com/scrapy/scrapy)
- **License**: BSD 3-Clause License
- **Concepts Used**:
  - Robust item processing pipelines, schema validation gates, normalization middleware, and structured execution timelines.
  - Separation of raw HTTP response payloads from normalized typed schema models.
- **Usage**: Architectural design principles for `Normalizer`, `Validator`, and audit logging.

---

### 5. Oxylabs AI Scraper
- **Repository**: [oxylabs/ai-scraper-py](https://github.com/oxylabs/ai-scraper-py)
- **License**: MIT License
- **Concepts Used**:
  - Schema-driven data extraction and structured JSON normalization.
  - Error categorization distinguishing data variance from extraction degradation.
- **Usage**: Conceptual reference for validation error taxonomies and quality scoring.

---

### 6. Import.io (Conceptual Production Reference)
- **Reference**: Import.io Web Data Extraction Architecture
- **License / Status**: Proprietary commercial software (Conceptual reference only)
- **Concepts Used**:
  - Enterprise change-detection paradigms (`data_changed` vs `extraction_degraded`).
  - No proprietary code or assets were used or copied.
