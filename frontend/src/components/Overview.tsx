import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Share2,
  Maximize2,
  X,
  FileCode,
  Grid,
  List
} from 'lucide-react';
import type { Metrics, ConfigModeResponse, ScrapeRun } from '../types';
import { fetchMetrics, fetchRuns, fetchRunDetails, executeScrape, batchScrape, simulateDrift, getExportUrl, crawlRecursive } from '../api';
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
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<{ key: string; value: any } | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'overview' | 'items' | 'headings' | 'code' | 'bullets' | 'images' | 'json'>('overview');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedFlashcard) {
          setSelectedFlashcard(null);
        } else if (isInspectModalOpen) {
          setIsInspectModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInspectModalOpen, selectedFlashcard]);

  const handleSelectPlatform = (p: typeof PLATFORMS[0]) => {
    setActivePlatform(p);
    setUrlInput(p.url);
    setExtractedResult(null);
  };

  const handleInspectRun = async (r: ScrapeRun) => {
    try {
      showToast('info', 'Loading Run Details', `Inspecting Trace #${r.id}...`);
      const details = await fetchRunDetails(r.id);
      setExtractedResult({
        status: details.status,
        quality_score: details.data_quality_score,
        target_url: details.target_url,
        url: details.target_url,
        selected_strategy: details.selected_strategy,
        duration_ms: details.duration_ms,
        extracted_data: details.normalized_result || details.raw_result || {}
      });
      setIsInspectModalOpen(true);
    } catch (e: any) {
      showToast('error', 'Failed to Inspect Run', e.message);
    }
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
      {/* ── Control Deck: Workspace Execution Controls ── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-[#090c14] border border-white/10 shadow-xl w-full">
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center text-xs font-mono text-slate-300 font-bold">
            <span className="text-blue-400 font-mono mr-1">01.</span> Control Deck
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setScrapeMode('single')}
              className={`tactile-press px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                scrapeMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              Single Target
            </button>
            <button
              onClick={() => setScrapeMode('batch')}
              className={`tactile-press px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scrapeMode === 'batch' ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Multi-URL</span>
            </button>
            <button
              onClick={() => setScrapeMode('crawl')}
              className={`tactile-press px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scrapeMode === 'crawl' ? 'bg-purple-600 text-white shadow-sm' : 'bg-[#121728] text-slate-200 border border-white/15 hover:bg-[#1a2238] hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Deep Crawler</span>
            </button>
          </div>
        </div>

        {/* Action Trigger: Autonomous Drift Simulator (Aligned flush with right grid boundary) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateDrift}
            disabled={simulatingDrift}
            className="tactile-press px-4 py-2 rounded-xl bg-[#121728] hover:bg-[#1a2238] border border-white/15 hover:border-amber-400/50 text-slate-200 hover:text-amber-300 text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Simulate upstream DOM breaking changes and trigger autonomous selector synthesis"
          >
            <Wrench className={`w-3.5 h-3.5 text-amber-400 ${simulatingDrift ? 'animate-spin' : ''}`} />
            <span>{simulatingDrift ? 'Synthesizing...' : 'Simulate DOM Drift'}</span>
          </button>
        </div>
      </div>

      {/* ── Deep Crawler Results Accordion ── */}
      {crawlResult && (
        <SpotlightCard className="enter-fade-up p-6 border-purple-500/30 bg-purple-950/10 space-y-4 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-sans">Recursive Link Discovery & Deep Crawl Summary</h2>
                <span className="text-xs font-mono text-purple-300">
                  Traversed {crawlResult.total_pages_crawled} Pages (Depth: {crawlResult.max_depth}) · Discovered {crawlResult.total_links_discovered} Canonical Links
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              {crawlResult.successful_extractions} Extracted Successfully
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto font-mono text-xs">
            {crawlResult.crawled_pages?.map((p: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-white/20 transition-colors">
                <div className="overflow-hidden mr-2">
                  <span className="text-xs text-purple-400 font-bold block">Depth {p.depth}</span>
                  <span className="text-slate-200 break-words block text-xs">{p.url}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-emerald-400 font-bold text-xs">{p.quality_score}%</span>
                  <span className="text-xs text-slate-400 block">{p.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      )}

      {/* ── Drift Simulation Highlight Card ── */}
      {driftResult && (
        <SpotlightCard className="enter-fade-up p-6 border-amber-500/30 bg-amber-950/10 space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-sans">Autonomous Hot-Patch Promoted (v{driftResult.patch_details?.from_version} → v{driftResult.patch_details?.to_version})</h2>
                <span className="text-xs font-mono text-amber-400">Confidence Score: {(driftResult.patch_details?.confidence_score * 100).toFixed(0)}% · 0% Human Intervention</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('repair')}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer font-semibold"
            >
              <span>View in Self-Healing Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-rose-400 font-bold block mb-1">Broken Legacy Selectors:</span>
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
              <span className="text-xs text-emerald-400 font-bold block mb-1">Promoted Hot-Patch Selectors:</span>
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

      {/* ── Main Bento Grid Architecture ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── CELL 1: Live Extraction Sandbox (Span 8 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-8 p-7 sm:p-8 flex flex-col justify-between min-h-[380px] relative rounded-2xl">
          <div className="space-y-6">
            {/* Header with System Ready Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-400">8 active schemas</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Globe className="w-6 h-6 text-blue-400" />
                  <span className="text-blue-400 font-mono text-lg font-bold">02.</span>
                  <span>
                    {scrapeMode === 'crawl' ? 'Autonomous Recursive Deep Crawler' : (scrapeMode === 'batch' ? 'Batch Multi-Target Scraper' : 'Live Extraction Sandbox')}
                  </span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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
                <label className="text-xs font-mono text-slate-300 font-medium">Enter Target URLs (One URL per line):</label>
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
                    className="w-full h-11 bg-[#080b12] border border-white/20 text-white font-mono text-sm pl-4 pr-36 rounded-xl focus:border-blue-400 focus:outline-none transition-colors shadow-inner"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/40 pointer-events-none shadow-sm flex items-center gap-1.5">
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
                        className="bg-[#090c13] border border-white/15 rounded-lg px-2.5 py-1 text-white focus:outline-none text-xs font-mono"
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
                        className="bg-[#090c13] border border-white/15 rounded-lg px-2.5 py-1 text-white focus:outline-none text-xs font-mono"
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
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  Target Protocol & Schema Presets:
                </span>
                <span className="text-xs font-mono text-slate-400">8 Supported Schemas</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = activePlatform.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPlatform(p)}
                      className={`tactile-press px-3.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border cursor-pointer ${
                        isSelected
                          ? 'border-blue-400 bg-blue-600 text-white font-bold shadow-sm'
                          : 'border-white/15 bg-[#121728] text-slate-200 hover:text-white hover:bg-[#1c2742] hover:border-blue-400/60 font-semibold shadow-sm'
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
          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-mono text-slate-300 font-medium">
              Provider: Bright Data Scraper Studio & Datasets v3
            </span>

            <button
              onClick={handleExecuteLiveScrape}
              disabled={loading || (scrapeMode !== 'batch' && !urlInput.trim())}
              className={`tactile-press px-6 py-2.5 rounded-xl text-white font-bold text-xs font-mono flex items-center gap-2 border border-blue-400/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm ${
                scrapeMode === 'crawl' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'
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
                  <kbd className="kbd-badge bg-white/15 text-white border-white/25 ml-1 text-xs py-0.5 px-1.5">↵</kbd>
                </>
              )}
            </button>
          </div>
        </SpotlightCard>

        {/* ── CELL 2: Telemetry Audit Stream & Pre-Flight Blueprint (Span 4 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-4 p-0 flex flex-col justify-between min-h-[380px] relative rounded-2xl">
          <div className="p-4 border-b border-white/10 bg-[#0f1422] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <span className="text-blue-400 font-mono text-xs">03.</span>
                <span>Telemetry Feed</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400 text-xs font-semibold mr-1">Export:</span>
                <button
                  onClick={() => handleExport('json')}
                  className="h-8 px-2.5 rounded-lg bg-[#121728] hover:bg-blue-600/30 border border-white/15 hover:border-blue-400 text-slate-200 hover:text-white font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  title="Export raw JSON dataset"
                >
                  <Download className="w-3 h-3 text-blue-400" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="h-8 px-2.5 rounded-lg bg-[#121728] hover:bg-emerald-600/30 border border-white/15 hover:border-emerald-400 text-slate-200 hover:text-white font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  title="Export CSV spreadsheet"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExport('ndjson')}
                  className="h-8 px-2.5 rounded-lg bg-[#121728] hover:bg-cyan-600/30 border border-white/15 hover:border-cyan-400 text-slate-200 hover:text-white font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  title="Export NDJSON stream"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>NDJSON</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTab('runs')}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1 cursor-pointer ml-1"
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
                  onClick={() => handleInspectRun(r)}
                  className="p-3.5 rounded-xl bg-[#090c13] border border-white/10 hover:border-blue-500/50 hover:bg-blue-950/20 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
                  title="Click to inspect trace in full-screen modal"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-slate-400 group-hover:text-blue-300 font-bold shrink-0">#{r.id}</span>
                    <StatusBadge status={r.status} />
                    <span className="text-slate-100 group-hover:text-white break-words text-xs font-medium min-w-0 leading-tight">{r.target_url}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold block">{r.data_quality_score}%</span>
                      <span className="text-xs text-slate-400">{r.duration_ms}ms</span>
                    </div>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 opacity-60 group-hover:opacity-100 transition-all" />
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
                  
                  <div className="space-y-2 text-xs text-slate-200 font-mono">
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
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Quick Sample Launchers:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[0])}
                      className="p-3 rounded-xl bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                        <span>Amazon Sony WH-1000XM5</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[1])}
                      className="p-3 rounded-xl bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>FastAPI Python Framework Docs</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => handleSelectPlatform(PLATFORMS[2])}
                      className="p-3 rounded-xl bg-[#121829] hover:bg-[#1a233a] border border-white/15 text-left flex items-center justify-between text-xs text-slate-100 hover:text-white transition-all cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                        <span>LinkedIn Executive Profile</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
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

        {/* ── CELL 3: 5-Stage Multi-Strategy Pipeline Waterfall (Span 12 cols) ── */}
        <SpotlightCard className="col-span-1 lg:col-span-12 p-6 sm:p-8 space-y-6 relative rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span className="text-blue-400 font-mono text-sm font-bold">04.</span>
                <span>Multi-Strategy Pipeline Waterfall</span>
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              {loading ? 'STATUS: EXECUTING LIVE' : (extractedResult ? 'STATUS: EXTRACTION COMPLETE' : 'STATUS: STANDBY')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-mono">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border transition-all space-y-2 ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/15 text-slate-100')
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">01 Crawl</span>
                <span className="text-xs text-slate-200 bg-white/15 px-2 py-0.5 rounded-lg font-bold border border-white/10">Bright Data</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">Scraper Studio / Datasets v3</p>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border transition-all space-y-2 ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/15 text-slate-100')
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">02 Fingerprint</span>
                <span className="text-xs text-slate-200 bg-white/15 px-2 py-0.5 rounded-lg font-bold border border-white/10">DOM Hash</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">Skeleton Template Signature</p>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border transition-all space-y-2 ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/15 text-slate-100')
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">03 Extract</span>
                <span className="text-xs text-cyan-200 bg-cyan-950/80 border border-cyan-400/50 px-2 py-0.5 rounded-lg font-bold break-words">{extractedResult?.selected_strategy || 'Waterfall'}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">JSON-LD / Rules / Heuristics</p>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-xl border transition-all space-y-2 ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/15 text-slate-100')
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">04 Validate</span>
                <span className="text-xs text-emerald-200 bg-emerald-950/80 border border-emerald-400/50 px-2 py-0.5 rounded-lg font-bold">{extractedResult ? `${extractedResult.quality_score}%` : 'Pydantic'}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">Quality Gating & Null Checks</p>
            </div>

            {/* Step 5 */}
            <div className={`p-4 rounded-xl border transition-all space-y-2 ${
              loading ? 'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20' : (extractedResult?.status === 'repaired' ? 'bg-amber-500/25 border-amber-400 text-amber-100' : (extractedResult ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-[#121728] border-white/15 text-slate-100'))
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">05 Deliver</span>
                <span className="text-xs text-slate-200 bg-white/15 px-2 py-0.5 rounded-lg font-bold border border-white/10">{extractedResult?.status === 'repaired' ? 'Auto-Healed' : 'Clean'}</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">Living RAG & DB Ingestion</p>
            </div>
          </div>

          {/* ── Waterfall Live Telemetry & Throughput Dock ── */}
          <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot-emerald animate-pulse" />
                <span>5-Stage Cascade Armed</span>
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
              <div className="flex items-center gap-1 text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg font-bold">
                <span>Provider: Bright Data Datasets v3</span>
              </div>
            </div>
          </div>
        </SpotlightCard>

        {/* ── CELL 4: 4 Precision Metric Cards With Progress Arcs (Span 12 cols) ── */}
        <div className="col-span-1 lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <SpotlightCard className="p-6 flex items-center justify-between relative rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 font-bold">01</span>
                <span className="text-xs font-mono text-slate-300 font-bold">Data Reliability</span>
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
              <span className="text-xs text-slate-400 block">Pydantic validation rate</span>
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
          <SpotlightCard className="p-6 flex items-center justify-between relative rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 font-bold">02</span>
                <span className="text-xs font-mono text-slate-300 font-bold">Mean Speed</span>
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
              <span className="text-xs text-slate-400 block">Average execution latency</span>
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
          <SpotlightCard className="p-6 flex items-center justify-between relative rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 font-bold">03</span>
                <span className="text-xs font-mono text-slate-300 font-bold">Self-Healing Rate</span>
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
              <span className="text-xs text-slate-400 block">Holdout validated (≥ 70%)</span>
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
          <SpotlightCard className="p-6 flex items-center justify-between relative rounded-2xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-slate-300 font-bold">04</span>
                <span className="text-xs font-mono text-slate-300 font-bold">Rule Bundles</span>
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
              <span className="text-xs text-slate-400 block">DOM Hash Keyed</span>
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

        {/* ── CELL 5: Dual-View Entity Inspector (Span 12 cols) ── */}
        {extractedResult && (
          <SpotlightCard className="col-span-1 lg:col-span-12 p-6 sm:p-8 space-y-6 relative rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300 font-bold">
                  05
                </span>
                <StatusBadge status={extractedResult.status} />
                <div>
                  <h2 className="text-base font-bold text-white font-sans">Extracted Entity Payload</h2>
                  <span className="text-xs font-mono text-slate-300">
                    Quality: <strong className="text-emerald-400">{extractedResult.quality_score}%</strong> · Latency: <strong className="text-white">{extractedResult.duration_ms}ms</strong> · Strategy: <strong className="text-cyan-300">{extractedResult.selected_strategy || extractedResult.strategy}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#090c13] p-1 rounded-xl border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActiveView('card')}
                    className={`tactile-press px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${activeView === 'card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    Visual Card
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`tactile-press px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${activeView === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="tactile-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>

            {activeView === 'card' ? (
              <div
                key="card"
                className="crossfade-view bg-[#090c13] border border-white/10 rounded-2xl p-6 space-y-5 relative shadow-lg"
              >
                {/* Floating Expand Full Screen Button */}
                <button
                  type="button"
                  onClick={() => {
                    setModalActiveTab('overview');
                    setIsInspectModalOpen(true);
                  }}
                  className="tactile-press absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md cursor-pointer transition-all active:scale-95"
                  title="Expand Full Screen Media & Entity Inspector"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Full Screen</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pr-32">
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

                  <div className="space-y-1.5 flex-1 max-w-2xl min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-snug group-hover:text-blue-300 transition-colors break-words">
                      {extractedResult.extracted_data?.title || extractedResult.extracted_data?.name || extractedResult.extracted_data?.job_title || extractedResult.extracted_data?.doc_title || 'Extracted Web Entity'}
                    </h3>
                    <a
                      href={extractedResult.target_url || extractedResult.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1.5 break-words"
                    >
                      <span className="break-all">{extractedResult.target_url || extractedResult.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
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

                {/* Attributes Grid of Fixed-Size Flashcards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4 border-t border-white/10 font-mono text-xs">
                  {Object.entries(extractedResult.extracted_data || {}).map(([key, value]) => {
                    if (key.includes('_url') || key === 'title' || key === 'price' || !value || key === 'items') return null;
                    return (
                      <div 
                        key={key} 
                        onClick={() => setSelectedFlashcard({ key, value })}
                        className="h-28 p-3.5 rounded-xl bg-[#080b12] hover:bg-[#101626] border border-white/10 hover:border-blue-400/50 flex flex-col justify-between transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-blue-500/10 relative overflow-hidden"
                        title={`Click to inspect ${key} details`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs text-slate-400 group-hover:text-blue-300 font-bold uppercase tracking-wider truncate">
                            {key}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-blue-400 font-mono flex items-center gap-0.5 shrink-0 font-semibold">
                            Inspect <Maximize2 className="w-3 h-3" />
                          </span>
                        </div>
                        <div className="text-slate-200 text-xs leading-relaxed line-clamp-3 break-words font-mono overflow-hidden">
                          {Array.isArray(value) ? `${value.length} items: [${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}]` : String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-item catalog teaser if present */}
                {extractedResult.extracted_data?.items && extractedResult.extracted_data.items.length > 0 && (
                  <div 
                    onClick={() => {
                      setModalActiveTab('items');
                      setIsInspectModalOpen(true);
                    }}
                    className="pt-2 flex items-center justify-between text-xs font-mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/60 border border-cyan-500/30 px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-cyan-400" />
                      <span>Repeating Catalog Detected: <strong>{extractedResult.extracted_data.items.length} items extracted</strong></span>
                    </div>
                    <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                      <span>View All in Inspector</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <pre className="p-6 rounded-xl bg-[#090c13] border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96 leading-relaxed">
                {JSON.stringify(extractedResult.extracted_data, null, 2)}
              </pre>
            )}
          </SpotlightCard>
        )}
      </div>

      {/* ── SINGLE FLASHCARD DETAIL INSPECTOR MODAL VIA PORTAL ── */}
      {selectedFlashcard && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFlashcard(null);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in font-mono"
        >
          <div className="max-w-3xl w-full max-h-[85vh] bg-[#090d19] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#0d1324] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    {selectedFlashcard.key}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-cyan-300 font-bold">
                      Type: {Array.isArray(selectedFlashcard.value) ? `Array (${selectedFlashcard.value.length} items)` : typeof selectedFlashcard.value}
                    </span>
                    <span>·</span>
                    <span>
                      Length: {typeof selectedFlashcard.value === 'string' ? `${selectedFlashcard.value.length} chars` : `${JSON.stringify(selectedFlashcard.value).length} chars`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = typeof selectedFlashcard.value === 'object' 
                      ? JSON.stringify(selectedFlashcard.value, null, 2) 
                      : String(selectedFlashcard.value);
                    navigator.clipboard.writeText(text);
                    showToast('success', 'Copied', `${selectedFlashcard.key} copied to clipboard`);
                  }}
                  className="tactile-press px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>Copy Value</span>
                </button>
                <button
                  onClick={() => setSelectedFlashcard(null)}
                  className="tactile-press p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-white/15"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#070a13] text-xs">
              <pre className="text-slate-100 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words bg-black/60 p-5 rounded-2xl border border-white/10 max-h-[55vh] overflow-y-auto">
                {typeof selectedFlashcard.value === 'object'
                  ? JSON.stringify(selectedFlashcard.value, null, 2)
                  : String(selectedFlashcard.value)}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0d1324] text-xs text-slate-400 flex items-center justify-between">
              <span>Press <kbd className="kbd-badge bg-white/10 text-white border-white/20">Esc</kbd> or click outside to dismiss</span>
              <button
                onClick={() => setSelectedFlashcard(null)}
                className="tactile-press px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── FULL SCREEN / BIG SCREEN ENTITY INSPECTOR MODAL VIA PORTAL ── */}
      {isInspectModalOpen && extractedResult && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsInspectModalOpen(false);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in font-mono"
        >
          <div className="max-w-6xl w-full max-h-[92vh] bg-[#090d19] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-white/10 bg-[#0d1324] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <StatusBadge status={extractedResult.status} />
                <div className="overflow-hidden">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xl">
                    {extractedResult.extracted_data?.title || extractedResult.extracted_data?.name || extractedResult.extracted_data?.doc_title || 'Entity Inspection'}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold">Quality: {extractedResult.quality_score}%</span>
                    <span>·</span>
                    <span>Strategy: <strong className="text-cyan-300">{extractedResult.selected_strategy || 'multi_strategy'}</strong></span>
                    <span>·</span>
                    <a
                      href={extractedResult.target_url || extractedResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-xs"
                    >
                      <span className="truncate">{extractedResult.target_url || extractedResult.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setIsInspectModalOpen(false)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-white/15"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 py-2.5 border-b border-white/10 bg-[#070a13] flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => setModalActiveTab('overview')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${modalActiveTab === 'overview' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Overview & Fields
              </button>
              {extractedResult.extracted_data?.items && (
                <button
                  onClick={() => setModalActiveTab('items')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${modalActiveTab === 'items' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Catalog Items ({extractedResult.extracted_data.items.length})</span>
                </button>
              )}
              {extractedResult.extracted_data?.all_headings && (
                <button
                  onClick={() => setModalActiveTab('headings')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${modalActiveTab === 'headings' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Headings ({extractedResult.extracted_data.all_headings.length})</span>
                </button>
              )}
              {extractedResult.extracted_data?.code_blocks && (
                <button
                  onClick={() => setModalActiveTab('code')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${modalActiveTab === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Code Blocks ({extractedResult.extracted_data.code_blocks.length})</span>
                </button>
              )}
              {extractedResult.extracted_data?.bullet_points && (
                <button
                  onClick={() => setModalActiveTab('bullets')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${modalActiveTab === 'bullets' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Points ({extractedResult.extracted_data.bullet_points.length})</span>
                </button>
              )}
              {extractedResult.extracted_data?.images && (
                <button
                  onClick={() => setModalActiveTab('images')}
                  className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${modalActiveTab === 'images' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Images ({extractedResult.extracted_data.images.length})</span>
                </button>
              )}
              <button
                onClick={() => setModalActiveTab('json')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${modalActiveTab === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                Complete JSON
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-xs bg-[#090d19]">
              {/* Tab 1: Overview & Fields */}
              {modalActiveTab === 'overview' && (
                <div className="space-y-6">
                  {/* Hero Summary */}
                  <div className="p-6 rounded-2xl bg-[#0e1424] border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block">Primary Entity Title</span>
                      <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                        {extractedResult.extracted_data?.title || extractedResult.extracted_data?.name || extractedResult.extracted_data?.doc_title || 'Extracted Record'}
                      </h2>
                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        {extractedResult.extracted_data?.description || extractedResult.extracted_data?.content_body || 'Full entity metadata extracted with Pydantic validation.'}
                      </p>
                    </div>

                    {extractedResult.extracted_data?.price !== undefined && (
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-right shrink-0">
                        <span className="text-3xl font-extrabold text-emerald-400 block font-mono">
                          {extractedResult.extracted_data?.currency || '$'} {extractedResult.extracted_data?.price}
                        </span>
                        {extractedResult.extracted_data?.availability && (
                          <span className="text-xs text-slate-300 font-bold block mt-1">
                            {extractedResult.extracted_data?.availability}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* All Fields Matrix (Uncut & Un-truncated) */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">All Extracted Attributes</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(extractedResult.extracted_data || {}).map(([k, v]) => {
                        if (['items', 'all_headings', 'code_blocks', 'bullet_points', 'images'].includes(k) || v === null || v === undefined) return null;
                        return (
                          <div key={k} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">{k}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(String(v));
                                  showToast('success', 'Copied', `${k} copied to clipboard`);
                                }}
                                className="text-slate-500 hover:text-white cursor-pointer"
                                title="Copy Value"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-slate-100 text-xs break-words leading-relaxed font-sans max-h-60 overflow-y-auto whitespace-pre-wrap">
                              {String(v)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Catalog Items Grid */}
              {modalActiveTab === 'items' && extractedResult.extracted_data?.items && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Extracted Catalog Cards ({extractedResult.extracted_data.items.length})</span>
                    <span className="text-xs text-slate-400">Multi-item category page extraction</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {extractedResult.extracted_data.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-[#0c1222] border border-white/15 space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
                        <div className="space-y-2">
                          <span className="text-[10px] text-slate-500 font-bold">Item #{idx + 1}</span>
                          <h4 className="font-bold text-white text-xs leading-snug break-words">
                            {item.title || item.name || 'Catalog Item'}
                          </h4>
                          {item.availability && (
                            <span className="text-[10px] text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 inline-block font-semibold">
                              {item.availability}
                            </span>
                          )}
                        </div>
                        {item.price !== undefined && (
                          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Price:</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {item.currency || '£'} {item.price}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Headings Outline (Full Un-truncated Headings) */}
              {modalActiveTab === 'headings' && extractedResult.extracted_data?.all_headings && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Full Page Heading Outline ({extractedResult.extracted_data.all_headings.length} headings)</span>
                    <span className="text-xs text-slate-400">Complete un-truncated document structure</span>
                  </div>
                  <div className="space-y-2.5">
                    {extractedResult.extracted_data.all_headings.map((h: string, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-start justify-between gap-4 text-slate-200 text-xs hover:border-blue-500/30 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white break-words text-sm leading-relaxed block">{h}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(h);
                            showToast('success', 'Heading Copied', 'Heading text copied to clipboard');
                          }}
                          className="text-slate-500 hover:text-white cursor-pointer shrink-0 mt-1"
                          title="Copy Heading Text"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Code Blocks */}
              {modalActiveTab === 'code' && extractedResult.extracted_data?.code_blocks && (
                <div className="space-y-4">
                  <span className="text-sm font-bold text-white">Extracted Code Blocks & API Examples ({extractedResult.extracted_data.code_blocks.length})</span>
                  <div className="space-y-4">
                    {extractedResult.extracted_data.code_blocks.map((code: string, idx: number) => (
                      <div key={idx} className="rounded-2xl border border-white/15 bg-black/70 overflow-hidden space-y-0">
                        <div className="p-3 border-b border-white/10 bg-[#0e1322] flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-bold text-blue-300 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-blue-400" />
                            Snippet #{idx + 1}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              showToast('success', 'Code Copied', 'Snippet copied to clipboard');
                            }}
                            className="text-blue-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <pre className="p-5 text-xs text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
                          {code}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Key Feature Points */}
              {modalActiveTab === 'bullets' && extractedResult.extracted_data?.bullet_points && (
                <div className="space-y-4">
                  <span className="text-sm font-bold text-white">Extracted Bullet Points & Feature Highlights</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extractedResult.extracted_data.bullet_points.map((pt: string, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-sans">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 6: Images Gallery */}
              {modalActiveTab === 'images' && extractedResult.extracted_data?.images && (
                <div className="space-y-4">
                  <span className="text-sm font-bold text-white">Extracted Image Assets ({extractedResult.extracted_data.images.length})</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {extractedResult.extracted_data.images.map((imgSrc: string, idx: number) => (
                      <a
                        key={idx}
                        href={imgSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-2xl bg-black/60 border border-white/15 p-3 flex flex-col items-center justify-center gap-2 overflow-hidden hover:border-blue-500/50 transition-colors"
                      >
                        <div className="w-full h-32 flex items-center justify-center overflow-hidden">
                          <img
                            src={imgSrc}
                            alt={`Asset ${idx}`}
                            className="max-h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-full group-hover:text-blue-300">
                          {imgSrc.substring(imgSrc.lastIndexOf('/') + 1) || `Image ${idx + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 7: Complete Raw JSON */}
              {modalActiveTab === 'json' && (
                <pre className="p-6 rounded-2xl bg-black/80 border border-white/15 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {JSON.stringify(extractedResult.extracted_data, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-[#0d1324] text-xs text-slate-400 flex items-center justify-between">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Esc</kbd> or click outside to dismiss</span>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SUBTLE PANEL CLOSURE LINE ── */}
      <div className="w-full pt-4 border-b border-white/[0.08]" />
    </div>
  );
};
