import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Copy, Wrench, ShieldCheck } from 'lucide-react';

export type ToastType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'copied' 
  | 'repair_requested' 
  | 'repair_verified' 
  | 'degraded';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = React.useState(false);

  const handleDismiss = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 160);
  }, [onDismiss, toast.id]);

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: 'var(--success, #10b981)' }} />;
      case 'copied':
        return <Copy size={16} style={{ color: 'var(--success, #10b981)' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--danger, #ef4444)' }} />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle size={16} style={{ color: 'var(--warning, #f59e0b)' }} />;
      case 'repair_requested':
        return <Wrench size={16} style={{ color: 'var(--accent, #a855f7)' }} />;
      case 'repair_verified':
        return <ShieldCheck size={16} style={{ color: 'var(--healed, #8b5cf6)' }} />;
      case 'info':
      default:
        return <Info size={16} style={{ color: 'var(--accent, #a855f7)' }} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
      case 'copied':
        return 'rgba(16, 185, 129, 0.35)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      case 'warning':
      case 'degraded':
        return 'rgba(245, 158, 11, 0.35)';
      case 'repair_requested':
        return 'rgba(168, 85, 247, 0.35)';
      case 'repair_verified':
        return 'rgba(139, 92, 246, 0.35)';
      default:
        return 'var(--border-default)';
    }
  };

  return (
    <div
      role="alert"
      className={`${isExiting ? 'toast-exiting' : 'toast-entering'} flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-xl pointer-events-auto max-w-sm w-full`}
      style={{
        background: 'rgba(14, 14, 18, 0.94)',
        border: `1px solid ${getBorderColor()}`,
        boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="shrink-0 mt-0.5" aria-hidden="true">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white tracking-tight">{toast.title}</div>
        {toast.message && (
          <p className="text-[11px] mt-0.5 leading-relaxed truncate-2-lines" style={{ color: 'var(--text-secondary, #9da0aa)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md text-slate-400 hover:text-white transition-colors focus-ring cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};
