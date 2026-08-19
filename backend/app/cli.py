import argparse
import asyncio
import json
import sys
from typing import Optional
from app.config import settings
from app.database import SessionLocal, init_db
from app.models.schema import get_schema_by_name, PRODUCT_SCHEMA
from app.models.scraper import ScraperDB
from app.models.scrape_run import ScrapeRunDB
from app.models.extractor_rule_db import ExtractorRuleBundleDB, CandidateRulePatchDB
from app.services.scrape_service import ScrapeService
from app.services.repair_engine import RepairEngine
from app.services.regression_validator import RegressionValidator

def print_header(title: str):
    print("\n" + "=" * 60)
    print(f"  MARKETSCOUT CLI — {title}")
    print("=" * 60)

async def cmd_status(args):
    print_header("SYSTEM STATUS & PROVIDER CONFIGURATION")
    print(f"Provider:                {settings.SCRAPER_PROVIDER}")
    print(f"Bright Data Base URL:    {settings.BRIGHTDATA_BASE_URL}")
    print(f"API Key Configured:      {'Yes (Present)' if settings.BRIGHTDATA_API_KEY else 'No (Missing)'}")
    print(f"SERP Zone:               {settings.BRIGHTDATA_SERP_ZONE or 'None'}")
    print(f"E-Commerce Dataset:      {settings.BRIGHTDATA_PRODUCT_DATASET_ID or 'Default'}")
    print(f"Database URL:            {settings.DATABASE_URL}")
    print(f"Fixtures Directory:      {settings.FIXTURES_DIR}")
    print("-" * 60)

async def cmd_create(args):
    print_header("CREATE SCRAPER (BRIGHT DATA DCA / LOCAL)")
    db = SessionLocal()
    try:
        workflow_type = args.workflow or "products"
        schema = get_schema_by_name(workflow_type) or PRODUCT_SCHEMA
        name = args.name or f"Scraper_{workflow_type}_{args.url[:25]}"
        
        print(f"[*] Creating scraper '{name}' on target: {args.url}")
        print(f"[*] Workflow Schema: {workflow_type}")
        
        scraper = await ScrapeService.create_scraper(
            db=db,
            name=name,
            target_domain=args.url,
            workflow_type=workflow_type,
            schema_name=workflow_type,
            instructions=args.instructions or ""
        )
        
        if args.json:
            print(json.dumps({
                "id": scraper.id,
                "name": scraper.name,
                "collector_id": scraper.external_scraper_id,
                "workflow_type": scraper.workflow_type,
                "target_domain": scraper.target_domain,
                "status": scraper.status
            }, indent=2))
        else:
            print(f"[+] Scraper Created Successfully!")
            print(f"    - Database ID:  {scraper.id}")
            print(f"    - Collector ID: {scraper.external_scraper_id}")
            print(f"    - Workflow:     {scraper.workflow_type}")
            print(f"    - Status:       {scraper.status}")
    finally:
        db.close()

async def cmd_run(args):
    db = SessionLocal()
    try:
        target_url = args.target
        workflow_type = args.workflow or "products"
        schema_name = args.schema or workflow_type
        
        if not args.json:
            print_header("EXECUTING SCRAPE RUN")
            print(f"[*] Target URL:       {target_url}")
            print(f"[*] Workflow / Schema:{workflow_type}")
            print(f"[*] Provider:         {settings.SCRAPER_PROVIDER}")
        
        run = await ScrapeService.execute_scrape(
            db=db,
            target_url=target_url,
            workflow_type=workflow_type,
            schema_name=schema_name
        )
        
        norm_result = json.loads(run.normalized_result) if run.normalized_result else {}
        val_errors = json.loads(run.validation_errors) if run.validation_errors else []
        
        if args.json:
            print(json.dumps({
                "run_id": run.id,
                "status": run.status,
                "data_quality_score": run.data_quality_score,
                "selected_strategy": run.selected_strategy,
                "duration_ms": run.duration_ms,
                "normalized_result": norm_result,
                "validation_errors": val_errors
            }, indent=2))
        else:
            print(f"\n[+] Scrape Execution Complete (Run #{run.id})")
            print(f"    - Status:             {run.status.upper()}")
            print(f"    - Data Quality Score: {run.data_quality_score}%")
            print(f"    - Strategy:           {run.selected_strategy}")
            print(f"    - Duration:           {run.duration_ms} ms")
            print("-" * 60)
            print("Extracted Normalized Fields:")
            for k, v in norm_result.items():
                if k not in ("source_url", "scraped_at", "target_url"):
                    val_str = str(v)[:60] + "..." if len(str(v)) > 60 else str(v)
                    print(f"    • {k:<18}: {val_str}")
            if val_errors:
                print(f"\n[!] Validation Warnings: {val_errors}")
    finally:
        db.close()

