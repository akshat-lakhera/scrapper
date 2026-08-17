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
import { RuleBundlesExplorer } from './components/RuleBundlesExplorer';
import { CommandPalette } from './components/CommandPalette';

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

  // Global Keyboard Navigation (⌘1-⌘5, ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === '1') { e.preventDefault(); switchTab('overview'); }
        if (e.key === '2') { e.preventDefault(); switchTab('studio'); }
        if (e.key === '3') { e.preventDefault(); switchTab('repair'); }
        if (e.key === '4') { e.preventDefault(); switchTab('runs'); }
        if (e.key === '5') { e.preventDefault(); switchTab('settings'); }
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
    }, 140);
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
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#f8fafc] overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Subtle Ambient Background Gradient */}
      <div className="ambient-bg" aria-hidden="true" />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={switchTab}
      />

      {/* Linear-Grade Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={switchTab}
        configMode={configMode}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onReset={handleGlobalReset}
        resetting={resetting}
      />

      {/* Main Studio Viewport */}
      <main
        id="main-content"
        role="main"
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(4px) scale(0.998)' : 'translateY(0) scale(1)',
          transition: 'opacity 140ms cubic-bezier(0.16, 1, 0.3, 1), transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {activeTab === 'overview' && <Overview configMode={configMode} setActiveTab={switchTab} />}
        {activeTab === 'studio' && <WorkflowsStudio setActiveTab={switchTab} />}
        {activeTab === 'products' && <ProductDiscovery setActiveTab={switchTab} />}
        {activeTab === 'jobs' && <JobDiscovery setActiveTab={switchTab} />}
        {activeTab === 'repair' && <RepairCenter />}
        {activeTab === 'rules' && <RuleBundlesExplorer />}
        {activeTab === 'scrapers' && <ScrapersList setActiveTab={switchTab} />}
        {activeTab === 'search' && <SearchHistory setActiveTab={switchTab} />}
        {activeTab === 'runs' && <RunHistory />}
        {activeTab === 'settings' && <Settings configMode={configMode} />}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="py-6 border-t border-white/[0.06] text-center text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MarketScout Engine v2.4 · Autonomous Web Extraction</span>
          <span>Powered by Bright Data & Multi-Strategy Normalizers</span>
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
