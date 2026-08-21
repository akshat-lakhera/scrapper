import React, { useState } from 'react';
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
  Command,
  Zap,
  HelpCircle,
  Sliders,
  ChevronDown
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
  onOpenCommandPalette?: () => void;
  onOpenCopilot?: () => void;
  onOpenQuickHUD?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenShortcuts?: () => void;
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
  onOpenCopilot,
  onOpenQuickHUD,
  onOpenDiagnostics,
  onOpenShortcuts,
  onReset,
  resetting = false,
}) => {
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
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
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                v2.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 status-dot-emerald animate-pulse' : 'bg-amber-400 status-dot-amber'}`} />
              <span className="text-slate-300 font-medium">{isLive ? 'Bright Data Live Provider' : 'Offline Local Fixtures'}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls (Primary Navigation Hierarchy) */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#101422] p-1.5 rounded-2xl border border-white/10 shadow-inner">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tactile-press flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold font-sans transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
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

        {/* Right Utility Actions (Cleanly Consolidated) */}
        <div className="flex items-center gap-2 shrink-0 font-mono text-xs relative">
          <button
            onClick={onOpenCommandPalette}
            className="tactile-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121726] hover:bg-[#1a2236] text-slate-200 hover:text-white transition-all border border-white/15 shadow-sm cursor-pointer"
            title="Search & Quick Actions (⌘K)"
          >
            <Command size={13} className="text-blue-400" />
            <span className="hidden sm:inline font-medium">Palette</span>
            <kbd className="kbd-badge">⌘K</kbd>
          </button>

          {/* System Tools Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className={`tactile-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                toolsDropdownOpen
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                  : 'bg-[#121726] hover:bg-[#1a2236] border-white/15 text-slate-200 hover:text-white shadow-sm'
              }`}
              title="System Tools & Diagnostic Actions"
            >
              <Sliders size={13} className={toolsDropdownOpen ? 'text-white' : 'text-cyan-400'} />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
            </button>

            {toolsDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setToolsDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 p-1.5 rounded-2xl bg-[#090d18] border border-white/15 shadow-2xl z-50 font-mono text-xs space-y-1 enter-fade-up">
                  {onOpenCopilot && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenCopilot();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-cyan-500/15 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-cyan-400" />
                        <span>AI Copilot</span>
                      </div>
                      <kbd className="kbd-badge text-cyan-300 bg-cyan-950/60 border-cyan-500/30">⌘I</kbd>
                    </button>
                  )}

                  {onOpenDiagnostics && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenDiagnostics();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-emerald-500/15 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Terminal size={14} className="text-emerald-400" />
                        <span>Diagnostics</span>
                      </div>
                      <kbd className="kbd-badge text-emerald-300 bg-emerald-950/60 border-emerald-500/30">⌘L</kbd>
                    </button>
                  )}

                  {onReset && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onReset();
                      }}
                      disabled={resetting}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-amber-500/15 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw size={14} className={resetting ? 'animate-spin text-amber-400' : 'text-amber-400'} />
                        <span>{resetting ? 'Resetting...' : 'Reset Database'}</span>
                      </div>
                    </button>
                  )}

                  {onOpenShortcuts && (
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenShortcuts();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border-t border-white/10 pt-2"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle size={14} className="text-slate-400" />
                        <span>Hotkeys Reference</span>
                      </div>
                      <kbd className="kbd-badge">?</kbd>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