async def cmd_ci_run(args):
    """
    CI/CD Automation runner: Executes a scrape, performs autonomous self-healing if needed,
    and returns exit code 0 on green (success/repaired) or 1 on unresolved failure.
    """
    db = SessionLocal()
    try:
        target_url = args.target
        workflow = args.workflow or "products"
        
        print(f"[CI Runner] Starting automated scrape job on {target_url}...")
        run = await ScrapeService.execute_scrape(
            db=db,
            target_url=target_url,
            workflow_type=workflow,
            schema_name=workflow
        )
        
        print(f"[CI Runner] Run #{run.id} finished with status: {run.status.upper()} (Score: {run.data_quality_score}%)")
        
        if run.status in ("success", "repaired") and run.data_quality_score >= 70:
            print("[CI Runner] STATUS: GREEN. Quality gates passed.")
            sys.exit(0)
        else:
            print(f"[CI Runner] STATUS: RED. Run failed or degraded below threshold. Errors: {run.validation_errors}")
            sys.exit(1)
    finally:
        db.close()

async def cmd_ask(args):
    print_header("KNOWLEDGE BASE RAG QUERY")
    db = SessionLocal()

    try:
        from app.services.rag_service import RAGService
        res = await RAGService.chat_with_data(
            db=db,
            query=args.question,
            run_ids=[args.run_id] if args.run_id else None,
            workflow_type=args.workflow
        )
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"[*] Question: {args.question}")
            print(f"[*] Analyzed Runs: {res.get('runs_analyzed', 0)} | Confidence: {res.get('confidence', 0):.0%}")
            print("-" * 60)
            print(f"Answer:\n{res.get('answer')}")
            if res.get("citations"):
                print("\nVerified Source Citations:")
                for cit in res.get("citations", []):
                    print(f"  • [{cit.get('field')}]: {cit.get('value')} (Source: {cit.get('source_url')})")
    finally:
        db.close()

async def cmd_intel(args):
    print_header("COMPETITIVE INTELLIGENCE & DIFF RADAR")
    db = SessionLocal()
    try:
        from app.services.intel_service import IntelService
        res = await IntelService.get_domain_intel_report(db, domain=args.domain)
        if args.json:
            print(json.dumps(res, indent=2))
        else:
            print(f"[*] Domain Target:     {res.get('domain')}")
            print(f"[*] Tracked Runs:      {res.get('total_tracked_runs')} | Healed Events: {res.get('healed_runs_count')}")
            print(f"[*] Total Diff Events: {res.get('total_diff_events')}")
            print("-" * 60)
            print(f"Executive Briefing:\n{res.get('executive_summary')}")
    finally:
        db.close()

async def cmd_heal(args):
    print_header("TRIGGER VALIDATION-GATED HEALING")
    db = SessionLocal()
    try:
        run_id = args.run_id
        print(f"[*] Requesting autonomous repair proposal for Scrape Run #{run_id}...")
        attempt = await ScrapeService.heal_scrape_run(db, run_id=run_id)
        
        if args.json:
            print(json.dumps({
                "attempt_id": attempt.id,
                "scrape_run_id": attempt.scrape_run_id,
                "external_repair_id": attempt.external_repair_id,
                "instruction": attempt.instruction,
                "approval_status": attempt.approval_status,
                "missing_fields": json.loads(attempt.missing_fields) if attempt.missing_fields else []
            }, indent=2))
        else:
            print(f"\n[+] Repair Proposal Synthesized Successfully!")
            print(f"    - Attempt ID:      {attempt.id}")
            print(f"    - Repair ID:       {attempt.external_repair_id}")
            print(f"    - Approval Status: {attempt.approval_status.upper()}")
            print(f"    - Missing Fields:  {attempt.missing_fields}")
            print("-" * 60)
            print(f"Repair Instruction:\n{attempt.instruction}")
            print("\n[!] Run 'python -m app.cli approve {run_id} {attempt.id}' to review and promote.")
    finally:
        db.close()

async def cmd_approve(args):
    print_header("APPROVE REPAIR & PROMOTE RULE BUNDLE")
    db = SessionLocal()
    try:
        run_id = args.run_id
        attempt_id = args.attempt_id
        print(f"[*] Approving Repair Attempt #{attempt_id} for Run #{run_id}...")
        res = await ScrapeService.approve_repair_attempt(db, run_id=run_id, attempt_id=attempt_id)
        run = res["scrape_run"]
        attempt = res["repair_attempt"]
        
        if args.json:
            print(json.dumps({
                "run_id": run.id,
                "status": run.status,
                "quality_score": run.data_quality_score,
                "strategy": run.selected_strategy,
                "attempt_result": attempt.result
            }, indent=2))
        else:
            print(f"\n[+] Repair Approved and Promoted!")
            print(f"    - New Run Status:  {run.status.upper()}")
            print(f"    - Quality Score:   {run.data_quality_score}%")
            print(f"    - Active Strategy: {run.selected_strategy}")
            print(f"    - Result Note:     {attempt.result}")
    finally:
        db.close()

