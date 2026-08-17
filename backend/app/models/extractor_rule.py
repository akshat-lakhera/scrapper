from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class FieldRule(BaseModel):
    field_name: str
    strategies: List[str] = Field(default_factory=lambda: ["json_ld", "meta_tags", "css", "semantic"])
    primary_css: Optional[str] = None
    fallback_css: List[str] = Field(default_factory=list)
    xpath: Optional[str] = None
    regex: Optional[str] = None
    attribute: Optional[str] = None  # e.g., "content", "src", "href", "value", or None for text
    transform: Optional[str] = None  # e.g., "parse_price", "parse_integer", "strip"
    confidence: float = 1.0

class ExtractorRuleBundle(BaseModel):
    id: Optional[int] = None
    domain: str
    template_signature: str = "default"
    workflow_type: str = "products"
    version: int = 1
    description: str = "Base extraction rule bundle"
    field_rules: Dict[str, FieldRule] = Field(default_factory=dict)
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class FieldTrace(BaseModel):
    field_name: str
    strategy_used: str
    selector_used: Optional[str] = None
    raw_value: Any = None
    normalized_value: Any = None
    is_valid: bool = True
    confidence: float = 1.0
    error: Optional[str] = None

class RegressionPageTest(BaseModel):
    target_url: str
    page_type: str  # "failing_target", "historical_holdout", "synthetic_fixture"
    fields_recovered: List[str] = Field(default_factory=list)
    fields_regressed: List[str] = Field(default_factory=list)
    passed_validity: bool = True
    quality_score: int = 100

class CandidateRulePatch(BaseModel):
    id: Optional[int] = None
    scrape_run_id: int
    domain: str
    template_signature: str
    from_version: int
    to_version: int
    broken_fields: List[str]
    root_cause_analysis: Dict[str, Any]
    selector_diff: Dict[str, Dict[str, Any]]  # { field: { "old_selector": ..., "new_selector": ..., "strategy": ... } }
    candidate_rules: Dict[str, FieldRule]
    regression_tests: List[RegressionPageTest] = Field(default_factory=list)
    field_recovery_rate: float = 1.0
    non_regression_rate: float = 1.0
    confidence_score: float = 0.95
    status: Literal["pending_approval", "promoted", "rejected"] = "pending_approval"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
