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
    <header className="sticky top-0 z-50 select-none">
      {/* ── TOP INDUSTRIAL TELEMETRY BAR ── */}
      <div className="bg-[#050608] border-b border-white/[0.06] text-[11px] font-mono text-slate-400 py-1.5 px-4 sm:px-8 overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`led-beacon ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="font-semibold text-slate-200">
              {isLive ? 'BRIGHTDATA-V3-LIVE' : 'OFFLINE-FIXTURE-CLUSTER'}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-slate-500">
            <span>[ZONE: <strong className="text-slate-300">SERP_API1</strong>]</span>
            <span>[DB: <strong className="text-slate-300">SQLITE-WAL</strong>]</span>
            <span>[REPAIR: <strong className="text-emerald-400">AUTONOMOUS-HEAL</strong>]</span>
            <span>[RAG: <strong className="text-cyan-400">GROQ-LLAMA-70B</strong>]</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-[10px] font-mono transition-colors border border-white/[0.08]"
          >
            <Command size={11} />
            <span>Search</span>
            <kbd className="bg-black/40 px-1 rounded text-[9px] text-slate-400">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSTATION NAV DOCK ── */}
      <div className="bg-[#0c0e14]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand & Mode Identifier */}
        <div 
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shadow-inner group-hover:border-blue-500 transition-colors">
            <Cpu size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wider font-sans uppercase">MarketScout</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO v2.5
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block -mt-0.5">
              Autonomous Web Intelligence
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <nav className="hidden md:flex items-center gap-1 bg-[#12151e] p-1 rounded-xl border border-white/[0.07]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-500">{tab.index}</span>
                <Icon size={13} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] font-mono font-bold px-1 rounded ${
                    tab.badge === 'Auto'
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

        {/* Right Actions: Demo Reset */}
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 text-xs font-semibold font-sans transition-all disabled:opacity-50"
              title="Reset database to clean baseline"
            >
              <RotateCcw size={12} className={resetting ? 'animate-spin text-amber-400' : 'text-slate-400'} />
              <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