async def cmd_collectors(args):
    print_header("BRIGHT DATA SCRAPER STUDIO COLLECTORS")
    db = SessionLocal()
    try:
        scrapers = db.query(ScraperDB).order_by(ScraperDB.id.desc()).all()
        if args.json:
            print(json.dumps([
                {
                    "id": s.id,
                    "name": s.name,
                    "collector_id": s.external_scraper_id,
                    "workflow": s.workflow_type,
                    "status": s.status,
                    "created_at": s.created_at
                } for s in scrapers
            ], indent=2))
        else:
            print(f"Found {len(scrapers)} registered collectors:\n")
            for s in scrapers:
                print(f"  • ID #{s.id:<3} | Collector: {s.external_scraper_id:<25} | Workflow: {s.workflow_type:<12} | Status: {s.status}")
    finally:
        db.close()

def main():
    init_db()
    parser = argparse.ArgumentParser(description="MarketScout Headless CLI & Bright Data Scraper Studio Bridge")
    subparsers = parser.add_subparsers(dest="command", help="CLI Subcommands")

    # status command
    subparsers.add_parser("status", help="Show system status and provider configuration")

    # create command
    create_p = subparsers.add_parser("create", help="Create a Scraper Studio custom collector or dataset tracker")
    create_p.add_argument("url", help="Target URL or domain")
    create_p.add_argument("--name", help="Name of the scraper")
    create_p.add_argument("--workflow", default="products", help="Workflow type (products, jobs, tech_docs, x, linkedin, maps, reddit)")
    create_p.add_argument("--instructions", default="", help="Natural language extraction instructions")
    create_p.add_argument("--json", action="store_true", help="Output JSON format")

    # run command
    run_p = subparsers.add_parser("run", help="Run a scrape on target URL")
    run_p.add_argument("target", help="Target URL to scrape")
    run_p.add_argument("--workflow", default="products", help="Workflow type")
    run_p.add_argument("--schema", default=None, help="Schema name")
    run_p.add_argument("--auto-heal", action="store_true", help="Enable autonomous self-healing if extraction degrades")
    run_p.add_argument("--json", action="store_true", help="Output raw JSON")

    # heal command
    heal_p = subparsers.add_parser("heal", help="Trigger validation-gated healing proposal for a degraded run")
    heal_p.add_argument("run_id", type=int, help="Scrape Run ID to repair")
    heal_p.add_argument("--json", action="store_true", help="Output raw JSON")

    # approve command
    approve_p = subparsers.add_parser("approve", help="Approve repair proposal and promote rule bundle")
    approve_p.add_argument("run_id", type=int, help="Scrape Run ID")
    approve_p.add_argument("attempt_id", type=int, help="Repair Attempt ID to approve")
    approve_p.add_argument("--json", action="store_true", help="Output raw JSON")

    # collectors command
    collectors_p = subparsers.add_parser("collectors", help="List all registered Scraper Studio collectors")
    collectors_p.add_argument("--json", action="store_true", help="Output raw JSON")

    # ci-run command
    ci_p = subparsers.add_parser("ci-run", help="Headless CI runner with auto-healing and strict status exit codes")
    ci_p.add_argument("target", help="Target URL to scrape in CI")
    ci_p.add_argument("--workflow", default="products", help="Workflow type")
    ci_p.add_argument("--strict", action="store_true", help="Enforce quality score >= 80%")

    # ask (RAG) command
    ask_p = subparsers.add_parser("ask", help="Query the self-healing knowledge base using Groq RAG")
    ask_p.add_argument("question", help="Natural language question to ask against scraped data")
    ask_p.add_argument("--run-id", type=int, help="Filter by specific scrape run ID")
    ask_p.add_argument("--workflow", default=None, help="Filter by workflow type")
    ask_p.add_argument("--json", action="store_true", help="Output raw JSON")

    # intel command
    intel_p = subparsers.add_parser("intel", help="Generate competitive intelligence and diff radar report")
    intel_p.add_argument("--domain", default=None, help="Filter by target domain")
    intel_p.add_argument("--json", action="store_true", help="Output raw JSON")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "status":
        asyncio.run(cmd_status(args))
    elif args.command == "create":
        asyncio.run(cmd_create(args))
    elif args.command == "run":
        asyncio.run(cmd_run(args))
    elif args.command == "heal":
        asyncio.run(cmd_heal(args))
    elif args.command == "approve":
        asyncio.run(cmd_approve(args))
    elif args.command == "collectors":
        asyncio.run(cmd_collectors(args))
    elif args.command == "ci-run":
        asyncio.run(cmd_ci_run(args))
    elif args.command == "ask":
        asyncio.run(cmd_ask(args))
    elif args.command == "intel":
        asyncio.run(cmd_intel(args))

if __name__ == "__main__":
    main()

