from datetime import datetime
import json
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime
from pydantic import BaseModel, Field, ConfigDict
from app.database import Base

class RepairAttemptDB(Base):
    __tablename__ = "repair_attempts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scrape_run_id = Column(Integer, nullable=False, index=True)
    external_repair_id = Column(String(100), nullable=True)
    strategy_name = Column(String(100), nullable=True)
    strategy_order = Column(Integer, default=1)
    instruction = Column(Text, nullable=True)
    failure_context = Column(Text, nullable=True, default="{}")
    provider_response = Column(Text, nullable=True, default="{}")
    extracted_data = Column(Text, nullable=True, default="{}")
    missing_fields = Column(Text, nullable=True, default="[]")
    validation_errors = Column(Text, nullable=True, default="[]")
    quality_score = Column(Integer, default=0)
    approval_status = Column(String(50), default="approved")
    rerun_status = Column(String(50), default="completed")
    result = Column(String(50), nullable=False)
    recovered_fields = Column(Text, nullable=True, default="[]")
    remaining_errors = Column(Text, nullable=True, default="[]")
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class RepairAttemptResponse(BaseModel):
    id: int
    scrape_run_id: int
    external_repair_id: Optional[str] = None
    strategy_name: Optional[str] = None
    strategy_order: int = 1
    instruction: Optional[str] = None
    failure_context: Dict[str, Any] = Field(default_factory=dict)
    provider_response: Dict[str, Any] = Field(default_factory=dict)
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    validation_errors: List[str] = Field(default_factory=list)
    quality_score: int = 0
    approval_status: str = "approved"
    rerun_status: str = "completed"
    result: str
    recovered_fields: List[str] = Field(default_factory=list)
    remaining_errors: List[str] = Field(default_factory=list)
    duration_ms: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
