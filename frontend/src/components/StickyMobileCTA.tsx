import React from 'react';
import { Play, Sparkles, Activity, ShieldCheck } from 'lucide-react';

interface StickyMobileCTAProps {
  onExecuteScrape: () => void;
  onSimulateDrift: () => void;
  loading: boolean;
  simulatingDrift: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const StickyMobileCTA: React.FC<StickyMobileCTAProps> = ({
  onExecuteScrape,
  onSimulateDrift,
  loading,
  simulatingDrift,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden bg-[#090d18]/95 backdrop-blur-2xl border-t border-white/15 p-3 flex items-center justify-between gap-2 shadow-2xl font-mono text-xs">
      <button
        onClick={() => {
          if (activeTab !== 'overview') setActiveTab('overview');
          onExecuteScrape();
        }}
        disabled={loading}
        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>{loading ? 'Scraping...' : 'Scrape'}</span>
      </button>

      <button
        onClick={() => {
          if (activeTab !== 'overview') setActiveTab('overview');
          onSimulateDrift();
        }}
        disabled={simulatingDrift}
        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 active:scale-95 disabled:opacity-50 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{simulatingDrift ? 'Drifting...' : 'Drift'}</span>
      </button>

      <button
        onClick={() => setActiveTab('runs')}
        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 active:scale-95 flex items-center justify-center cursor-pointer"
        title="Audit Logs"
      >
        <Activity className="w-4 h-4 text-emerald-400" />
      </button>
    </div>
  );
};
