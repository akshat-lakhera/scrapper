from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.models.schema import ScrapeSchema

class ScraperProvider(ABC):
    @abstractmethod
    async def search(
        self,
        query: str,
        workflow_type: str = "products",
        target_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def create_scraper(
        self,
        target: str,
        schema: ScrapeSchema,
        instructions: Optional[str] = ""
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def run_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def heal_scraper(
        self,
        scraper_id: str,
        target: str,
        schema: ScrapeSchema,
        failure_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def approve_repair(
        self,
        scraper_id: str,
        repair_id: str
    ) -> Dict[str, Any]:
        pass
