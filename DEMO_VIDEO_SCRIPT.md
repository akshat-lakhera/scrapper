# 🎬 MarketScout Pro v2.5 — Official Hackathon Video Demo Script & Action Playbook

> **Guide for Recording**:
> - **Part 1**: The exact words and bullet points to speak (clear, confident, no timestamps).
> - **Part 2**: The exact click-by-click screen actions to perform simultaneously with your voiceover.
> - **Rule**: Only features that are **100% built, tested, and verified** are included.

---

# 🎙️ PART 1: SPOKEN SCRIPT (What to Say)

### 1. The Hook & The Problem
* The modern web is constantly changing, making traditional web scrapers notoriously fragile.
* A single website redesign, a renamed CSS class, or an anti-bot update will break production pipelines, returning empty data and costing engineering teams hours of manual debugging.
* Today, we present **MarketScout Pro v2.5** — an autonomous, self-healing web data intelligence platform powered by **Bright Data Scraper Studio & Web Unlocker**.
* MarketScout eliminates data rot completely by pairing Bright Data's residential proxy infrastructure with an autonomous multi-strategy extraction engine that detects DOM breaking changes, synthesizes replacement selectors, and hot-patches extraction rules in real time with zero human intervention.

---

### 2. Command Center & Multi-Strategy Waterfall
* Here in the **Command Center**, we can deploy extraction pipelines across any target URL, batch multi-URLs, or recursive deep crawling.
* Watch what happens when we deploy an agent on an Amazon product target.
* Behind the scenes, MarketScout executes a **5-stage cascade waterfall**:
  * **Stage 1 (Crawl)**: Routes traffic through Bright Data Web Unlocker to solve CAPTCHAs, rotate residential IPs, and bypass bot detection.
  * **Stage 2 (Fingerprint)**: Generates a skeleton DOM hash to identify the layout template.
  * **Stage 3 (Extract)**: Executes an ordered fallback chain — from local rule bundles, to JSON-LD Schema.org metadata, OpenGraph tags, regex heuristics, and finally Groq Llama-3.3-70B.
  * **Stage 4 (Validate)**: Enforces strict Pydantic schema contracts to guarantee field types, non-null constraints, and data reliability.
  * **Stage 5 (Deliver)**: Automatically ingests normalized records into SQLite WAL storage and updates the living RAG knowledge vector index.
* On the right, the **Extraction Audit Stream** provides instant dual-view inspection — rendering both a rich visual product card with high-resolution image previews, and the validated raw JSON payload with 1-click exports in JSON, CSV, or NDJSON formats.

---

### 3. The Core Innovation: Autonomous Self-Healing & AST Repair
* Now, let's look at what happens when an upstream website updates its HTML and breaks the CSS selectors.
* In traditional scrapers, the pipeline fails silently.
* In MarketScout, we click **Simulate DOM Drift** to test an adversarial upstream class change.
* When we open the **Self-Healing Lab**, we immediately see our diagnostic radar at work:
  * In red, MarketScout isolates the exact deprecated selectors that broke during extraction.
  * In green, our autonomous repair engine synthesizes replacement CSS selectors using structural tree heuristics.
  * It tests the new selectors against historical holdout snapshots, calculates a **100% Holdout Confidence Score**, and enforces an **AST Regression Prevention Guarantee** to ensure no other fields break.
* With a single click, we can live re-test and promote this hot-patch to the versioned rule bundle, seamlessly advancing the extraction engine from version 1.0 to version 2.0 without a single line of manual code changes.

---

### 4. Multi-Platform Extraction Studio & Schema Engine
* Moving to the **Extraction Studio**, MarketScout comes pre-armed with 8 production-grade schema contracts:
  * E-Commerce Retail (Amazon), Developer Documentation (FastAPI), Executive Talent (LinkedIn Profiles), Social Intelligence (X Posts and Instagram), Labor Markets (Lever & Greenhouse Job Postings), Community Threads (Reddit), and Local POI (Google Maps Places).
* Each target protocol features an interactive Schema Contract Blueprint, strict type validation, and instant code generation where developers can export clean Python SDK or cURL integration snippets.

---

### 5. Living RAG Knowledge Nexus & Zero-Hallucination Intelligence
* In the **Living RAG Studio**, we query all extracted web entities using multi-LLM grounded synthesis powered by Groq Llama-3.3-70B and Gemini.
* Unlike generic AI wrappers that hallucinate, every single response in MarketScout is strictly bound to indexed database records.
* When we ask for a cross-catalog price comparison between our Amazon US and Amazon India targets, MarketScout renders a clean, structured comparison table complete with live stock statuses, star ratings, and exact field-level citation chips linking directly to the canonical source URLs.

---

