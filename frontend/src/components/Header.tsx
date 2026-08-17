import React, { useRef, useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingBag, Briefcase, Cpu, Search, Wrench, History, Settings as SettingsIcon, Sparkles } from 'lucide-react';
import type { ConfigModeResponse } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: ShoppingBag },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'scrapers', label: 'Scrapers', icon: Cpu },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'repair', label: 'Repair', icon: Wrench },
  { id: 'runs', label: 'Runs', icon: History },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, configMode }) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const isLive = configMode?.provider === 'brightdata';

  useEffect(() => {
    if (!navRef.current) return;
    const el = navRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'rgba(7, 7, 9, 0.82)',
        backdropFilter: 'blur(24px) saturate(190%)',
        WebkitBackdropFilter: 'blur(24px) saturate(190%)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group btn-spring"
            onClick={() => setActiveTab('overview')}
          >
            <div
              className="rounded-xl p-[1px] w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--gold))',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)'
              }}
            >
              <div
                className="w-full h-full rounded-[11px] flex items-center justify-center"
                style={{ background: 'var(--bg-root)' }}
              >
                <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-[15px] tracking-tight flex items-center gap-1 leading-none" style={{ color: 'var(--text-primary)' }}>
                <span>Market</span>
                <span className="text-gradient">Scout</span>
              </div>
              <span className="text-[9px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                Bright Data OS
              </span>
            </div>
          </div>

          {/* Engine Status Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderColor: isLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              boxShadow: isLive ? '0 0 16px rgba(16, 185, 129, 0.1)' : '0 0 16px rgba(245, 158, 11, 0.1)'
            }}
          >
            <div
              className="pulse-dot"
              style={{
                color: isLive ? 'var(--success)' : 'var(--warning)',
                backgroundColor: isLive ? 'var(--success)' : 'var(--warning)',
                width: 6,
                height: 6
              }}
            />
            <span className="text-[11px] mono font-semibold tracking-wide" style={{ color: isLive ? 'var(--success)' : 'var(--warning)' }}>
              {isLive ? 'Bright Data Live' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* Apple-style Sliding Tabs */}
        <div className="relative pb-1" ref={navRef}>
          <div className="flex gap-1 no-scrollbar overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap rounded-lg transition-all duration-150 btn-spring"
                  style={{
                    color: active ? '#fff' : 'var(--text-tertiary)',
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'var(--accent)' : 'inherit' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div
            className="absolute bottom-0 h-[2px] rounded-full transition-all duration-300 pointer-events-none"
            style={{
              left: indicator.left,
              width: indicator.width,
              background: 'linear-gradient(90deg, var(--accent), var(--gold))',
              boxShadow: '0 0 12px var(--accent)',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          />
        </div>
      </div>
    </header>
  );
};
