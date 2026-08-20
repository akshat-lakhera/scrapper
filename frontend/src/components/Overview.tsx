import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  ShoppingBag, 
  Briefcase, 
  Wrench, 
  ShieldCheck, 
  Zap, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Terminal, 
  Database, 
  MessageCircle, 
  MapPin, 
  Code2, 
  Clock, 
  ArrowRight,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  Send,
  History,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Cpu,
  Network,
  Share2
} from 'lucide-react';
import type { Metrics, ConfigModeResponse, ScrapeRun } from '../types';
import { fetchMetrics, fetchRuns, executeScrape, batchScrape, simulateDrift, getExportUrl, crawlRecursive } from '../api';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';
import { CountUp } from './effects/CountUp';
import { SpotlightCard } from './effects/SpotlightCard';
import { ScrambleText } from './effects/ScrambleText';

interface OverviewProps {
  configMode: ConfigModeResponse | null;
  setActiveTab: (tab: string) => void;
}

const PLATFORMS = [
  { id: 'products', name: 'Amazon E-Commerce', icon: ShoppingBag, tag: 'Retail', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
  { id: 'tech_docs', name: 'Tech Docs & APIs', icon: Code2, tag: 'API Guides', url: 'https://fastapi.tiangolo.com/' },
  { id: 'linkedin', name: 'LinkedIn Talent', icon: Briefcase, tag: 'Profiles', url: 'https://www.linkedin.com/in/codingstark/' },
  { id: 'x', name: 'X (Twitter)', icon: MessageCircle, tag: 'Social Pulse', url: 'https://x.com/konig0000/status/2089565885149466685?s=20' },
  { id: 'jobs', name: 'Job Openings', icon: Briefcase, tag: 'Careers', url: 'https://jobs.lever.co/stripe/staff-backend-engineer' },
  { id: 'instagram', name: 'Instagram Creators', icon: Camera, tag: 'Influencers', url: 'https://www.instagram.com/cristiano/' },
  { id: 'reddit', name: 'Reddit Discussions', icon: MessageCircle, tag: 'Communities', url: 'https://www.reddit.com/r/battlefield2042/comments/1cmqs1d/official_update_on_the_next_battlefield_game/' },
  { id: 'google_maps', name: 'Google Maps Places', icon: MapPin, tag: 'Local POI', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/' },
];

export const Overview: React.FC<OverviewProps> = ({ configMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [activePlatform, setActivePlatform] = useState(PLATFORMS[0]);
  const [urlInput, setUrlInput] = useState(PLATFORMS[0].url);
  const [scrapeMode, setScrapeMode] = useState<'single' | 'batch' | 'crawl'>('single');
  const [batchUrls, setBatchUrls] = useState(
    "https://www.amazon.com/dp/B09XS7JWHH\nhttps://fastapi.tiangolo.com/\nhttps://requests.readthedocs.io/en/latest/"
  );
  const [crawlDepth, setCrawlDepth] = useState<number>(2);
  const [crawlMaxPages, setCrawlMaxPages] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [simulatingDrift, setSimulatingDrift] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [driftResult, setDriftResult] = useState<any>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeView, setActiveView] = useState<'card' | 'json'>('card');
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [m, r] = await Promise.all([fetchMetrics(), fetchRuns()]);
      if (m) setMetrics(m);
      if (r) setRecentRuns(r.slice(0, 8));
    } catch (e) {
      console.error('Failed to load data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlatform = (p: typeof PLATFORMS[0]) => {
    setActivePlatform(p);
    setUrlInput(p.url);
    setExtractedResult(null);
  };

  const handleExecuteLiveScrape = async () => {
    if (scrapeMode === 'crawl') {
      if (!urlInput.trim()) return;
      setLoading(true);
      setCrawlResult(null);
      setExtractedResult(null);
      try {
        showToast('info', 'Starting Deep Crawl', `Traversing links up to depth ${crawlDepth} on ${urlInput.substring(0, 35)}...`);
        const res = await crawlRecursive({
          start_url: urlInput.trim(),
          workflow_type: activePlatform.id,
          max_depth: crawlDepth,
          max_pages: crawlMaxPages,
        });
        setCrawlResult(res);
        showToast('success', 'Deep Crawl Complete', `Traversed ${res.total_pages_crawled} pages & discovered ${res.total_links_discovered} links`);
        if (res.crawled_pages && res.crawled_pages.length > 0) {
          setExtractedResult(res.crawled_pages[0]);
        }
        loadData();
      } catch (e: any) {
        showToast('error', 'Deep Crawl Failed', e.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (scrapeMode === 'batch') {
      const urls = batchUrls.split('\n').map(u => u.trim()).filter(Boolean);
      if (!urls.length) return;
      setLoading(true);
      setExtractedResult(null);
      try {
        showToast('info', 'Batch Scraping', `Extracting ${urls.length} targets concurrently...`);
        const res = await batchScrape({ urls, workflow_type: activePlatform.id });
        showToast('success', 'Batch Complete', `Extracted ${res.successful}/${res.total_targets} targets`);
        if (res.results && res.results.length > 0) {
          setExtractedResult(res.results[0]);
        }
        loadData();
      } catch (e: any) {
        showToast('error', 'Batch Execution Failed', e.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!urlInput.trim()) return;
    setLoading(true);
    setExtractedResult(null);
    try {
      showToast('info', 'Deploying Agent', `Connecting to target: ${urlInput.substring(0, 40)}...`);
      const res = await executeScrape({
        target_url: urlInput.trim(),
        workflow_type: activePlatform.id,
        schema_name: activePlatform.id,
      });
      setExtractedResult(res);
      if (res.status === 'success' || res.status === 'repaired') {
        showToast('success', 'Extraction Complete', `Payload verified at ${res.quality_score}% data quality`);
      } else {
        showToast('warning', 'Structural Drift Detected', 'Routed to Self-Healing Lab for automated patch');
      }
      loadData();
    } catch (e: any) {
      showToast('error', 'Extraction Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDrift = async () => {
    setSimulatingDrift(true);
    setDriftResult(null);
    try {
      showToast('warning', 'DOM Drift Injected', 'Simulating broken legacy layout on product target...');
      const res = await simulateDrift({ fixture_target: 'product_broken.html' });
      setDriftResult(res);
      setExtractedResult({
        target_url: 'https://demo.local/product_broken.html',
        status: res.status,
        quality_score: res.quality_score,
        duration_ms: 18,
        selected_strategy: res.selected_strategy,
        extracted_data: res.extracted_data
      });
      showToast('success', 'Auto-Healed to v2', `Autonomous patch promoted with ${res.patch_details?.confidence_score * 100}% confidence!`);
      loadData();
    } catch (e: any) {
      showToast('error', 'Drift Simulation Failed', e.message);
    } finally {
      setSimulatingDrift(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedResult) return;
    navigator.clipboard.writeText(JSON.stringify(extractedResult.extracted_data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    showToast('info', 'Copied JSON', 'Structured payload copied to clipboard');
  };

  const handleExport = (format: 'json' | 'csv' | 'ndjson') => {
    window.open(getExportUrl(format), '_blank');
    showToast('info', 'Export Started', `Downloading extracted records in ${format.toUpperCase()} format`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── [01 // CONTROL DECK] WORKSPACE EXECUTION CONTROLS ── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#090c14] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400 font-bold tracking-wider">
            [01 // CONTROL DECK]
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setScrapeMode('single')}
              className={`tactile-press px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                scrapeMode === 'single' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              Single Target
            </button>
            <button
              onClick={() => setScrapeMode('batch')}
              className={`tactile-press px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scrapeMode === 'batch' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Multi-URL</span>
            </button>
            <button
              onClick={() => setScrapeMode('crawl')}
              className={`tactile-press px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scrapeMode === 'crawl' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>🕸️ Deep Crawler</span>
            </button>
          </div>
        </div>

        {/* Action Trigger: Autonomous Drift Simulator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateDrift}
            disabled={simulatingDrift}
            className="tactile-press px-3.5 py-1.5 rounded-xl bg-[#121728] hover:bg-[#1a2238] border border-white/20 hover:border-amber-400/50 text-slate-200 hover:text-amber-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Simulate upstream DOM breaking changes and trigger autonomous selector synthesis"
          >
            <Wrench className={`w-3.5 h-3.5 text-amber-400 ${simulatingDrift ? 'animate-spin' : ''}`} />
            <span>{simulatingDrift ? 'Synthesizing...' : '⚡ Simulate DOM Drift'}</span>
          </button>
        </div>
      </div>

      {/* ── DEEP CRAWLER RESULTS ACCORDION (Shown if crawl executed) ── */}
      {crawlResult && (
        <SpotlightCard className="enter-fade-up p-6 border-purple-500/30 bg-purple-950/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recursive Link Discovery & Deep Crawl Summary</h3>
                <span className="text-xs font-mono text-purple-300">
                  Traversed {crawlResult.total_pages_crawled} Pages (Depth: {crawlResult.max_depth}) · Discovered {crawlResult.total_links_discovered} Canonical Links
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              {crawlResult.successful_extractions} Extracted Successfully
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto font-mono text-xs">
            {crawlResult.crawled_pages?.map((p: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/15 transition-colors">
                <div className="overflow-hidden mr-2">
                  <span className="text-[10px] text-purple-400 font-bold block">Depth {p.depth}</span>
                  <span className="text-slate-200 truncate block text-[11px]">{p.url}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-400 font-bold text-[11px]">{p.quality_score}%</span>
                  <span className="text-[10px] text-slate-500 block">{p.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      )}

      {/* ── DRIFT SIMULATION HIGHLIGHT CARD (Shown if drift simulated) ── */}
      {driftResult && (
        <SpotlightCard className="enter-fade-up p-6 border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Autonomous Hot-Patch Promoted (v{driftResult.patch_details?.from_version} → v{driftResult.patch_details?.to_version})</h3>
                <span className="text-xs font-mono text-amber-400">Confidence Score: {(driftResult.patch_details?.confidence_score * 100).toFixed(0)}% · 0% Human Intervention</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('repair')}
              className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View in Self-Healing Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">Broken Legacy Selectors:</span>
              <div className="space-y-1 text-slate-400">
                {driftResult.patch_details?.broken_fields?.map((bf: string) => (
                  <div key={bf} className="flex items-center gap-2">
                    <span className="text-rose-400">✗</span>
                    <span>{bf}: .product-price (Deprecated / Drifted)</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Promoted Hot-Patch Selectors:</span>
              <div className="space-y-1 text-slate-300">
                {Object.entries(driftResult.patch_details?.selector_diff || {}).map(([f, sel]: any) => {
                  const selText = typeof sel === 'object' && sel !== null
                    ? (sel.new_selector || sel.selector || JSON.stringify(sel))
                    : String(sel);
                  return (
                    <div key={f} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{f}: <strong className="text-emerald-300">{typeof selText === 'object' ? JSON.stringify(selText) : String(selText)}</strong></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* ── MAIN BENTO GRID ARCHITECTURE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── CELL 1: HERO EXTRACTION SANDBOX (Span 8 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-8 p-7 sm:p-9 flex flex-col justify-between min-h-[380px] relative">
          <div className="space-y-6">
            {/* Header with System Ready Pill & Swiss Coordinate */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                    [02 // INGESTION SANDBOX]
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">SCHEMAS: 8 ACTIVE</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <span>
                    {scrapeMode === 'crawl' ? 'Autonomous Recursive Deep Crawler' : (scrapeMode === 'batch' ? 'Batch Multi-Target Scraper' : 'Live Extraction Sandbox')}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {scrapeMode === 'crawl' ? 'Discovers pagination and child entity links, extracting structured data across tree nodes.' : (scrapeMode === 'batch' ? 'Execute concurrent extractions across multiple target URLs.' : 'Configure target URL and platform schema for immediate agent deployment.')}
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold shrink-0 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot-emerald animate-pulse" />
                <ScrambleText text="SYSTEM READY" speed={40} />
              </div>
            </div>

            {/* Target URL Omnibar / Batch Textarea */}
            {scrapeMode === 'batch' ? (
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400">Enter Target URLs (One URL per line):</label>
                <textarea
                  rows={4}
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  className="w-full bg-[#090c13] border border-white/15 text-white font-mono text-xs sm:text-sm p-4 rounded-xl focus:border-blue-500 focus:outline-none transition-colors shadow-inner"
                  placeholder="https://example.com/target1&#10;https://example.com/target2"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter target URL (Amazon, LinkedIn, X, Lever, Docs, Reddit, Maps)..."
                    className="w-full bg-[#080b12] border border-white/20 text-white font-mono text-sm sm:text-base py-4 pl-4 pr-36 rounded-xl focus:border-blue-400 focus:outline-none transition-colors shadow-inner"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 pointer-events-none shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span>{activePlatform.tag}</span>
                  </span>
                </div>

                {scrapeMode === 'crawl' && (
                  <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-black/40 border border-purple-500/20 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">Max Crawl Depth:</span>
                      <select
                        value={crawlDepth}
                        onChange={(e) => setCrawlDepth(Number(e.target.value))}
                        className="bg-[#090c13] border border-white/15 rounded px-2 py-1 text-white focus:outline-none"
                      >
                        <option value={1}>1 (Current Page Links)</option>
                        <option value={2}>2 (Deep Pagination & Children)</option>
                        <option value={3}>3 (Exhaustive Tree)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">Max Pages Limit:</span>
                      <select
                        value={crawlMaxPages}
                        onChange={(e) => setCrawlMaxPages(Number(e.target.value))}
                        className="bg-[#090c13] border border-white/15 rounded px-2 py-1 text-white focus:outline-none"
                      >
                        <option value={3}>3 Pages</option>
                        <option value={5}>5 Pages</option>
                        <option value={10}>10 Pages</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Platform Source Chips */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider block">
                  Target Protocol & Schema Presets:
                </span>
                <span className="text-[11px] font-mono text-slate-400">8 Supported Schemas</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = activePlatform.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPlatform(p)}
                      className={`tactile-press px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 border cursor-pointer ${
                        isSelected
                          ? 'border-blue-400 bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30 scale-[1.02]'
                          : 'border-white/20 bg-[#121728] text-slate-100 hover:text-white hover:bg-[#1c2742] hover:border-blue-400/60 font-semibold shadow-sm'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-medium">
              Provider: Bright Data Scraper Studio & Datasets v3
            </span>

            <button
              onClick={handleExecuteLiveScrape}
              disabled={loading || (scrapeMode !== 'batch' && !urlInput.trim())}
              className={`btn-pulse tactile-press px-8 py-3.5 rounded-xl text-white font-bold text-sm flex items-center gap-2.5 shadow-xl transition-all disabled:opacity-50 cursor-pointer ${
                scrapeMode === 'crawl' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
              }`}
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {scrapeMode === 'crawl' ? 'Crawling Tree Nodes...' : (scrapeMode === 'batch' ? 'Extracting Batch...' : 'Executing Scraper...')}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {scrapeMode === 'crawl' ? 'Launch Deep Crawler' : (scrapeMode === 'batch' ? 'Deploy Batch Pipeline' : 'Deploy Agent')}
                  </span>
                  <Send className="w-4 h-4" />
                  <kbd className="kbd-badge bg-white/15 text-white border-white/25 ml-1 text-[9px] py-0.5 px-1.5">↵</kbd>
                </>
              )}
            </button>
          </div>
        </SpotlightCard>

        {/* ── CELL 2: EXTRACTION AUDIT STREAM / PRE-FLIGHT BLUEPRINT (Span 4 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-4 p-0 flex flex-col justify-between min-h-[380px] relative">
          <div className="p-4 border-b border-white/10 bg-[#0f1422] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-300 font-bold">
                [03]
              </span>
              <History className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white font-mono">Telemetry Feed</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#090c13] border border-white/15 rounded-lg px-2 py-0.5 text-xs font-mono shadow-inner">
                <span className="text-slate-400 text-[10px] mr-1 font-semibold">Export:</span>
                <button
                  onClick={() => handleExport('json')}
                  className="px-1.5 py-0.5 rounded hover:bg-white/10 text-slate-200 hover:text-white text-[10px] font-medium cursor-pointer"
                  title="Export raw JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-1.5 py-0.5 rounded hover:bg-white/10 text-emerald-300 hover:text-emerald-200 text-[10px] font-medium cursor-pointer"
                  title="Export CSV spreadsheet"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('ndjson')}
                  className="px-1.5 py-0.5 rounded hover:bg-white/10 text-cyan-300 hover:text-cyan-200 text-[10px] font-medium cursor-pointer"
                  title="Export NDJSON stream"
                >
                  NDJSON
                </button>
              </div>

              <button
                onClick={() => setActiveTab('runs')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                title="View full audit log"
              >
                <span>Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-3 font-mono text-xs max-h-[340px]">
            {recentRuns.length > 0 ? (
              recentRuns.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-lg bg-[#090c13] border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-slate-300 font-bold">#{r.id}</span>
                    <StatusBadge status={r.status} />
                    <span className="text-slate-100 truncate max-w-[140px] text-[11px] font-medium">{r.target_url}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-emerald-400 font-bold block">{r.data_quality_score}%</span>
                    <span className="text-[10px] text-slate-300">{r.duration_ms}ms</span>
                  </div>
                </div>
              ))
            ) : (
              /* Rich Interactive Architecture Blueprint & Pre-flight Guide */
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>Engine Pre-Flight Readiness</span>
                  </div>
                  
                  <div className="space-y-2 text-[11px] text-slate-200 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Active Provider:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Bright Data Datasets v3
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Schema Contracts:</span>
                      <span className="text-slate-100 font-bold">8 Strict Pydantic</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Self-Healing Watcher:</span>
                      <span className="text-amber-300 font-bold">Auto-Drift Armed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Living RAG Copilot:</span>
                      <span className="text-cyan-300 font-bold">Llama-70B Ready</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Quick Sample Launchers:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[0])}
                      className="p-2.5 rounded-lg bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                        <span>Amazon Sony WH-1000XM5</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[1])}
                      className="p-2.5 rounded-lg bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>FastAPI Python Framework Docs</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[2])}
                      className="p-2.5 rounded-lg bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                        <span>LinkedIn Executive Profile</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 border-t border-white/10 bg-[#090c13] text-xs font-mono text-slate-300 flex items-center justify-between">
            <span>Cluster Status: <strong className="text-emerald-400 font-bold">NORMAL</strong></span>
            <span>WAL Mode: <strong className="text-white font-bold">ACTIVE</strong></span>
          </div>
        </SpotlightCard>

        {/* ── CELL 3: 5-STAGE PIPELINE WATERFALL (Span 12 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-12 p-6 sm:p-8 space-y-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                [04 // WATERFALL CASCADE]
              </span>
              <Terminal className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Multi-Strategy Pipeline Waterfall
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {loading ? 'STATUS: EXECUTING LIVE' : (extractedResult ? 'STATUS: EXTRACTION COMPLETE' : 'STATUS: STANDBY')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border transition-all ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/20 text-slate-100')
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">01 CRAWL</span>
                <span className="text-[10px] text-slate-100 bg-white/15 px-2 py-0.5 rounded-full font-bold border border-white/10">Bright Data</span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">Scraper Studio / Datasets v3</p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border transition-all ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/20 text-slate-100')
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">02 FINGERPRINT</span>
                <span className="text-[10px] text-slate-100 bg-white/15 px-2 py-0.5 rounded-full font-bold border border-white/10">DOM Hash</span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">Skeleton Template Signature</p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border transition-all ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/20 text-slate-100')
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">03 EXTRACT</span>
                <span className="text-[10px] text-cyan-200 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-full font-bold truncate max-w-[85px]">{extractedResult?.selected_strategy || 'Waterfall'}</span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">JSON-LD / Rules / Heuristics</p>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-xl border transition-all ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/20 text-slate-100')
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">04 VALIDATE</span>
                <span className="text-[10px] text-emerald-200 bg-emerald-950/80 border border-emerald-400/50 px-2 py-0.5 rounded-full font-bold">{extractedResult ? `${extractedResult.quality_score}%` : 'Pydantic'}</span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">Quality Gating & Null Checks</p>
            </div>

            {/* Step 5 */}
            <div className={`p-4 rounded-xl border transition-all ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult?.status === 'repaired' ? 'bg-amber-500/25 border-amber-400 text-amber-100' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/20 text-slate-100'))
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-white text-sm">05 DELIVER</span>
                <span className="text-[10px] text-slate-100 bg-white/15 px-2 py-0.5 rounded-full font-bold border border-white/10">{extractedResult?.status === 'repaired' ? 'Auto-Healed' : 'Clean'}</span>
              </div>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed">Living RAG & DB Ingestion</p>
            </div>
          </div>

          {/* ── WATERFALL LIVE TELEMETRY & THROUGHPUT DOCK (Balances Bottom Right) ── */}
          <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot-emerald animate-pulse" />
                <span>5-STAGE CASCADE ARMED</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-200">
                Fallback Cascade: <span className="text-blue-300 font-medium">Rules → JSON-LD → Meta → Heuristics → Groq Llama-70B</span>
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="text-slate-300">
                Avg Latency: <strong className="text-white font-bold">{metrics?.avg_duration_ms ? Math.round(metrics.avg_duration_ms) : 18}ms</strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <div className="flex items-center gap-1 text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                <span>Provider: Bright Data Datasets v3 / Studio</span>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* ── CELL 4: 4 PRECISION METRIC CARDS WITH PROGRESS ARCS (Span 12 cols) ── */}
        <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <SpotlightCard className="p-6 flex items-center justify-between relative">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">01</span>
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Data Reliability</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                <CountUp 
                  end={
                    metrics?.overall_reliability !== undefined 
                      ? Math.round(metrics.overall_reliability) 
                      : (recentRuns.length > 0 
                          ? Math.round((recentRuns.filter(r => r.status === 'success' || r.status === 'repaired').length / recentRuns.length) * 100)
                          : 100)
                  } 
                  suffix="%" 
                />
              </div>
              <span className="text-[11px] text-slate-400 block">Pydantic validation rate</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400 progress-ring-circle"
                  strokeDasharray={`${metrics?.overall_reliability || 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <ShieldCheck className="w-5 h-5 text-emerald-400 absolute" />
            </div>
          </SpotlightCard>

          {/* Card 2 */}
          <SpotlightCard className="p-6 flex items-center justify-between relative">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">02</span>
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Mean Speed</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                <CountUp 
                  end={
                    metrics?.avg_duration_ms !== undefined && metrics.avg_duration_ms > 0
                      ? Math.round(metrics.avg_duration_ms) 
                      : (metrics?.average_latency_ms !== undefined && metrics.average_latency_ms > 0
                          ? Math.round(metrics.average_latency_ms)
                          : (recentRuns.length > 0 
                              ? Math.round(recentRuns.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / recentRuns.length)
                              : 18))
                  } 
                />
                <span className="text-base text-blue-400 font-normal">ms</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Average execution latency</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-400 progress-ring-circle"
                  strokeDasharray="80, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Zap className="w-5 h-5 text-blue-400 absolute" />
            </div>
          </SpotlightCard>

          {/* Card 3 */}
          <SpotlightCard className="p-6 flex items-center justify-between relative">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">03</span>
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Self-Healing Rate</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                <CountUp 
                  end={
                    metrics?.healing_success_rate !== undefined 
                      ? Math.round(metrics.healing_success_rate) 
                      : ((metrics?.repair_metrics as any)?.same_template_repair_success_rate !== undefined
                          ? Math.round((metrics?.repair_metrics as any).same_template_repair_success_rate)
                          : 100)
                  } 
                  suffix="%" 
                />
              </div>
              <span className="text-[11px] text-slate-400 block">Holdout validated (≥ 70%)</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-amber-400 progress-ring-circle"
                  strokeDasharray={`${metrics?.healing_success_rate || 100}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Wrench className="w-5 h-5 text-amber-400 absolute" />
            </div>
          </SpotlightCard>

          {/* Card 4 */}
          <SpotlightCard className="p-6 flex items-center justify-between relative">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">04</span>
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Rule Bundles</span>
              </div>
              <div className="text-3xl font-extrabold font-mono text-white">
                <CountUp 
                  end={
                    metrics?.template_count ?? 
                    (metrics?.repair_metrics as any)?.template_count ?? 
                    (metrics?.repair_metrics as any)?.active_rule_bundles ?? 
                    7
                  } 
                />
              </div>
              <span className="text-[11px] text-slate-400 block">DOM Hash Keyed</span>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400 progress-ring-circle"
                  strokeDasharray="70, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Database className="w-5 h-5 text-cyan-400 absolute" />
            </div>
          </SpotlightCard>
        </div>

        {/* ── CELL 5: DUAL-VIEW ENTITY INSPECTOR (Span 12 cols) ── */}
        {extractedResult && (
          <SpotlightCard className="col-span-1 lg:col-span-12 p-6 sm:p-8 space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 font-bold tracking-wider">
                  [05 // PAYLOAD INSPECTOR]
                </span>
                <StatusBadge status={extractedResult.status} />
                <div>
                  <h3 className="text-lg font-bold text-white">Extracted Entity Payload</h3>
                  <span className="text-xs font-mono text-slate-400">
                    Quality: <strong className="text-emerald-400">{extractedResult.quality_score}%</strong> · Latency: <strong className="text-white">{extractedResult.duration_ms}ms</strong> · Strategy: <strong className="text-cyan-400">{extractedResult.selected_strategy || extractedResult.strategy}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#090c13] p-1 rounded-lg border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActiveView('card')}
                    className={`tactile-press px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Visual Card
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`tactile-press px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="tactile-press flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            {activeView === 'card' ? (
              <div key="card" className="crossfade-view bg-[#090c13] border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                  {/* Product Image Preview */}
                  {(extractedResult.extracted_data?.image_url || extractedResult.extracted_data?.image) && (
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-black/60 border border-white/15 p-2 flex items-center justify-center shrink-0 overflow-hidden group shadow-lg">
                      <img
                        src={extractedResult.extracted_data.image_url || extractedResult.extracted_data.image}
                        alt={extractedResult.extracted_data?.title || 'Product'}
                        className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1 max-w-2xl">
                    <h4 className="text-xl font-bold text-white leading-snug">
                      {extractedResult.extracted_data?.title || extractedResult.extracted_data?.name || extractedResult.extracted_data?.job_title || extractedResult.extracted_data?.doc_title || 'Extracted Web Entity'}
                    </h4>
                    <a
                      href={extractedResult.target_url || extractedResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <span>{extractedResult.target_url || extractedResult.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {extractedResult.extracted_data?.price !== undefined && (
                    <div className="text-left sm:text-right shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-xl">
                      <span className="text-2xl font-extrabold font-mono text-emerald-400 block">
                        {extractedResult.extracted_data?.currency || '$'} {extractedResult.extracted_data?.price}
                      </span>
                      {extractedResult.extracted_data?.availability && (
                        <span className="text-xs font-mono text-slate-300">
                          {extractedResult.extracted_data?.availability}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-white/10 font-mono text-xs">
                  {Object.entries(extractedResult.extracted_data || {}).map(([key, value]) => {
                    if (key.includes('_url') || key === 'title' || key === 'price' || !value) return null;
                    return (
                      <div key={key} className="p-3.5 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{key}</span>
                        <span className="text-slate-200 truncate block text-sm">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <pre className="p-6 rounded-xl bg-[#090c13] border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(extractedResult.extracted_data, null, 2)}
              </pre>
            )}
          </SpotlightCard>
        )}
      </div>

      {/* ── SUBTLE PANEL CLOSURE LINE ── */}
      <div className="w-full pt-4 border-b border-white/[0.08]" />
    </div>
  );
};
