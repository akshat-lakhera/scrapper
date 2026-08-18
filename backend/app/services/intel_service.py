import json
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models.scrape_run import ScrapeRunDB
from app.models.field_change import FieldChangeDB
from app.extraction.fingerprinter import TemplateFingerprinter

logger = logging.getLogger("marketscout.intel_service")

class IntelService:
    """
    Competitive Intelligence & Historical Diff Analysis Engine.
    Tracks structural, pricing, catalog, and documentation shifts across
    competitor websites over time, synthesizing executive briefings.
    """

    @staticmethod
    async def get_domain_intel_report(
        db: Session,
        domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a comprehensive competitive intel summary across runs.
        """
        query = db.query(ScrapeRunDB).order_by(ScrapeRunDB.id.desc())
        all_runs = query.limit(50).all()

        if domain:
            target_runs = [r for r in all_runs if domain.lower() in (r.target_url or "").lower()]
        else:
            target_runs = all_runs

        if not target_runs:
            return {
                "domain": domain or "all",
                "total_tracked_runs": 0,
                "executive_summary": "No historical intelligence data collected yet for this domain.",
                "timeline_events": [],
                "price_trends": [],
                "structural_shifts": 0
            }

        # 1. Gather all field changes across these runs
        run_ids = [r.id for r in target_runs]
        changes = db.query(FieldChangeDB).filter(FieldChangeDB.scrape_run_id.in_(run_ids)).order_by(FieldChangeDB.id.desc()).all()

        timeline_events = []
        price_events = []
        for c in changes:
            event = {
                "id": c.id,
                "run_id": c.scrape_run_id,
                "field_name": c.field_name,
                "old_value": c.old_value,
                "new_value": c.new_value,
                "change_type": c.change_type,
                "detected_at": c.detected_at.isoformat() if hasattr(c, "detected_at") and c.detected_at else "Recently"
            }
            timeline_events.append(event)
            if c.field_name in ("price", "salary"):
                price_events.append(event)

        # 2. Count template / structural mutations
        templates_observed = set(r.template_signature for r in target_runs if r.template_signature)
        healed_runs_count = sum(1 for r in target_runs if r.status in ("repaired", "auto_healed"))

        # 3. Generate AI Executive Briefing via Groq
        executive_summary = (
            f"MarketScout tracked {len(target_runs)} execution runs across {len(templates_observed)} unique DOM template signatures. "
            f"Detected {len(timeline_events)} attribute diffs ({len(price_events)} pricing events) and {healed_runs_count} autonomous self-healing events."
        )

        if settings.is_groq_enabled() and timeline_events:
            system_prompt = (
                "You are an elite Competitive Intelligence & Market Data Analyst.\n"
                "Review the chronological field diffs and provide a sharp, 3-4 sentence executive briefing "
                "highlighting key price movements, stock updates, or competitor website redesigns."
            )
            user_prompt = (
                f"Domain: {domain or 'Multi-target portfolio'}\n"
                f"Tracked Runs: {len(target_runs)}\n"
                f"Detected Field Changes:\n{json.dumps(timeline_events[:10], indent=2)}\n\n"
                "Synthesize an executive intelligence briefing:"
            )
            try:
                from groq import AsyncGroq
                client = AsyncGroq(api_key=settings.GROQ_API_KEY)
                resp = await client.chat.completions.create(
                    model=settings.GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.2,
                    max_tokens=350
                )
                ai_text = resp.choices[0].message.content
                if ai_text:
                    executive_summary = ai_text.strip()
            except Exception as e:
                logger.warning(f"Groq Intel summary generation failed: {e}")

        return {
            "domain": domain or "all",
            "total_tracked_runs": len(target_runs),
            "unique_templates": len(templates_observed),
            "healed_runs_count": healed_runs_count,
            "total_diff_events": len(timeline_events),
            "executive_summary": executive_summary,
            "timeline_events": timeline_events[:20],
            "price_events": price_events[:10]
        }
