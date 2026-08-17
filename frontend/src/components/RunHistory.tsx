import React, { useEffect, useState } from 'react';
import { History, Eye, RotateCcw, X, Copy, CheckCheck, Trash2 } from 'lucide-react';
import type { ScrapeRun, ScrapeRunDetails } from '../types';
import { fetchRuns, fetchRunDetails, clearRuns } from '../api';
import { useScrambleText, stagger } from '../hooks';

export const RunHistory: React.FC = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<ScrapeRunDetails | null>(null);
  const [activeJsonTab, setActiveJsonTab] = useState<'normalized' | 'raw' | 'errors'>('normalized');
  const [filterWorkflow, setFilterWorkflow] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const title = useScrambleText('Execution Timeline & Audit Log', true);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await fetchRuns();
      setRuns(data);
    } catch (e) {
      console.error(e);
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
      alert(`Fetch run details failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyModalPayload = () => {
    if (!selectedDetails) return;
    const content = activeJsonTab === 'normalized' 
      ? selectedDetails.normalized_result 
      : activeJsonTab === 'raw' 
      ? selectedDetails.raw_result 
      : selectedDetails.validation_errors;
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRuns = runs.filter(r => filterWorkflow === 'all' || r.workflow_type === filterWorkflow);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'success': return { label: 'SUCCESS', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' };
      case 'repaired': return { label: 'REPAIRED', color: 'var(--healed)', bg: 'rgba(139,92,246,0.1)' };
      case 'degraded': return { label: 'DEGRADED', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' };
      case 'repair_requested': return { label: 'PENDING REPAIR', color: 'var(--accent)', bg: 'rgba(168,85,247,0.1)' };
      case 'manual_review': return { label: 'MANUAL REVIEW', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' };
      case 'provider_error': return { label: 'PROVIDER ERROR', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' };
      case 'provider_timeout': return { label: 'TIMEOUT', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' };
      default: return { label: s.toUpperCase(), color: 'var(--text-secondary)', bg: 'var(--bg-elevated)' };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="stagger-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={stagger(0)}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
              Audit & Provenance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Full execution timeline, raw provider JSON payloads, schema normalizations, and field-level diffs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Workflow Filter */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            {['all', 'products', 'jobs'].map(w => (
              <button
                key={w}
                onClick={() => setFilterWorkflow(w)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase mono transition-all btn-spring"
                style={{
                  background: filterWorkflow === w ? 'var(--accent)' : 'transparent',
                  color: filterWorkflow === w ? '#fff' : 'var(--text-tertiary)',
                  border: 'none',
                  cursor: 'pointer'
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
                loadRuns();
              }
            }}
            className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-400 hover:text-red-400"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <Trash2 size={13} />
            <span>Clear Log</span>
          </button>

          <button
            onClick={loadRuns}
            disabled={loading}
            className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Runs Monospace Table */}
      <div className="rounded-2xl overflow-hidden stagger-in" style={{ ...stagger(1), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
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
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {filteredRuns.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              )}

              {filteredRuns.map((r, idx) => {
                const badge = statusBadge(r.status);
                return (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}
                  >
                    <td className="py-3.5 px-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                      #{r.id}
                    </td>
                    <td className="py-3.5 px-4 uppercase" style={{ color: 'var(--accent)' }}>
                      {r.workflow_type}
                    </td>
                    <td className="py-3.5 px-4 max-w-[280px] truncate" style={{ color: 'var(--text-secondary)' }} title={r.target_url}>
                      {r.target_url}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold" style={{ color: r.data_quality_score >= 80 ? 'var(--success)' : r.data_quality_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {r.data_quality_score}%
                    </td>
                    <td className="py-3.5 px-4" style={{ color: 'var(--text-tertiary)' }}>
                      {r.duration_ms || 0}ms
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDetails(r.id)}
                        className="p-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 btn-spring"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apple-Style Glass Modal Payload Inspector */}
      {selectedDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(16px)' }}
        >
          <div
            className="w-full max-w-3xl rounded-2xl p-6 space-y-5 overflow-hidden flex flex-col max-h-[90vh] stagger-in"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono font-bold text-base text-white">Execution Run #{selectedDetails.id}</span>
                  <span className="text-[10px] mono px-2 py-0.5 rounded font-bold uppercase" style={{ background: statusBadge(selectedDetails.status).bg, color: statusBadge(selectedDetails.status).color }}>
                    {selectedDetails.status}
                  </span>
                </div>
                <div className="mono text-xs mt-1 truncate max-w-lg" style={{ color: 'var(--text-secondary)' }}>
                  {selectedDetails.target_url}
                </div>
              </div>

              <button
                onClick={() => setSelectedDetails(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white btn-spring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-root)' }}>
                {(['normalized', 'raw', 'errors'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveJsonTab(tab)}
                    className="px-3.5 py-1.5 rounded-lg text-xs mono font-semibold uppercase transition-all btn-spring"
                    style={{
                      background: activeJsonTab === tab ? 'var(--accent)' : 'transparent',
                      color: activeJsonTab === tab ? '#fff' : 'var(--text-tertiary)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {tab === 'normalized' ? 'Normalized Result' : tab === 'raw' ? 'Raw DOM Payload' : 'Validation Errors'}
                  </button>
                ))}
              </div>

              <button
                onClick={copyModalPayload}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold mono flex items-center gap-1.5 btn-spring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                {copied ? <CheckCheck size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            {/* Modal Code Viewer */}
            <div className="flex-1 overflow-y-auto">
              <pre
                className="p-4 rounded-xl text-xs mono leading-relaxed overflow-x-auto"
                style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                {JSON.stringify(
                  activeJsonTab === 'normalized'
                    ? selectedDetails.normalized_result
                    : activeJsonTab === 'raw'
                    ? selectedDetails.raw_result
                    : selectedDetails.validation_errors,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
