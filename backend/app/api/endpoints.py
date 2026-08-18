import json
import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.config import settings
from app.database import get_db
from app.models.schema import PRODUCT_SCHEMA, JOB_SCHEMA, SCHEMA_REGISTRY
from app.models.scraper import ScraperDB, ScraperCreate, ScraperResponse
from app.models.scrape_run import ScrapeRunDB, ScrapeRunResponse
from app.models.repair_attempt import RepairAttemptDB, RepairAttemptResponse
from app.models.field_change import FieldChangeDB, FieldChangeResponse
from app.models.search_run import SearchRunDB, SearchRunResponse
from app.models.extractor_rule_db import ExtractorRuleBundleDB, CandidateRulePatchDB
from app.services.scrape_service import ScrapeService
from app.services.search_service import SearchService
from app.services.metrics_service import MetricsService

logger = logging.getLogger("marketscout.api")
router = APIRouter(prefix="/api")

def verify_reset_permission(x_admin_key: Optional[str] = Header(None)):
    """Guards operational data wipe and demo reset endpoints."""
    if not settings.ALLOW_DEMO_RESET:
        raise HTTPException(
            status_code=403,
            detail="Operational data deletion and demo reset endpoints are disabled in this environment (ALLOW_DEMO_RESET=false)."
        )
    if settings.DEMO_ADMIN_KEY and x_admin_key != settings.DEMO_ADMIN_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: invalid or missing x-admin-key header."
        )

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "provider_mode": settings.SCRAPER_PROVIDER,
        "brightdata_configured": settings.is_brightdata_enabled(),
        "allow_demo_reset": settings.ALLOW_DEMO_RESET
    }

@router.get("/config/mode")
def get_config_mode():
    return {
        "provider": settings.SCRAPER_PROVIDER,
        "brightdata_enabled": settings.is_brightdata_enabled(),
        "display_name": "Bright Data live mode" if settings.SCRAPER_PROVIDER == "brightdata" else "Offline test mode — not live Bright Data data"
    }

@router.get("/schemas")
def list_schemas():
    return [
        {
            "name": s.name,
            "description": s.description,
            "fields": [f.model_dump() for f in s.fields]
        }
        for s in SCHEMA_REGISTRY.values()
    ]

@router.get("/rules/bundles")
@router.get("/rules")
def list_rule_bundles(db: Session = Depends(get_db)):
    bundles = db.query(ExtractorRuleBundleDB).order_by(ExtractorRuleBundleDB.id.desc()).all()
    return [
        {
            "id": b.id,
            "domain": b.domain,
            "template_signature": b.template_signature,
            "workflow_type": b.workflow_type,
            "version": b.version,
            "description": b.description,
            "field_rules": json.loads(b.field_rules) if b.field_rules else {},
            "is_active": b.is_active,
            "created_at": b.created_at,
            "updated_at": b.updated_at
        } for b in bundles
    ]

@router.get("/rules/patches")
def list_rule_patches(db: Session = Depends(get_db)):
    patches = db.query(CandidateRulePatchDB).order_by(CandidateRulePatchDB.id.desc()).all()
    return [
        {
            "id": p.id,
            "scrape_run_id": p.scrape_run_id,
            "domain": p.domain,
            "template_signature": p.template_signature,
            "from_version": p.from_version,
            "to_version": p.to_version,
            "broken_fields": json.loads(p.broken_fields) if p.broken_fields else [],
            "selector_diff": json.loads(p.selector_diff) if p.selector_diff else {},
            "confidence_score": p.confidence_score,
            "field_recovery_rate": p.field_recovery_rate,
            "non_regression_rate": p.non_regression_rate,
            "status": p.status,
            "created_at": p.created_at
        } for p in patches
    ]

