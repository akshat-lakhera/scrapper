import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Wrench, 
  History, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Database,
  Cpu,
  Radio,
  ExternalLink,
  Command
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard, shortcut: '⌘1' },
  { id: 'studio', label: 'Extraction Studio', icon: Sparkles, shortcut: '⌘2' },
  { id: 'repair', label: 'Self-Healing Lab', icon: Wrench, shortcut: '⌘3', badge: 'Auto' },
  { id: 'runs', label: 'Audit Timeline', icon: History, shortcut: '⌘4' },
  { id: 'settings', label: 'Engine Settings', icon: SettingsIcon, shortcut: '⌘5' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  configMode,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isLive = configMode?.provider === 'brightdata';

  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col justify-between z-40 bg-[#060a12] border-r border-white/[0.08] transition-all duration-300 select-none ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Top Section: Brand & Navigation */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06]">
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles size={16} className="text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white tracking-tight">MarketScout</span>
                  <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300">OS</span>
                </div>
                <span className="text-[10px] mono text-slate-500 block truncate">Autonomous Web Engine</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Workspaces
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent active:scale-[0.98]'
                }`}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
              >
                <div className={`shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                  <Icon size={18} />
                </div>
                
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-600">
                        {item.shortcut}
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Card */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Provider Status</span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isLive ? 'Bright Data Live' : 'Local Sandbox'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mono">
              Engine: <span className="text-white font-semibold">Multi-Strategy v2.4</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Provider Active" />
          </div>
        )}
      </div>
    </aside>
  );
};
