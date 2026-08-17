# Production Deployment Guide

MarketScout is designed as a self-contained full-stack service that can be containerized or deployed to any cloud provider (Render, Railway, Fly.io, AWS, GCP, Azure).

---

## 1. Single-Container Docker Deployment

Create a `Dockerfile` at the root of the repository:

```dockerfile
# Multi-stage build: Frontend + Backend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source & built frontend
COPY backend/ ./backend
COPY fixtures/ ./fixtures
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV SCRAPER_PROVIDER=brightdata
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend
EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 2. Environment Variables on Cloud Hosting

Set the following environment secrets in your cloud platform dashboard:

| Variable | Description |
|---|---|
| `SCRAPER_PROVIDER` | `brightdata` |
| `BRIGHTDATA_API_KEY` | Your Bright Data API Token |
| `BRIGHTDATA_BASE_URL` | `https://api.brightdata.com` |
| `DATABASE_URL` | `sqlite:///./data/marketscout.db` (or PostgreSQL URL) |

---

## 3. Health Checks

- **Health Probe**: `GET /api/health`
- **Config Probe**: `GET /api/config/mode`
