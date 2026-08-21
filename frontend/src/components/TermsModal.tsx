import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, X, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in font-mono"
    >
      <div className="max-w-3xl w-full max-h-[85vh] bg-[#090d19] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-[#0c1222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Terms of Service & API Agreement</h3>
              <p className="text-xs text-slate-400">MarketScout Enterprise Workstation License</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors cursor-pointer border border-white/15"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              1. Acceptable Use & Extraction Compliance
            </h4>
            <p>
              By operating MarketScout, you agree to comply with local laws and regulations governing automated web extraction. MarketScout is built for legitimate research, price intelligence, competitive analysis, and dataset verification.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              2. Autonomous Self-Healing Telemetry
            </h4>
            <p>
              The self-healing engine synthesizes CSS patches and selector fallbacks strictly from live DOM structural mutations. Patches are regression-tested in staging sandboxes before production activation.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              3. Limitation of Liability
            </h4>
            <p>
              Target websites may alter layouts, terms, or security checkpoints without notice. MarketScout provides multi-strategy resilience and self-healing algorithms but makes no guarantees regarding third-party server uptime or layout stability.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0c1222] flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400">License: MIT Open Source Intelligence</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-colors"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
