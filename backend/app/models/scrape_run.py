from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, ConfigDict
from app.database import Base

class ScrapeRunDB(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True, index=True)
    scraper_id = Column(Integer, nullable=True)
    provider_run_id = Column(String, nullable=True)
    target_url = Column(String, nullable=False)
    workflow_type = Column(String, default="products")
    fixture_name = Column(String, nullable=True)
    template_signature = Column(String, default="default", index=True)
    
    status = Column(String, default="success")  # success, degraded, repair_requested, repaired, manual_review, provider_error
    selected_strategy = Column(String, nullable=True)  # rule_bundle_v1, json_ld, meta_tags, semantic_dom
    repair_triggered = Column(Boolean, default=False)
    
    raw_result = Column(Text, nullable=True)
    normalized_result = Column(Text, nullable=True)
    validation_errors = Column(Text, nullable=True)
    field_traces = Column(Text, nullable=True)  # Durable JSON-serialized extraction traces
    data_quality_score = Column(Integer, default=100)
    
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=0)
    record_count = Column(Integer, default=1)

class ScrapeRunCreate(BaseModel):
    target_url: str
    workflow_type: Optional[str] = "products"
    schema_name: Optional[str] = "products"
    scraper_id: Optional[int] = None

class ScrapeRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scraper_id: Optional[int] = None
    provider_run_id: Optional[str] = None
    target_url: str
    workflow_type: str = "products"
    fixture_name: Optional[str] = None
    template_signature: Optional[str] = "default"
    status: str
    selected_strategy: Optional[str] = None
    repair_triggered: bool = False
    raw_result: Optional[str] = None
    normalized_result: Optional[str] = None
    validation_errors: Optional[str] = None
    field_traces: Optional[str] = None
    data_quality_score: int = 100
    duration_ms: int = 0
    record_count: int = 1
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
