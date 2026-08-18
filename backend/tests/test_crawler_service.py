import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.services.crawler_service import CrawlerService
from app.database import SessionLocal

def test_crawler_link_extraction_and_filters():
    html = """
    <html>
        <body>
            <a href="/catalogue/category/books_1/index.html">Books Category</a>
            <a href="http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html">Book 1</a>
            <a href="https://external-site.com/other">External Link</a>
            <a href="/static/main.css">CSS Asset</a>
            <a href="/images/cover.jpg">Image Asset</a>
            <a href="mailto:support@books.toscrape.com">Email</a>
            <a href="#section-top">Anchor Link</a>
        </body>
    </html>
    """
    base_url = "http://books.toscrape.com/index.html"
    links = CrawlerService.extract_links(html, base_url, "products")
    
    # Internal links should be extracted and normalized
    assert "http://books.toscrape.com/catalogue/category/books_1/index.html" in links
    assert "http://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html" in links
    
    # External and static asset links must be filtered out
    assert not any("external-site.com" in l for l in links)
    assert not any(l.endswith(".css") or l.endswith(".jpg") for l in links)
    assert not any("mailto:" in l for l in links)

@pytest.mark.asyncio
async def test_crawler_recursive_execution():
    db = SessionLocal()
    res = await CrawlerService.crawl_recursive(
        db=db,
        start_url="https://fastapi.tiangolo.com/",
        workflow_type="tech_docs",
        schema_name="tech_docs",
        max_depth=2,
        max_pages=2
    )
    assert res["start_url"] == "https://fastapi.tiangolo.com/"
    assert res["total_pages_crawled"] >= 1
    assert res["total_links_discovered"] >= 1
    assert len(res["crawled_pages"]) >= 1
    db.close()
