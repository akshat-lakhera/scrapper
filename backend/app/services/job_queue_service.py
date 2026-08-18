import asyncio
import json
import logging
import time
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.async_job import AsyncScrapeJobDB, AsyncJobResponse, BatchProgressResponse, AsyncJobCreate
from app.services.scrape_service import ScrapeService

logger = logging.getLogger("marketscout.job_queue")

# Bounded worker concurrency semaphore
_CONCURRENCY_SEMAPHORE = asyncio.Semaphore(10)

class JobQueueService:
    @staticmethod
    def enqueue_job(
        target_url: str,
        workflow_type: str = "products",
        schema_name: str = "products",
        batch_id: Optional[str] = None
    ) -> AsyncJobResponse:
        """
        Enqueues an extraction job in the background and returns a 202 Accepted representation.
        """
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        db: Session = SessionLocal()
        try:
            job_db = AsyncScrapeJobDB(
                id=job_id,
                batch_id=batch_id,
                target_url=target_url,
                workflow_type=workflow_type,
                schema_name=schema_name,
                status="pending",
                created_at=datetime.utcnow()
            )
            db.add(job_db)
            db.commit()
            db.refresh(job_db)

            # Spawn async background worker
            asyncio.create_task(JobQueueService._process_job(job_id))

            return JobQueueService._to_response(job_db)
        finally:
            db.close()

    @staticmethod
    def enqueue_batch(
        items: List[AsyncJobCreate],
        batch_name: Optional[str] = "Batch Scrape"
    ) -> Dict[str, Any]:
        """
        Enqueues a batch of extraction jobs with a shared batch_id.
        """
        batch_id = f"batch_{uuid.uuid4().hex[:12]}"
        job_ids = []
        for item in items:
            resp = JobQueueService.enqueue_job(
                target_url=item.target_url,
                workflow_type=item.workflow_type or "products",
                schema_name=item.schema_name or "products",
                batch_id=batch_id
            )
            job_ids.append(resp.job_id)

        return {
            "batch_id": batch_id,
            "batch_name": batch_name,
            "total_enqueued": len(job_ids),
            "job_ids": job_ids
        }

    @staticmethod
    async def _process_job(job_id: str):
        """
        Background worker processing a single scraping job with semaphore concurrency.
        """
        async with _CONCURRENCY_SEMAPHORE:
            start_time = time.time()
            db: Session = SessionLocal()
            try:
                job_db = db.query(AsyncScrapeJobDB).filter(AsyncScrapeJobDB.id == job_id).first()
                if not job_db:
                    logger.error(f"Job {job_id} not found in database")
                    return

                job_db.status = "processing"
                job_db.started_at = datetime.utcnow()
                db.commit()

                # Execute extraction pipeline
                run_db = await ScrapeService.execute_scrape(
                    db,
                    target_url=job_db.target_url,
                    workflow_type=job_db.workflow_type,
                    schema_name=job_db.schema_name
                )

                duration_ms = int((time.time() - start_time) * 1000)
                
                # Map run status to job status
                final_status = "completed"
                if run_db.status in ("repaired", "degraded", "failed"):
                    final_status = run_db.status

                job_db.status = final_status
                job_db.quality_score = float(run_db.data_quality_score or 0.0)
                job_db.extracted_data = run_db.normalized_result
                job_db.validation_errors = run_db.validation_errors
                job_db.run_id = run_db.id
                job_db.execution_duration_ms = duration_ms
                job_db.completed_at = datetime.utcnow()
                db.commit()

            except Exception as e:
                logger.error(f"Job {job_id} execution failed: {e}", exc_info=True)
                if job_db:
                    job_db.status = "failed"
                    job_db.error_message = str(e)
                    job_db.completed_at = datetime.utcnow()
                    job_db.execution_duration_ms = int((time.time() - start_time) * 1000)
                    db.commit()
            finally:
                db.close()

    @staticmethod
    def get_job(job_id: str) -> Optional[AsyncJobResponse]:
        """
        Retrieves current state of a background extraction job.
        """
        db: Session = SessionLocal()
        try:
            job_db = db.query(AsyncScrapeJobDB).filter(AsyncScrapeJobDB.id == job_id).first()
            if not job_db:
                return None
            return JobQueueService._to_response(job_db)
        finally:
            db.close()

    @staticmethod
    def get_batch_progress(batch_id: str) -> Optional[BatchProgressResponse]:
        """
        Computes aggregate metrics across all jobs in a batch.
        """
        db: Session = SessionLocal()
        try:
            jobs_db = db.query(AsyncScrapeJobDB).filter(AsyncScrapeJobDB.batch_id == batch_id).all()
            if not jobs_db:
                return None

            total = len(jobs_db)
            completed = sum(1 for j in jobs_db if j.status in ("completed", "repaired", "degraded"))
            failed = sum(1 for j in jobs_db if j.status == "failed")
            pending = sum(1 for j in jobs_db if j.status in ("pending", "processing"))

            quality_scores = [j.quality_score for j in jobs_db if j.status in ("completed", "repaired", "degraded")]
            avg_quality = round(sum(quality_scores) / len(quality_scores), 2) if quality_scores else 0.0
            progress_pct = round(((completed + failed) / total) * 100, 1) if total > 0 else 0.0

            overall_status = "completed" if pending == 0 else "processing"

            job_responses = [JobQueueService._to_response(j) for j in jobs_db]

            return BatchProgressResponse(
                batch_id=batch_id,
                total_jobs=total,
                completed_jobs=completed,
                failed_jobs=failed,
                pending_jobs=pending,
                progress_percentage=progress_pct,
                average_quality_score=avg_quality,
                status=overall_status,
                jobs=job_responses
            )
        finally:
            db.close()

    @staticmethod
    def _to_response(job_db: AsyncScrapeJobDB) -> AsyncJobResponse:
        extracted = None
        errors = None
        if job_db.extracted_data:
            try:
                extracted = json.loads(job_db.extracted_data)
            except Exception:
                pass
        if job_db.validation_errors:
            try:
                errors = json.loads(job_db.validation_errors)
            except Exception:
                pass

        return AsyncJobResponse(
            job_id=job_db.id,
            batch_id=job_db.batch_id,
            target_url=job_db.target_url,
            workflow_type=job_db.workflow_type,
            status=job_db.status,
            quality_score=job_db.quality_score or 0.0,
            extracted_data=extracted,
            validation_errors=errors,
            error_message=job_db.error_message,
            run_id=job_db.run_id,
            execution_duration_ms=job_db.execution_duration_ms or 0,
            created_at=job_db.created_at,
            started_at=job_db.started_at,
            completed_at=job_db.completed_at
        )
