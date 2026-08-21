import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, Lock } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('marketscout_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('marketscout_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('marketscout_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fade-in font-mono text-xs">
      <div className="p-5 rounded-2xl bg-[#090d19]/95 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-blue-400 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
              <Lock className="w-4 h-4" />
            </div>
            <span>Privacy & Telemetry</span>
          </div>
          <button
            onClick={handleDecline}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300 text-xs leading-relaxed font-sans">
          MarketScout uses local storage and zero-PII telemetry tokens to preserve your active scraping workflows and cluster preferences. No personal tracking or ad pixels.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Essential Only
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
