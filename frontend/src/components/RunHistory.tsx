import React, { useEffect, useState } from 'react';
import { History, Eye, RotateCcw, X, Trash2 } from 'lucide-react';
import type { ScrapeRun, ScrapeRunDetails } from '../types';
import { fetchRuns, fetchRunDetails, clearRuns } from '../api';
import { useScrambleText, stagger } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { JsonDiffViewer } from './JsonDiffViewer';
import { TableRowSkeleton } from './SkeletonLoader';
import { useToast } from './ToastContext';

export const RunHistory: React.FC = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<ScrapeRunDetails | null>(null);
  const [filterWorkflow, setFilterWorkflow] = useState<string>('all');
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
    } catch (e: any) {
      showToast('error', 'Fetch Run Details Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = runs.filter((r) => filterWorkflow === 'all' || r.workflow_type === filterWorkflow);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="stagger-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={stagger(0)} aria-labelledby="history-title">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
              Audit & Provenance
            </span>
          </div>
          <h1 id="history-title" className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Full execution timeline, raw provider JSON payloads, schema normalizations, and field-level diffs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Workflow Filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            {['all', 'products', 'jobs'].map((w) => (
              <button
                key={w}
                onClick={() => setFilterWorkflow(w)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase mono transition-all btn-spring focus-ring"
                style={{
                  background: filterWorkflow === w ? 'var(--accent)' : 'transparent',
                  color: filterWorkflow === w ? '#fff' : 'var(--text-tertiary)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              if (confirm('Permanently delete all execution audit records?')) {
                await clearRuns();
                showToast('info', 'Audit Log Cleared', 'All execution records removed');
                loadRuns();
              }
            }}
            className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-400 hover:text-red-400 focus-ring"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <Trash2 size={13} aria-hidden="true" />
            <span>Clear Log</span>
          </button>

          <button
            onClick={loadRuns}
            disabled={loading}
            className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 focus-ring"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* Runs Monospace Table */}
      <section className="rounded-2xl overflow-hidden stagger-in" style={{ ...stagger(1), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} aria-label="Execution Audit Records">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs mono">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th className="py-3 px-4 font-semibold">RUN ID</th>
                <th className="py-3 px-4 font-semibold">WORKFLOW</th>
                <th className="py-3 px-4 font-semibold">TARGET URL</th>
                <th className="py-3 px-4 font-semibold">STATUS</th>
                <th className="py-3 px-4 font-semibold">QUALITY</th>
                <th className="py-3 px-4 font-semibold">DURATION</th>
                <th className="py-3 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && runs.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              )}

              {filteredRuns.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              )}

              {filteredRuns.map((r, idx) => (
                <tr
                  key={r.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                >
                  <td className="py-3.5 px-4 font-bold text-white">#{r.id}</td>
                  <td className="py-3.5 px-4 uppercase text-purple-400">{r.workflow_type}</td>
                  <td className="py-3.5 px-4 max-w-[280px] truncate text-slate-300" title={r.target_url}>
                    {r.target_url}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td
                    className="py-3.5 px-4 font-bold"
                    style={{
                      color:
                        r.data_quality_score >= 80
                          ? 'var(--success)'
                          : r.data_quality_score >= 50
                          ? 'var(--warning)'
                          : 'var(--danger)',
                    }}
                  >
                    {r.data_quality_score}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{r.duration_ms || 0}ms</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => openDetails(r.id)}
                      className="p-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 btn-spring focus-ring"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                      aria-label={`Inspect Run #${r.id}`}
                    >
                      <Eye size={12} aria-hidden="true" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Apple-Style Glass Modal Payload Inspector */}
      {selectedDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-run-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(16px)' }}
          onClick={() => setSelectedDetails(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl p-6 space-y-5 overflow-hidden flex flex-col max-h-[90vh] stagger-in"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="modal-run-title" className="mono font-bold text-base text-white">
                    Execution Run #{selectedDetails.id}
                  </h2>
                  <StatusBadge status={selectedDetails.status} size="sm" />
                </div>
                <div className="mono text-xs mt-1 truncate max-w-lg text-slate-400">
                  {selectedDetails.target_url}
                </div>
              </div>

              <button
                onClick={() => setSelectedDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white btn-spring focus-ring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                aria-label="Close run inspection dialog"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content: JsonDiffViewer comparing Raw DOM vs Normalized Output */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <JsonDiffViewer
                beforeData={selectedDetails.raw_result}
                afterData={selectedDetails.normalized_result}
                singleData={selectedDetails.normalized_result}
                title="DOM Payload & Normalized Attributes"
              />

              {selectedDetails.validation_errors && selectedDetails.validation_errors.length > 0 && (
                <div className="p-4 rounded-xl space-y-2 bg-red-500/10 border border-red-500/20 text-xs font-mono">
                  <div className="font-bold text-red-400 uppercase tracking-wider">Validation Errors</div>
                  <ul className="list-disc list-inside space-y-1 text-red-300">
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
