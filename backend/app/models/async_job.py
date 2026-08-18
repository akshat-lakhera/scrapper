import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from pydantic import BaseModel, Field
from app.database import Base

class AsyncScrapeJobDB(Base):
    __tablename__ = "async_scrape_jobs"

    id = Column(String(64), primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:12]}")
    batch_id = Column(String(64), index=True, nullable=True)
    target_url = Column(String(1024), nullable=False)
    workflow_type = Column(String(64), default="products")
    schema_name = Column(String(64), default="products")
    status = Column(String(32), default="pending")  # pending, processing, completed, repaired, degraded, failed
    quality_score = Column(Float, default=0.0)
    extracted_data = Column(Text, nullable=True)  # JSON serialized
    validation_errors = Column(Text, nullable=True)  # JSON serialized
    error_message = Column(Text, nullable=True)
    run_id = Column(Integer, nullable=True)
    execution_duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

class AsyncJobCreate(BaseModel):
    target_url: str = Field(..., description="Target URL to scrape asynchronously")
    workflow_type: Optional[str] = Field(default="products", description="Workflow category")
    schema_name: Optional[str] = Field(default="products", description="Target schema name")

class BatchScrapeRequest(BaseModel):
    items: List[AsyncJobCreate] = Field(..., description="List of URLs to scrape in batch")
    batch_name: Optional[str] = Field(default="Batch Scrape", description="Optional batch label")

class AsyncJobResponse(BaseModel):
    job_id: str
    batch_id: Optional[str] = None
    target_url: str
    workflow_type: str
    status: str
    quality_score: float = 0.0
    extracted_data: Optional[Dict[str, Any]] = None
    validation_errors: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None
    run_id: Optional[int] = None
    execution_duration_ms: int = 0
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class BatchProgressResponse(BaseModel):
    batch_id: str
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    pending_jobs: int
    progress_percentage: float
    average_quality_score: float
    status: str  # pending, processing, completed
    jobs: List[AsyncJobResponse]
