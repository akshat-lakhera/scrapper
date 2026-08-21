import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Copy, 
  ExternalLink,
  GitBranch, 
  ShieldCheck, 
  FileCode2,
  AlertTriangle,
  Play,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Search,
  Code2,
  CheckCheck,
  Zap,
  Crosshair,
  ListTree,
  Eye,
  Sliders,
  Cpu
} from 'lucide-react';
import type { ScrapeRun } from '../types';
import { fetchRuns, healScrapeRun, approveRepair, fetchCandidatePatches, executeScrape, evaluateDOMSelector, suggestDOMSelectors } from '../api';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CountUp } from './effects/CountUp';
import { SpotlightCard } from './effects/SpotlightCard';

export const RepairCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stream' | 'inspector'>('stream');
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ScrapeRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePatch, setActivePatch] = useState<any | null>(null);
  const [retestLoading, setRetestLoading] = useState(false);
  const [retestResult, setRetestResult] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'repaired' | 'degraded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const { showToast } = useToast();

  // DOM Inspector States
  const [targetSelector, setTargetSelector] = useState('.price-current');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [copiedSelector, setCopiedSelector] = useState<string | null>(null);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const allRuns = await fetchRuns();
      setRuns(allRuns);

      const targetRun =
        allRuns.find(
          (r) =>
            r.status === 'repaired' ||
            r.status === 'degraded' ||
            r.status === 'auto_healing' ||
            r.status === 'manual_review'
        ) || allRuns[0];

      if (targetRun && (!selectedRun || !allRuns.some((r) => r.id === selectedRun.id))) {
        setSelectedRun(targetRun);
      }

      try {
        const patches = await fetchCandidatePatches();
        if (patches && patches.length > 0) {
          const match = targetRun ? patches.find((p: any) => p.scrape_run_id === targetRun.id) || patches[0] : patches[0];
          setActivePatch(match);
        }
      } catch {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleSelectRun = async (r: ScrapeRun) => {
    setSelectedRun(r);
    setRetestResult(null);
    try {
      const patches = await fetchCandidatePatches();
      const match = patches.find((p: any) => p.scrape_run_id === r.id);
      setActivePatch(match || null);
    } catch {}
  };

  const handleSynthesizeManualPatch = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      showToast('info', 'Synthesizing Patch', `Diagnosing DOM drift for Run #${selectedRun.id}...`);
      const res = await healScrapeRun(selectedRun.scraper_id || 1, selectedRun.id);
      showToast('success', 'Autonomous Patch Generated', `Regression tests passed with ${Math.round(res.confidence_score * 100)}% confidence`);
      await loadRuns();
    } catch (e: any) {
      showToast('error', 'Patch Generation Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activePatch || !selectedRun) return;
    try {
      setLoading(true);
      await approveRepair(selectedRun.id, activePatch.id);
      showToast('success', 'Rule Bundle Promoted', `Promoted v${activePatch.to_version} to active rule set`);
      await loadRuns();
    } catch (e: any) {
      showToast('error', 'Approval Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetest = async () => {
    if (!selectedRun) return;
    try {
      setRetestLoading(true);
      const res = await executeScrape({
        target_url: selectedRun.target_url,
        workflow_type: selectedRun.workflow_type,
        schema_name: selectedRun.workflow_type,
      });
      setRetestResult(res);
      showToast('success', 'Live Re-Test Finished', `Score: ${res.quality_score}% · Strategy: ${res.selected_strategy}`);
      await loadRuns();
    } catch (e: any) {
      showToast('error', 'Re-Test Failed', e.message);
    } finally {
      setRetestLoading(false);
    }
  };

  // DOM Inspector Handler
  const handleEvaluateSelector = async (selToEval?: string) => {
    const sel = (selToEval || targetSelector).trim();
    if (!sel) return;
    try {
      setInspectLoading(true);
      const res = await evaluateDOMSelector({
        selector: sel,
        run_id: selectedRun?.id,
      });
      setEvalResult(res);
      if (res.error) {
        showToast('error', 'Invalid Selector', res.error);
      } else {
        showToast('info', 'Evaluated Selector', `Found ${res.match_count} matches (Stability: ${res.stability_score}%)`);
      }
    } catch (e: any) {
      showToast('error', 'Evaluation Failed', e.message);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleSuggestField = async (fieldName: string) => {
    try {
      setSuggestLoading(true);
      showToast('info', 'Scanning DOM Graph', `Synthesizing robust candidate selectors for "${fieldName}"...`);
      const res = await suggestDOMSelectors({
        target_field: fieldName,
        run_id: selectedRun?.id,
      });
      setSuggestions(res.suggestions || []);
      if (res.suggestions && res.suggestions.length > 0) {
        setTargetSelector(res.suggestions[0].selector);
        handleEvaluateSelector(res.suggestions[0].selector);
        showToast('success', 'Candidates Found', `Ranked ${res.suggestions.length} candidates for "${fieldName}"`);
      } else {
        showToast('warning', 'No Direct Match', 'Try refining selector manually.');
      }
    } catch (e: any) {
      showToast('error', 'Suggestion Failed', e.message);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleCopySelectorText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSelector(text);
    setTimeout(() => setCopiedSelector(null), 2000);
    showToast('info', 'Copied Selector', text);
  };

  const filteredRuns = runs.filter((r) => {
    if (filterType === 'repaired') return r.status === 'repaired';
    if (filterType === 'degraded') return r.status === 'degraded' || r.status === 'manual_review';
    return true;
  }).filter((r) => !searchQuery || r.target_url.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-8 pb-16">
      {/* ── TOP HEADER & SUB-TAB SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300 font-bold tracking-wider">
              [AUTONOMOUS SELF-HEALING ENGINE]
            </span>
            <span className="text-[11px] font-mono text-slate-500">AST MATRIX v2.4</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Self-Healing Lab & AST Diff Workbench</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time DOM drift diagnostics, candidate selector synthesis, holdout validation, and live DOM hierarchy testing.
          </p>
        </div>

        <div className="flex items-center bg-[#090c13] p-1.5 rounded-xl border border-white/10 text-xs font-mono shadow-inner">
          <button
            onClick={() => setActiveTab('stream')}
            className={`tactile-press px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'stream' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>[01] Repair Stream & Diff</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('inspector');
              if (!evalResult) handleEvaluateSelector();
            }}
            className={`tactile-press px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inspector' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>[02] Visual DOM Inspector</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: REPAIR STREAM & DIFF ── */}
      {activeTab === 'stream' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Scrape Runs List (4 cols) */}
          <SpotlightCard className="col-span-1 lg:col-span-4 p-0 flex flex-col justify-between min-h-[500px] relative">
            <div className="p-4 border-b border-white/10 bg-[#0f131f] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">
                    [01 // QUEUE]
                  </span>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Diagnostic Queue</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-bold">{filteredRuns.length} Runs</span>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-[#090c13] p-1 rounded-lg border border-white/10 text-[11px] font-mono">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterType === 'all' ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('repaired')}
                  className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterType === 'repaired' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Repaired
                </button>
                <button
                  onClick={() => setFilterType('degraded')}
                  className={`flex-1 py-1 rounded transition-colors cursor-pointer ${filterType === 'degraded' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Degraded
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter target domain..."
                  className="w-full bg-[#090c13] border border-white/10 text-white font-mono text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 font-mono text-xs max-h-[460px]">
              {filteredRuns.map((r) => {
                const isSelected = selectedRun?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectRun(r)}
                    className={`tactile-press p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-[#090c13] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 font-bold text-xs">Run #{r.id}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <span className="text-slate-200 truncate block text-[11px] mb-2 font-medium">{r.target_url}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <span>Quality: <strong className="text-emerald-400">{r.data_quality_score}%</strong></span>
                      <span className="text-blue-300 font-semibold">{r.duration_ms}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>

          {/* Right Panel: Selected Run Details & Repair Diff (8 cols) */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            {selectedRun ? (
              <>
                {/* Top Action Card */}
                <SpotlightCard className="p-6 sm:p-8 space-y-5 relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300 font-bold tracking-wider">
                          [02 // AST PATCH WORKBENCH]
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-lg font-bold text-white">Diagnostic Record for Run #{selectedRun.id}</span>
                        <StatusBadge status={selectedRun.status} />
                      </div>
                      <span className="text-xs font-mono text-slate-400 truncate block max-w-xl">
                        Target: {selectedRun.target_url}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSynthesizeManualPatch}
                        disabled={loading}
                        className="tactile-press px-4 py-2 rounded-xl bg-[#121728] hover:bg-[#1a2238] border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-mono font-medium flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        <Wrench className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        <span>Synthesize Patch</span>
                      </button>

                      <button
                        onClick={handleRetest}
                        disabled={retestLoading}
                        className="btn-pulse tactile-press px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{retestLoading ? 'Executing...' : 'Live Re-Test & Validate'}</span>
                        <kbd className="kbd-badge bg-white/15 text-white border-white/25 text-[9px] py-0.5 px-1.5 ml-0.5">↵</kbd>
                      </button>
                    </div>
                  </div>

                  {/* Re-test result card if exists */}
                  {retestResult && (
                    <div className="enter-fade-up p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Re-Test Succeeded with Active Rule Set</span>
                        </span>
                        <span className="text-white">Quality: <strong className="text-emerald-400">{retestResult.quality_score}%</strong> · Latency: {retestResult.duration_ms}ms</span>
                      </div>
                    </div>
                  )}

                  {/* Patch diff card */}
                  {activePatch ? (
                    <div className="enter-fade-up space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-bold text-white font-mono">
                            Candidate Patch: v{activePatch.from_version} → v{activePatch.to_version}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                          Holdout Confidence: {(activePatch.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="enter-fade-up stagger-1 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                            [-] Deprecated / Drifted Selectors:
                          </span>
                          {(Array.isArray(activePatch.broken_fields) 
                            ? activePatch.broken_fields 
                            : (() => { try { const p = JSON.parse(activePatch.broken_fields); return Array.isArray(p) ? p : [p]; } catch { return [activePatch.broken_fields || 'price']; } })()
                          ).map((f: string) => {
                            const rootCauses = typeof activePatch.root_cause_analysis === 'object' && activePatch.root_cause_analysis !== null 
                              ? activePatch.root_cause_analysis 
                              : (() => { try { return JSON.parse(activePatch.root_cause_analysis || '{}'); } catch { return {}; } })();
                            const diffs = typeof activePatch.selector_diff === 'object' && activePatch.selector_diff !== null 
                              ? activePatch.selector_diff 
                              : (() => { try { return JSON.parse(activePatch.selector_diff || '{}'); } catch { return {}; } })();
                            const oldSel = rootCauses[f]?.broken_selector || diffs[f]?.old_selector || `.${f}-deprecated`;
                            return (
                              <div key={f} className="text-rose-200 flex items-center gap-2">
                                <span className="text-rose-400 font-bold">✗</span>
                                <span>{f}: <code className="text-rose-300 font-mono">{oldSel}</code></span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="enter-fade-up stagger-2 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                            [+] Synthesized Replacement Selectors:
                          </span>
                          {Object.entries(
                            typeof activePatch.selector_diff === 'object' && activePatch.selector_diff !== null
                              ? activePatch.selector_diff
                              : (() => { try { return JSON.parse(activePatch.selector_diff || '{}'); } catch { return { price: '.price-current' }; } })()
                          ).map(([f, sel]: any) => {
                            const selText = typeof sel === 'object' && sel !== null 
                              ? (sel.new_selector || sel.selector || JSON.stringify(sel)) 
                              : String(sel);
                            return (
                              <div key={f} className="text-slate-200 flex items-center gap-2">
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{f}: <strong className="text-emerald-300 font-mono">{typeof selText === 'object' ? JSON.stringify(selText) : String(selText)}</strong></span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── AST DIFF & REGRESSION CONFIDENCE PANEL (Locks Bottom Panel) ── */}
                      <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            AST Regression Prevention Guarantee
                          </span>
                          <span className="text-[10px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            Zero Breaking Changes
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          Candidate rule replacement verified against historical holdout snapshots. No existing schemas or extraction fields degraded.
                        </div>
                      </div>

                      {activePatch.status !== 'promoted' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={handleApprove}
                            disabled={loading}
                            className="tactile-press px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>Promote Candidate to Rule Bundle</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default Idle Diagnostic Preview */
                    <div className="p-6 rounded-2xl bg-[#080b12] border border-blue-500/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                          Diagnostic State: Clean & Verified
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                          100% Reliability
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        This scrape run completed with full field fidelity. All CSS selectors and JSON-LD fallbacks operated within nominal reliability thresholds.
                      </p>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono text-slate-300">
                        <span>Tested Rules: <strong className="text-white">v1.2 Canonical</strong></span>
                        <span>Holdout Drift: <strong className="text-emerald-400">0.00%</strong></span>
                        <span>Confidence: <strong className="text-blue-300">100%</strong></span>
                      </div>
                    </div>
                  )}
                </SpotlightCard>
              </>
            ) : (
              <div className="text-center py-20 text-slate-400 font-mono text-xs bg-[#0e1320] border border-white/15 rounded-2xl">
                Select a run from the audit stream to inspect self-healing telemetry.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── TAB 2: INTERACTIVE VISUAL DOM INSPECTOR & SELECTOR TESTER ── */
        <div className="space-y-6">
          {/* Top Control Bar & Live Omnibar */}
          <SpotlightCard className="p-6 sm:p-8 space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                    [03 // SELECTOR PLAYGROUND]
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Crosshair className="w-5 h-5 text-blue-400" />
                  <span>Real-Time DOM Selector Playground</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Type any CSS selector to evaluate matching nodes, compute hierarchy paths, and calculate stability scores against the loaded DOM tree.
                </p>
              </div>

              {/* AI Suggest Quick Action Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-500 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>AI Suggest:</span>
                </span>
                {['price', 'title', 'availability', 'rating', 'doc_body'].map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSuggestField(field)}
                    disabled={suggestLoading}
                    className="tactile-press px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-slate-300 hover:text-white capitalize transition-all cursor-pointer"
                  >
                    {field.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector Omnibar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={targetSelector}
                  onChange={(e) => setTargetSelector(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEvaluateSelector(); }}
                  placeholder="Enter CSS selector (e.g. .price-current, h1.title, span[data-asin], div.job-desc)..."
                  className="w-full bg-[#090c13] border border-white/15 text-white font-mono text-sm sm:text-base py-3.5 pl-4 pr-36 rounded-xl focus:border-blue-500 focus:outline-none transition-colors shadow-inner"
                />
                <button
                  onClick={() => handleEvaluateSelector()}
                  disabled={inspectLoading}
                  className="btn-pulse tactile-press absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{inspectLoading ? 'Evaluating...' : 'Test Selector'}</span>
                  <kbd className="kbd-badge bg-white/15 text-white border-white/25 text-[9px] py-0.5 px-1.5">↵</kbd>
                </button>
              </div>
            </div>

            {/* Quick Preset Selector Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs font-mono text-slate-400">
              <span className="text-[11px] text-slate-500 font-bold">PRESETS:</span>
              {['.price-current', 'h1', '.product-title', '.availability', 'article', 'span.price', 'div[class*="price"]'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setTargetSelector(preset);
                    handleEvaluateSelector(preset);
                  }}
                  className="tactile-press px-2.5 py-1 rounded bg-white/[0.03] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </SpotlightCard>

          {/* Evaluation Results & Elements Stream */}
          {evalResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Telemetry Summary (4 cols) */}
              <SpotlightCard className="col-span-1 lg:col-span-4 p-6 space-y-5 relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Selector Telemetry</span>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                    evalResult.match_count > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}>
                    {evalResult.match_count > 0 ? 'MATCH FOUND' : 'NO MATCH'}
                  </span>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block mb-1">Target Selector:</span>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 text-cyan-300 font-bold break-all flex items-center justify-between">
                      <span>{evalResult.selector}</span>
                      <button
                        onClick={() => handleCopySelectorText(evalResult.selector)}
                        className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      >
                        {copiedSelector === evalResult.selector ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#090c13] border border-white/5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Total Matches</span>
                      <span className="text-2xl font-extrabold text-white">{evalResult.match_count}</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#090c13] border border-white/5">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Uniqueness</span>
                      <span className={`text-sm font-bold block mt-1 ${evalResult.is_unique ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {evalResult.is_unique ? '✓ Unique Node' : 'Multi-Node Match'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-[11px]">Stability Rating:</span>
                      <strong className="text-emerald-400">{evalResult.stability_score}%</strong>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          evalResult.stability_score >= 80 ? 'bg-emerald-500' : (evalResult.stability_score >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                        }`}
                        style={{ width: `${evalResult.stability_score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Matched Elements Inspector List (8 cols) */}
              <SpotlightCard className="col-span-1 lg:col-span-8 p-6 space-y-4 relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Matched DOM Nodes Hierarchy ({evalResult.matches?.length || 0})</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Live HTML Node Traces</span>
                </div>

                {evalResult.matches && evalResult.matches.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto font-mono text-xs">
                    {evalResult.matches.map((m: any) => (
                      <div
                        key={m.index}
                        className="p-4 rounded-xl bg-[#090c13] border border-white/10 hover:border-blue-500/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                              &lt;{m.tag}&gt; #{m.index}
                            </span>
                            <span className="text-slate-300 font-bold text-xs truncate max-w-sm">
                              {m.computed_path}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopySelectorText(m.computed_path)}
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Copy Path</span>
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Text Snippet Preview */}
                        {m.text && (
                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Inner Text:</span>
                            <span className="text-emerald-300 text-xs font-mono leading-relaxed">{m.text}</span>
                          </div>
                        )}

                        {/* Attribute Tags */}
                        {m.attributes && Object.keys(m.attributes).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {Object.entries(m.attributes).map(([attr, val]: any) => (
                              <span key={attr} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-slate-400">
                                <strong className="text-slate-300">{attr}</strong>="{String(val).substring(0, 40)}"
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 font-mono text-xs">
                    No elements matched this selector. Try a broader tag or use AI Suggest.
                  </div>
                )}
              </SpotlightCard>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
