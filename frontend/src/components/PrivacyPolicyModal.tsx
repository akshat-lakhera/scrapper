import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X, Lock, CheckCircle2, FileText, Globe } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
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
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacy Policy & Ethical Extraction Standards</h3>
              <p className="text-xs text-slate-400">MarketScout Web-Data Intelligence Engine</p>
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              1. Zero PII Retention Architecture
            </h4>
            <p>
              MarketScout operates on ephemeral transformation pipelines. Extracted entities are parsed, normalized against strict Pydantic schemas, and stored exclusively in your local database instance with zero third-party advertising telemetry.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Ethical Scraping & Rate Limits
            </h4>
            <p>
              Autonomous self-healing agents respect target site concurrency bounds, backoff protocols, and robots.txt directives. Web data extraction is restricted to publicly available catalog information, job postings, technical documentation, and public knowledge graphs.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              3. Bright Data Provider Security
            </h4>
            <p>
              When Bright Data cluster execution is enabled, API tokens and proxy credentials are encrypted in-memory and communicated solely over TLS 1.3 encrypted endpoints.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              4. User Control & Data Export
            </h4>
            <p>
              You maintain 100% ownership over all extracted datasets. You may clear audit traces, export JSON/CSV records, or reset rule bundles at any time with single-click actions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0c1222] flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400">Effective Date: August 2026</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
