import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Eye,
  RotateCcw,
  X,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Clock,
  ArrowUpDown,
  Search,
  Download,
  Copy,
  Check,
  Layers,
  Activity,
  Sparkles,
  Filter,
  ShieldCheck,
  Terminal,
  FileCode,
  ExternalLink
} from 'lucide-react';
import type { ScrapeRun, ScrapeRunDetails } from '../types';
import { fetchRuns, fetchRunDetails, clearRuns } from '../api';
import { useScrambleText, stagger } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { JsonDiffViewer } from './JsonDiffViewer';
import { TableRowSkeleton } from './SkeletonLoader';
import { useToast } from './ToastContext';
import { SpotlightCard } from './SpotlightCard';

export const RunHistory: React.FC = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<ScrapeRunDetails | null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'normalized' | 'diff' | 'traces'>('normalized');
  const title = useScrambleText('Execution Timeline & Audit Log', true);
  const { showToast } = useToast();

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await fetchRuns();
      setRuns(data);
    } catch (e: any) {
      showToast('error', 'Failed to Load Runs', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const openDetails = async (id: number) => {
    try {
      setLoading(true);
      const details = await fetchRunDetails(id);
      setSelectedDetails(details);
      setModalTab('normalized');
    } catch (e: any) {
      showToast('error', 'Fetch Run Details Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredRuns = useMemo(() => {
    return runs
      .filter((r) => {
        const matchesWorkflow = filterWorkflow === 'all' || r.workflow_type === filterWorkflow;
        const matchesSearch = !searchQuery.trim() || 
          (r.target_url || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.workflow_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(r.id).includes(searchQuery);
        return matchesWorkflow && matchesSearch;
      })
      .sort((a: any, b: any) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
  }, [runs, filterWorkflow, searchQuery, sortField, sortAsc]);

  // Aggregated Telemetry Metrics
  const metrics = useMemo(() => {
    if (runs.length === 0) return { total: 0, avgQuality: 100, healed: 0, avgDuration: 0 };
    const total = runs.length;
    const avgQuality = Math.round(runs.reduce((acc, r) => acc + (r.data_quality_score || 0), 0) / total);
    const healed = runs.filter((r) => r.status === 'repaired' || r.repair_triggered).length;
    const avgDuration = Math.round(runs.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / total);
    return { total, avgQuality, healed, avgDuration };
  }, [runs]);

  const copyJsonPayload = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
    showToast('success', 'Payload Copied', 'JSON payload copied to clipboard.');
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── [01 // AUDIT TIMELINE & PROVENANCE] TOP HERO BANNER ── */}
      <SpotlightCard className="p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                [01 // AUDIT TIMELINE & PROVENANCE]
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Immutable SQLite WAL Audit Ledger
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Execution Timeline & Audit History
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Inspect historical execution traces, Pydantic data quality scores, active strategy version promotions, and multi-run DOM field diffs.
            </p>
          </div>

          {/* Action Dock */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
            <button
              onClick={async () => {
                if (confirm('Permanently delete all execution audit records?')) {
                  await clearRuns();
                  showToast('info', 'Audit Log Cleared', 'All execution records removed');
                  loadRuns();
                }
              }}
              className="tactile-press px-4 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 text-slate-300 hover:text-rose-400 bg-[#080b12] border border-white/15 hover:border-rose-500/30 transition-all cursor-pointer shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Log</span>
            </button>

            <button
              onClick={loadRuns}
              disabled={loading}
              className="tactile-press px-5 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* ── 4-METRIC AUDIT VITALS BAR ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Total Audited Runs
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>{metrics.total}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Average Quality
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{metrics.avgQuality}%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Auto-Healed Scrapes
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <span>{metrics.healed}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Mean Ingestion Latency
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 font-mono flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>{metrics.avgDuration}ms</span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* ── [02 // FILTER & SEARCH DOCK] ── */}
      <SpotlightCard className="p-6 space-y-4 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Workflow Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#080b12] border border-white/15 shadow-inner">
            {[
              { id: 'all', label: 'All Workflows' },
              { id: 'products', label: 'Products' },
              { id: 'tech_docs', label: 'Tech Docs' },
              { id: 'jobs', label: 'Jobs' },
              { id: 'linkedin', label: 'LinkedIn' },
              { id: 'x', label: 'X (Twitter)' },
              { id: 'reddit', label: 'Reddit' },
              { id: 'google_maps', label: 'Maps' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => setFilterWorkflow(w.id)}
                className={`tactile-press px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                  filterWorkflow === w.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target URL or ID..."
              className="w-full bg-[#080b12] border border-white/15 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>
        </div>
      </SpotlightCard>

      {/* ── [03 // EXECUTION RUNS MATRIX TABLE] ── */}
      <SpotlightCard className="p-0 overflow-hidden relative shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10 bg-[#080b12] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
              [03 // EXECUTION LEDGER]
            </span>
            <History className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Audit Traces ({filteredRuns.length})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing latest {filteredRuns.length} recorded events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0b0f1a] border-b border-white/10 text-slate-300 uppercase tracking-wider text-[11px]">
                <th className="py-4 px-5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-1.5">
                    <span>RUN ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-5 font-bold">WORKFLOW</th>
                <th className="py-4 px-5 font-bold">TARGET URL / DOMAIN</th>
                <th className="py-4 px-5 font-bold">STATUS</th>
                <th className="py-4 px-5 font-bold">ACTIVE STRATEGY</th>
                <th className="py-4 px-5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('data_quality_score')}>
                  <div className="flex items-center gap-1.5">
                    <span>QUALITY</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-5 font-bold cursor-pointer hover:text-white" onClick={() => handleSort('duration_ms')}>
                  <div className="flex items-center gap-1.5">
                    <span>LATENCY</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-4 px-5 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#070a12]">
              {loading && runs.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              )}

              {filteredRuns.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-mono text-xs">
                    No execution audit records match the current filter or search criteria.
                  </td>
                </tr>
              )}

              {filteredRuns.map((r, idx) => (
                <tr
                  key={r.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td className="py-4 px-5 font-bold text-white">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                      #{r.id}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 font-bold uppercase text-[10px]">
                      {r.workflow_type}
                    </span>
                  </td>
                  <td className="py-4 px-5 max-w-[280px] truncate text-slate-200 font-medium" title={r.target_url}>
                    {r.target_url}
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-slate-300">
                      {r.selected_strategy || 'rule_bundle_v1'}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            r.data_quality_score >= 80 ? 'bg-emerald-400' : r.data_quality_score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${r.data_quality_score}%` }}
                        />
                      </div>
                      <span
                        className={
                          r.data_quality_score >= 80 ? 'text-emerald-400' : r.data_quality_score >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }
                      >
                        {r.data_quality_score}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-400 font-mono">{r.duration_ms || 0}ms</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => openDetails(r.id)}
                      className="tactile-press px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono inline-flex items-center gap-1.5 bg-[#101524] hover:bg-blue-600 text-slate-200 hover:text-white border border-white/15 hover:border-blue-500 transition-all cursor-pointer shadow-sm"
                      aria-label={`Inspect Run #${r.id}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* ── HIGH-END AUDIT TRACE INSPECTION MODAL ── */}
      {selectedDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-run-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md cursor-pointer animate-fade-in"
          onClick={() => setSelectedDetails(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl p-6 sm:p-8 space-y-6 overflow-hidden flex flex-col max-h-[90vh] bg-[#090d16] border border-white/20 shadow-2xl cursor-default animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold">
                    [TRACE // RUN #{selectedDetails.id}]
                  </span>
                  <h2 id="modal-run-title" className="font-mono font-bold text-lg text-white">
                    Execution Trace #{selectedDetails.id}
                  </h2>
                  <StatusBadge status={selectedDetails.status} size="sm" />
                </div>
                <div className="font-mono text-xs text-slate-400 truncate max-w-xl flex items-center gap-1.5">
                  <span>Target:</span>
                  <span className="text-slate-200">{selectedDetails.target_url}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyJsonPayload(selectedDetails.normalized_result)}
                  className="tactile-press px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedDetails(null)}
                  className="tactile-press p-2 rounded-xl text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-2 bg-[#05070c] p-1 rounded-xl border border-white/10 self-start">
              <button
                onClick={() => setModalTab('normalized')}
                className={`tactile-press px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  modalTab === 'normalized'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normalized Output
              </button>
              <button
                onClick={() => setModalTab('diff')}
                className={`tactile-press px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  modalTab === 'diff'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw vs Normalized Diff
              </button>
              {selectedDetails.field_traces && selectedDetails.field_traces.length > 0 && (
                <button
                  onClick={() => setModalTab('traces')}
                  className={`tactile-press px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    modalTab === 'traces'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Field Traces ({selectedDetails.field_traces.length})
                </button>
              )}
            </div>

            {/* Modal Content Deck */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {modalTab === 'normalized' && (
                <div className="p-5 rounded-2xl bg-[#04060a] border border-white/10 text-xs font-mono overflow-x-auto shadow-inner">
                  <pre className="text-emerald-400 leading-relaxed">
                    {JSON.stringify(selectedDetails.normalized_result, null, 2)}
                  </pre>
                </div>
              )}

              {modalTab === 'diff' && (
                <JsonDiffViewer
                  beforeData={selectedDetails.raw_result}
                  afterData={selectedDetails.normalized_result}
                  singleData={selectedDetails.normalized_result}
                  title="Raw Ingestion Snapshot vs Normalized Attributes"
                />
              )}

              {modalTab === 'traces' && selectedDetails.field_traces && (
                <div className="space-y-3 font-mono text-xs">
                  {selectedDetails.field_traces.map((trace: any, tIdx: number) => (
                    <div
                      key={tIdx}
                      className="p-4 rounded-xl bg-[#06080e] border border-white/10 space-y-2 hover:border-blue-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-300 uppercase text-[11px]">{trace.field_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Strategy: {trace.strategy_used}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] truncate">
                        <strong>Selector:</strong> <code className="text-slate-200">{trace.selector_used || 'N/A'}</code>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-slate-200 text-[11px] truncate">
                        <strong>Extracted Value:</strong> {String(trace.extracted_value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Errors Box */}
              {selectedDetails.validation_errors && selectedDetails.validation_errors.length > 0 && (
                <div className="p-5 rounded-2xl space-y-2.5 bg-rose-500/10 border border-rose-500/30 text-xs font-mono">
                  <div className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Schema Validation Gating Warnings</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-rose-300">
                    {selectedDetails.validation_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
