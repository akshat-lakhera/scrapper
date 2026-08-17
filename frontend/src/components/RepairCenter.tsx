import React, { useEffect, useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Copy, 
  CheckCheck, 
  GitBranch, 
  ShieldCheck, 
  FileCode2 
} from 'lucide-react';
import type { ScrapeRun, RepairAttempt } from '../types';
import { fetchRuns, healScrapeRun, approveRepair, fetchCandidatePatches } from '../api';
import { stagger } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';

const REPAIR_STATE_MACHINE = [
  { id: 'healthy', label: 'Healthy' },
  { id: 'degraded', label: 'Degradation detected' },
  { id: 'repair_requested', label: 'Repair requested' },
  { id: 'approval_required', label: 'Approval required' },
  { id: 'rerunning', label: 'Rerunning' },
  { id: 'verification', label: 'Verification' },
  { id: 'repaired', label: 'Repaired' },
];

export const RepairCenter: React.FC = () => {
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ScrapeRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [repairAttempt, setRepairAttempt] = useState<RepairAttempt | null>(null);
  const [activePatch, setActivePatch] = useState<any | null>(null);
  const [repairedData, setRepairedData] = useState<any>(null);
  const [repairStatus, setRepairStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { showToast, showCopyToast } = useToast();

  const loadRuns = async () => {
    try {
      setLoading(true);
      const allRuns = await fetchRuns();
      setRuns(allRuns);

      const targetRun =
        allRuns.find(
          (r) =>
            r.status === 'degraded' ||
            r.status === 'repair_requested' ||
            r.status === 'repaired' ||
            r.status === 'manual_review'
        ) || allRuns[0];

      if (targetRun && (!selectedRun || !allRuns.some((r) => r.id === selectedRun.id))) {
        setSelectedRun(targetRun);
        setRepairStatus(targetRun.status);
      }

      // Fetch latest patches
      try {
        const patches = await fetchCandidatePatches();
        if (patches && patches.length > 0 && targetRun) {
          const matchingPatch = patches.find((p: any) => p.scrape_run_id === targetRun.id) || patches[0];
          setActivePatch(matchingPatch);
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
    setRepairAttempt(null);
    setRepairedData(null);
    setRepairStatus(r.status);

    try {
      const patches = await fetchCandidatePatches();
      const matchingPatch = patches.find((p: any) => p.scrape_run_id === r.id);
      setActivePatch(matchingPatch || null);
    } catch {}
  };

  const handleHeal = async () => {
    if (!selectedRun) return;
    try {
      setLoading(true);
      showToast('info', 'Synthesizing Candidate Rule Patch', `Run #${selectedRun.id}`);
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
        created_at: new Date().toISOString(),
      });
      setRepairStatus('repair_requested');
      showToast('repair_requested', 'Candidate Patch Synthesized', 'Tested on regression suite with confidence gate');
      await loadRuns();
    } catch (e: any) {
      showToast('error', 'Heal Generation Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRepair = async () => {
    if (!selectedRun || !repairAttempt) return;
    try {
      setLoading(true);
      showToast('info', 'Promoting Rule Bundle & Rerunning', `Attempt #${repairAttempt.id}`);
      const res = await approveRepair(selectedRun.id, repairAttempt.id);
      setRepairedData(res.repaired_data || res.repaired_result);
      setRepairStatus(res.status || 'repaired');
      showToast('repair_verified', 'Rule Bundle Promoted', `Promoted to version v${res.promoted_bundle_version || 2}`);
      await loadRuns();
    } catch (e: any) {
      showToast('error', 'Repair Approval Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyRepairedJson = () => {
    if (!repairedData) return;
    navigator.clipboard.writeText(JSON.stringify(repairedData, null, 2));
    setCopied(true);
    showCopyToast('Repaired JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStateMachineIndex = () => {
    if (repairStatus === 'repaired') return 6;
    if (loading && repairAttempt) return 4;
    if (repairAttempt) return 3;
    if (repairStatus === 'degraded' || repairStatus === 'manual_review') return 1;
    if (repairStatus === 'success') return 0;
    return 0;
  };

  const currentMachineIndex = getStateMachineIndex();

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="stagger-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={stagger(0)} aria-labelledby="repair-title">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} className="text-cyan-400" aria-hidden="true" />
            <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold text-cyan-400">
              Autonomous Self-Healing
            </span>
          </div>
          <h1 id="repair-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Self-Healing Engine & Versioned Rule Workstation
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Root-cause selector analysis, candidate rule synthesis, multi-page regression testing, and versioned rule promotion.
          </p>
        </div>

        <button
          onClick={loadRuns}
          disabled={loading}
          className="btn-spring px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start md:self-auto focus-ring"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
        >
          <RotateCcw size={13} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
          <span>Refresh Runs</span>
        </button>
      </section>

      {/* 7-Stage State Machine Progress Stepper */}
      <section className="p-6 rounded-2xl glow-hover stagger-in space-y-4" style={{ ...stagger(1), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }} aria-label="Self-Healing Lifecycle State Machine">
        <div className="flex items-center justify-between">
          <span className="mono text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Self-Healing State Machine
          </span>
          <span className="mono text-xs font-bold text-purple-400">
            Stage {currentMachineIndex + 1} of {REPAIR_STATE_MACHINE.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {REPAIR_STATE_MACHINE.map((step, idx) => {
            const isPassed = idx < currentMachineIndex;
            const isCurrent = idx === currentMachineIndex;

            return (
              <div
                key={step.id}
                className="p-3 rounded-xl flex flex-col justify-between transition-all"
                style={{
                  background: isCurrent
                    ? 'rgba(168,85,247,0.15)'
                    : isPassed
                    ? 'rgba(16,185,129,0.08)'
                    : 'var(--bg-elevated)',
                  border: isCurrent
                    ? '1px solid var(--accent)'
                    : isPassed
                    ? '1px solid rgba(16,185,129,0.3)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="mono text-[9px] font-bold uppercase text-slate-400">
                    Step {idx + 1}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 size={12} className="text-emerald-400" aria-hidden="true" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" aria-hidden="true" />
                  ) : null}
                </div>
                <div
                  className="text-xs font-semibold"
                  style={{
                    color: isCurrent
                      ? 'var(--accent)'
                      : isPassed
                      ? 'var(--success)'
                      : 'var(--text-tertiary)',
                  }}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Target Under Inspection */}
        <section className="lg:col-span-1 space-y-4" aria-labelledby="runs-list-heading">
          <div className="flex items-center justify-between">
            <h2 id="runs-list-heading" className="text-xs mono uppercase tracking-wider font-semibold text-slate-400">
              Execution History ({runs.length})
            </h2>
            <span className="text-[11px] mono text-purple-400">Select Target</span>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {runs.map((r) => {
              const isSelected = selectedRun?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRun(r)}
                  className="w-full p-4 rounded-2xl text-left transition-all btn-spring focus-ring space-y-2 block"
                  style={{
                    background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 20px rgba(168,85,247,0.15)' : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="mono text-xs font-bold text-white">Run #{r.id}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  <div className="mono text-xs truncate text-slate-300" title={r.target_url}>
                    {r.target_url}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mono text-slate-400">
                    <span className="uppercase text-purple-400 font-semibold">{r.workflow_type}</span>
                    <span className="font-semibold text-slate-300">Quality: {r.data_quality_score}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Column: Workstation & Rule Promotion Suite */}
        <section className="lg:col-span-2 space-y-6" aria-labelledby="workstation-heading">
          {selectedRun ? (
            <div className="space-y-6">
              {/* Target Banner */}
              <div className="p-6 rounded-2xl space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="mono text-[10px] px-2.5 py-0.5 rounded font-bold uppercase" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                        {selectedRun.workflow_type}
                      </span>
                      <span className="mono text-[11px] text-slate-400">Run #{selectedRun.id}</span>
                      <span className="mono text-[10px] px-2 py-0.5 rounded font-semibold text-slate-300" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {selectedRun.selected_strategy || 'rule_bundle_v1'}
                      </span>
                    </div>
                    <h2 id="workstation-heading" className="mono text-sm font-bold text-white truncate max-w-xl">
                      {selectedRun.target_url}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={repairStatus || selectedRun.status} size="md" />
                    <div className="mono text-xs font-bold text-right ml-2">
                      <div className="text-[10px] uppercase text-slate-400">Quality Score</div>
                      <div className="text-sm" style={{ color: selectedRun.data_quality_score >= 80 ? 'var(--success)' : 'var(--danger)' }}>
                        {selectedRun.data_quality_score}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                {(selectedRun.status === 'degraded' || selectedRun.status === 'provider_error' || selectedRun.status === 'manual_review') && !repairAttempt && (
                  <button
                    onClick={handleHeal}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-spring focus-ring"
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
                    }}
                  >
                    <Sparkles size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                    <span>{loading ? 'Synthesizing Candidate Patch & Testing…' : 'Synthesize Candidate Rule Patch'}</span>
                  </button>
                )}
              </div>

              {/* Versioned Candidate Patch & Regression Proof Card */}
              {activePatch && (
                <div className="p-6 rounded-2xl space-y-5 stagger-in" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 8px 32px rgba(168,85,247,0.1)' }}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <GitBranch size={16} className="text-purple-400" aria-hidden="true" />
                      <h3 className="mono text-sm font-bold text-white">
                        Rule Bundle Patch (v{activePatch.from_version} → v{activePatch.to_version})
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                        Confidence: {Math.round(activePatch.confidence_score * 100)}%
                      </span>
                      <span className="mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Recovery: {Math.round(activePatch.field_recovery_rate * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Selector Diff Table */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase mono text-slate-300 flex items-center gap-1.5">
                      <FileCode2 size={13} className="text-purple-400" aria-hidden="true" />
                      <span>Synthesized Field Selector Replacements</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40">
                      <table className="w-full text-left text-xs mono">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 bg-white/[0.02]">
                            <th className="py-2.5 px-3">FIELD</th>
                            <th className="py-2.5 px-3">PREVIOUS SELECTOR</th>
                            <th className="py-2.5 px-3">CANDIDATE SELECTOR</th>
                            <th className="py-2.5 px-3">STABILITY</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Object.entries(activePatch.selector_diff || {}).map(([fName, diff]: [string, any]) => (
                            <tr key={fName}>
                              <td className="py-2.5 px-3 font-bold text-purple-300">{fName}</td>
                              <td className="py-2.5 px-3 text-red-400 truncate max-w-[160px] line-through">{diff.old_selector || 'None'}</td>
                              <td className="py-2.5 px-3 text-emerald-400 font-semibold truncate max-w-[200px]">{diff.new_selector || 'Manual review'}</td>
                              <td className="py-2.5 px-3 text-slate-300">{diff.stability_score ? `${Math.round(diff.stability_score * 100)}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Multi-Page Regression Test Suite */}
                  {activePatch.regression_tests && activePatch.regression_tests.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase mono text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-400" aria-hidden="true" />
                        <span>Holdout Regression Suite Results ({activePatch.regression_tests.length} Samples)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activePatch.regression_tests.map((test: any, idx: number) => (
                          <div key={idx} className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs mono">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 uppercase text-[10px] font-bold">{test.page_type}</span>
                              <span className={test.passed_validity ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                Score: {test.quality_score}%
                              </span>
                            </div>
                            <div className="truncate text-slate-300 text-[11px]" title={test.target_url}>{test.target_url}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1-Click Approve & Promote Button */}
                  {activePatch.status === 'pending_approval' && (
                    <button
                      onClick={handleApproveRepair}
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-spring focus-ring"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                      }}
                    >
                      <Check size={15} aria-hidden="true" />
                      <span>Approve & Promote Candidate Rules (v{activePatch.to_version})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Repaired Data Result Display */}
              {repairedData && (
                <div className="p-6 rounded-2xl space-y-4 stagger-in bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400" aria-hidden="true" />
                      <h3 className="mono text-sm font-bold text-white">Promoted Rule Bundle Output</h3>
                    </div>
                    <button
                      onClick={copyRepairedJson}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 btn-spring bg-black/40 text-slate-300 hover:text-white"
                    >
                      {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl text-xs mono overflow-x-auto bg-black/60 border border-white/5 text-emerald-300">
                    {JSON.stringify(repairedData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center space-y-2 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="empty-orb mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">No Target Selected</p>
              <p className="text-xs text-slate-400">Select an execution run from the left panel to inspect diagnostics.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
