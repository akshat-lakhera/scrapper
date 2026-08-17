# Bright Data Scraper Studio Integration Workflow

This document details the verified API and CLI workflow for integrating **Bright Data Scraper Studio** into **ScrapeGuard**.

---

## 1. Credentials & Environment Configuration

```env
# Provider Mode ('brightdata' or 'local')
SCRAPER_PROVIDER=brightdata

# Bright Data API Credentials
BRIGHTDATA_API_KEY=bd_api_key_here
BRIGHTDATA_SCRAPER_ID=c_xxxxxxxxxxxx
BRIGHTDATA_WORKSPACE_ID=w_xxxxxxxxxxxx
BRIGHTDATA_BASE_URL=https://api.brightdata.com
```

- **Authentication Header**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`
- **Security Rule**: API keys are accessed backend-only and never exposed to the frontend or committed to source control.

---

## 2. Verified API Workflows

### A. Scraper Creation Workflow
- **Endpoint**: `POST https://api.brightdata.com/dca/collectors`
- **Headers**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`, `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "name": "ScrapeGuard_Product_Scraper",
    "target_url": "https://example.com/product/123",
    "fields": ["title", "price", "currency", "availability"],
    "instructions": "Extract title, integer price in INR, currency code, and stock status."
  }
  ```
- **Response**: `201 Created` or `200 OK`
  ```json
  {
    "collector_id": "c_xxxxxxxxxxxx",
    "status": "created"
  }
  ```

### B. Trigger Collection (Run Scraper)
- **Endpoint**: `POST https://api.brightdata.com/dca/trigger?collector={COLLECTOR_ID}`
- **Headers**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`, `Content-Type: application/json`
- **Request Payload**:
  ```json
  [
    {
      "url": "https://example.com/product/123"
    }
  ]
  ```
- **Response**: `200 OK` or `202 Accepted`
  ```json
  {
    "collection_id": "s_yyyyyyyyyyyy"
  }
  ```

### C. Retrieve Dataset Results
- **Endpoint**: `GET https://api.brightdata.com/dca/dataset?id={COLLECTION_ID}`
- **Headers**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`
- **Behavior**:
  - `202 Accepted`: Job is currently processing. Client polls again with exponential backoff (e.g. 1.5s interval).
  - `200 OK`: Job finished. Body contains the extracted JSON dataset:
    ```json
    [
      {
        "url": "https://example.com/product/123",
        "title": "Wireless Headphones",
        "price": 4999,
        "currency": "INR",
        "availability": "In stock"
      }
    ]
    ```

### D. Self-Healing & Refactor Workflow
- **Endpoint**: `POST https://api.brightdata.com/dca/collectors/{COLLECTOR_ID}/refactor_template`
- **Headers**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`, `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "target_url": "https://example.com/product/123",
    "instruction": "The title and price selectors broke. Update selectors to extract visible title and price in INR.",
    "failure_context": {
      "missing_fields": ["title", "price"],
      "invalid_fields": []
    }
  }
  ```
- **Response**:
  ```json
  {
    "repair_id": "rep_zzzzzzzzzz",
    "status": "repair_requested"
  }
  ```

### E. Approve Repair Workflow
- **Endpoint**: `POST https://api.brightdata.com/dca/collectors/{COLLECTOR_ID}/approve`
- **Headers**: `Authorization: Bearer ${BRIGHTDATA_API_KEY}`, `Content-Type: application/json`
- **Request Payload**:
  ```json
  {
    "repair_id": "rep_zzzzzzzzzz"
  }
  ```
- **Response**:
  ```json
  {
    "status": "approved"
  }
  ```

---

## 3. Provider Limitations & Error Handling
1. **Asynchronous Processing**: Bright Data triggers runs asynchronously. Polling must use exponential backoff (up to 30–60 seconds max).
2. **Missing Credentials**: When `SCRAPER_PROVIDER=brightdata` and `BRIGHTDATA_API_KEY` is empty, the provider returns a clear configuration error instead of failing silently or using fake credentials.
3. **Offline Fallback**: When `SCRAPER_PROVIDER=local`, `LocalProvider` uses local fixtures and rule-based extraction for unit testing and offline development.
