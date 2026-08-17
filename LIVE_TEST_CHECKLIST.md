# Live Test & Verification Checklist

This checklist provides a structured manual test procedure for validating all MarketScout features.

---

### Phase 1: Environment & Health Verification
- [ ] **Config Mode**: Visit `http://127.0.0.1:8000/api/config/mode` and verify `brightdata_enabled: true`.
- [ ] **UI Header**: Verify the top-right pill displays `Bright Data live mode` with a green pulse dot.

---

### Phase 2: Product Discovery & Extraction
- [ ] **Direct URL Scrape**:
  1. Go to **Product Discovery**.
  2. Enter a live e-commerce product URL (e.g. Amazon, Flipkart, Myntra, Walmart).
  3. Click **Execute Extraction**.
  4. Verify extracted card displays real title, price, currency, availability, rating, and seller.
  5. Click **View Raw JSON** to inspect the full parsed payload.

---

### Phase 3: Job Discovery & Market Compensation
- [ ] **Job Scrape**:
  1. Go to **Job Discovery**.
  2. Enter a live job URL (e.g. LinkedIn, Indeed, Glassdoor).
  3. Click **Execute Extraction**.
  4. Verify job title, company name, location, and application URL are populated.

---

### Phase 4: Self-Healing & Degradation Workflow
- [ ] **Trigger Degradation Test**:
  1. Run a degraded URL or test case where fields are missing.
  2. Navigate to **Self-Healing Center**.
  3. Verify **Step 1** displays the missing fields and degradation audit.
  4. Verify **Step 2** displays the synthesized Bright Data natural-language repair prompt.
  5. Click **Approve & Apply Repair**.
  6. Verify **Step 3** shows the recovered payload and status `REPAIRED` with 100% data quality.

---

### Phase 5: Audit Log & History
- [ ] **Run History**:
  1. Go to **Run History**.
  2. Inspect execution records in the monospace table.
  3. Click **Inspect** on any run to open the Apple-grade translucent JSON inspector.
  4. Toggle between `Normalized Result`, `Raw DOM Payload`, and `Validation Errors`.
  5. Click **Copy JSON** to confirm clipboard export.
