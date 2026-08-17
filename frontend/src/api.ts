import type {
  ConfigModeResponse,
  ScrapeSchema,
  Scraper,
  ScrapeRun,
  ScrapeRunDetails,
  Metrics,
} from './types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchConfigMode(): Promise<ConfigModeResponse> {
  const res = await fetch(`${API_BASE}/config/mode`);
  return res.json();
}

export async function fetchSchemas(): Promise<ScrapeSchema[]> {
  const res = await fetch(`${API_BASE}/schemas`);
  return res.json();
}

export async function fetchScrapers(): Promise<Scraper[]> {
  const res = await fetch(`${API_BASE}/scrapers`);
  return res.json();
}

export async function createScraper(data: {
  name: string;
  target_domain?: string;
  workflow_type?: string;
  schema_name?: string;
  requested_fields?: string[];
  instructions?: string;
}): Promise<Scraper> {
  const res = await fetch(`${API_BASE}/scrapers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function executeScrape(data: {
  target_url: string;
  workflow_type?: string;
  schema_name?: string;
}) {
  const res = await fetch(`${API_BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function healScrapeRun(scraperId: number, runId: number) {
  const res = await fetch(`${API_BASE}/scrapers/${scraperId}/heal?run_id=${runId}`, {
    method: 'POST',
  });
  return res.json();
}

export async function approveRepair(scraperId: number, repairAttemptId: number) {
  const res = await fetch(`${API_BASE}/scrapers/${scraperId}/approve-repair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repair_attempt_id: repairAttemptId }),
  });
  return res.json();
}

export async function executeSearch(data: {
  query: string;
  workflow_type?: string;
  target_domain?: string;
}): Promise<{ search_id: number; query: string; workflow_type: string; provider: string; results: any[] }> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function selectSearchResult(searchId: number, selectedUrl: string, workflowType?: string) {
  const res = await fetch(`${API_BASE}/search/${searchId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected_url: selectedUrl, workflow_type: workflowType }),
  });
  return res.json();
}

export async function fetchRuns(): Promise<ScrapeRun[]> {
  const res = await fetch(`${API_BASE}/runs`);
  return res.json();
}

export async function clearRuns(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/runs/clear`, { method: 'POST' });
  return res.json();
}

export async function fetchRunDetails(id: number): Promise<ScrapeRunDetails> {
  const res = await fetch(`${API_BASE}/runs/${id}`);
  return res.json();
}

export async function fetchMetrics(): Promise<Metrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  return res.json();
}

export async function resetDemo() {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  return res.json();
}
