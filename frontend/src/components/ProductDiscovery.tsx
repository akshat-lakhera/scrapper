import React, { useState } from 'react';
import { Globe, Search, Play, AlertTriangle, Wrench, ExternalLink, Sparkles, Check, Copy, CheckCheck, Code2 } from 'lucide-react';
import { executeScrape, executeSearch, selectSearchResult } from '../api';
import { useScrambleText, stagger } from '../hooks';

interface ProductDiscoveryProps { setActiveTab: (tab: string) => void; }

export const ProductDiscovery: React.FC<ProductDiscoveryProps> = ({ setActiveTab }) => {
  const [mode, setMode] = useState<'url' | 'search'>('url');
  const [targetUrl, setTargetUrl] = useState('');
  const [query, setQuery] = useState('');
  const [targetDomain, setTargetDomain] = useState('amazon.in');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'title', 'price', 'currency', 'availability', 'rating', 'review_count', 'seller', 'product_url'
  ]);
  const [loading, setLoading] = useState(false);
  const [selectingUrl, setSelectingUrl] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const title = useScrambleText('Product Discovery & Intelligence', true);

  const popularDomains = ['amazon.in', 'flipkart.com', 'myntra.com', 'ebay.com', 'walmart.com'];

  const fields = [
    { name: 'title', label: 'Title', req: true },
    { name: 'price', label: 'Price', req: true },
    { name: 'currency', label: 'Currency', req: true },
    { name: 'availability', label: 'Availability', req: true },
    { name: 'rating', label: 'Rating' },
    { name: 'review_count', label: 'Reviews' },
    { name: 'seller', label: 'Seller' },
    { name: 'product_url', label: 'URL', req: true },
    { name: 'image_url', label: 'Image' },
    { name: 'specifications', label: 'Specs' },
  ];

  const handleUrlChange = (url: string) => {
    setTargetUrl(url);
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        if (host) setTargetDomain(host);
      } else if (url.includes('.')) {
        const host = url.split('/')[0].replace(/^www\./, '');
        if (host) setTargetDomain(host);
      }
    } catch {
      // ignore
    }
  };

  const handleRun = async () => {
    if (mode === 'url' && !targetUrl.trim()) return alert('Please enter a target URL or select a test fixture');
    if (mode === 'search' && !query.trim()) return alert('Please enter a search query');
    try {
      setLoading(true); setResult(null); setSearchResults([]);
      if (mode === 'url') {
        const scrapePayloadUrl = targetUrl.trim().startsWith('http') ? targetUrl.trim() : `https://${targetUrl.trim()}`;
        const res = await executeScrape({ target_url: scrapePayloadUrl, workflow_type: 'products', schema_name: 'products' });
        setResult(res);
      } else {
        const s = await executeSearch({ query: query.trim(), workflow_type: 'products', target_domain: targetDomain.trim() });
        setSearchResults(s.results || []);
      }
    } catch (e: any) { alert(`Extraction error: ${e.message}`); } finally { setLoading(false); }
  };

  const handleSelect = async (item: any) => {
    const url = item.product_url || item.application_url || item.url || (typeof item === 'string' ? item : '');
    if (!url) return;
    try {
      setSelectingUrl(url);
      setTargetUrl(url);
      setLoading(true);
      const res = await selectSearchResult(0, url, 'products');
      setResult(res);
      setTimeout(() => {
        const el = document.getElementById('product-scrape-result');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e: any) {
      alert(`Scrape failed: ${e.message}`);
    } finally {
      setLoading(false);
      setSelectingUrl(null);
    }
  };

  const copyResultJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.extracted_data || result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleField = (n: string) => setSelectedFields(p => p.includes(n) ? p.filter(f => f !== n) : [...p, n]);
  const extracted = result?.extracted_data || {};
  const isDegraded = result?.status === 'degraded' || result?.repair_triggered;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="stagger-in" style={stagger(0)}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
            Collector Studio
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Extract normalized product pricing, specifications, and availability from Amazon, Flipkart, or any custom website.
        </p>
      </div>

      {/* Main Extraction Form Box */}
      <div className="rounded-2xl glow-hover stagger-in p-6 space-y-6" style={{ ...stagger(1), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {/* Mode Switcher */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-root)' }}>
          {(['url', 'search'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all btn-spring flex items-center justify-center gap-2"
              style={{
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-tertiary)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: mode === m ? '0 0 16px rgba(168,85,247,0.2)' : 'none',
              }}
            >
              {m === 'url' ? <><Globe size={13} /> Direct Public URL</> : <><Search size={13} /> Natural Language Search</>}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              {mode === 'url' ? <><Globe size={12} style={{ color: 'var(--accent)' }} /> Target Website / Product URL</> : <><Search size={12} style={{ color: 'var(--accent)' }} /> Search Query</>}
            </label>
            <input
              type="text"
              value={mode === 'url' ? targetUrl : query}
              onChange={e => mode === 'url' ? handleUrlChange(e.target.value) : setQuery(e.target.value)}
              placeholder={mode === 'url' ? 'e.g. https://www.amazon.in/dp/... or https://akshat-lakhera.vercel.app/' : 'e.g. wireless headphones under ₹5000'}
              className="w-full px-4 py-3 rounded-xl mono text-xs focus-ring transition-all"
              style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Custom Domain Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold flex items-center justify-between" style={{ color: 'var(--text-secondary)' }}>
              <span>Target Domain Scope</span>
              <span className="text-[10px] mono text-purple-400 font-normal">Custom input</span>
            </label>
            <input
              type="text"
              value={targetDomain}
              onChange={e => setTargetDomain(e.target.value)}
              placeholder="e.g. amazon.in or custom domain"
              className="w-full px-4 py-3 rounded-xl mono text-xs focus-ring"
              style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Quick Domain Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-wider mono font-semibold" style={{ color: 'var(--text-tertiary)' }}>
            Quick Domains:
          </span>
          {popularDomains.map(d => (
            <button
              key={d}
              onClick={() => setTargetDomain(d)}
              className="px-2.5 py-1 rounded-lg mono text-[11px] transition-all btn-spring"
              style={{
                background: targetDomain === d ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                border: `1px solid ${targetDomain === d ? 'var(--accent)' : 'var(--border-default)'}`,
                color: targetDomain === d ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Schema Fields Selector */}
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Extraction Schema Attributes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {fields.map(f => {
              const active = selectedFields.includes(f.name);
              return (
                <button
                  key={f.name}
                  onClick={() => toggleField(f.name)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 btn-spring"
                  style={{
                    background: active ? 'var(--accent-muted)' : 'var(--bg-root)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
                    color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}
                >
                  {active && <Check size={11} className="inline mr-1" />}
                  {f.label}{f.req ? ' *' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRun}
          disabled={loading}
          className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-spring transition-all ${loading ? 'shimmer-loading' : ''}`}
          style={{
            background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 24px rgba(168,85,247,0.3)',
          }}
        >
          <Play size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Executing Bright Data Scraper Engine…' : 'Execute Product Scraper'}
        </button>
      </div>

      {/* Empty State */}
      {!result && searchResults.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl stagger-in" style={{ ...stagger(2), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="empty-orb mb-4" />
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Collector Ready</p>
          <p className="text-xs mt-1 text-center max-w-sm" style={{ color: 'var(--text-tertiary)' }}>
            Enter a public URL or search query to extract structured product data with automated schema normalization.
          </p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4 stagger-in" style={stagger(3)}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Discovered Products ({searchResults.length})
            </h3>
            <span className="text-xs mono" style={{ color: 'var(--accent)' }}>Domain: {targetDomain}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((item, i) => {
              const itemUrl = item.product_url || item.application_url || '';
              const isThisSelecting = selectingUrl === itemUrl && loading;
              return (
                <div key={i} className="p-5 rounded-xl glow-hover card-reveal space-y-3" style={{ ...stagger(i), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="mono text-sm font-bold" style={{ color: 'var(--success)' }}>
                      ₹{item.price?.toLocaleString()} {item.currency}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.seller}</span>
                  </div>
                  <button
                    onClick={() => handleSelect(item)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 btn-spring"
                    style={{
                      background: isThisSelecting ? 'var(--accent)' : 'var(--accent-muted)',
                      color: isThisSelecting ? '#fff' : 'var(--accent)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      cursor: loading ? 'wait' : 'pointer'
                    }}
                  >
                    {isThisSelecting ? (
                      <>
                        <Play size={13} className="animate-spin" />
                        <span>Scraping Live Product…</span>
                      </>
                    ) : (
                      <>
                        <span>Select & Scrape This Product</span>
                        <ExternalLink size={13} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrape Result Output */}
      {result && (
        <div id="product-scrape-result" className="rounded-2xl glow-hover stagger-in p-6 space-y-6" style={{ ...stagger(4), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3">
              <div className="pulse-dot" style={{ color: result.status === 'success' ? 'var(--success)' : 'var(--warning)', backgroundColor: result.status === 'success' ? 'var(--success)' : 'var(--warning)' }} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Extraction {result.status}
                  </span>
                  <span className="text-[10px] mono px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--bg-root)', color: 'var(--accent)' }}>
                    200 OK
                  </span>
                </div>
                <div className="mono text-xs mt-0.5 truncate max-w-lg" style={{ color: 'var(--text-tertiary)' }}>{result.target_url}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>Data Quality Score</div>
                <div className="text-2xl font-bold mono" style={{ color: (result.quality_score || 0) >= 80 ? 'var(--success)' : (result.quality_score || 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {result.quality_score || 0}%
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyResultJson}
                  className="p-2.5 rounded-xl btn-spring flex items-center gap-1 text-xs"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                  title="Copy Extracted JSON"
                >
                  {copied ? <CheckCheck size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="p-2.5 rounded-xl btn-spring flex items-center gap-1 text-xs"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: showRawJson ? 'var(--accent)' : 'var(--text-secondary)' }}
                  title="Toggle Raw JSON"
                >
                  <Code2 size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="progress-bar">
            <div style={{ width: `${result.quality_score || 0}%`, background: (result.quality_score || 0) >= 80 ? 'var(--success)' : (result.quality_score || 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }} />
          </div>

          {/* Degraded Alert */}
          {isDegraded && (
            <div className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--warning)' }}>Schema Degradation Detected</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Target page markup changed or missing required fields.</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('repair')}
                className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 btn-spring"
                style={{ background: 'var(--warning)', color: '#000' }}
              >
                <Wrench size={13} />
                <span>Open Repair Center</span>
              </button>
            </div>
          )}

          {/* Extracted Product Showcase Card */}
          {extracted.title && (
            <div className="p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
              <div className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  {extracted.seller ? `Source: ${extracted.seller}` : 'Extracted Item'}
                </div>
                <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{extracted.title}</div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="px-2 py-0.5 rounded font-semibold text-[11px]" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                    {extracted.availability || 'Available'}
                  </span>
                  {extracted.rating && <span>★ {extracted.rating} ({extracted.review_count || 100} reviews)</span>}
                </div>
              </div>

              {extracted.price && (
                <div className="text-right">
                  <div className="text-2xl font-bold mono" style={{ color: 'var(--success)' }}>
                    {extracted.currency === 'INR' ? '₹' : '$'}{extracted.price?.toLocaleString()}
                  </div>
                  <span className="text-[10px] mono uppercase" style={{ color: 'var(--text-tertiary)' }}>{extracted.currency || 'INR'}</span>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON View (if toggled) */}
          {showRawJson && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase font-semibold mono" style={{ color: 'var(--accent)' }}>Raw Extracted Payload JSON</div>
              <pre className="p-4 rounded-xl text-xs mono overflow-x-auto leading-relaxed" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                {JSON.stringify(extracted, null, 2)}
              </pre>
            </div>
          )}

          {/* Normalized Attributes Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider flex items-center justify-between" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              <span>Normalized Schema Attributes</span>
              <span className="mono text-[10px] font-normal" style={{ color: 'var(--text-tertiary)' }}>Schema: Products</span>
            </div>
            {Object.entries(extracted).filter(([k]) => k !== '__label__').map(([key, val], i) => (
              <div
                key={key}
                className="flex items-center justify-between px-4 py-3 text-xs"
                style={{
                  background: i % 2 === 0 ? 'var(--bg-root)' : 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <span className="mono text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>{key}</span>
                <span className="mono text-right max-w-[65%] truncate font-medium" style={{ color: val !== null ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {val !== null ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
