import React, { useRef, useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Sparkles,
  Wrench, 
  History, 
  Settings as SettingsIcon, 
  Menu,
  X
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { TypewriterText, ShimmerText } from './TextEffects';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  configMode: ConfigModeResponse | null;
  isRequestActive?: boolean;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'studio', label: 'Studio', icon: Sparkles },
  { id: 'repair', label: 'Self-Healing', icon: Wrench },
  { id: 'runs', label: 'Runs', icon: History },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  configMode,
  isRequestActive = false,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLive = configMode?.provider === 'brightdata';

  useEffect(() => {
    if (!navRef.current) return;
    const el = navRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header
      role="banner"
      aria-label="Application Header"
      className="sticky top-0 z-30 w-full border-b backdrop-blur-xl transition-colors duration-200"
      style={{
        backgroundColor: 'rgba(3, 7, 18, 0.82)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Telemetry */}
          <div
            onClick={() => handleTabClick('overview')}
            role="button"
            tabIndex={0}
            aria-label="MarketScout Home"
            className="flex items-center gap-3 cursor-pointer group focus-ring rounded-lg p-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabClick('overview');
              }
            }}
          >
            <div
              className="rounded-xl p-[1px] w-9 h-9 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #10b981)',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)',
              }}
            >
              <div
                className="w-full h-full rounded-[11px] flex items-center justify-center"
                style={{ background: 'var(--bg-root)' }}
              >
                <Sparkles size={16} className="text-cyan-400" aria-hidden="true" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-[15px] tracking-tight flex items-center gap-1 leading-none text-white">
                <TypewriterText text="MarketScout" speed={40} className="text-white font-extrabold" />
              </div>
              <span className="text-[9px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                <ShimmerText text="Bright Data OS" />
              </span>
            </div>
          </div>

          {/* Right Header Status Pill */}
          <div className="flex items-center gap-3">
            <div
              role="status"
              aria-label={`Provider Status: ${isLive ? 'Bright Data live mode' : 'Offline test mode'}${isRequestActive ? ', request active' : ''}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: isLive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                boxShadow: isLive ? '0 0 16px rgba(16, 185, 129, 0.1)' : '0 0 16px rgba(245, 158, 11, 0.1)',
              }}
            >
              <div
                className={`pulse-dot ${isRequestActive ? 'active-pulsing' : ''}`}
                style={{
                  color: isLive ? 'var(--success)' : 'var(--warning)',
                  backgroundColor: isLive ? 'var(--success)' : 'var(--warning)',
                  width: 6,
                  height: 6,
                }}
              />
              <span className="text-[11px] mono font-semibold tracking-wide" style={{ color: isLive ? 'var(--success)' : 'var(--warning)' }}>
                {isLive ? 'Bright Data live mode' : 'Offline test mode'}
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10 btn-spring focus-ring"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Desktop Sliding Tabs */}
        <nav
          id="desktop-navigation"
          aria-label="Main Navigation"
          className="hidden md:block relative pb-1"
          ref={navRef}
        >
          <div className="flex gap-1 no-scrollbar overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap rounded-lg transition-all duration-150 btn-spring focus-ring"
                  style={{
                    color: active ? '#fff' : 'var(--text-tertiary)',
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'var(--accent)' : 'inherit' }} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Spring Tab Indicator */}
          {indicator.width > 0 && (
            <div
              className="absolute bottom-0 h-[2px] transition-all duration-200 ease-out pointer-events-none"
              style={{
                left: indicator.left,
                width: indicator.width,
                background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                boxShadow: '0 0 12px #06b6d4',
              }}
            />
          )}
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-t px-4 py-3 space-y-1 bg-[#030712]/95 backdrop-blur-2xl"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors"
                style={{
                  background: active ? 'var(--bg-elevated)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} style={{ color: active ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
