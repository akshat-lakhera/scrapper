import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { executeSearch, selectSearchResult } from '../api';
import type { SearchRun } from '../types';
import { useScrambleText, stagger } from '../hooks';
import { useToast } from './ToastContext';

interface SearchHistoryProps {
  setActiveTab: (tab: string) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ setActiveTab }) => {
  const [query, setQuery] = useState('');
  const [workflowType, setWorkflowType] = useState('products');
  const [targetDomain, setTargetDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSearch, setCurrentSearch] = useState<SearchRun | null>(null);
  const title = useScrambleText('Natural Language Search Discovery', true);
  const { showToast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return alert('Please enter a search query');
    try {
      setLoading(true);
      showToast('info', 'Executing SERP Query', `Query: "${query.trim()}"`);
      const res = await executeSearch({
        query: query.trim(),
        workflow_type: workflowType,
        target_domain: targetDomain.trim() || undefined,
      });
      setCurrentSearch({
        id: res.search_id,
        query: res.query,
        workflow_type: res.workflow_type,
        target_domain: targetDomain || 'All Domains',
        provider: res.provider,
        results: res.results || [],
        created_at: new Date().toISOString(),
      });
      showToast('success', 'SERP Search Completed', `Found ${res.results?.length || 0} result candidates`);
    } catch (err: any) {
      showToast('error', 'Search Query Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (url: string) => {
    try {
      setLoading(true);
      showToast('info', 'Routing Item into Scraper', url);
      await selectSearchResult(currentSearch?.id || 0, url, workflowType);
      setActiveTab(workflowType);
    } catch (e: any) {
      showToast('error', 'Selection Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="stagger-in" style={stagger(0)} aria-labelledby="search-history-title">
        <div className="flex items-center gap-2 mb-2">
          <Search size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
            SERP Intelligence
          </span>
        </div>
        <h1 id="search-history-title" className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Search for products or job openings across any domain using Bright Data SERP parsing, then seamlessly route into extractors.
        </p>
      </section>

      {/* Search Input Box */}
      <section
        className="rounded-2xl glow-hover stagger-in p-6 space-y-5"
        style={{ ...stagger(1), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        aria-label="Search Form"
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Search Query
              </label>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. noise cancelling headphones under ₹5000 or python backend engineer remote"
                className="w-full px-4 py-3 rounded-xl mono text-xs focus-ring"
                style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Workflow Type
              </label>
              <select
                value={workflowType}
                onChange={(e) => setWorkflowType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs focus-ring"
                style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="products">Product Discovery</option>
                <option value="jobs">Job Discovery</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Filter Domain (Optional)
              </label>
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="e.g. glassdoor.com or amazon.in"
                className="w-full px-4 py-3 rounded-xl mono text-xs focus-ring"
                style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-spring transition-all focus-ring"
            style={{
              background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(168,85,247,0.3)',
            }}
          >
            <Search size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>{loading ? 'Querying Bright Data SERP API…' : 'Execute Search Discovery'}</span>
          </button>
        </form>
      </section>

      {/* Fresh User / Empty Search State */}
      {!currentSearch && !loading && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl stagger-in text-center px-4" style={{ ...stagger(2), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="empty-orb mb-4" />
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>SERP Discovery Engine Ready</p>
          <p className="text-xs mt-1 text-center max-w-sm" style={{ color: 'var(--text-tertiary)' }}>
            Search across any website and route discovery results into schema scrapers with 1 click.
          </p>
        </div>
      )}

      {/* Search Results Display */}
      {currentSearch && (
        <section className="space-y-4 stagger-in" style={stagger(3)} aria-label="Search Discovery Results">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Search Results ({currentSearch.results.length})
            </h2>
            <span className="text-xs mono" style={{ color: 'var(--accent)' }}>
              Provider: {currentSearch.provider}
            </span>
          </div>

          {currentSearch.results.length === 0 ? (
            <div className="p-8 rounded-2xl text-center text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
              No results found for query &quot;{currentSearch.query}&quot;. Try a broader search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSearch.results.map((res: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl glow-hover card-reveal space-y-3" style={{ ...stagger(idx), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{res.title || res.job_title}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {res.seller || res.company || 'Source not specified'} {res.location ? `• ${res.location}` : ''}
                  </div>
                  {(res.price != null || res.salary != null) && (
                    <div className="mono text-xs font-bold" style={{ color: 'var(--success)' }}>
                      {res.currency ? `${res.currency} ` : ''}{res.price || res.salary}
                    </div>
                  )}
                  <button
                    onClick={() => handleSelect(res.product_url || res.application_url || res.url || '')}
                    disabled={!res.product_url && !res.application_url && !res.url}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 btn-spring focus-ring"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent)', border: '1px solid rgba(168,85,247,0.2)' }}
                  >
                    <span>Select & Route to Scraper</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
