from datetime import datetime
import json
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime
from pydantic import BaseModel, Field, ConfigDict
from app.database import Base

class ScraperDB(Base):
    __tablename__ = "scrapers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider = Column(String(50), nullable=False, default="local")
    external_scraper_id = Column(String(100), nullable=True)
    name = Column(String(200), nullable=False)
    workflow_type = Column(String(50), nullable=False, default="products")
    target_domain = Column(String(200), nullable=True)
    schema_name = Column(String(100), nullable=False, default="products")
    requested_fields = Column(Text, nullable=False, default="[]")
    instructions = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ScraperBase(BaseModel):
    name: str
    workflow_type: str = "products"
    target_domain: Optional[str] = None
    schema_name: str = "products"
    requested_fields: List[str] = Field(default_factory=list)
    instructions: Optional[str] = ""

class ScraperCreate(ScraperBase):
    provider: str = "local"
    external_scraper_id: Optional[str] = None

class ScraperResponse(ScraperBase):
    id: int
    provider: str
    external_scraper_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
