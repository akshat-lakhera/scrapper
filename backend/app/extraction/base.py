from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ExtractionResult(BaseModel):
    strategy_name: str
    raw_fields: Dict[str, Any] = Field(default_factory=dict)
    evidence: Dict[str, str] = Field(default_factory=dict)
    missing_fields: List[str] = Field(default_factory=list)
    validation_errors: List[str] = Field(default_factory=list)
    normalized_data: Dict[str, Any] = Field(default_factory=dict)
    quality_score: int = 0
    is_valid: bool = False
    execution_time_ms: int = 0

class BaseExtractionStrategy(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        pass

    @abstractmethod
    def extract(self, html_content: str, source_url: str = "") -> ExtractionResult:
        pass
