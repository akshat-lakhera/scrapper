from datetime import datetime
import json
from typing import Any, List, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime
from pydantic import BaseModel, Field, ConfigDict
from app.database import Base

class SearchRunDB(Base):
    __tablename__ = "search_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    query = Column(String(300), nullable=False)
    workflow_type = Column(String(50), nullable=False, default="products")
    target_domain = Column(String(200), nullable=True)
    provider = Column(String(50), nullable=False, default="local")
    provider_run_id = Column(String(100), nullable=True)
    results = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchRunResponse(BaseModel):
    id: int
    query: str
    workflow_type: str = "products"
    target_domain: Optional[str] = None
    provider: str
    provider_run_id: Optional[str] = None
    results: List[Any] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
