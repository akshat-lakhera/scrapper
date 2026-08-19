from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.scrape_run import ScrapeRunDB
from app.models.repair_attempt import RepairAttemptDB
from app.models.scraper import ScraperDB
from app.models.extractor_rule_db import ExtractorRuleBundleDB, CandidateRulePatchDB

class MetricsService:
    @staticmethod
    def get_metrics(db: Session) -> Dict[str, Any]:
        runs = db.query(ScrapeRunDB).all()
        repairs = db.query(RepairAttemptDB).all()
        patches = db.query(CandidateRulePatchDB).all()
        bundles = db.query(ExtractorRuleBundleDB).all()
        scrapers = db.query(ScraperDB).all()

        total_runs = len(runs)
        total_scrapers = len(scrapers)

        # Status breakdown
        status_counts = {"success": 0, "degraded": 0, "repair_requested": 0, "repaired": 0, "manual_review": 0, "provider_error": 0}
        total_quality = 0
        total_latency = 0

        for r in runs:
            st = r.status or "unknown"
            if st in status_counts:
                status_counts[st] += 1
            else:
                status_counts[st] = 1
            total_quality += (r.data_quality_score or 0)
            total_latency += (r.duration_ms or 0)

        # Observed metrics (None when unobserved)
        successful_repairs = sum(1 for a in repairs if a.result == "successful")
        approved_repairs = sum(1 for a in repairs if a.approval_status == "approved")
        promoted_patches = [p for p in patches if p.status == "promoted"]
        
        repair_precision: Optional[float] = round((successful_repairs / approved_repairs * 100), 1) if approved_repairs > 0 else None
        avg_confidence_promoted: Optional[float] = round(sum(p.confidence_score for p in promoted_patches) / len(promoted_patches) * 100, 1) if len(promoted_patches) > 0 else None
        avg_confidence_all: Optional[float] = round(sum(p.confidence_score for p in patches) / len(patches) * 100, 1) if len(patches) > 0 else None
        
        # Rule bundles and templates count
        unique_domains = len(set(b.domain for b in bundles)) if bundles else 0
        unique_templates = len(set(b.template_signature for b in bundles)) if bundles else 0
        
        bundle_count_by_domain: Dict[str, int] = {}
        for b in bundles:
            dom = b.domain or "unknown"
            bundle_count_by_domain[dom] = bundle_count_by_domain.get(dom, 0) + 1

        # Same template repair rate
        same_template_success = 0
        same_template_total = 0
        for p in promoted_patches:
            same_template_total += 1
            if p.non_regression_rate >= 0.8:
                same_template_success += 1
        same_template_rate = round((same_template_success / same_template_total * 100), 1) if same_template_total > 0 else None

        successful_runs = status_counts.get("success", 0) + status_counts.get("repaired", 0)
        overall_reliability = round((successful_runs / total_runs * 100), 1) if total_runs > 0 else 100.0
        avg_latency = round(total_latency / total_runs, 1) if total_runs > 0 else 0.0
        healing_success_rate = repair_precision if repair_precision is not None else (100.0 if approved_repairs > 0 or len(repairs) > 0 else 0.0)

        return {
            "total_runs": total_runs,
            "total_scrapers": total_scrapers,
            "successful_runs": status_counts.get("success", 0),
            "degraded_runs": status_counts.get("degraded", 0),
            "repaired_runs": status_counts.get("repaired", 0),
            "healed_runs": status_counts.get("repaired", 0),
            "manual_review_runs": status_counts.get("manual_review", 0),
            "status_counts": status_counts,
            "average_quality_score": round(total_quality / total_runs, 1) if total_runs > 0 else 0.0,
            "average_latency_ms": avg_latency,
            "avg_duration_ms": avg_latency,
            "overall_reliability": overall_reliability,
            "healing_success_rate": healing_success_rate,
            "template_count": max(unique_templates, len(bundles)),
            "scraper_health": "healthy" if overall_reliability >= 80 else ("degraded" if overall_reliability >= 50 else "critical"),
            "repair_metrics": {
                "total_repair_attempts": len(repairs),
                "successful_repairs": successful_repairs,
                "approved_repairs": approved_repairs,
                "promoted_patches": len(promoted_patches),
                "repair_precision_percent": repair_precision,
                "average_healing_confidence": avg_confidence_all,
                "avg_confidence_promoted_only": avg_confidence_promoted,
                "same_template_repair_success_rate": same_template_rate,
                "managed_domains_count": unique_domains,
                "template_count": unique_templates,
                "rule_bundle_count_by_domain": bundle_count_by_domain,
                "active_rule_bundles": len([b for b in bundles if b.is_active])
            }
        }
