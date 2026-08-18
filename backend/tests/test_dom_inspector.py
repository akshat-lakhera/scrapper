import pytest
from app.services.dom_inspector_service import DOMInspectorService

SAMPLE_HTML = """
<html>
    <head><title>Test Store</title></head>
    <body>
        <div id="main-content">
            <h1 class="product-title">Ultra HD Wireless Noise Canceling Headphones</h1>
            <div class="pricing-container">
                <span class="price-current">$299.99</span>
                <span class="price-old">$349.99</span>
            </div>
            <div class="inventory-status">
                <span class="in-stock">In Stock (Only 4 left)</span>
            </div>
            <div class="product-rating">
                <span class="stars">4.8 out of 5 stars</span>
            </div>
            <ul class="features">
                <li>Active Noise Cancellation</li>
                <li>40 Hour Battery Life</li>
                <li>Bluetooth 5.3 Multipoint</li>
            </ul>
        </div>
    </body>
</html>
"""

def test_evaluate_valid_unique_selector():
    res = DOMInspectorService.evaluate_selector(SAMPLE_HTML, ".price-current")
    assert res["match_count"] == 1
    assert res["is_unique"] is True
    assert res["stability_score"] >= 80.0
    assert len(res["matches"]) == 1
    assert res["matches"][0]["text"] == "$299.99"
    assert res["matches"][0]["tag"] == "span"

def test_evaluate_multi_node_selector():
    res = DOMInspectorService.evaluate_selector(SAMPLE_HTML, "li")
    assert res["match_count"] == 3
    assert res["is_unique"] is False
    assert len(res["matches"]) == 3
    assert res["matches"][0]["text"] == "Active Noise Cancellation"

def test_evaluate_invalid_selector():
    res = DOMInspectorService.evaluate_selector(SAMPLE_HTML, "div[invalid==")
    assert res["match_count"] == 0
    assert res["error"] is not None

def test_suggest_selectors_for_price():
    suggestions = DOMInspectorService.suggest_selectors(SAMPLE_HTML, "price")
    assert len(suggestions) >= 1
    # At least one suggestion should target price
    selectors = [s["selector"] for s in suggestions]
    assert any(".price" in sel or "price" in sel for sel in selectors)
    assert suggestions[0]["stability_score"] >= 50.0

def test_suggest_selectors_for_title():
    suggestions = DOMInspectorService.suggest_selectors(SAMPLE_HTML, "title")
    assert len(suggestions) >= 1
    selectors = [s["selector"] for s in suggestions]
    assert any("h1" in sel or "title" in sel for sel in selectors)
