from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from bs4 import BeautifulSoup
from app.config import settings
from app.models.schema import ScrapeSchema
from app.models.extractor_rule import CandidateRulePatch, ExtractorRuleBundle, RegressionPageTest
from app.extraction.multi_strategy_engine import MultiStrategyEngine
from app.extraction.validator import Validator

class RegressionValidator:
    """
    Multi-page regression validator that tests candidate rule patches across
    the failing page, holdout samples, and regression fixture packs before promotion.
    """

    @staticmethod
    def validate_patch(
        patch: CandidateRulePatch,
        schema: ScrapeSchema,
        failing_html: str,
        failing_url: str,
        holdout_samples: Optional[List[Tuple[str, str]]] = None  # List of (html, url)
    ) -> CandidateRulePatch:
        candidate_bundle = ExtractorRuleBundle(
            domain=patch.domain,
            template_signature=patch.template_signature,
            version=patch.to_version,
            field_rules=patch.candidate_rules
        )

        regression_results: List[RegressionPageTest] = []
        test_pages: List[Tuple[str, str, str]] = []

        # 1. Add failing target page
        test_pages.append((failing_html, failing_url, "failing_target"))

        # 2. Add explicit holdout samples if provided
        if holdout_samples:
            for h_html, h_url in holdout_samples:
                test_pages.append((h_html, h_url, "historical_holdout"))

        # 3. Add local fixture regression pack matching workflow
        fixtures_dir = Path(settings.FIXTURES_DIR)
        if fixtures_dir.exists():
            for fpath in fixtures_dir.glob("*.html"):
                if "broken" in fpath.name:
                    continue
                if schema.name == "products" and "product" in fpath.name:
                    try:
                        content = fpath.read_text(encoding="utf-8")
                        test_pages.append((content, f"https://demo.local/{fpath.name}", "fixture_pack"))
                    except Exception:
                        pass
                elif schema.name == "jobs" and "job" in fpath.name:
                    try:
                        content = fpath.read_text(encoding="utf-8")
                        test_pages.append((content, f"https://demo.local/{fpath.name}", "fixture_pack"))
                    except Exception:
                        pass

        total_broken_recovered = 0
        total_broken_checked = 0
        total_regressions = 0

        for html_content, page_url, ptype in test_pages:
            normalized_record, traces = MultiStrategyEngine.extract(
                html=html_content,
                schema=schema,
                target_url=page_url,
                rule_bundle=candidate_bundle
            )

            is_valid, missing, errors = Validator.validate_record(normalized_record, schema)
            quality_score = Validator.calculate_quality_score(normalized_record, schema, is_valid)

            recovered_fields = [f for f in patch.broken_fields if normalized_record.get(f) is not None]
            regressed_fields = [f for f in schema.get_required_field_names() if f not in patch.broken_fields and normalized_record.get(f) is None]

            if ptype in ("failing_target", "historical_holdout"):
                total_broken_recovered += len(recovered_fields)
                total_broken_checked += len(patch.broken_fields)
                total_regressions += len(regressed_fields)

            regression_results.append(RegressionPageTest(
                target_url=page_url,
                page_type=ptype,
                fields_recovered=recovered_fields,
                fields_regressed=regressed_fields,
                passed_validity=is_valid,
                quality_score=quality_score
            ))

        recovery_rate = (total_broken_recovered / total_broken_checked) if total_broken_checked > 0 else 1.0
        non_regression_rate = 1.0 if total_regressions == 0 else max(0.0, 1.0 - (total_regressions * 0.2))

        # Composite Confidence Gate Score
        confidence = (recovery_rate * 0.70) + (non_regression_rate * 0.30)

        patch.regression_tests = regression_results
        patch.field_recovery_rate = round(recovery_rate, 2)
        patch.non_regression_rate = round(non_regression_rate, 2)
        patch.confidence_score = round(confidence, 2)

        return patch
