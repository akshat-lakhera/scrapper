from app.config import settings
from app.providers.base import ScraperProvider
from app.providers.brightdata_provider import BrightDataProvider
from app.providers.local_provider import LocalProvider

def get_scraper_provider() -> ScraperProvider:
    if settings.SCRAPER_PROVIDER == "brightdata":
        return BrightDataProvider()
    return LocalProvider()