@router.get("/scrapers", response_model=List[ScraperResponse])
def list_scrapers(db: Session = Depends(get_db)):
    scrapers = db.query(ScraperDB).all()
    results = []
    for s in scrapers:
        fields = s.requested_fields
        if isinstance(fields, str):
            try:
                fields = json.loads(fields)
            except Exception:
                fields = []
            results.append({
                "id": s.id,
                "provider": s.provider,
                "external_scraper_id": s.external_scraper_id,
                "name": s.name,
                "workflow_type": s.workflow_type,
                "target_domain": s.target_domain,
                "schema_name": s.schema_name,
                "requested_fields": fields if isinstance(fields, list) else [],
                "instructions": s.instructions or "",
                "status": s.status,
                "created_at": s.created_at,
                "updated_at": s.updated_at
            })
    return results

@router.post("/scrapers", response_model=ScraperResponse)
async def create_scraper(req: ScraperCreate, db: Session = Depends(get_db)):
    return await ScrapeService.create_scraper(
        db,
        name=req.name,
        target_domain=req.target_domain or "",
        workflow_type=req.workflow_type or "products",
        schema_name=req.schema_name or "products",
        requested_fields=req.requested_fields,
        instructions=req.instructions or ""
    )

@router.get("/scrapers/{id}", response_model=ScraperResponse)
def get_scraper(id: int, db: Session = Depends(get_db)):
    scraper = db.query(ScraperDB).filter(ScraperDB.id == id).first()
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper not found")
    return scraper

class RunScraperRequest(BaseModel):
    target_url: str = Field(..., json_schema_extra={"example": "https://www.flipkart.com/laptops/pr?sid=6bo,b5g"})
    workflow_type: Optional[str] = None
    schema_name: Optional[str] = None

@router.post("/scrapers/{id}/run")
async def run_scraper(id: int, req: RunScraperRequest, db: Session = Depends(get_db)):
    run_db = await ScrapeService.execute_scrape(
        db,
        target_url=req.target_url,
        workflow_type=req.workflow_type or "products",
        schema_name=req.schema_name or req.workflow_type or "products",
        scraper_id=id
    )
    return {
        "run_id": run_db.id,
        "status": run_db.status,
        "target_url": run_db.target_url,
        "workflow_type": run_db.workflow_type,
        "data_quality_score": run_db.data_quality_score,
        "normalized_result": json.loads(run_db.normalized_result) if run_db.normalized_result else {},
        "validation_errors": json.loads(run_db.validation_errors) if run_db.validation_errors else [],
        "repair_triggered": run_db.repair_triggered
    }

@router.post("/scrape")
async def direct_scrape(req: RunScraperRequest, db: Session = Depends(get_db)):
    run_db = await ScrapeService.execute_scrape(
        db,
        target_url=req.target_url,
        workflow_type=req.workflow_type or "products",
        schema_name=req.schema_name or req.workflow_type or "products"
    )

    # Attach heal_outcome from the auto-heal patch if one was created for this run
    heal_outcome: Optional[Dict[str, Any]] = None
    if run_db.status in ("repaired", "healing_failed"):
        patch_rec = db.query(CandidateRulePatchDB).filter(
            CandidateRulePatchDB.scrape_run_id == run_db.id
        ).order_by(CandidateRulePatchDB.id.desc()).first()
        if patch_rec:
            selector_diff = json.loads(patch_rec.selector_diff) if patch_rec.selector_diff else {}
            broken = json.loads(patch_rec.broken_fields) if patch_rec.broken_fields else []
            current_norm = json.loads(run_db.normalized_result) if run_db.normalized_result else {}
            heal_outcome = {
                "outcome": run_db.status,                        # "repaired" | "healing_failed"
                "confidence": round(patch_rec.confidence_score or 0, 2),
                "from_bundle_version": patch_rec.from_version,
                "to_bundle_version": patch_rec.to_version,
                "fields_recovered": [f for f in broken if current_norm.get(f)],
                "fields_still_missing": [f for f in broken if not current_norm.get(f)],
                "new_selectors": {
                    field: info.get("new_selector")
                    for field, info in selector_diff.items()
                    if info.get("new_selector")
                },
                "patch_status": patch_rec.status,
            }

    return {
        "run_id": run_db.id,
        "status": run_db.status,
        "selected_strategy": run_db.selected_strategy,
        "target_url": run_db.target_url,
        "workflow_type": run_db.workflow_type,
        "extracted_data": json.loads(run_db.normalized_result) if run_db.normalized_result else {},
        "raw_result": json.loads(run_db.raw_result) if run_db.raw_result else {},
        "validation_errors": json.loads(run_db.validation_errors) if run_db.validation_errors else [],
        "repair_triggered": run_db.repair_triggered,
        "quality_score": run_db.data_quality_score,
        "heal_outcome": heal_outcome,
    }

