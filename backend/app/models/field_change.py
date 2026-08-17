from datetime import datetime
from typing import Any, Optional
from sqlalchemy import Column, Integer, String, Text, DateTime
from pydantic import BaseModel, ConfigDict
from app.database import Base

class FieldChangeDB(Base):
    __tablename__ = "field_changes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scrape_run_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(100), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    change_type = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FieldChangeResponse(BaseModel):
    id: int
    scrape_run_id: int
    field_name: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    change_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
