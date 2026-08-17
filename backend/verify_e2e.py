import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

def run_full_verification():
    init_db()
    client = TestClient(app)

    print("=" * 60)
    print("MARKETSCOUT END-TO-END VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health & Config
    h = client.get("/api/health")
    assert h.status_code == 200
    print(f"1. Health Check: OK -> {h.json()}")

    cm = client.get("/api/config/mode")
    assert cm.status_code == 200
    print(f"2. Provider Mode: {cm.json()['display_name']} (Provider: {cm.json()['provider']})")

    # 2. Schemas
    sc = client.get("/api/schemas")
    assert sc.status_code == 200
    schema_names = [s['name'] for s in sc.json()]
    print(f"3. Registered Schemas ({len(sc.json())}): {schema_names}")

    # 3. Live Search Discovery
    sr = client.post("/api/search", json={
        "query": "wireless headphones",
        "workflow_type": "products",
        "target_domain": "amazon.in"
    })
    assert sr.status_code == 200
    search_data = sr.json()
    results = search_data.get("results", [])
    print(f"4. Live Search: {len(results)} items found from Bright Data SERP")
    if results:
        print(f"   - First Result: {results[0].get('title')}")

    # 4. Product Scraper Run (Normal)
    ds = client.post("/api/scrape", json={
        "target_url": "https://demo.local/product_v1.html",
        "workflow_type": "products",
        "schema_name": "products"
    })
    assert ds.status_code == 200
    print(f"5. Product Scrape (Success Case): Status={ds.json()['status']}, Quality={ds.json()['quality_score']}%")

    # 5. Degraded Scraper Run & Self-Healing Trigger
    dg = client.post("/api/scrape", json={
        "target_url": "https://demo.local/product_v2.html",
        "workflow_type": "products",
        "schema_name": "products"
    })
    assert dg.status_code == 200
    run_id = dg.json()["run_id"]
    print(f"6. Degraded Run Detection: Status={dg.json()['status']}, Repair Triggered={dg.json()['repair_triggered']}")

    # 6. Heal Scraper
    hl = client.post(f"/api/scrapers/1/heal?run_id={run_id}")
    assert hl.status_code == 200
    attempt_id = hl.json()["attempt_id"]
    print(f"7. Self-Healing Request: Attempt ID={attempt_id}, Approval Status={hl.json()['approval_status']}")

    # 7. Approve Repair & Verify Output
    ap = client.post("/api/scrapers/1/approve-repair", json={"repair_attempt_id": attempt_id})
    assert ap.status_code == 200
    print(f"8. Repair Approval & Rerun: Status={ap.json()['status']}, Repaired Item={ap.json()['repaired_data']['title']}")

    # 8. Job Discovery Workflow
    jb = client.post("/api/scrape", json={
        "target_url": "https://demo.local/jobs/python-dev-123",
        "workflow_type": "jobs",
        "schema_name": "jobs"
    })
    assert jb.status_code == 200
    print(f"9. Job Discovery Scrape: Status={jb.json()['status']}, Title={jb.json()['extracted_data']['job_title']}, Company={jb.json()['extracted_data']['company']}")

    # 9. Audit History & Metrics
    runs = client.get("/api/runs")
    metrics = client.get("/api/metrics")
    print(f"10. Audit History & Metrics: Total Runs={len(runs.json())}, Metrics={metrics.json()}")
    print("=" * 60)
    print("ALL 10 VERIFICATION GATES PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_full_verification()
