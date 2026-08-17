# MarketScout System Architecture

## 1. Executive Summary

MarketScout is an enterprise data extraction and self-healing platform engineered to address the core vulnerability of web scrapers: **silent selector degradation caused by website redesigns, DOM mutations, and anti-bot obstacles**.

---

## 2. Core Subsystems

### 2.1 Provider Layer & Abstraction
The system utilizes the `ScraperProvider` abstract base class (`app.providers.base`), enabling seamless switching between:
- **`BrightDataProvider`**: Connects directly to Bright Data Scraper Studio (DCA API & SERP API) with URL-encoded query synthesis and bot bypass.
- **`LocalProvider`**: Executes local fixture parsing from HTML files on disk, ensuring 100% offline testability.

### 2.2 Extraction & Normalization Pipeline
1. **Raw Ingestion**: Ingests raw HTML or JSON from the active provider.
2. **DOM Extraction (`DOMExtractor`)**: Parses structured microdata (`application/ld+json`, OpenGraph) and multi-platform DOM elements (Amazon `#productTitle`, Flipkart `div.Nx9bqj`, Myntra `h1.pdp-title`, etc.).
3. **Type Normalization (`Normalizer`)**:
   - Converts strings to typed floats, integers, and ISO timestamps.
   - Cleans currency symbols and maps domains to ISO 4217 currency codes (`INR`, `USD`, `EUR`, `GBP`).
4. **Validation Gate (`Validator`)**:
   - Evaluates mandatory schema attributes against `PRODUCT_SCHEMA` and `JOB_SCHEMA`.
   - Computes a granular **Data Quality Score (0–100%)**.

### 2.3 Drift & Self-Healing Decision Engine
The `DiffService` analyzes historical executions to categorize changes:
- **`data_changed`**: The source value changed (e.g., price ₹49,990 $\rightarrow$ ₹45,990), but the structure and field presence remain intact.
- **`extraction_degraded`**: A required field vanished or corrupted (e.g., `price` or `title` becomes `null`), triggering an automatic alert and repair request.

### 2.4 Self-Healing Workflow
```
   [Scrape Run] 
         │
   [Quality Gate] ──── Quality < 80%? ────► [Degraded Run Recorded]
         │                                              │
      Success                                [Generate Repair Context]
         │                                              │
   [Save Run Record]                         [Send Prompt to Bright Data]
                                                        │
                                             [Approval Gate (UI/API)]
                                                        │
                                            [Rerun & Re-verify Result]
                                                        │
                                     ┌──────────────────┴──────────────────┐
                                     │ Validated?                          │
                                    Yes                                   No
                                     │                                     │
                             [Mark Repaired]                       [Rollback Version]
                             [Update Scraper]                      [Mark Manual Review]
```

---

## 3. Data Schema & Persistence

Database models (`app.models`):
- **`ScraperDB`**: Stores registered scrapers, target domains, active versions, and health scores.
- **`ScrapeRunDB`**: Audit record of every execution including raw JSON payloads, normalized models, duration, and validation errors.
- **`RepairAttemptDB`**: Audit trail of self-healing requests, natural-language instructions, approval states, and recovered field diffs.
- **`FieldChangeDB`**: Field-level delta tracking between consecutive runs.

---

## 4. Frontend Architecture
Built using React 18, Vite, and Tailwind CSS with Apple-inspired translucent glass aesthetics:
- **`SpotlightCard`**: Interactive cards with cursor-following 3D perspective tilt and radial gradient lighting.
- **`Header`**: Translucent navigation bar (`backdrop-filter: blur(24px)`) with physical sliding pill indicators.
- **`ParticlesCanvas`**: 60 FPS HTML5 canvas particle mesh responding dynamically to mouse repulsion.
- **State Management**: Reactive custom hooks (`useScrambleText`, `useCounter`, `stagger`) with Emil Kowalski cubic-bezier spring physics (`cubic-bezier(0.23, 1, 0.32, 1)`).