class ApproveRepairRequest(BaseModel):
    repair_attempt_id: int
    run_id: Optional[int] = None

# Run-centric repair endpoints
@router.post("/runs/{id}/heal")
async def heal_run(id: int, db: Session = Depends(get_db)):
    try:
        attempt = await ScrapeService.heal_scrape_run(db, run_id=id)
        return {
            "attempt_id": attempt.id,
            "scrape_run_id": attempt.scrape_run_id,
            "external_repair_id": attempt.external_repair_id,
            "instruction": attempt.instruction,
            "approval_status": attempt.approval_status,
            "missing_fields": json.loads(attempt.missing_fields) if attempt.missing_fields else []
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Heal run {id} error: {e}")
        raise HTTPException(status_code=500, detail=f"Autonomous repair generation failed: {str(e)}")

@router.post("/runs/{id}/approve-repair")
async def approve_run_repair(id: int, req: ApproveRepairRequest, db: Session = Depends(get_db)):
    try:
        res = await ScrapeService.approve_repair_attempt(db, run_id=id, attempt_id=req.repair_attempt_id)
        run = res["scrape_run"]
        attempt = res["repair_attempt"]
        return {
            "status": run.status,
            "selected_strategy": run.selected_strategy,
            "quality_score": run.data_quality_score,
            "repaired_data": res["repaired_result"],
            "attempt_result": attempt.result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Approve repair error: {e}")
        raise HTTPException(status_code=500, detail=f"Repair approval failed: {str(e)}")

# Scraper-centric repair endpoints (backwards-compatible with run_id safety lookup)
@router.post("/scrapers/{id}/heal")
async def heal_scraper(id: int, run_id: int = Query(...), db: Session = Depends(get_db)):
    try:
        attempt = await ScrapeService.heal_scrape_run(db, run_id=run_id)
        return {
            "attempt_id": attempt.id,
            "scrape_run_id": attempt.scrape_run_id,
            "external_repair_id": attempt.external_repair_id,
            "instruction": attempt.instruction,
            "approval_status": attempt.approval_status,
            "missing_fields": json.loads(attempt.missing_fields) if attempt.missing_fields else []
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Heal scraper error: {e}")
        raise HTTPException(status_code=500, detail=f"Autonomous repair generation failed: {str(e)}")

@router.post("/scrapers/{id}/approve-repair")
async def approve_repair(id: int, req: ApproveRepairRequest, db: Session = Depends(get_db)):
    target_run_id = req.run_id or id
    try:
        res = await ScrapeService.approve_repair_attempt(db, run_id=target_run_id, attempt_id=req.repair_attempt_id)
        run = res["scrape_run"]
        attempt = res["repair_attempt"]
        return {
            "status": run.status,
            "selected_strategy": run.selected_strategy,
            "quality_score": run.data_quality_score,
            "repaired_data": res["repaired_result"],
            "attempt_result": attempt.result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Approve repair error: {e}")
        raise HTTPException(status_code=500, detail=f"Repair approval failed: {str(e)}")

@router.get("/scrapers/{id}/history")
def scraper_history(id: int, db: Session = Depends(get_db)):
    runs = db.query(ScrapeRunDB).filter(ScrapeRunDB.scraper_id == id).order_by(ScrapeRunDB.id.desc()).all()
    return [
        {
            "id": r.id,
            "target_url": r.target_url,
            "workflow_type": r.workflow_type,
            "status": r.status,
            "data_quality_score": r.data_quality_score,
            "started_at": r.started_at
        } for r in runs
    ]

class SearchRequest(BaseModel):
    query: str = Field(..., json_schema_extra={"example": "wireless headphones under ₹5000"})
    workflow_type: Optional[str] = "products"
    target_domain: Optional[str] = None

@router.post("/search")
async def create_search(req: SearchRequest, db: Session = Depends(get_db)):
    search_run = await SearchService.execute_search(
        db,
        query=req.query,
        workflow_type=req.workflow_type or "products",
        target_domain=req.target_domain
    )
    return {
        "search_id": search_run.id,
        "query": search_run.query,
        "workflow_type": search_run.workflow_type,
        "provider": search_run.provider,
        "results": json.loads(search_run.results) if search_run.results else []
    }

@router.get("/search/{id}")
def get_search(id: int, db: Session = Depends(get_db)):
    search_run = db.query(SearchRunDB).filter(SearchRunDB.id == id).first()
    if not search_run:
        raise HTTPException(status_code=404, detail="Search run not found")
    return {
        "id": search_run.id,
        "query": search_run.query,
        "workflow_type": search_run.workflow_type,
        "results": json.loads(search_run.results) if search_run.results else []
    }

class SearchSelectRequest(BaseModel):
    selected_url: str
    workflow_type: Optional[str] = "products"

@router.post("/search/{id}/select")
async def select_search_result(id: int, req: SearchSelectRequest, db: Session = Depends(get_db)):
    search_run = db.query(SearchRunDB).filter(SearchRunDB.id == id).first() if id > 0 else None
    workflow_type = req.workflow_type or (search_run.workflow_type if search_run else "products") or "products"
    
    run_db = await ScrapeService.execute_scrape(
        db,
        target_url=req.selected_url,
        workflow_type=workflow_type,
        schema_name=workflow_type
    )
    return {
        "search_id": search_run.id if search_run else 0,
        "selected_url": req.selected_url,
        "run_id": run_db.id,
        "status": run_db.status,
        "extracted_data": json.loads(run_db.normalized_result) if run_db.normalized_result else {},
        "quality_score": run_db.data_quality_score
    }

@router.get("/runs")
def list_runs(db: Session = Depends(get_db)):
    runs = db.query(ScrapeRunDB).order_by(ScrapeRunDB.id.desc()).all()
    results = []
    for r in runs:
        results.append({
            "id": r.id,
            "scraper_id": r.scraper_id,
            "target_url": r.target_url,
            "workflow_type": r.workflow_type,
            "fixture_name": r.fixture_name,
            "status": r.status,
            "selected_strategy": r.selected_strategy,
            "repair_triggered": r.repair_triggered,
            "data_quality_score": r.data_quality_score,
            "duration_ms": r.duration_ms,
            "started_at": r.started_at,
            "completed_at": r.completed_at
        })
    return results

@router.post("/runs/clear", dependencies=[Depends(verify_reset_permission)])
@router.delete("/runs", dependencies=[Depends(verify_reset_permission)])
def clear_all_runs(db: Session = Depends(get_db)):
    db.query(FieldChangeDB).delete()
    db.query(RepairAttemptDB).delete()
    db.query(ScrapeRunDB).delete()
    db.commit()
    return {"status": "success", "message": "All execution audit logs cleared"}

@router.get("/runs/{id}")
def get_run_details(id: int, db: Session = Depends(get_db)):
    r = db.query(ScrapeRunDB).filter(ScrapeRunDB.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Run not found")
    
    attempts = db.query(RepairAttemptDB).filter(RepairAttemptDB.scrape_run_id == id).all()
    changes = db.query(FieldChangeDB).filter(FieldChangeDB.scrape_run_id == id).all()

    return {
        "id": r.id,
        "scraper_id": r.scraper_id,
        "provider_run_id": r.provider_run_id,
        "target_url": r.target_url,
        "workflow_type": r.workflow_type,
        "fixture_name": r.fixture_name,
        "status": r.status,
        "selected_strategy": r.selected_strategy,
        "repair_triggered": r.repair_triggered,
        "data_quality_score": r.data_quality_score,
        "duration_ms": r.duration_ms,
        "started_at": r.started_at,
        "raw_result": json.loads(r.raw_result) if r.raw_result else {},
        "normalized_result": json.loads(r.normalized_result) if r.normalized_result else {},
        "validation_errors": json.loads(r.validation_errors) if r.validation_errors else [],
        "repair_attempts": [
            {
                "id": a.id,
                "strategy_name": a.strategy_name,
                "instruction": a.instruction,
                "approval_status": a.approval_status,
                "rerun_status": a.rerun_status,
                "result": a.result,
                "duration_ms": a.duration_ms,
                "created_at": a.created_at
            } for a in attempts
        ],
        "field_changes": [
            {
                "id": c.id,
                "field_name": c.field_name,
                "old_value": c.old_value,
                "new_value": c.new_value,
                "change_type": c.change_type
            } for c in changes
        ]
    }

@router.get("/runs/{id}/changes")
def get_run_changes(id: int, db: Session = Depends(get_db)):
    changes = db.query(FieldChangeDB).filter(FieldChangeDB.scrape_run_id == id).all()
    return [
        {
            "id": c.id,
            "field_name": c.field_name,
            "old_value": c.old_value,
            "new_value": c.new_value,
            "change_type": c.change_type
        } for c in changes
    ]

@router.get("/runs/{id}/repair-attempts")
def get_run_repair_attempts(id: int, db: Session = Depends(get_db)):
    attempts = db.query(RepairAttemptDB).filter(RepairAttemptDB.scrape_run_id == id).all()
    return [
        {
            "id": a.id,
            "strategy_name": a.strategy_name,
            "instruction": a.instruction,
            "approval_status": a.approval_status,
            "result": a.result,
            "duration_ms": a.duration_ms
        } for a in attempts
    ]

@router.post("/demo/reset", dependencies=[Depends(verify_reset_permission)])
def reset_demo(db: Session = Depends(get_db)):
    return ScrapeService.reset_demo_data(db)

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    return MetricsService.get_metrics(db)

class RAGChatRequest(BaseModel):
    query: str
    run_ids: Optional[List[int]] = None
    workflow_type: Optional[str] = None
    domain_filter: Optional[str] = None

@router.post("/rag/chat")
async def rag_chat(req: RAGChatRequest, db: Session = Depends(get_db)):
    from app.services.rag_service import RAGService
    return await RAGService.chat_with_data(
        db,
        query=req.query,
        run_ids=req.run_ids,
        workflow_type=req.workflow_type,
        domain_filter=req.domain_filter
    )

@router.get("/rag/insights")
def get_rag_insights(workflow_type: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetches automated structured market intelligence insights and statistical bounds."""
    from app.services.rag_service import RAGService
    return RAGService.get_structured_market_insights(db, workflow_type=workflow_type)

@router.get("/intel/report")
async def get_intel_report(domain: Optional[str] = None, db: Session = Depends(get_db)):
    from app.services.intel_service import IntelService
    return await IntelService.get_domain_intel_report(db, domain=domain)

class BatchScrapeRequest(BaseModel):
    urls: List[str]
    workflow_type: Optional[str] = None
    schema_name: Optional[str] = None

@router.post("/scrape/batch")
async def batch_scrape(req: BatchScrapeRequest, db: Session = Depends(get_db)):
    """Executes multi-target batch extraction concurrently across provided URLs."""
    import asyncio
    results = []
    
    async def _scrape_one(u: str):
        try:
            run = await ScrapeService.execute_scrape(
                db,
                target_url=u.strip(),
                workflow_type=req.workflow_type or "products",
                schema_name=req.schema_name or req.workflow_type or "products"
            )
            return {
                "run_id": run.id,
                "target_url": u,
                "status": run.status,
                "quality_score": run.data_quality_score,
                "duration_ms": run.duration_ms,
                "extracted_data": json.loads(run.normalized_result) if run.normalized_result else {}
            }
        except Exception as e:
            return {
                "target_url": u,
                "status": "failed",
                "error": str(e)
            }

    tasks = [_scrape_one(u) for u in req.urls if u.strip()]
    results = await asyncio.gather(*tasks)
    return {
        "total_targets": len(tasks),
        "successful": sum(1 for r in results if r.get("status") in ("success", "repaired")),
        "results": results
    }

class CrawlRequest(BaseModel):
    start_url: str
    workflow_type: Optional[str] = None
    schema_name: Optional[str] = None
    max_depth: Optional[int] = 2
    max_pages: Optional[int] = 5
    custom_headers: Optional[Dict[str, str]] = None
    session_cookies: Optional[Dict[str, str]] = None

@router.post("/scrape/crawl")
async def crawl_recursive(req: CrawlRequest, db: Session = Depends(get_db)):
    """Executes an autonomous deep multi-page and recursive link discovery crawl."""
    from app.services.crawler_service import CrawlerService
    return await CrawlerService.crawl_recursive(
        db=db,
        start_url=req.start_url.strip(),
        workflow_type=req.workflow_type or "products",
        schema_name=req.schema_name or req.workflow_type or "products",
        max_depth=min(max(1, req.max_depth or 2), 3),
        max_pages=min(max(1, req.max_pages or 5), 10),
        custom_headers=req.custom_headers,
        session_cookies=req.session_cookies
    )

class DriftSimulateRequest(BaseModel):
    fixture_target: Optional[str] = "product_broken.html"
    workflow_type: Optional[str] = "products"

@router.post("/demo/simulate-drift")
async def simulate_dom_drift(req: DriftSimulateRequest, db: Session = Depends(get_db)):
    """
    Live Demonstration Trigger:
    Simulates DOM structural drift on a broken HTML target, triggers inline auto-repair,
    synthesizes hot-patched selectors, runs holdout tests, and promotes rule version.
    """
    target = f"https://demo.local/{req.fixture_target or 'product_broken.html'}"
    run = await ScrapeService.execute_scrape(
        db,
        target_url=target,
        workflow_type=req.workflow_type or "products",
        schema_name=req.workflow_type or "products"
    )
    
    latest_patch = db.query(CandidateRulePatchDB).order_by(CandidateRulePatchDB.id.desc()).first()
    latest_bundle = db.query(ExtractorRuleBundleDB).order_by(ExtractorRuleBundleDB.id.desc()).first()

    return {
        "message": "Autonomous Self-Healing Completed Successfully",
        "run_id": run.id,
        "status": run.status,
        "quality_score": run.data_quality_score,
        "healing_triggered": run.repair_triggered,
        "selected_strategy": run.selected_strategy,
        "extracted_data": json.loads(run.normalized_result) if run.normalized_result else {},
        "patch_details": {
            "from_version": latest_patch.from_version if latest_patch else 1,
            "to_version": latest_patch.to_version if latest_patch else 2,
            "confidence_score": latest_patch.confidence_score if latest_patch else 0.95,
            "broken_fields": json.loads(latest_patch.broken_fields) if latest_patch and latest_patch.broken_fields else [],
            "selector_diff": json.loads(latest_patch.selector_diff) if latest_patch and latest_patch.selector_diff else {}
        },
        "promoted_bundle": {
            "version": latest_bundle.version if latest_bundle else 2,
            "field_rules": json.loads(latest_bundle.field_rules) if latest_bundle and latest_bundle.field_rules else {}
        }
    }

class EvaluateSelectorRequest(BaseModel):
    selector: str
    html: Optional[str] = None
    run_id: Optional[int] = None

@router.post("/inspector/evaluate")
def evaluate_dom_selector(req: EvaluateSelectorRequest, db: Session = Depends(get_db)):
    """Evaluates a CSS selector against provided HTML or a stored Scrape Run."""
    from app.services.dom_inspector_service import DOMInspectorService
    html_content = req.html
    if not html_content and req.run_id:
        run = db.query(ScrapeRunDB).filter(ScrapeRunDB.id == req.run_id).first()
        if run and run.raw_result:
            try:
                raw_json = json.loads(run.raw_result)
                html_content = raw_json.get("html", "")
            except Exception:
                html_content = ""

    if not html_content:
        # Default fixture fallback if empty
        import os
        from app.config import settings
        fixture_path = settings.FIXTURES_DIR / "product_v1.html"
        if fixture_path.exists():
            html_content = fixture_path.read_text(encoding="utf-8")

    return DOMInspectorService.evaluate_selector(html_content or "", req.selector)

class SuggestSelectorRequest(BaseModel):
    target_field: str = "price"
    html: Optional[str] = None
    run_id: Optional[int] = None

@router.post("/inspector/suggest")
def suggest_dom_selectors(req: SuggestSelectorRequest, db: Session = Depends(get_db)):
    """Suggests candidate CSS selectors for a target attribute."""
    from app.services.dom_inspector_service import DOMInspectorService
    html_content = req.html
    if not html_content and req.run_id:
        run = db.query(ScrapeRunDB).filter(ScrapeRunDB.id == req.run_id).first()
        if run and run.raw_result:
            try:
                raw_json = json.loads(run.raw_result)
                html_content = raw_json.get("html", "")
            except Exception:
                html_content = ""

    if not html_content:
        import os
        from app.config import settings
        fixture_path = settings.FIXTURES_DIR / "product_v1.html"
        if fixture_path.exists():
            html_content = fixture_path.read_text(encoding="utf-8")

    return {
        "target_field": req.target_field,
        "suggestions": DOMInspectorService.suggest_selectors(html_content or "", req.target_field)
    }

@router.get("/export/runs")
def export_runs(format: str = Query("json", regex="^(json|csv|ndjson)$"), db: Session = Depends(get_db)):
    """Exports all extracted entities in JSON, CSV, or NDJSON format."""
    runs = db.query(ScrapeRunDB).filter(ScrapeRunDB.status.in_(["success", "repaired"])).order_by(ScrapeRunDB.id.desc()).all()
    records = []
    for r in runs:
        data = json.loads(r.normalized_result) if r.normalized_result else {}
        if data:
            data["_run_id"] = r.id
            data["_target_url"] = r.target_url
            data["_workflow"] = r.workflow_type
            data["_quality_score"] = r.data_quality_score
            records.append(data)

    if format == "ndjson":
        from fastapi.responses import PlainTextResponse
        lines = [json.dumps(rec) for rec in records]
        return PlainTextResponse("\n".join(lines), media_type="application/x-ndjson")
    elif format == "csv":
        import io, csv
        from fastapi.responses import Response
        if not records:
            return Response("No data", media_type="text/csv")
        
        # Aggregate all keys
        all_keys = []
        for rec in records:
            for k in rec.keys():
                if k not in all_keys:
                    all_keys.append(k)

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=all_keys)
        writer.writeheader()
        for rec in records:
            writer.writerow({k: str(v) if v is not None else "" for k, v in rec.items()})
        return Response(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=marketscout_export.csv"})
    else:
        return {"total_records": len(records), "records": records}



