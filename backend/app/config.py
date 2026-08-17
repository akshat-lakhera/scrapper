import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "MarketScout"
    VERSION: str = "1.0.0"
    
    SCRAPER_PROVIDER: str = os.getenv("SCRAPER_PROVIDER", "local").lower()
    
    BRIGHTDATA_API_KEY: str = os.getenv("BRIGHTDATA_API_KEY", "")
    BRIGHTDATA_SCRAPER_ID: str = os.getenv("BRIGHTDATA_SCRAPER_ID", "")
    BRIGHTDATA_WORKSPACE_ID: str = os.getenv("BRIGHTDATA_WORKSPACE_ID", "")
    BRIGHTDATA_BASE_URL: str = os.getenv("BRIGHTDATA_BASE_URL", "https://api.brightdata.com")
    
    # Groq Extraction & Normalization
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BACKEND_DIR / "data"
    FIXTURES_DIR: Path = BASE_DIR / "fixtures"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATA_DIR}/marketscout.db")
    
    def is_brightdata_enabled(self) -> bool:
        return self.SCRAPER_PROVIDER == "brightdata" and bool(self.BRIGHTDATA_API_KEY)

    def is_groq_enabled(self) -> bool:
        return bool(self.GROQ_API_KEY)

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
