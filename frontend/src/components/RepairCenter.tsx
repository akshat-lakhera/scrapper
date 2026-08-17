import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Code2,
  Copy,
  CheckCheck
} from 'lucide-react';
import type { ScrapeRun, RepairAttempt } from '../types';
import { fetchRuns, healScrapeRun, approveRepair } from '../api';
import { useScrambleText, stagger } from '../hooks';

export const RepairCenter: React.FC = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ScrapeRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairAttempt, setRepairAttempt] = useState<RepairAttempt | null>(null);
  const [repairedData, setRepairedData] = useState<any>(null);
  const [repairStatus, setRepairStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const title = useScrambleText('Self-Healing Engine & Interactive Repair Center', true);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const allRuns = await fetchRuns();
      setRuns(allRuns);

      const targetRun = allRuns.find(r => 
        r.status === 'degraded' || r.status === 'repair_requested' || r.status === 'repaired' || r.status === 'manual_review'
      ) || allRuns[0];

      if (targetRun && (!selectedRun || !allRuns.some(r => r.id === selectedRun.id))) {
        setSelectedRun(targetRun);
        setRepairStatus(targetRun.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleSelectRun = (r: ScrapeRun) => {
    setSelectedRun(r);
    setRepairAttempt(null);
    setRepairedData(null);
    setRepairStatus(r.status);
  };

  const handleHeal = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      const res = await healScrapeRun(selectedRun.scraper_id || 1, selectedRun.id);
      setRepairAttempt({
        id: res.attempt_id,
        scrape_run_id: res.scrape_run_id,
        external_repair_id: res.external_repair_id,
        instruction: res.instruction,
        approval_status: res.approval_status,
        rerun_status: 'pending',
        result: 'pending',
        duration_ms: 0,
        created_at: new Date().toISOString()
      });
      setRepairStatus('repair_requested');
      await loadRuns();
    } catch (e: any) {
      alert(`Heal failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRepair = async () => {
    if (!selectedRun || !repairAttempt) return;
    try {
      setLoading(true);
      const res = await approveRepair(selectedRun.scraper_id || 1, repairAttempt.id);
      setRepairedData(res.repaired_data || res.repaired_result);
      setRepairStatus(res.status || 'repaired');
      await loadRuns();
    } catch (e: any) {
      alert(`Approval failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyRepairedJson = () => {
    if (!repairedData) return;
    navigator.clipboard.writeText(JSON.stringify(repairedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'success':
        return { label: 'SUCCESS', color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' };
      case 'repaired':
        return { label: 'REPAIRED', color: 'var(--healed)', bg: 'rgba(139,92,246,0.1)' };
      case 'degraded':
        return { label: 'DEGRADED', color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)' };
      case 'repair_requested':
        return { label: 'PENDING APPROVAL', color: 'var(--accent)', bg: 'rgba(168,85,247,0.1)' };
      case 'manual_review':
        return { label: 'MANUAL REVIEW', color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' };
      default:
        return { label: s.toUpperCase(), color: 'var(--text-secondary)', bg: 'var(--bg-elevated)' };
    }
  };

  // Parse missing fields dynamically
  const parseMissingFields = (run: ScrapeRun): string[] => {
    try {
      if (run.validation_errors) {
        const errs: string[] = typeof run.validation_errors === 'string' ? JSON.parse(run.validation_errors) : run.validation_errors;
        const missing = errs
          .filter(e => e.includes("Missing required field") || e.includes("missing"))
          .map(e => e.replace(/.*Missing required field: '([^']+)'.*/, '$1').replace(/.*missing.*/, '$&'));
        if (missing.length > 0) return missing;
      }
    } catch {
      // ignore
    }
    return run.workflow_type === 'jobs' ? ['company', 'description'] : ['price', 'currency', 'availability'];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="stagger-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={stagger(0)}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
              Bright Data Scraper Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Diagnose broken website selectors, synthesize refactor instructions, and approve automated repairs.
          </p>
        </div>

        <button
          onClick={loadRuns}
          disabled={loading}
          className="btn-spring px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 self-start md:self-auto"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        >
          <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Runs</span>
        </button>
      </div>

      {/* Main Grid: Left Runs Selector, Right 3-Stage Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Runs Audit List (4 cols) */}
        <div className="lg:col-span-4 space-y-3 stagger-in" style={stagger(1)}>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Execution History
            </span>
            <span className="mono text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
              {runs.length} Runs
            </span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {runs.length === 0 && !loading && (
              <div className="p-6 rounded-xl text-center text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-tertiary)' }}>
                No runs recorded yet. Execute a scrape from the Product or Job tab.
              </div>
            )}

            {runs.map((r) => {
              const isSelected = selectedRun?.id === r.id;
              const badge = statusBadge(r.status);
              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRun(r)}
                  className="p-4 rounded-xl glow-hover cursor-pointer transition-all space-y-2"
                  style={{
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 16px rgba(168,85,247,0.15)' : 'none'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Run #{r.id}
                    </span>
                    <span
                      className="text-[10px] mono font-bold px-2 py-0.5 rounded"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mono text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {r.target_url}
                  </div>

                  <div className="flex items-center justify-between text-[10px] mono pt-1" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{r.workflow_type?.toUpperCase() || 'PRODUCTS'}</span>
                    <span style={{ color: r.data_quality_score >= 80 ? 'var(--success)' : r.data_quality_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      Quality: {r.data_quality_score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Healing Workstation (8 cols) */}
        <div className="lg:col-span-8 space-y-6 stagger-in" style={stagger(2)}>
          {selectedRun ? (
            <div className="rounded-2xl p-6 space-y-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              {/* Selected Run Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Target Under Inspection
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                    <span>Run #{selectedRun.id}</span>
                    <span className="text-xs font-normal mono px-2 py-0.5 rounded max-w-sm truncate" style={{ background: 'var(--bg-root)', color: 'var(--text-secondary)' }}>
                      {selectedRun.target_url}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                      Quality Score
                    </div>
                    <div className="text-xl font-bold mono" style={{ color: selectedRun.data_quality_score >= 80 ? 'var(--success)' : selectedRun.data_quality_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                      {selectedRun.data_quality_score}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: Failure Diagnosis */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--warning)' }}>
                    <AlertTriangle size={14} />
                    <span>Step 1 · Schema Degradation Diagnosis</span>
                  </div>
                  <span className="text-[10px] mono text-slate-400">Automated Audit</span>
                </div>

                <div className="p-4 rounded-xl space-y-2.5 text-xs" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)' }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Target URL:</span>
                    <code className="mono text-[11px] px-2 py-0.5 rounded truncate max-w-md" style={{ background: 'var(--bg-surface)', color: 'var(--accent)' }}>
                      {selectedRun.target_url}
                    </code>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Missing Schema Fields:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {parseMissingFields(selectedRun).map(f => (
                        <span key={f} className="px-2 py-0.5 rounded mono text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Bright Data Refactor Plan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                    <Code2 size={14} />
                    <span>Step 2 · Bright Data Refactor Template</span>
                  </div>

                  {!repairAttempt && repairStatus !== 'repaired' && repairStatus !== 'manual_review' && (
                    <button
                      onClick={handleHeal}
                      disabled={loading}
                      className="btn-spring px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 16px rgba(168,85,247,0.3)' }}
                    >
                      <Sparkles size={12} className={loading ? 'animate-spin' : ''} />
                      <span>{loading ? 'Synthesizing…' : 'Generate Healing Plan'}</span>
                    </button>
                  )}
                </div>

                {repairAttempt ? (
                  <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)' }}>
                    <div className="text-[11px] mono p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {repairAttempt.instruction}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs flex items-center gap-2">
                        <span style={{ color: 'var(--text-tertiary)' }}>Approval Gate:</span>
                        <span className="mono font-bold uppercase text-[11px] px-2 py-0.5 rounded" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                          {repairAttempt.approval_status}
                        </span>
                      </div>

                      {repairStatus !== 'repaired' && repairStatus !== 'manual_review' && (
                        <button
                          onClick={handleApproveRepair}
                          disabled={loading}
                          className="btn-spring px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, var(--success), #059669)',
                            color: '#fff',
                            boxShadow: '0 0 20px rgba(16,185,129,0.3)',
                          }}
                        >
                          <Check size={14} />
                          <span>Approve Repair & Re-Run Scraper</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl text-center text-xs space-y-2" style={{ background: 'var(--bg-root)', border: '1px dashed var(--border-default)' }}>
                    <div className="text-slate-400">Click &quot;Generate Healing Plan&quot; above to synthesize a Bright Data refactor instruction for this run.</div>
                  </div>
                )}
              </div>

              {/* Step 3: Verification & Recovery Results */}
              {repairStatus === 'repaired' && (
                <div className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--healed)' }}>
                      <CheckCircle2 size={16} />
                      <span>Step 3 · Verified Healing Successful</span>
                    </div>

                    <button
                      onClick={copyRepairedJson}
                      className="p-2 rounded-lg text-xs font-medium flex items-center gap-1 btn-spring"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                    >
                      {copied ? <CheckCheck size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                      <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  {repairedData && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Recovered Record Payload:</div>
                      <pre className="p-3.5 rounded-xl text-xs mono overflow-x-auto leading-relaxed" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                        {JSON.stringify(repairedData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Review Fallback */}
              {repairStatus === 'manual_review' && (
                <div className="p-5 rounded-xl space-y-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>
                    <ShieldAlert size={16} />
                    <span>Manual Review Escalation</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    The target public page structure is missing critical markup or the URL does not contain product/job schema data. Automatic refactor could not recover missing fields. Escalated to human operator review.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl text-center space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="empty-orb mx-auto mb-3" />
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select a Run to Begin</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Choose a degraded or completed run from the left panel to test the Self-Healing engine.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
