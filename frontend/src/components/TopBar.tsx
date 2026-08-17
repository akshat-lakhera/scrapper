import React from 'react';
import { 
  Search, 
  Command, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  Zap,
  Activity
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { Button } from './ui/Button';

interface TopBarProps {
  activeTab: string;
  configMode: ConfigModeResponse | null;
  onReset: () => void;
  resetting?: boolean;
  onOpenQuickScrape?: () => void;
}

const TAB_TITLES: Record<string, { title: string; category: string }> = {
  overview: { title: 'Command Center', category: 'Executive Dashboard' },
  studio: { title: 'Extraction Studio', category: 'Universal Pipelines' },
  repair: { title: 'Self-Healing Diagnostic Lab', category: 'Autonomous Recovery' },
  runs: { title: 'Audit Timeline', category: 'Provenance & Logs' },
  settings: { title: 'Engine Configuration', category: 'Provider & Secrets' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  configMode,
  onReset,
  resetting = false,
  onOpenQuickScrape,
}) => {
  const currentTab = TAB_TITLES[activeTab] || { title: 'Overview', category: 'Workspace' };
  const isLive = configMode?.provider === 'brightdata';

  return (
    <header className="h-16 px-6 bg-[#030712]/90 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
          MarketScout
        </span>
        <ChevronRight size={13} className="text-slate-600" />
        <span className="text-xs font-mono text-slate-400">
          {currentTab.category}
        </span>
        <ChevronRight size={13} className="text-slate-600" />
        <span className="text-xs font-mono font-bold text-white">
          {currentTab.title}
        </span>
      </div>

      {/* Center Command Shortcut Launcher */}
      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={onOpenQuickScrape}
          className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/40 text-xs text-slate-400 hover:text-white transition-all cursor-pointer group shadow-sm"
        >
          <Search size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <span className="font-medium">Quick Scrape URL or Dataset...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400 border border-white/10">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Provider Live Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold">{isLive ? 'Bright Data Live' : 'Local Sandbox'}</span>
        </div>

        {/* Reset Baseline Action */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onReset}
          isLoading={resetting}
          leftIcon={<RotateCcw size={13} />}
        >
          Reset Baseline
        </Button>
      </div>
    </header>
  );
};
