import React from 'react';
import { Activity, PieChart, ShieldCheck, CheckCircle2, AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';
import type { Metrics, ScrapeRun } from '../types';

interface HealthRingProps {
  metrics: Metrics | null;
  loading?: boolean;
}

export const ScraperHealthRing: React.FC<HealthRingProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="p-5 rounded-2xl flex items-center justify-center h-48 bg-surface border border-white/5 animate-pulse">
        <div className="w-24 h-24 rounded-full border-4 border-white/10" />
      </div>
    );
  }

  const total = metrics?.total_runs || 0;
  const success = metrics?.successful_runs || 0;
  const repaired = metrics?.repaired_runs || 0;
  const degraded = metrics?.degraded_runs || 0;
  const manual = metrics?.manual_review_runs || 0;

  const healthyRate = total > 0 ? Math.round(((success + repaired) / total) * 100) : 100;
  const strokeDashoffset = 283 - (283 * (healthyRate / 100));

  const ringColor =
    healthyRate >= 80 ? 'var(--success, #10b981)' : healthyRate >= 50 ? 'var(--warning, #f59e0b)' : 'var(--danger, #ef4444)';

  return (
    <div
      role="region"
      aria-label={`Scraper Reliability Score: ${healthyRate}% based on ${total} total executions`}
      className="p-5 rounded-2xl flex flex-col justify-between"
      style={{
        background: 'var(--bg-surface, #0e0e12)',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Collector Health</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">{total} Total Runs</span>
      </div>

      <div className="flex items-center gap-5 my-2">
        {/* SVG Ring */}
        <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={ringColor}
              strokeWidth="8"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 600ms var(--ease-out, cubic-bezier(0.23, 1, 0.32, 1))' }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-extrabold font-mono text-white leading-none">{healthyRate}%</span>
            <span className="text-[9px] font-mono uppercase text-slate-400 mt-0.5">Reliable</span>
          </div>
        </div>

        {/* Text Equivalents & Breakdown */}
        <div className="space-y-1.5 flex-1 text-xs font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={11} /> Success:
            </span>
            <span className="font-bold text-white">{success}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-purple-400">
              <Wrench size={11} /> Repaired:
            </span>
            <span className="font-bold text-white">{repaired}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle size={11} /> Degraded:
            </span>
            <span className="font-bold text-white">{degraded}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-red-400">
              <ShieldAlert size={11} /> Manual Review:
            </span>
            <span className="font-bold text-white">{manual}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatusDistributionProps {
  runs: ScrapeRun[];
  loading?: boolean;
}

export const StatusDistributionBar: React.FC<StatusDistributionProps> = ({ runs, loading }) => {
  if (loading) {
    return (
      <div className="p-5 rounded-2xl h-48 bg-surface border border-white/5 animate-pulse" />
    );
  }

  const total = runs.length;
  if (total === 0) {
    return (
      <div
        className="p-5 rounded-2xl flex flex-col justify-between"
        style={{
          background: 'var(--bg-surface, #0e0e12)',
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
        }}
      >
        <div className="flex items-center gap-2">
          <PieChart size={14} className="text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Execution Status Distribution</span>
        </div>
        <div className="py-6 text-center text-xs text-slate-500 font-mono">
          No execution runs recorded yet.
        </div>
      </div>
    );
  }

  const success = runs.filter((r) => r.status === 'success').length;
  const repaired = runs.filter((r) => r.status === 'repaired').length;
  const degraded = runs.filter((r) => r.status === 'degraded' || r.status === 'repair_requested').length;
  const manual = runs.filter((r) => r.status === 'manual_review' || r.status === 'provider_error').length;

  const successPct = Math.round((success / total) * 100);
  const repairedPct = Math.round((repaired / total) * 100);
  const degradedPct = Math.round((degraded / total) * 100);
  const manualPct = Math.max(0, 100 - successPct - repairedPct - degradedPct);

  return (
    <div
      role="region"
      aria-label={`Execution Status Distribution: ${success} success, ${repaired} repaired, ${degraded} degraded, ${manual} manual review`}
      className="p-5 rounded-2xl flex flex-col justify-between space-y-4"
      style={{
        background: 'var(--bg-surface, #0e0e12)',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Status Breakdown</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Sample of {total} runs</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-3.5 rounded-lg overflow-hidden flex bg-white/5 p-0.5 gap-0.5" aria-hidden="true">
        {successPct > 0 && (
          <div
            style={{ width: `${successPct}%`, background: 'var(--success, #10b981)' }}
            className="h-full rounded-sm transition-all duration-300"
            title={`Success: ${successPct}%`}
          />
        )}
        {repairedPct > 0 && (
          <div
            style={{ width: `${repairedPct}%`, background: 'var(--healed, #8b5cf6)' }}
            className="h-full rounded-sm transition-all duration-300"
            title={`Repaired: ${repairedPct}%`}
          />
        )}
        {degradedPct > 0 && (
          <div
            style={{ width: `${degradedPct}%`, background: 'var(--warning, #f59e0b)' }}
            className="h-full rounded-sm transition-all duration-300"
            title={`Degraded: ${degradedPct}%`}
          />
        )}
        {manualPct > 0 && (
          <div
            style={{ width: `${manualPct}%`, background: 'var(--danger, #ef4444)' }}
            className="h-full rounded-sm transition-all duration-300"
            title={`Manual/Error: ${manualPct}%`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase">Success</div>
          <div className="font-bold text-emerald-400">{successPct}% ({success})</div>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase">Repaired</div>
          <div className="font-bold text-purple-400">{repairedPct}% ({repaired})</div>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase">Degraded</div>
          <div className="font-bold text-amber-400">{degradedPct}% ({degraded})</div>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="text-[10px] text-slate-400 uppercase">Review/Err</div>
          <div className="font-bold text-red-400">{manualPct}% ({manual})</div>
        </div>
      </div>
    </div>
  );
};

interface FieldCompletenessProps {
  fields: Array<{ name: string; required?: boolean; present: boolean; value?: any }>;
  workflow: string;
}

export const FieldCompletenessBar: React.FC<FieldCompletenessProps> = ({ fields, workflow }) => {
  const total = fields.length;
  if (total === 0) return null;

  const presentCount = fields.filter((f) => f.present).length;
  const completeness = Math.round((presentCount / total) * 100);

  return (
    <div
      role="region"
      aria-label={`Schema Attribute Completeness: ${completeness}% (${presentCount} of ${total} fields extracted)`}
      className="p-4 rounded-xl space-y-3"
      style={{
        background: 'var(--bg-root, #070709)',
        border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      }}
    >
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="font-bold text-slate-300 uppercase tracking-wider">
          Schema Completeness ({workflow})
        </span>
        <span
          className="font-extrabold"
          style={{
            color:
              completeness >= 80
                ? 'var(--success)'
                : completeness >= 50
                ? 'var(--warning)'
                : 'var(--danger)',
          }}
        >
          {presentCount}/{total} Fields ({completeness}%)
        </span>
      </div>

      <div className="h-2 rounded-full overflow-hidden bg-white/5" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${completeness}%`,
            background:
              completeness >= 80
                ? 'var(--success, #10b981)'
                : completeness >= 50
                ? 'var(--warning, #f59e0b)'
                : 'var(--danger, #ef4444)',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {fields.map((f) => (
          <span
            key={f.name}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
              f.present
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : f.required
                ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                : 'bg-white/5 text-slate-500 border border-white/5'
            }`}
          >
            {f.present ? '✓' : f.required ? '✗' : '○'} {f.name}
          </span>
        ))}
      </div>
    </div>
  );
};
