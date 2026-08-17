import type {
  ConfigModeResponse,
  ScrapeSchema,
  Scraper,
  ScrapeRun,
  ScrapeRunDetails,
  Metrics,
} from './types';

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(url: string, options?: RequestInit, timeoutMs = 180_000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      let detail = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.detail) detail = String(body.detail);
        else if (body?.error) detail = String(body.error);
        else if (body?.message) detail = String(body.message);
      } catch { /* ignore parse errors */ }
      throw new ApiError(detail, res.status);
    }
    return res.json() as Promise<T>;
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      throw new Error(`Scraper cluster operation timed out after ${timeoutMs / 1000}s while collecting live dataset.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchHealth() {
  return request<Record<string, unknown>>(`${API_BASE}/health`);
}

export async function fetchConfigMode(): Promise<ConfigModeResponse> {
  return request<ConfigModeResponse>(`${API_BASE}/config/mode`);
}

export async function fetchSchemas(): Promise<ScrapeSchema[]> {
  return request<ScrapeSchema[]>(`${API_BASE}/schemas`);
}

export async function fetchScrapers(): Promise<Scraper[]> {
  return request<Scraper[]>(`${API_BASE}/scrapers`);
}

export async function createScraper(data: {
  name: string;
  target_domain?: string;
  workflow_type?: string;
  schema_name?: string;
  requested_fields?: string[];
  instructions?: string;
}): Promise<Scraper> {
  return request<Scraper>(`${API_BASE}/scrapers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function executeScrape(data: {
  target_url: string;
  workflow_type?: string;
  schema_name?: string;
}) {
  return request<Record<string, any>>(`${API_BASE}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function healScrapeRun(_scraperId: number, runId: number) {
  return request<Record<string, any>>(`${API_BASE}/runs/${runId}/heal`, {
    method: 'POST',
  });
}

export async function approveRepair(runId: number, repairAttemptId: number) {
  return request<Record<string, any>>(`${API_BASE}/runs/${runId}/approve-repair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repair_attempt_id: repairAttemptId, run_id: runId }),
  });
}

export async function fetchRuleBundles() {
  return request<any[]>(`${API_BASE}/rules`);
}

export async function fetchRulePatches() {
  return request<any[]>(`${API_BASE}/rules/patches`);
}

export async function executeSearch(data: {
  query: string;
  workflow_type?: string;
  target_domain?: string;
}): Promise<{ search_id: number; query: string; workflow_type: string; provider: string; results: any[] }> {
  return request(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function selectSearchResult(searchId: number, selectedUrl: string, workflowType?: string) {
  return request<Record<string, any>>(`${API_BASE}/search/${searchId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selected_url: selectedUrl, workflow_type: workflowType }),
  });
}

export async function fetchRuns(): Promise<ScrapeRun[]> {
  return request<ScrapeRun[]>(`${API_BASE}/runs`);
}

export async function clearRuns(): Promise<{ status: string; message: string }> {
  return request(`${API_BASE}/runs/clear`, { method: 'POST' });
}

export async function fetchRunDetails(id: number): Promise<ScrapeRunDetails> {
  return request<ScrapeRunDetails>(`${API_BASE}/runs/${id}`);
}

export async function fetchMetrics(): Promise<Metrics> {
  return request<Metrics>(`${API_BASE}/metrics`);
}

export async function resetDemo() {
  return request<Record<string, any>>(`${API_BASE}/demo/reset`, { method: 'POST' });
}
