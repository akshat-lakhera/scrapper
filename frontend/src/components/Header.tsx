import React from 'react';
import { 
  Sparkles, 
  Layers, 
  Wrench, 
  History, 
  Settings as SettingsIcon,
  RotateCcw,
  Search,
  CheckCircle2,
  Cpu,
  Brain
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { Button } from './ui/Button';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
  onOpenCommandPalette?: () => void;
  onReset?: () => void;
  resetting?: boolean;
}

const TABS = [
  { id: 'overview', label: 'Command Center', icon: Sparkles },
  { id: 'studio', label: 'Extraction Studio', icon: Layers },
  { id: 'intel', label: 'Living RAG & Intel', icon: Brain, badge: 'AI' },
  { id: 'repair', label: 'Self-Healing Lab', icon: Wrench, badge: 'Auto' },
  { id: 'runs', label: 'Audit Timeline', icon: History },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];


export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  configMode,
  onOpenCommandPalette,
  onReset,
  resetting = false,
}) => {
  const isLive = configMode?.provider === 'brightdata';

  return (
    <header className="h-16 sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-white/[0.07] px-4 sm:px-8 flex items-center justify-between select-none">
      {/* Left: Brand Identity */}
      <div 
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-3 cursor-pointer group shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Sparkles size={16} className="text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white tracking-tight">MarketScout</span>
          <span className="text-[10px] mono font-bold px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/10">
            v2.4
          </span>
        </div>
      </div>

      {/* Center: Sleek Segmented Control Tabs (Linear Style) */}
      <nav className="hidden md:flex items-center p-1 rounded-xl bg-[#111218] border border-white/[0.08] shadow-inner">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <Search size={13} className="text-slate-500" />
          <span className="font-mono text-[11px]">Search</span>
          <kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-mono text-slate-400 border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* Live Provider Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/10 text-xs mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-semibold text-[11px] hidden sm:inline">
            {isLive ? 'Bright Data Live' : 'Sandbox'}
          </span>
        </div>

        {onReset && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            isLoading={resetting}
            leftIcon={<RotateCcw size={12} />}
          >
            Reset
          </Button>
        )}
      </div>
    </header>
  );
};