### 6. Audit Timeline, Enterprise Administration & 100% Test Verification
* In the **Audit Timeline**, developers have access to a monospace execution ledger with interactive sorting across Run IDs, quality scores, and durations.
* The **System Administration Console** provides full enterprise control — from adjusting concurrency worker pools and request timeouts, to configuring autonomous quality gates and streaming real-time webhook events to downstream consumers.
* Under the hood, MarketScout is built for production reliability. Our backend is protected by **67 passing unit and integration tests with 100% pass rate**, fully type-checked with TypeScript and Pydantic, and packaged with a standalone CLI runner for automated CI/CD execution.
* MarketScout proves that web scraping doesn't have to be brittle — with Bright Data and autonomous self-healing, data pipelines can adapt, self-repair, and scale reliably forever.

---

# 🎬 PART 2: ACTION PLAYBOOK (What to Do on Screen)

### Step 1: Opening Hero Shot (Command Center)
1. Open browser at `http://127.0.0.1:8000`.
2. Start on the **Command Center** tab.
3. Show the top status bar: point out `● ENGINE ONLINE` and `Cluster: Bright Data Live mode`.
4. Hover over the **Target Protocol Presets** (`Tech Docs & APIs`, `LinkedIn Talent`, `Amazon E-Commerce`).

### Step 2: Live Extraction Execution
1. Click the **Amazon E-Commerce** preset (Sony WH-1000XM5).
2. Click the primary blue **`Deploy Agent`** button.
3. Watch the **5-Stage Waterfall Cards** light up sequentially (`01 CRAWL` $\rightarrow$ `05 DELIVER`).
4. Point to the right-hand **Audit Stream**:
   - Show the **Visual Card** with the Sony headphone image preview, price ($398.00), and 96% quality score.
   - Click the **Raw JSON** toggle button to show the clean structured dictionary.
   - Hover over the **Export: JSON / CSV / NDJSON** pills in the Audit Stream header.

### Step 3: Demonstrate Recursive Deep Crawler (Optional Quick Feature)
1. In the top toolbar, click **`🕸️ Deep Crawler`**.
2. Show the configurable **Max Crawl Depth (2)** and **Max Pages (5)** dropdowns.
3. Switch back to **Single Target**.

### Step 4: The Showstopper — Trigger Self-Healing Live
1. Click the **`⚡ Simulate DOM Drift`** button in the top action bar.
2. Watch the toast notification pop up: *"Drift Injected — Upstream HTML classes altered"*.
3. Click the **`Self-Healing Lab`** tab in the main navigation bar.
4. On the left list, click the latest degraded run (`Run #...`).
5. Point to the **Diagnostic Record**:
   - Point out the **Red Box**: Deprecated / Drifted Selectors (`.product-price`).
   - Point out the **Green Box**: Synthesized Replacement Selectors (`.price-current`).
   - Point out the **Holdout Confidence: 100%** badge and **AST Regression Prevention Guarantee**.
6. Click the blue **`Live Re-Test & Validate`** button $\rightarrow$ show the green success notification.
7. Click the green **`Promote Candidate to Rule Bundle`** button $\rightarrow$ show version incrementing to $v2.0$.

### Step 5: Tour the Extraction Studio
1. Click the **`Extraction Studio`** tab in the main navigation.
2. Show the 8 bento cards (`Amazon E-Commerce`, `Tech Docs & API Specs`, `LinkedIn Profiles`, `X Feed`, `Talent & Jobs`, `Instagram Profiles`, `Reddit Discussions`, `Google Maps Places`).
3. Click **`LinkedIn Profiles`** $\rightarrow$ show the **Active Target** blue beacon and the **Schema Blueprint Contract** below it.
4. Click **`Generate SDK Snippet`** in the hero card $\rightarrow$ show the clean Python / cURL modal and close it.

### Step 6: Tour the Living RAG Knowledge Nexus
1. Click the **`Living RAG & Intel`** tab in the main navigation.
2. Show the pre-loaded analytical query and the **Grounded Comparison Table** comparing the Sony headphones vs. the Portronics fan.
3. Point out the **Verified Source Citations** chips at the bottom (`[1] Amazon US`, `[2] Amazon IN`) with direct external links.
4. Click one of the **Suggested Questions** on the left (e.g. *"What are the key collector methods described in the Tech Docs?"*) $\rightarrow$ show real-time grounded generation.

### Step 7: Tour Audit Timeline & Enterprise Settings
1. Click the **`Audit Timeline`** tab in the main navigation.
2. Point out the monospace execution ledger, filter by **`Products`** or **`Jobs`**, and click the column header **`QUALITY ↕`** or **`DURATION ↕`** to show interactive sorting.
3. Click the **`Settings`** tab in the main navigation.
4. Show the **Bright Data Web Unlocker Status**, drag the **Max Concurrent Scrapers** slider (e.g., from 10 to 15), toggle the **Quality Gating** switches, and point out the **Real-Time Webhook Pipeline Dispatcher**.

### Step 8: Terminal Proof & Closing Statement
1. Switch to your VS Code / Terminal window.
2. Run `pytest -v` in the terminal.
3. Show all **67 unit and integration tests passing in green (100%)**.
4. Conclude with a strong closing sentence thanking the judges and Bright Data!
