import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Clock, Globe } from 'lucide-react';

export interface ScrapeProgressTimelineProps {
  isActive: boolean;
  isCompleted?: boolean;
  error?: string | null;
  targetUrl?: string;
  workflowType?: string;
  qualityScore?: number;
}

const STEPS = [
  { id: 'submitted', label: 'Request submitted' },
  { id: 'snapshot', label: 'Snapshot created' },
  { id: 'waiting', label: 'Waiting for provider' },
  { id: 'processing', label: 'Processing snapshot' },
  { id: 'downloading', label: 'Downloading structured result' },
  { id: 'validating', label: 'Validating records' },
  { id: 'completed', label: 'Completed' },
];

export const ScrapeProgressTimeline: React.FC<ScrapeProgressTimelineProps> = ({
  isActive,
  isCompleted = false,
  error = null,
  targetUrl,
  workflowType = 'products',
  qualityScore,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isActive && !isCompleted && !error) {
      setCurrentStepIndex(0);
      setElapsedSec(0);
      return;
    }

    if (error) {
      return; // stop on error step
    }

    if (isCompleted) {
      setCurrentStepIndex(STEPS.length - 1);
      return;
    }

    if (isActive) {
      setCurrentStepIndex(0);
      setElapsedSec(0);
      const timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);

      // Step progression based on real time progression during Bright Data fetch
      const stepTimer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < STEPS.length - 2) {
            return prev + 1;
          }
          return prev;
        });
      }, 1400);

      return () => {
        clearInterval(timer);
        clearInterval(stepTimer);
      };
    }
  }, [isActive, isCompleted, error]);

  if (!isActive && !isCompleted && !error) return null;

  return (
    <div
      role="region"
      aria-label="Extraction Progress Tracker"
      className="p-5 rounded-2xl glow-hover space-y-4 transition-all duration-200"
      style={{
        background: 'var(--bg-surface, #0e0e12)',
        border: `1px solid ${
          error
            ? 'rgba(239, 68, 68, 0.4)'
            : isCompleted
            ? 'rgba(16, 185, 129, 0.3)'
            : 'rgba(168, 85, 247, 0.3)'
        }`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          {error ? (
            <AlertCircle size={16} className="text-red-400 shrink-0" />
          ) : isCompleted ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <Loader2 size={16} className="animate-spin text-purple-400 shrink-0" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            {error
              ? 'Provider Extraction Failed'
              : isCompleted
              ? `${workflowType.toUpperCase()} Extraction & Validation Completed`
              : `Active ${workflowType.toUpperCase()} Scraper Progress`}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs mono">
          {targetUrl && (
            <div className="flex items-center gap-1.5 text-slate-400 truncate max-w-xs" title={targetUrl}>
              <Globe size={11} className="shrink-0 text-purple-400" />
              <span className="truncate">{targetUrl}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <Clock size={11} />
            <span>{elapsedSec}s</span>
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
        {STEPS.map((step, idx) => {
          const isDone = isCompleted || (!error && idx < currentStepIndex);
          const isCurrent = !isCompleted && !error && idx === currentStepIndex;
          const isFailed = error && idx === currentStepIndex;

          let statusBg = 'var(--bg-root, #070709)';
          let statusBorder = 'rgba(255, 255, 255, 0.06)';
          let textColor = 'var(--text-tertiary, #60636e)';

          if (isDone) {
            statusBg = 'rgba(16, 185, 129, 0.08)';
            statusBorder = 'rgba(16, 185, 129, 0.25)';
            textColor = 'var(--success, #10b981)';
          } else if (isCurrent) {
            statusBg = 'rgba(168, 85, 247, 0.12)';
            statusBorder = 'rgba(168, 85, 247, 0.4)';
            textColor = 'var(--accent, #a855f7)';
          } else if (isFailed) {
            statusBg = 'rgba(239, 68, 68, 0.12)';
            statusBorder = 'rgba(239, 68, 68, 0.4)';
            textColor = 'var(--danger, #ef4444)';
          }

          return (
            <div
              key={step.id}
              className="p-2.5 rounded-xl flex items-center gap-2 text-xs transition-all duration-150"
              style={{
                background: statusBg,
                border: `1px solid ${statusBorder}`,
              }}
            >
              {isDone ? (
                <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-purple-400" />
              ) : isFailed ? (
                <AlertCircle size={13} className="shrink-0 text-red-400" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-white/10 flex items-center justify-center text-[9px] mono text-slate-500 shrink-0">
                  {idx + 1}
                </span>
              )}
              <span className="text-[11px] font-semibold truncate" style={{ color: textColor }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl text-xs mono leading-relaxed"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--danger, #ef4444)',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {isCompleted && qualityScore !== undefined && (
        <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
          <span>Schema Validation Quality Score:</span>
          <span
            className="mono font-bold"
            style={{
              color:
                qualityScore >= 80
                  ? 'var(--success)'
                  : qualityScore >= 50
                  ? 'var(--warning)'
                  : 'var(--danger)',
            }}
          >
            {qualityScore}%
          </span>
        </div>
      )}
    </div>
  );
};
