export interface SchemaField {
  name: string;
  data_type: 'string' | 'number' | 'integer' | 'boolean' | 'url' | 'date' | 'object';
  required: boolean;
  description: string;
}

export interface ScrapeSchema {
  name: string;
  description: string;
  fields: SchemaField[];
}

export interface ConfigModeResponse {
  provider: string;
  brightdata_enabled: boolean;
  display_name: string;
}

export interface Scraper {
  id: number;
  provider: string;
  external_scraper_id: string;
  name: string;
  workflow_type: string;
  target_domain?: string;
  schema_name: string;
  requested_fields: string;
  instructions?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ScrapeRun {
  id: number;
  scraper_id?: number;
  provider_run_id?: string;
  target_url: string;
  workflow_type: string;
  fixture_name?: string;
  status: string;
  selected_strategy?: string;
  repair_triggered: boolean;
  data_quality_score: number;
  validation_errors?: string[] | string;
  started_at: string;
  completed_at?: string;
  duration_ms: number;
}

export interface ScrapeRunDetails extends ScrapeRun {
  raw_result: Record<string, any>;
  normalized_result: Record<string, any>;
  validation_errors: string[];
  repair_attempts: RepairAttempt[];
  field_changes: FieldChange[];
  field_traces?: Array<{
    field_name: string;
    strategy_used: string;
    selector_used?: string;
    extracted_value?: any;
  }>;
}

export interface RepairAttempt {
  id: number;
  scrape_run_id: number;
  external_repair_id?: string;
  strategy_name?: string;
  instruction: string;
  approval_status: string;
  rerun_status: string;
  result: string;
  duration_ms: number;
  created_at: string;
}

export interface FieldChange {
  id: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  change_type: string;
}

export interface SearchRun {
  id: number;
  query: string;
  workflow_type: string;
  target_domain?: string;
  provider: string;
  provider_run_id?: string;
  results: any[];
  created_at: string;
}

export interface RuleBundle {
  id: number;
  domain: string;
  template_signature: string;
  workflow_type: string;
  version: number;
  description: string;
  field_rules: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface CandidateRulePatch {
  id: number;
  scrape_run_id: number;
  domain: string;
  template_signature: string;
  from_version: number;
  to_version: number;
  broken_fields: string[];
  root_cause_analysis: Record<string, any>;
  selector_diff: Record<string, any>;
  regression_results: any[];
  confidence_score: number;
  field_recovery_rate: number;
  non_regression_rate: number;
  status: string;
  created_at: string;
}

export interface Metrics {
  total_scrapers: number;
  total_runs: number;
  successful_runs: number;
  degraded_runs: number;
  repaired_runs: number;
  healed_runs?: number;
  manual_review_runs: number;
  avg_repair_duration_ms?: number;
  avg_duration_ms?: number;
  average_latency_ms?: number;
  average_quality_score?: number;
  overall_reliability?: number;
  healing_success_rate?: number;
  scraper_health?: string;
  same_template_repair_success_rate?: number;
  avg_confidence_promoted_only?: number;
  template_count?: number;
  rule_bundle_count_by_domain?: Record<string, number>;
  status_counts?: Record<string, number>;
  repair_metrics?: Record<string, any>;
}

export type ScraperMetrics = Metrics;


