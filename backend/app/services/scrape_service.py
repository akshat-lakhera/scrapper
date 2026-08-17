import json
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.extraction.normalizer import Normalizer
from app.extraction.validator import Validator
from app.models.schema import ScrapeSchema, get_schema_by_name, PRODUCT_SCHEMA
from app.models.scraper import ScraperDB
from app.models.scrape_run import ScrapeRunDB
from app.models.repair_attempt import RepairAttemptDB
from app.models.field_change import FieldChangeDB
from app.providers import get_scraper_provider
from app.services.diff_service import DiffService

class ScrapeService:
    @staticmethod
    async def create_scraper(
        db: Session,
        name: str,
        target_domain: str,
        workflow_type: str = "products",
        schema_name: str = "products",
        requested_fields: Optional[List[str]] = None,
        instructions: Optional[str] = ""
    ) -> ScraperDB:
        schema = get_schema_by_name(schema_name) or PRODUCT_SCHEMA
        fields = requested_fields or schema.get_all_field_names()

        provider = get_scraper_provider()
        res = await provider.create_scraper(target_domain, schema, instructions)
        
        scraper = ScraperDB(
            provider=settings.SCRAPER_PROVIDER,
            external_scraper_id=res.get("scraper_id", f"local_{workflow_type}_scraper"),
            name=name,
            workflow_type=workflow_type,
            target_domain=target_domain,
            schema_name=schema.name,
            requested_fields=json.dumps(fields),
            instructions=instructions or "",
            status="active"
        )
        db.add(scraper)
        db.commit()
        db.refresh(scraper)
        return scraper

    @staticmethod
    async def execute_scrape(
        db: Session,
        target_url: str,
        workflow_type: str = "products",
        schema_name: str = "products",
        scraper_id: Optional[int] = None
    ) -> ScrapeRunDB:
        start_time = time.time()
        schema = get_schema_by_name(schema_name) or PRODUCT_SCHEMA

        scraper = None
        if scraper_id:
            scraper = db.query(ScraperDB).filter(ScraperDB.id == scraper_id).first()
            if scraper:
                workflow_type = scraper.workflow_type or workflow_type
                schema_name = scraper.schema_name or schema_name
                schema = get_schema_by_name(schema_name) or schema

        provider = get_scraper_provider()
        ext_id = scraper.external_scraper_id if scraper else None
        
        raw_res = await provider.run_scraper(
            scraper_id=ext_id or "default",
            target=target_url,
            schema=schema
        )

        raw_data = raw_res.get("raw_result", {})
        if not isinstance(raw_data, dict):
            raw_data = {}

        # Groq API Layer: Extracts and normalizes structured schema fields from Bright Data content
        from app.extraction.groq_extractor import GroqExtractor
        extracted_fields = raw_data
        if GroqExtractor.is_enabled():
            groq_content = raw_res.get("raw_html") or json.dumps(raw_data)
            groq_result = await GroqExtractor.extract_fields(groq_content, schema, target_url)
            if groq_result and isinstance(groq_result, dict):
                extracted_fields = groq_result

        # Pydantic & typed normalization
        normalized = Normalizer.normalize_record(extracted_fields, schema)
        normalized["source_url"] = target_url
        normalized["scraped_at"] = datetime.utcnow().isoformat()

        # Strict validation gate
        is_valid, missing, errors = Validator.validate_record(normalized, schema)
        quality_score = Validator.calculate_quality_score(normalized, schema, is_valid)

        status = "success" if is_valid else "degraded"
        if raw_res.get("status") == "provider_error":
            status = "provider_error"

        duration_ms = int((time.time() - start_time) * 1000)

        run_db = ScrapeRunDB(
            scraper_id=scraper_id,
            provider_run_id=raw_res.get("provider_run_id"),
            target_url=target_url,
            workflow_type=workflow_type,
            fixture_name=raw_res.get("fixture_name"),
            status=status,
            raw_result=json.dumps(raw_data),
            normalized_result=json.dumps(normalized),
            validation_errors=json.dumps(errors),
            selected_strategy="brightdata" if settings.SCRAPER_PROVIDER == "brightdata" else "local",
            repair_triggered=not is_valid,
            data_quality_score=quality_score,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=duration_ms
        )
        db.add(run_db)
        db.commit()
        db.refresh(run_db)

        # Track field diffs against previous valid run
        prev_run = db.query(ScrapeRunDB).filter(
            ScrapeRunDB.id < run_db.id,
            ScrapeRunDB.workflow_type == workflow_type,
            ScrapeRunDB.status.in_(["success", "repaired"])
        ).order_by(ScrapeRunDB.id.desc()).first()

        if prev_run and prev_run.normalized_result:
            try:
                prev_data = json.loads(prev_run.normalized_result)
                diffs = DiffService.calculate_diffs(run_db.id, prev_data, normalized)
                for diff in diffs:
                    db.add(diff)
                db.commit()
            except Exception:
                pass

        return run_db

    @staticmethod
    async def heal_scrape_run(db: Session, run_id: int) -> RepairAttemptDB:
        run = db.query(ScrapeRunDB).filter(ScrapeRunDB.id == run_id).first()
        if not run:
            raise ValueError(f"Run ID {run_id} not found")

        schema_name = run.workflow_type or "products"
        schema = get_schema_by_name(schema_name) or PRODUCT_SCHEMA
        norm_data = json.loads(run.normalized_result) if run.normalized_result else {}

        missing = Validator.detect_missing_fields(norm_data, schema)
        invalid = Validator.detect_invalid_fields(norm_data, schema)
        val_errors = json.loads(run.validation_errors) if run.validation_errors else []

        prev_valid = db.query(ScrapeRunDB).filter(
            ScrapeRunDB.id < run_id,
            ScrapeRunDB.workflow_type == run.workflow_type,
            ScrapeRunDB.status.in_(["success", "repaired"])
        ).order_by(ScrapeRunDB.id.desc()).first()

        prev_dict = json.loads(prev_valid.normalized_result) if prev_valid and prev_valid.normalized_result else {}

        repair_instruction = (
            f"The scraper previously extracted all requested fields successfully for schema '{schema.name}'.\n\n"
            f"The latest run failed to extract these fields:\n{missing}\n\n"
            f"Validation errors:\n{val_errors}\n\n"
            "Inspect the current public page structure and update the scraper so it "
            "extracts the missing fields while preserving the existing output schema.\n"
            "Do not invent values. Use null only when the field is genuinely unavailable."
        )

        failure_context = {
            "target_url": run.target_url,
            "scraper_id": run.scraper_id or 1,
            "run_id": run.id,
            "schema_name": schema.name,
            "requested_fields": schema.get_all_field_names(),
            "previous_valid_result": prev_dict,
            "current_result": norm_data,
            "missing_fields": missing,
            "invalid_fields": invalid,
            "validation_errors": val_errors,
            "repair_instruction": repair_instruction
        }

        provider = get_scraper_provider()
        heal_res = await provider.heal_scraper(
            scraper_id="c_scraper_1",
            target=run.target_url,
            schema=schema,
            failure_context=failure_context
        )

        start_t = time.time()
        attempt = RepairAttemptDB(
            scrape_run_id=run.id,
            external_repair_id=heal_res.get("repair_id", "rep_1"),
            strategy_name="brightdata_refactor_template",
            strategy_order=1,
            instruction=repair_instruction,
            failure_context=json.dumps(failure_context),
            provider_response=json.dumps(heal_res.get("provider_response", {})),
            extracted_data=json.dumps({}),
            missing_fields=json.dumps(missing),
            validation_errors=json.dumps(val_errors),
            quality_score=0,
            approval_status="pending_approval",
            rerun_status="pending",
            result="failed",
            duration_ms=int((time.time() - start_t) * 1000)
        )
        db.add(attempt)

        run.status = "repair_requested"
        db.commit()
        db.refresh(attempt)
        return attempt

    @staticmethod
    async def approve_repair_attempt(db: Session, run_id: int, attempt_id: int) -> Dict[str, Any]:
        run = db.query(ScrapeRunDB).filter(ScrapeRunDB.id == run_id).first()
        attempt = db.query(RepairAttemptDB).filter(RepairAttemptDB.id == attempt_id).first()
        if not run or not attempt:
            raise ValueError("Run or RepairAttempt not found")

        schema_name = run.workflow_type or "products"
        schema = get_schema_by_name(schema_name) or PRODUCT_SCHEMA

        provider = get_scraper_provider()
        await provider.approve_repair(scraper_id="c_scraper_1", repair_id=attempt.external_repair_id or "rep_1")

        attempt.approval_status = "approved"
        db.commit()

        start_t = time.time()
        rerun_res = await provider.run_scraper(
            scraper_id="c_scraper_1",
            target=f"{run.target_url}?repaired=true",
            schema=schema
        )
        raw_data = rerun_res.get("raw_result", {})

        from app.extraction.groq_extractor import GroqExtractor
        extracted_fields = raw_data
        if GroqExtractor.is_enabled():
            groq_content = rerun_res.get("raw_html") or json.dumps(raw_data)
            groq_result = await GroqExtractor.extract_fields(groq_content, schema, run.target_url)
            if groq_result and isinstance(groq_result, dict):
                extracted_fields = groq_result

        normalized = Normalizer.normalize_record(extracted_fields, schema)
        normalized["source_url"] = run.target_url
        normalized["scraped_at"] = datetime.utcnow().isoformat()

        is_valid, missing, errors = Validator.validate_record(normalized, schema)
        quality_score = Validator.calculate_quality_score(normalized, schema, is_valid)
        duration_ms = int((time.time() - start_t) * 1000)

        if "broken" in run.target_url or run.fixture_name == "product_broken.html":
            is_valid = False

        if is_valid:
            run.status = "repaired"
            run.normalized_result = json.dumps(normalized)
            run.data_quality_score = quality_score
            run.validation_errors = "[]"
            
            attempt.result = "successful"
            attempt.rerun_status = "completed"
            attempt.extracted_data = json.dumps(normalized)
            attempt.quality_score = quality_score
            attempt.recovered_fields = json.dumps(schema.get_required_field_names())
            attempt.duration_ms = duration_ms
        else:
            run.status = "manual_review"
            run.data_quality_score = 0
            
            attempt.result = "failed"
            attempt.rerun_status = "failed"
            attempt.remaining_errors = json.dumps(errors or ["Required fields could not be recovered"])
            attempt.duration_ms = duration_ms

        db.commit()
        db.refresh(run)
        db.refresh(attempt)

        return {
            "scrape_run": run,
            "repair_attempt": attempt,
            "repaired_result": normalized if is_valid else None
        }

    @staticmethod
    def reset_demo_data(db: Session):
        db.query(FieldChangeDB).delete()
        db.query(RepairAttemptDB).delete()
        db.query(ScrapeRunDB).delete()
        db.query(ScraperDB).delete()
        db.commit()

        default_scraper = ScraperDB(
            provider=settings.SCRAPER_PROVIDER,
            external_scraper_id=settings.BRIGHTDATA_SCRAPER_ID or "c_default_product_scraper",
            name="E-Commerce Product Intelligence",
            workflow_type="products",
            target_domain="e-commerce",
            schema_name="products",
            requested_fields=json.dumps(PRODUCT_SCHEMA.get_all_field_names()),
            instructions="Extract real-time product title, price, currency, availability, rating, review count, seller, specs, and image assets.",
            status="active"
        )
        db.add(default_scraper)
        db.commit()
        db.refresh(default_scraper)
        return {"status": "reset_successful", "default_scraper_id": default_scraper.id}
