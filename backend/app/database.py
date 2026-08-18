from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)

# Enable Write-Ahead Logging (WAL) and busy timeout for concurrent SQLite transactions
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Import all models to register with Base.metadata
    from app.models.scraper import ScraperDB
    from app.models.scrape_run import ScrapeRunDB
    from app.models.repair_attempt import RepairAttemptDB
    from app.models.field_change import FieldChangeDB
    from app.models.search_run import SearchRunDB
    from app.models.extractor_rule_db import ExtractorRuleBundleDB, CandidateRulePatchDB

    Base.metadata.create_all(bind=engine)
    # Check and migrate missing columns in existing SQLite database
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                cursor = conn.connection.cursor()
                cursor.execute("PRAGMA table_info(scrape_runs)")
                columns = [row[1] for row in cursor.fetchall()]
                if columns:
                    if "record_count" not in columns:
                        cursor.execute("ALTER TABLE scrape_runs ADD COLUMN record_count INTEGER DEFAULT 1")
                    if "template_signature" not in columns:
                        cursor.execute("ALTER TABLE scrape_runs ADD COLUMN template_signature TEXT DEFAULT 'default'")
                    if "field_traces" not in columns:
                        cursor.execute("ALTER TABLE scrape_runs ADD COLUMN field_traces TEXT")
                    conn.connection.commit()
        except Exception:
            pass
