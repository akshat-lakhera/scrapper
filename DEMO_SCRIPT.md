# MarketScout Hackathon Demo Script

**Target Duration**: 3 to 4 minutes  
**Presenter Goal**: Showcase live Bright Data integration, dual intelligence workflows, automated degradation detection, and the 3-stage self-healing pipeline.

---

## Act 1: The Problem & Architecture (0:00 – 0:45)
- **Visual**: MarketScout Overview page with live metrics, animated counters, and 3D spotlight cards.
- **Narrative**:
  > *"Every modern data-driven business relies on web scraping. But the #1 failure mode in the industry is silent selector degradation — when a target website updates its DOM or anti-bot defenses, scrapers silently fail or return nulls.*
  > *MarketScout solves this with continuous schema validation, drift classification, and autonomous self-healing powered by Bright Data Scraper Studio."*

---

## Act 2: Product & Job Discovery (0:45 – 1:45)
- **Visual**: Switch to **Product Discovery**.
- **Action**: Paste a live product URL (Amazon / Flipkart) and click **Execute Extraction**.
- **Narrative**:
  > *"Users can target any global or Indian e-commerce marketplace. MarketScout executes the extraction via Bright Data, maps the attributes against our strict typed schema, and extracts title, price, currency, availability, and specs with zero hardcoded mocks."*
- **Visual**: Switch to **Job Discovery** and demonstrate structured job extraction.

---

## Act 3: Degradation & 3-Stage Self-Healing (1:45 – 3:00)
- **Visual**: Open **Self-Healing Center**.
- **Action**:
  1. Show **Step 1 (Audit & Diagnosis)**: Point out missing fields detected automatically by the quality gate.
  2. Show **Step 2 (Repair Plan)**: Display the natural-language repair instructions synthesized for Bright Data Scraper Studio.
  3. Click **Approve & Apply Repair**.
  4. Show **Step 3 (Verification & Recovery)**: Display the newly recovered schema payload with 100% data quality score.
- **Narrative**:
  > *"When website markup drifts, MarketScout isolates the broken selectors, constructs a natural-language repair prompt for Bright Data, waits for human approval, and verifies the repaired output. If a repair fails, it automatically triggers version rollback and escalates to manual review."*

---

## Act 4: Audit Timeline & Provenance (3:00 – 3:30)
- **Visual**: Open **Run History**, click **Inspect** on a run to reveal the translucent JSON diff inspector.
- **Conclusion**:
  > *"With full provenance, 100% test coverage, and native Bright Data Scraper Studio integration, MarketScout transforms brittle web scraping into an autonomous, resilient data infrastructure."*
