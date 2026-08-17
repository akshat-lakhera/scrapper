import React from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  Clock, 
  Loader2, 
  Info, 
  Zap 
} from 'lucide-react';

export type ScraperStatus = 
  | 'success'
  | 'repaired'
  | 'degraded'
  | 'repair_requested'
  | 'manual_review'
  | 'provider_error'
  | 'provider_timeout'
  | 'running'
  | 'collecting'
  | 'loading'
  | 'unsupported_workflow'
  | 'idle'
  | 'ready'
  | string;

interface StatusBadgeProps {
  status: ScraperStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  labelOverride?: string;
  className?: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  ariaDescription: string;
  isPulsing?: boolean;
}

const statusMap: Record<string, StatusConfig> = {
  success: {
    label: 'SUCCESS',
    color: 'var(--success, #10b981)',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.28)',
    icon: CheckCircle2,
    ariaDescription: 'Scrape completed successfully with validated schema.',
  },
  repaired: {
    label: 'REPAIRED',
    color: 'var(--healed, #8b5cf6)',
    bg: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.32)',
    icon: ShieldCheck,
    ariaDescription: 'Scraper degradation repaired and verified.',
  },
  degraded: {
    label: 'DEGRADED',
    color: 'var(--warning, #f59e0b)',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.32)',
    icon: AlertTriangle,
    ariaDescription: 'Schema degradation detected. Missing required attributes.',
  },
  repair_requested: {
    label: 'PENDING REPAIR',
    color: 'var(--accent, #a855f7)',
    bg: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.32)',
    icon: Wrench,
    ariaDescription: 'Self-healing repair plan generated, awaiting approval.',
  },
  manual_review: {
    label: 'MANUAL REVIEW',
    color: 'var(--danger, #ef4444)',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.32)',
    icon: ShieldAlert,
    ariaDescription: 'Automated repair unable to recover fields. Human review required.',
  },
  provider_error: {
    label: 'PROVIDER ERROR',
    color: 'var(--danger, #ef4444)',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.38)',
    icon: AlertCircle,
    ariaDescription: 'Upstream provider error occurred during extraction.',
  },
  provider_timeout: {
    label: 'TIMEOUT',
    color: 'var(--warning, #f59e0b)',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)',
    icon: Clock,
    ariaDescription: 'Provider request timed out.',
  },
  running: {
    label: 'RUNNING',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.32)',
    icon: Loader2,
    ariaDescription: 'Scraping engine currently executing.',
    isPulsing: true,
  },
  collecting: {
    label: 'COLLECTING',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.32)',
    icon: Loader2,
    ariaDescription: 'Collecting structured dataset records.',
    isPulsing: true,
  },
  loading: {
    label: 'LOADING',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.28)',
    icon: Loader2,
    ariaDescription: 'Loading execution status.',
    isPulsing: true,
  },
  unsupported_workflow: {
    label: 'UNSUPPORTED',
    color: 'var(--text-tertiary, #60636e)',
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    icon: Info,
    ariaDescription: 'Workflow type is not currently configured.',
  },
  ready: {
    label: 'READY',
    color: 'var(--text-secondary, #9da0aa)',
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
    icon: Zap,
    ariaDescription: 'Collector is ready for new execution.',
  },
  idle: {
    label: 'IDLE',
    color: 'var(--text-secondary, #9da0aa)',
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
    icon: Zap,
    ariaDescription: 'Scraper in idle state.',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'sm',
  showIcon = true,
  labelOverride,
  className = '',
}) => {
  const normKey = (status || 'idle').toLowerCase().trim();
  const config = statusMap[normKey] || {
    label: (status || 'UNKNOWN').toUpperCase(),
    color: 'var(--text-secondary, #9da0aa)',
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    icon: Info,
    ariaDescription: `Status: ${status}`,
  };

  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      role="status"
      aria-label={config.ariaDescription}
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-md transition-colors ${
        isSm ? 'px-2 py-0.5 text-[10px] gap-1.5' : 'px-2.5 py-1 text-xs gap-2'
      } ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {showIcon && (
        <Icon
          size={isSm ? 11 : 13}
          className={`shrink-0 ${config.isPulsing ? 'animate-spin' : ''}`}
          style={{ color: config.color }}
          aria-hidden="true"
        />
      )}
      <span>{labelOverride || config.label}</span>
    </span>
  );
};
