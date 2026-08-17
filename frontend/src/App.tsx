import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Overview } from './components/Overview';
import { ProductDiscovery } from './components/ProductDiscovery';
import { JobDiscovery } from './components/JobDiscovery';
import { ScrapersList } from './components/ScrapersList';
import { SearchHistory } from './components/SearchHistory';
import { RepairCenter } from './components/RepairCenter';
import { RunHistory } from './components/RunHistory';
import { Settings } from './components/Settings';
import { ParticlesCanvas } from './components/ParticlesCanvas';
import { ToastProvider } from './components/ToastContext';
import type { ConfigModeResponse } from './types';
import { fetchConfigMode } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configMode, setConfigMode] = useState<ConfigModeResponse | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchConfigMode().then(setConfigMode).catch(console.error);
  }, []);

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTransitioning(false);
    }, 160);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col relative bg-[#070709] text-[#f4f4f6]">
        {/* Dynamic Interactive Background Mesh & Optimized Particles */}
        <div className="mesh-bg" aria-hidden="true" />
        <ParticlesCanvas />

        {/* Translucent Floating Navigation */}
        <Header activeTab={activeTab} setActiveTab={switchTab} configMode={configMode} />

        {/* Main View Shell with Fluid Crossfade */}
        <main
          id="main-content"
          role="main"
          className="flex-1 relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
          style={{
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(6px) scale(0.995)' : 'translateY(0) scale(1)',
            transition: 'opacity 160ms cubic-bezier(0.23, 1, 0.32, 1), transform 160ms cubic-bezier(0.23, 1, 0.32, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {activeTab === 'overview' && <Overview configMode={configMode} setActiveTab={switchTab} />}
          {activeTab === 'products' && <ProductDiscovery setActiveTab={switchTab} />}
          {activeTab === 'jobs' && <JobDiscovery setActiveTab={switchTab} />}
          {activeTab === 'scrapers' && <ScrapersList setActiveTab={switchTab} />}
          {activeTab === 'search' && <SearchHistory setActiveTab={switchTab} />}
          {activeTab === 'repair' && <RepairCenter />}
          {activeTab === 'runs' && <RunHistory />}
          {activeTab === 'settings' && <Settings configMode={configMode} />}
        </main>

        {/* Clean Monospace Footer */}
        <footer className="relative z-10 py-6 border-t border-white/5" role="contentinfo">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="text-[11px] font-medium text-slate-500">
              © 2026 MarketScout · Autonomous Scraping Engine
            </span>
            <span className="text-[11px] mono text-slate-500">
              Integrated with <span className="text-gradient font-bold">Bright Data</span>
            </span>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}

export default App;
