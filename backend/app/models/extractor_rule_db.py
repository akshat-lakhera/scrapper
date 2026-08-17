from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from app.database import Base

class ExtractorRuleBundleDB(Base):
    __tablename__ = "extractor_rule_bundles"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String, index=True, nullable=False)
    template_signature = Column(String, index=True, default="default")
    workflow_type = Column(String, index=True, default="products")
    version = Column(Integer, default=1, nullable=False)
    description = Column(String, default="Standard Extraction Rules")
    field_rules = Column(Text, default="{}")  # JSON serialized Dict[str, FieldRule]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CandidateRulePatchDB(Base):
    __tablename__ = "candidate_rule_patches"

    id = Column(Integer, primary_key=True, index=True)
    scrape_run_id = Column(Integer, ForeignKey("scrape_runs.id"), nullable=False)
    domain = Column(String, index=True, nullable=False)
    template_signature = Column(String, index=True, default="default")
    from_version = Column(Integer, nullable=False)
    to_version = Column(Integer, nullable=False)
    broken_fields = Column(Text, default="[]")  # JSON list
    root_cause_analysis = Column(Text, default="{}")  # JSON dict
    selector_diff = Column(Text, default="{}")  # JSON dict
    candidate_rules = Column(Text, default="{}")  # JSON serialized rules
    regression_tests = Column(Text, default="[]")  # JSON list of RegressionPageTest
    field_recovery_rate = Column(Float, default=1.0)
    non_regression_rate = Column(Float, default=1.0)
    confidence_score = Column(Float, default=0.95)
    status = Column(String, default="pending_approval")  # pending_approval, promoted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
