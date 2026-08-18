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
import { ToastProvider, useToast } from './components/ToastContext';
import type { ConfigModeResponse } from './types';
import { fetchConfigMode, resetDemo } from './api';
import { WorkflowsStudio } from './components/WorkflowsStudio';
import { IntelligenceStudio } from './components/IntelligenceStudio';
import { RuleBundlesExplorer } from './components/RuleBundlesExplorer';
import { CommandPalette } from './components/CommandPalette';
import { ParticleBackground } from './components/effects/ParticleBackground';

export function AppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configMode, setConfigMode] = useState<ConfigModeResponse | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchConfigMode().then(setConfigMode).catch(console.error);
  }, []);

  // Global Keyboard Navigation (⌘1-⌘6, ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') { e.preventDefault(); switchTab('overview'); }
        if (e.key === '2') { e.preventDefault(); switchTab('studio'); }
        if (e.key === '3') { e.preventDefault(); switchTab('intel'); }
        if (e.key === '4') { e.preventDefault(); switchTab('repair'); }
        if (e.key === '5') { e.preventDefault(); switchTab('runs'); }
        if (e.key === '6') { e.preventDefault(); switchTab('settings'); }
        if (e.key === 'k') { 
          e.preventDefault(); 
          setCommandPaletteOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const switchTab = (tab: string) => {
    if (tab === activeTab) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTransitioning(false);
    }, 120);
  };

  const handleGlobalReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      showToast('success', 'Demo Reset', 'Database restored to initial clean baseline state');
      window.location.reload();
    } catch (e: any) {
      showToast('error', 'Reset Failed', e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07080c] text-[#f1f5f9] overflow-x-hidden relative">
      {/* ── INTERACTIVE CANVAS PARTICLE CONSTELLATION ── */}
      <ParticleBackground />

      {/* Ambient Glows */}
      <div className="ambient-glow-primary" aria-hidden="true" />
      <div className="ambient-glow-secondary" aria-hidden="true" />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={switchTab}
      />

      {/* Floating Island Navigation Dock */}
      <Header
        activeTab={activeTab}
        setActiveTab={switchTab}
        configMode={configMode}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onReset={handleGlobalReset}
        resetting={resetting}
      />

      {/* Main Workstation Viewport */}
      <main
        id="main-content"
        role="main"
        className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 relative z-10"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(3px)' : 'translateY(0)',
          transition: 'opacity 120ms ease, transform 120ms ease',
        }}
      >
        {activeTab === 'overview' && <Overview configMode={configMode} setActiveTab={switchTab} />}
        {activeTab === 'studio' && <WorkflowsStudio setActiveTab={switchTab} />}
        {activeTab === 'intel' && <IntelligenceStudio />}
        {activeTab === 'products' && <ProductDiscovery setActiveTab={switchTab} />}
        {activeTab === 'jobs' && <JobDiscovery setActiveTab={switchTab} />}
        {activeTab === 'repair' && <RepairCenter />}
        {activeTab === 'rules' && <RuleBundlesExplorer />}
        {activeTab === 'scrapers' && <ScrapersList setActiveTab={switchTab} />}
        {activeTab === 'search' && <SearchHistory setActiveTab={switchTab} />}
        {activeTab === 'runs' && <RunHistory />}
        {activeTab === 'settings' && <Settings configMode={configMode} />}
      </main>

      {/* Industrial Footer */}
      <footer className="py-6 border-t border-white/[0.06] text-xs font-mono text-slate-500 relative z-10 bg-[#07080c]/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-semibold text-slate-300">MarketScout Enterprise v2.5</span>
            <span>· Autonomous Web-Data Intelligence</span>
          </div>
          <div className="text-slate-400">
            Powered by Bright Data Scraper Studio & Multi-Strategy Engine
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
