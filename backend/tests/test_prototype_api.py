import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_config_mode_endpoint():
    response = client.get("/api/config/mode")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "display_name" in data

def test_schemas_endpoint():
    response = client.get("/api/schemas")
    assert response.status_code == 200
    schemas = response.json()
    assert len(schemas) >= 2
    names = [s["name"] for s in schemas]
    assert "products" in names
    assert "jobs" in names

def test_scrape_endpoint_v1():
    response = client.post("/api/scrape", json={
        "target_url": "https://demo.local/product_v1.html",
        "workflow_type": "products",
        "schema_name": "products"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["extracted_data"]["title"] == "Wireless Headphones"
    assert data["extracted_data"]["price"] == 4999.0
    assert data["extracted_data"]["availability"] == "In stock"
