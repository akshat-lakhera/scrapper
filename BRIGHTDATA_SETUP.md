# Bright Data Setup & Configuration Guide

This guide details how to configure your Bright Data account and API credentials for MarketScout live mode.

---

## 1. Obtaining Bright Data API Credentials

1. Log in to your [Bright Data Control Panel](https://brightdata.com/cp).
2. Navigate to **Account Settings** $\rightarrow$ **API Tokens**.
3. Generate a new API token with access to **Data Collector (DCA)** and **SERP API**.
4. Copy the API Token to your `.env` file:
   ```env
   BRIGHTDATA_API_KEY=your_brightdata_api_token_here
   BRIGHTDATA_BASE_URL=https://api.brightdata.com
   ```

---

## 2. Configuring Bright Data Zones

MarketScout uses the `serp_api1` zone for live search and unstructured web unlocking.

1. In your Bright Data Control Panel, navigate to **My Zones**.
2. Verify you have a zone named `serp_api1` (or create a SERP API zone).
3. **Important: IP Whitelisting / Access Settings**:
   - Go to `https://brightdata.com/cp/zones/serp_api1/access_params`.
   - Ensure your client machine IP is added to the **Allowed IPs** list, or set the zone access policy to allow all authenticated requests.

---

## 3. Verifying Live Mode

1. Set `SCRAPER_PROVIDER=brightdata` in your `.env` file.
2. Start the backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --port 8000 --host 127.0.0.1
   ```
3. Check the health endpoint:
   ```bash
   curl http://127.0.0.1:8000/api/config/mode
   ```
   **Expected Response**:
   ```json
   {
     "provider": "brightdata",
     "brightdata_enabled": true,
     "display_name": "Bright Data live mode"
   }
   ```
