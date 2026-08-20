import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import httpx
from sqlalchemy.orm import Session

from app.services.scrape_service import ScrapeService

logger = logging.getLogger("marketscout.crawler")

class CrawlerService:
    """
    Autonomous Deep Multi-Page & Recursive Link Discovery Crawler.
    Traverses pagination links, discovers target entity URLs across domains,
    and executes structured multi-strategy extraction across all discovered nodes.
    """

    @staticmethod
    def _is_valid_child_url(base_url: str, candidate_url: str, workflow_type: str) -> bool:
        """Determines if a discovered link is a relevant internal target node."""
        try:
            base_parsed = urlparse(base_url)
            cand_parsed = urlparse(candidate_url)

            # Must match domain or subdomain
            if not cand_parsed.netloc or (cand_parsed.netloc != base_parsed.netloc and not cand_parsed.netloc.endswith(f".{base_parsed.netloc}")):
                return False

            # Ignore static assets and non-HTML extensions
            path = cand_parsed.path.lower()
            if re.search(r"\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz|mp4|webp)$", path):
                return False

            # Ignore logout/auth redirect loops
            if any(term in path for term in ["logout", "signout", "signin", "login", "register"]):
                return False

            return True
        except Exception:
            return False

    @staticmethod
    def extract_links(html: str, base_url: str, workflow_type: str) -> List[str]:
        """Extracts and normalizes all canonical hyper-links from the HTML payload."""
        if not html:
            return []
        
        soup = BeautifulSoup(html, "html.parser")
        discovered: Set[str] = set()

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"].strip()
            if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            full_url = urljoin(base_url, href)
            # Remove fragment/hash
            full_url = full_url.split("#")[0]

            # Normalize trailing slash for path consistency
            if full_url.endswith("/") and full_url.count("/") > 3:
                full_url = full_url.rstrip("/")

            if CrawlerService._is_valid_child_url(base_url, full_url, workflow_type):
                discovered.add(full_url)

        return list(discovered)

    @classmethod
    async def crawl_recursive(
        cls,
        db: Session,
        start_url: str,
        workflow_type: str = "products",
        schema_name: Optional[str] = None,
        max_depth: int = 2,
        max_pages: int = 5,
        custom_headers: Optional[Dict[str, str]] = None,
        session_cookies: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Executes a breadth-first recursive deep crawl starting from start_url.
        """
        schema_name = schema_name or workflow_type
        visited: Set[str] = set()
        queue: List[Dict[str, Any]] = [{"url": start_url, "depth": 1}]
        extracted_pages: List[Dict[str, Any]] = []
        all_discovered_links: Set[str] = {start_url}

        while queue and len(visited) < max_pages:
            current = queue.pop(0)
            current_url = current["url"]
            current_depth = current["depth"]

            if current_url in visited:
                continue

            visited.add(current_url)

            try:
                # Execute structured scrape pipeline on current target
                run = await ScrapeService.execute_scrape(
                    db=db,
                    target_url=current_url,
                    workflow_type=workflow_type,
                    schema_name=schema_name,
                    custom_headers=custom_headers,
                    session_cookies=session_cookies
                )

                norm_data = json.loads(run.normalized_result) if run.normalized_result else {}
                raw_html = json.loads(run.raw_result).get("html", "") if run.raw_result else ""

                extracted_pages.append({
                    "run_id": run.id,
                    "url": current_url,
                    "depth": current_depth,
                    "status": run.status,
                    "quality_score": run.data_quality_score,
                    "duration_ms": run.duration_ms,
                    "strategy": run.selected_strategy,
                    "extracted_data": norm_data
                })

                # If depth allows, discover child links and enqueue
                if current_depth < max_depth and raw_html:
                    child_links = cls.extract_links(raw_html, current_url, workflow_type)
                    for link in child_links:
                        all_discovered_links.add(link)
                        if link not in visited and not any(item["url"] == link for item in queue):
                            queue.append({"url": link, "depth": current_depth + 1})

            except Exception as e:
                logger.error(f"Error crawling node {current_url}: {e}")
                extracted_pages.append({
                    "url": current_url,
                    "depth": current_depth,
                    "status": "failed",
                    "error": str(e)
                })

        return {
            "start_url": start_url,
            "workflow_type": workflow_type,
            "max_depth": max_depth,
            "max_pages_limit": max_pages,
            "total_pages_crawled": len(visited),
            "total_links_discovered": len(all_discovered_links),
            "successful_extractions": sum(1 for p in extracted_pages if p.get("status") in ("success", "repaired")),
            "crawled_pages": extracted_pages,
            "discovered_link_sample": list(all_discovered_links)[:25]
        }
