from datetime import datetime
import json
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from pydantic import BaseModel, Field, ConfigDict
from app.database import Base

class ScrapeRunDB(Base):
    __tablename__ = "scrape_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scraper_id = Column(Integer, nullable=True)
    provider_run_id = Column(String(100), nullable=True)
    target_url = Column(String(500), nullable=False)
    workflow_type = Column(String(50), nullable=False, default="products")
    fixture_name = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="running")
    raw_result = Column(Text, nullable=True, default="{}")
    normalized_result = Column(Text, nullable=True, default="{}")
    validation_errors = Column(Text, nullable=True, default="[]")
    selected_strategy = Column(String(100), nullable=True)
    repair_triggered = Column(Boolean, default=False)
    data_quality_score = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, default=0)

class ScrapeRunResponse(BaseModel):
    id: int
    scraper_id: Optional[int] = None
    provider_run_id: Optional[str] = None
    target_url: str
    workflow_type: str = "products"
    fixture_name: Optional[str] = None
    status: str
    raw_result: Dict[str, Any] = Field(default_factory=dict)
    normalized_result: Dict[str, Any] = Field(default_factory=dict)
    validation_errors: List[str] = Field(default_factory=list)
    selected_strategy: Optional[str] = None
    repair_triggered: bool = False
    data_quality_score: int = 0
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: int = 0

    model_config = ConfigDict(from_attributes=True)
