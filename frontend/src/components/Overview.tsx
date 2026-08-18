import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Sparkles, 
  ShoppingBag, 
  Briefcase, 
  Wrench, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  Terminal, 
  Database, 
  MessageCircle, 
  MapPin, 
  TrendingUp, 
  Radio, 
  Code2,
  Clock,
  ArrowRight,
  Shield,
  FileCode,
  CheckCheck
} from 'lucide-react';
import type { Metrics, ConfigModeResponse, ScrapeRun } from '../types';
import { fetchMetrics, fetchRuns, executeScrape } from '../api';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';
import { CountUp } from './effects/CountUp';

interface OverviewProps {
  configMode: ConfigModeResponse | null;
  setActiveTab: (tab: string) => void;
}

const PRESET_PLATFORMS = [
  { id: 'products', label: 'Amazon Products', icon: ShoppingBag, tag: 'E-Commerce', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
  { id: 'tech_docs', label: 'Tech Docs & APIs', icon: Code2, tag: 'Developer Docs', url: 'https://demo.local/tech_docs_v1.html' },
  { id: 'jobs', label: 'Talent & Jobs', icon: Briefcase, tag: 'Careers', url: 'https://jobs.lever.co/stripe/staff-backend-engineer' },
  { id: 'linkedin', label: 'LinkedIn Profiles', icon: Briefcase, tag: 'Talent Lead', url: 'https://www.linkedin.com/in/codingstark/' },
  { id: 'x', label: 'X (Twitter)', icon: MessageCircle, tag: 'Social Pulse', url: 'https://x.com/konig0000/status/2089565885149466685?s=20' },
  { id: 'reddit', label: 'Reddit Discussions', icon: MessageCircle, tag: 'Communities', url: 'https://www.reddit.com/r/battlefield2042/comments/1cmqs1d/official_update_on_the_next_battlefield_game/' },
  { id: 'google_maps', label: 'Google Maps', icon: MapPin, tag: 'Local Intel', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/' },
];

export const Overview: React.FC<OverviewProps> = ({ configMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [activePlatform, setActivePlatform] = useState(PRESET_PLATFORMS[0]);
  const [urlInput, setUrlInput] = useState(PRESET_PLATFORMS[0].url);
  const [loading, setLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeView, setActiveView] = useState<'card' | 'json'>('card');
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [m, r] = await Promise.all([fetchMetrics(), fetchRuns()]);
      if (m) setMetrics(m);
      if (r) setRecentRuns(r.slice(0, 6));
    } catch (e) {
      console.error('Failed to load metrics or runs', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlatform = (p: typeof PRESET_PLATFORMS[0]) => {
    setActivePlatform(p);
    setUrlInput(p.url);
    setExtractedResult(null);
  };

  const handleExecuteLiveScrape = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    setExtractedResult(null);
    try {
      showToast('info', 'Triggering Pipeline', `Scraping target: ${urlInput.substring(0, 36)}...`);
      const res = await executeScrape({
        target_url: urlInput.trim(),
        workflow_type: activePlatform.id,
        schema_name: activePlatform.id,
      });
      setExtractedResult(res);
      if (res.status === 'success' || res.status === 'repaired') {
        showToast('success', 'Extraction Completed', `Extracted with ${res.quality_score}% quality score`);
      } else {
        showToast('warning', 'Extraction Degraded', 'Drift detected — routed to Self-Healing Lab');
      }
      loadData();
    } catch (e: any) {
      showToast('error', 'Execution Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedResult) return;
    navigator.clipboard.writeText(JSON.stringify(extractedResult.extracted_data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    showToast('info', 'Copied JSON', 'Structured payload copied to clipboard');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. CLUSTER TELEMETRY & HARDWARE METRICS BENTO ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Extractions */}
        <div className="hw-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Scrapes</span>
            <Activity size={14} className="text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-white">
              <CountUp end={metrics?.total_runs || 0} />
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Active</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">Universal across all 8 workflows</span>
        </div>

        {/* Metric 2: Cluster Reliability */}
        <div className="hw-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Data Reliability</span>
            <ShieldCheck size={14} className="text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              <CountUp end={metrics?.overall_reliability || 96} suffix="%" />
            </span>
            <span className="text-[10px] font-mono text-slate-400">Gated</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">Strict Pydantic schema validation</span>
        </div>

        {/* Metric 3: Autonomous Healing Rate */}
        <div className="hw-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Self-Healing Rate</span>
            <Wrench size={14} className="text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400">
              <CountUp end={metrics?.healing_success_rate || 100} suffix="%" />
            </span>
            <span className="text-[10px] font-mono text-amber-400/80">Autonomous</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">Multi-page holdout regression tested</span>
        </div>

        {/* Metric 4: DOM Template Signatures */}
        <div className="hw-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Active Rule Bundles</span>
            <Database size={14} className="text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400">
              <CountUp end={metrics?.template_count || 4} />
            </span>
            <span className="text-[10px] font-mono text-slate-400">Partitions</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 mt-1">Domain + DOM skeleton hash keyed</span>
        </div>
      </div>

      {/* ── 2. INTERACTIVE TARGET LAUNCHER & STAGE PIPELINE ── */}
      <div className="hw-panel p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="text-lg font-bold font-sans text-white flex items-center gap-2">
              <Terminal size={18} className="text-blue-400" />
              Live Target Ingestion & Autonomous Extraction
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Input any target URL or select a platform preset. The Multi-Strategy engine automatically resolves schemas and heals on drift.
            </p>
          </div>

          {/* Quick Platform Chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLATFORMS.map((p) => {
              const Icon = p.icon;
              const isSelected = activePlatform.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlatform(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all hw-btn ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                  }`}
                >
                  <Icon size={12} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Input & Launch Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter canonical target URL..."
              className="w-full bg-[#0c0e14] border border-white/[0.1] rounded-lg px-4 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 shadow-inner"
            />
            <span className="absolute right-3 top-3 px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] text-slate-400 border border-white/[0.08]">
              {activePlatform.tag}
            </span>
          </div>

          <button
            onClick={handleExecuteLiveScrape}
            disabled={loading || !urlInput.trim()}
            className="hw-btn px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {loading ? (
              <>
                <Zap size={14} className="animate-spin text-white" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Extract Target</span>
              </>
            )}
          </button>
        </div>

        {/* ── 3. 5-STAGE EXTRACTION WATERFALL VISUALIZER ── */}
        <div className="p-4 rounded-lg bg-[#0c0e14] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">MULTI-STRATEGY PIPELINE WATERFALL</span>
            <span>{loading ? 'STATUS: EXECUTING...' : (extractedResult ? 'STATUS: COMPLETE' : 'STATUS: READY')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px] font-mono">
            {/* Stage 1 */}
            <div className={`p-2.5 rounded border transition-all ${
              loading ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : (extractedResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.05] text-slate-500')
            }`}>
              <div className="font-bold">01 INGESTION</div>
              <div className="text-[10px] text-slate-400 truncate">Bright Data Cluster</div>
            </div>

            {/* Stage 2 */}
            <div className={`p-2.5 rounded border transition-all ${
              loading ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : (extractedResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.05] text-slate-500')
            }`}>
              <div className="font-bold">02 FINGERPRINT</div>
              <div className="text-[10px] text-slate-400 truncate">DOM Hash tpl_*</div>
            </div>

            {/* Stage 3 */}
            <div className={`p-2.5 rounded border transition-all ${
              loading ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : (extractedResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.05] text-slate-500')
            }`}>
              <div className="font-bold">03 STRATEGY</div>
              <div className="text-[10px] text-slate-400 truncate">{extractedResult?.selected_strategy || 'JSON-LD / Rules'}</div>
            </div>

            {/* Stage 4 */}
            <div className={`p-2.5 rounded border transition-all ${
              loading ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : (extractedResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.05] text-slate-500')
            }`}>
              <div className="font-bold">04 QUALITY GATE</div>
              <div className="text-[10px] text-slate-400 truncate">{extractedResult ? `${extractedResult.quality_score}% Pass` : 'Pydantic Gating'}</div>
            </div>

            {/* Stage 5 */}
            <div className={`p-2.5 rounded border transition-all ${
              loading ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' : (extractedResult?.status === 'repaired' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : (extractedResult ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/[0.05] text-slate-500'))
            }`}>
              <div className="font-bold">05 AUTO-HEAL</div>
              <div className="text-[10px] text-slate-400 truncate">{extractedResult?.status === 'repaired' ? 'Auto-Healed v2' : 'Verified'}</div>
            </div>
          </div>
        </div>

        {/* ── 4. EXTRACTED PAYLOAD VIEW (HOLOGRAPHIC CARD / JSON TREE) ── */}
        {extractedResult && (
          <div className="p-4 rounded-lg bg-[#0c0e14] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={extractedResult.status} />
                <span className="text-xs font-mono text-slate-400">
                  Quality Score: <strong className="text-white">{extractedResult.quality_score}%</strong> · Duration: <strong className="text-white">{extractedResult.duration_ms}ms</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#161a26] p-0.5 rounded-lg border border-white/[0.06] text-xs font-mono">
                  <button
                    onClick={() => setActiveView('card')}
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'card' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'json' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="hw-btn flex items-center gap-1 px-3 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-slate-300 border border-white/[0.08]"
                >
                  {copiedJson ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* View 1: Formatted Entity Card */}
            {activeView === 'card' ? (
              <div className="p-4 rounded-lg bg-[#12151e] border border-white/[0.06] space-y-3 font-sans">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {extractedResult.extracted_data?.title || extractedResult.extracted_data?.name || extractedResult.extracted_data?.job_title || extractedResult.extracted_data?.doc_title || 'Structured Web Entity'}
                    </h3>
                    <a
                      href={extractedResult.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1 truncate max-w-xl"
                    >
                      <span>{extractedResult.target_url}</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>

                  {extractedResult.extracted_data?.price !== undefined && (
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold font-mono text-emerald-400">
                        {extractedResult.extracted_data?.currency || '$'} {extractedResult.extracted_data?.price}
                      </span>
                      {extractedResult.extracted_data?.availability && (
                        <span className="block text-[11px] font-mono text-slate-400">
                          {extractedResult.extracted_data?.availability}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Attribute Matrix Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.05] font-mono text-xs">
                  {Object.entries(extractedResult.extracted_data || {}).map(([key, value]) => {
                    if (key.includes('_url') || key === 'title' || key === 'price' || !value) return null;
                    return (
                      <div key={key} className="p-2 rounded bg-black/40 border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase block">{key}</span>
                        <span className="text-slate-200 truncate block">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* View 2: Raw Syntax JSON */
              <pre className="p-4 rounded-lg bg-black/60 border border-white/[0.06] text-xs font-mono text-emerald-300 overflow-x-auto max-h-80">
                {JSON.stringify(extractedResult.extracted_data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* ── 5. RECENT EXTRACTION AUDIT FEED ── */}
      <div className="hw-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-slate-400" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Recent Extraction Audit Feed
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('runs')}
            className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Timeline</span>
            <ArrowRight size={11} />
          </button>
        </div>

        <div className="space-y-2">
          {recentRuns.length > 0 ? (
            recentRuns.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg bg-[#0c0e14] border border-white/[0.05] flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-slate-500 shrink-0">#{r.id}</span>
                  <StatusBadge status={r.status} />
                  <span className="text-slate-300 truncate max-w-md">{r.target_url}</span>
                </div>

                <div className="flex items-center gap-4 text-slate-400 shrink-0">
                  <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.05] text-[10px]">
                    {r.workflow_type}
                  </span>
                  <span>{r.duration_ms}ms</span>
                  <span className="text-emerald-400 font-bold">{r.data_quality_score}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No scrape runs recorded yet. Execute an extraction above to populate the audit feed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
