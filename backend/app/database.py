from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    # Check for missing columns in existing SQLite database
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            with engine.connect() as conn:
                cursor = conn.connection.cursor()
                cursor.execute("PRAGMA table_info(scrape_runs)")
                columns = [row[1] for row in cursor.fetchall()]
                if columns and "record_count" not in columns:
                    cursor.execute("ALTER TABLE scrape_runs ADD COLUMN record_count INTEGER DEFAULT 1")
                    conn.connection.commit()
        except Exception:
            pass
