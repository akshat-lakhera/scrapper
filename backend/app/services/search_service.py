import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.search_run import SearchRunDB
from app.providers import get_scraper_provider

class SearchService:
    @staticmethod
    async def execute_search(
        db: Session,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> SearchRunDB:
        provider = get_scraper_provider()
        res = await provider.search(
            query=query,
            workflow_type=workflow_type,
            target_domain=target_domain
        )

        results_list = res.get("results", [])
        search_db = SearchRunDB(
            query=query,
            workflow_type=workflow_type,
            target_domain=target_domain,
            provider=settings.SCRAPER_PROVIDER,
            provider_run_id=res.get("collection_id"),
            results=json.dumps(results_list)
        )
        db.add(search_db)
        db.commit()
        db.refresh(search_db)
        return search_db

    @staticmethod
    def get_search_run(db: Session, search_id: int) -> Optional[SearchRunDB]:
        return db.query(SearchRunDB).filter(SearchRunDB.id == search_id).first()
