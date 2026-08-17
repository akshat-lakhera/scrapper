from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.scrape_run import ScrapeRunDB
from app.models.scraper import ScraperDB
from app.models.repair_attempt import RepairAttemptDB

class MetricsService:
    @staticmethod
    def get_metrics(db: Session) -> dict:
        total_scrapers = db.query(ScraperDB).count()
        total_runs = db.query(ScrapeRunDB).count()
        
        success_count = db.query(ScrapeRunDB).filter(ScrapeRunDB.status == "success").count()
        degraded_count = db.query(ScrapeRunDB).filter(ScrapeRunDB.status == "degraded").count()
        repaired_count = db.query(ScrapeRunDB).filter(ScrapeRunDB.status == "repaired").count()
        manual_review_count = db.query(ScrapeRunDB).filter(ScrapeRunDB.status == "manual_review").count()

        avg_dur = db.query(func.avg(RepairAttemptDB.duration_ms)).filter(
            RepairAttemptDB.result == "successful"
        ).scalar() or 0

        latest_run = db.query(ScrapeRunDB).order_by(ScrapeRunDB.id.desc()).first()
        health = "healthy"
        if latest_run:
            if latest_run.status == "repaired":
                health = "repaired"
            elif latest_run.status in ("degraded", "failed"):
                health = "degraded"
            elif latest_run.status == "manual_review":
                health = "manual_review"

        return {
            "total_scrapers": total_scrapers,
            "total_runs": total_runs,
            "successful_runs": success_count,
            "degraded_runs": degraded_count,
            "repaired_runs": repaired_count,
            "manual_review_runs": manual_review_count,
            "avg_repair_duration_ms": int(avg_dur),
            "scraper_health": health
        }
