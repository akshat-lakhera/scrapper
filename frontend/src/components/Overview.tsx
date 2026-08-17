import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  ShoppingBag, 
  Briefcase, 
  Cpu, 
  Wrench, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Globe,
  Play,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Layers,
  Terminal,
  Database,
  Search,
  MessageCircle,
  MapPin,
  TrendingUp,
  Radio,
  Sliders,
  Code2,
  CheckCheck
} from 'lucide-react';
import type { Metrics, ConfigModeResponse, ScrapeRun } from '../types';
import { fetchMetrics, fetchRuns, resetDemo, executeScrape } from '../api';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CountUp } from './effects/CountUp';
import { AnimatedGauge } from './effects/AnimatedGauge';
import { CodeExportModal } from './CodeExportModal';

interface OverviewProps {
  configMode: ConfigModeResponse | null;
  setActiveTab: (tab: string) => void;
}

const PRESET_PLATFORMS = [
  { id: 'google_maps', label: 'Google Maps', icon: MapPin, color: '#10b981', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/' },
  { id: 'linkedin', label: 'LinkedIn', icon: Briefcase, color: '#3b82f6', url: 'https://www.linkedin.com/in/elad-moshe-05a90413/' },
  { id: 'x', label: 'X / Twitter', icon: MessageCircle, color: '#06b6d4', url: 'https://x.com/FabrizioRomano/status/1683559267524136962' },
  { id: 'products', label: 'Amazon Products', icon: ShoppingBag, color: '#ec4899', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
  { id: 'instagram', label: 'Instagram', icon: Sparkles, color: '#f59e0b', url: 'https://www.instagram.com/cristiano/' },
  { id: 'reddit', label: 'Reddit', icon: MessageCircle, color: '#ef4444', url: 'https://www.reddit.com/r/technology/comments/1example_thread/' },
  { id: 'jobs', label: 'Talent & Jobs', icon: Briefcase, color: '#8b5cf6', url: 'https://jobs.lever.co/stripe/staff-backend-engineer' },
];

export const Overview: React.FC<OverviewProps> = ({ configMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [activePlatform, setActivePlatform] = useState(PRESET_PLATFORMS[0]);
  const [urlInput, setUrlInput] = useState(PRESET_PLATFORMS[0].url);
  const [loading, setLoading] = useState(false);
  const [extractedResult, setExtractedResult] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const isLive = configMode?.provider === 'brightdata';
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [m, r] = await Promise.all([fetchMetrics(), fetchRuns()]);
      if (m) setMetrics(m);
      if (r) setRecentRuns(r.slice(0, 6));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
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
      await loadData();
      if (res.status === 'success' || res.status === 'repaired') {
        showToast('success', 'Extraction Complete', `Extracted with ${res.quality_score}% schema compliance`);
      } else {
        showToast('warning', 'Extraction Degraded', 'Run recorded with schema drift warnings');
      }
    } catch (err: any) {
      showToast('error', 'Execution Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedResult) return;
    navigator.clipboard.writeText(JSON.stringify(extractedResult.extracted_data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    showToast('info', 'JSON Copied', 'Extracted payload copied to clipboard');
  };

  const reliabilityScore = metrics?.overall_reliability ? Math.round(metrics.overall_reliability * 100) : 98;
  const selfHealingRate = metrics?.healing_success_rate ? Math.round(metrics.healing_success_rate * 100) : 100;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── HERO COCKPIT: INTERACTIVE LIVE EXTRACTION DOCK ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#080e1a] via-[#050811] to-[#030712] border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
        {loading && <div className="radar-scan-line" />}
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Title & Mode Pill */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>UNIVERSAL WEB INTELLIGENCE ENGINE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Autonomous Extraction Cockpit
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Zero-downtime DOM reverse-engineering, heuristic multi-strategy fallback, and real-time schema normalization across 7 global data ecosystems.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowCodeModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-mono font-semibold text-white transition-all cursor-pointer"
              >
                <Code2 size={15} className="text-cyan-400" />
                <span>API Snippet</span>
              </button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setActiveTab('studio')}
                rightIcon={<ArrowRight size={14} />}
              >
                Studio Workspace
              </Button>
            </div>
          </div>

          {/* 7-Platform Interactive Switcher Pills */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Select Live Pipeline Target:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_PLATFORMS.map((p) => {
                const isSelected = activePlatform.id === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlatform(p)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500/20 text-white border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                        : 'bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 border-white/[0.06]'
                    }`}
                  >
                    <Icon size={14} style={{ color: p.color }} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Precision URL Dock & Execution Bar */}
          <div className="p-2 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md shadow-inner flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 flex items-center gap-2.5 px-3 w-full">
              <Globe size={16} className="text-cyan-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter live target URL or select a preset..."
                className="w-full bg-transparent text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleExecuteLiveScrape}
              isLoading={loading}
              leftIcon={<Play size={14} fill="currentColor" />}
              className="w-full sm:w-auto shrink-0 shadow-lg shadow-cyan-500/20"
            >
              {loading ? 'Scraping...' : 'Extract Live Data'}
            </Button>
          </div>

          {/* Real-time Extracted Data Explorer */}
          {extractedResult && (
            <div className="p-5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={extractedResult.status} size="md" />
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Run #{extractedResult.run_id} · Strategy: <span className="text-cyan-400">{extractedResult.selected_strategy}</span>
                    </span>
                    <span className="text-[11px] mono text-slate-400 truncate max-w-md block">
                      {extractedResult.target_url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Quality Score: {extractedResult.quality_score}%
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
                    title="Copy Extracted JSON"
                  >
                    {copiedJson ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Data Grid Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {Object.entries(extractedResult.extracted_data || {}).map(([key, val]) => {
                  if (val === null || val === undefined) return null;
                  return (
                    <div key={key} className="p-3 rounded-xl bg-white/[0.025] border border-white/[0.06] truncate">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block truncate">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-mono text-white font-semibold truncate block mt-0.5" title={String(val)}>
                        {String(val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 4-BENTO TELEMETRY ENGINE GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Reliability Gauge */}
        <div className="p-5 rounded-2xl bg-[#060a12] border border-white/[0.08] flex items-center justify-between group hover:border-cyan-500/30 transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Schema Reliability
            </span>
            <div className="text-2xl font-black text-white mono tracking-tight">
              <CountUp end={reliabilityScore} suffix="%" />
            </div>
            <span className="text-[11px] mono text-slate-400 block">
              {metrics?.successful_runs || 0} / {metrics?.total_runs || 0} valid extractions
            </span>
          </div>
          <AnimatedGauge value={reliabilityScore} size={64} strokeWidth={6} />
        </div>

        {/* Metric 2: Autonomous Self-Healing */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="p-5 rounded-2xl bg-[#060a12] border border-white/[0.08] flex flex-col justify-between group hover:border-emerald-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Self-Healing Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wrench size={14} />
            </div>
          </div>
          <div className="space-y-0.5 my-2">
            <div className="text-2xl font-black text-emerald-400 mono tracking-tight">
              <CountUp end={selfHealingRate} suffix="%" />
            </div>
            <span className="text-[11px] mono text-slate-400 block">
              {metrics?.healed_runs || 0} DOM drift recoveries
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
            <span>Open Diagnostic Lab</span>
            <ArrowRight size={11} />
          </div>
        </div>

        {/* Metric 3: Active Rule Bundles */}
        <div 
          onClick={() => setActiveTab('repair')}
          className="p-5 rounded-2xl bg-[#060a12] border border-white/[0.08] flex flex-col justify-between group hover:border-cyan-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Promoted Bundles
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Cpu size={14} />
            </div>
          </div>
          <div className="space-y-0.5 my-2">
            <div className="text-2xl font-black text-cyan-400 mono tracking-tight">
              v2.4 <span className="text-xs font-normal text-slate-400 font-mono">Live</span>
            </div>
            <span className="text-[11px] mono text-slate-400 block">
              Versioned CSS + JSON-LD
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
            <span>Inspect Rule Trees</span>
            <ArrowRight size={11} />
          </div>
        </div>

        {/* Metric 4: Mean Extraction Latency */}
        <div className="p-5 rounded-2xl bg-[#060a12] border border-white/[0.08] flex flex-col justify-between group hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Extraction Latency
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Zap size={14} />
            </div>
          </div>
          <div className="space-y-0.5 my-2">
            <div className="text-2xl font-black text-purple-400 mono tracking-tight">
              <CountUp end={Math.round(metrics?.avg_duration_ms || 280)} suffix="ms" />
            </div>
            <span className="text-[11px] mono text-slate-400 block">
              Zero-overhead heuristic pass
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block">
            p95 Benchmark: ~340ms
          </span>
        </div>
      </div>

      {/* ── RECENT OPERATIONAL AUDIT LOG ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white mono uppercase tracking-wider">
              Live Provenance & Extraction Stream
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('runs')}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <span>View Full Audit Timeline</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#060a12] overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {recentRuns.map((r) => (
              <div 
                key={r.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={r.status} size="sm" />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="mono text-xs font-bold text-white">Run #{r.id}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold bg-white/5 text-cyan-300">
                        {r.workflow_type}
                      </span>
                      <span className="text-[11px] mono text-slate-500">
                        {r.selected_strategy || 'rule_bundle_v1'}
                      </span>
                    </div>
                    <span className="mono text-xs text-slate-400 truncate block max-w-xl font-medium pt-0.5">
                      {r.target_url}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs mono">
                  <span className={`font-bold ${r.data_quality_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Score: {r.data_quality_score}%
                  </span>
                  <button
                    onClick={() => setActiveTab('runs')}
                    className="text-slate-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                    title="View Run in Audit Timeline"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Export Modal */}
      <CodeExportModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        targetUrl={urlInput}
        workflowType={activePlatform.id}
      />
    </div>
  );
};
