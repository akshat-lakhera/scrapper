import React from 'react';
import { 
  Activity,
  Layers, 
  Wrench, 
  History, 
  Settings as SettingsIcon,
  RotateCcw,
  Search,
  CheckCircle2,
  Cpu,
  Brain,
  ShieldCheck,
  Terminal,
  Radio,
  Sparkles,
  Command
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
  onOpenCommandPalette?: () => void;
  onReset?: () => void;
  resetting?: boolean;
}

const TABS = [
  { id: 'overview', index: '01', label: 'Command Center', icon: Activity },
  { id: 'studio', index: '02', label: 'Extraction Studio', icon: Layers },
  { id: 'intel', index: '03', label: 'Living RAG & Intel', icon: Brain, badge: 'AI' },
  { id: 'repair', index: '04', label: 'Self-Healing Lab', icon: Wrench, badge: 'Auto' },
  { id: 'runs', index: '05', label: 'Audit Timeline', icon: History },
  { id: 'settings', index: '06', label: 'Settings', icon: SettingsIcon },
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
    <header className="sticky top-0 z-50 select-none bg-[#080a10]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Mode Identifier */}
        <div 
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg group-hover:border-blue-400 transition-all">
            <Cpu size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wider font-sans uppercase">MarketScout</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                v2.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">{isLive ? 'Bright Data Web Unlocker' : 'Offline Local Fixtures'}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#101422] p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.badge === 'Auto'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Command Palette, Reset, Shortcuts */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121726] hover:bg-[#1a2236] text-slate-200 hover:text-white text-xs font-mono transition-all border border-white/15 shadow-sm cursor-pointer"
            title="Search & Quick Actions (⌘K)"
          >
            <Command size={13} className="text-blue-400" />
            <span className="hidden sm:inline font-medium">Palette</span>
            <kbd className="bg-black/50 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-white/10 font-bold">⌘K</kbd>
          </button>

          {onReset && (
            <button
              onClick={onReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-[#121726] hover:bg-[#1a2236] text-slate-200 hover:text-white text-xs font-mono font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Reset database to clean baseline"
            >
              <RotateCcw size={13} className={resetting ? 'animate-spin text-amber-400' : 'text-slate-400'} />
              <span className="hidden xl:inline">{resetting ? 'Resetting...' : 'Reset'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
