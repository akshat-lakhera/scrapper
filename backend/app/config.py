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
    VERSION: str = "2.5.0"
    
    SCRAPER_PROVIDER: str = os.getenv("SCRAPER_PROVIDER", "local").lower()
    
    BRIGHTDATA_API_KEY: str = os.getenv("BRIGHTDATA_API_KEY", "")
    BRIGHTDATA_SCRAPER_ID: str = os.getenv("BRIGHTDATA_SCRAPER_ID", "")
    BRIGHTDATA_WORKSPACE_ID: str = os.getenv("BRIGHTDATA_WORKSPACE_ID", "")
    BRIGHTDATA_BASE_URL: str = os.getenv("BRIGHTDATA_BASE_URL", "https://api.brightdata.com")
    BRIGHTDATA_SERP_ZONE: str = os.getenv("BRIGHTDATA_SERP_ZONE", "serp_api1")
    
    # Datasets v3 Workflow Configurations
    BRIGHTDATA_PRODUCT_DATASET_ID: str = os.getenv("BRIGHTDATA_PRODUCT_DATASET_ID", "")
    BRIGHTDATA_JOB_DATASET_ID: str = os.getenv("BRIGHTDATA_JOB_DATASET_ID", "")
    BRIGHTDATA_X_DATASET_ID: str = os.getenv("BRIGHTDATA_X_DATASET_ID", "gd_lwxkxvnf1cynvib9co")
    BRIGHTDATA_LINKEDIN_DATASET_ID: str = os.getenv("BRIGHTDATA_LINKEDIN_DATASET_ID", "gd_l1viktl72bvl7bjuj0")
    BRIGHTDATA_FACEBOOK_DATASET_ID: str = os.getenv("BRIGHTDATA_FACEBOOK_DATASET_ID", "gd_lkaxegm826bjpoo9m5")
    BRIGHTDATA_INSTAGRAM_DATASET_ID: str = os.getenv("BRIGHTDATA_INSTAGRAM_DATASET_ID", "gd_l1vikfch901nx3by4")
    BRIGHTDATA_GOOGLE_MAPS_DATASET_ID: str = os.getenv("BRIGHTDATA_GOOGLE_MAPS_DATASET_ID", "gd_m8ebnr0q2qlklc02fz")
    BRIGHTDATA_REDDIT_DATASET_ID: str = os.getenv("BRIGHTDATA_REDDIT_DATASET_ID", "gd_lvz8ah06191smkebj4")

    # Security & Environment Governance
    ALLOW_DEMO_RESET: bool = os.getenv("ALLOW_DEMO_RESET", "true").lower() in ("true", "1", "yes")
    DEMO_ADMIN_KEY: str = os.getenv("DEMO_ADMIN_KEY", "")

    # CORS Configuration
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:8000,http://localhost:5173,http://localhost:3000")

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

    def get_cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGIN.split(",") if origin.strip()]

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
