import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Wrench, 
  History, 
  Settings, 
  MapPin, 
  Briefcase, 
  MessageCircle, 
  ShoppingBag, 
  ExternalLink,
  Code2,
  ArrowRight,
  X,
  Layers,
  Database,
  FileCode,
  Zap
} from 'lucide-react';
import { executeScrape } from '../api';
import { useToast } from './ToastContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
}

const COMMANDS = [
  { id: 'tab-overview', title: 'Go to Command Center', category: 'Navigation', icon: Sparkles, tab: 'overview', shortcut: '⌘1' },
  { id: 'tab-studio', title: 'Go to Extraction Studio', category: 'Navigation', icon: Layers, tab: 'studio', shortcut: '⌘2' },
  { id: 'tab-repair', title: 'Go to Self-Healing Lab', category: 'Navigation', icon: Wrench, tab: 'repair', shortcut: '⌘3' },
  { id: 'tab-runs', title: 'Go to Audit Timeline', category: 'Navigation', icon: History, tab: 'runs', shortcut: '⌘4' },
  { id: 'tab-settings', title: 'Go to Engine Settings', category: 'Navigation', icon: Settings, tab: 'settings', shortcut: '⌘5' },
];

const DATASET_PRESETS = [
  { 
    id: 'preset-maps', 
    title: 'Google Maps: Pizza Inn Magdeburg', 
    category: 'Run Live Scrape', 
    icon: MapPin, 
    url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/', 
    type: 'google_maps',
    color: '#10b981'
  },
  { 
    id: 'preset-linkedin', 
    title: 'LinkedIn: Elad Moshe Profile', 
    category: 'Run Live Scrape', 
    icon: Briefcase, 
    url: 'https://www.linkedin.com/in/elad-moshe-05a90413/', 
    type: 'linkedin',
    color: '#3b82f6'
  },
  { 
    id: 'preset-x', 
    title: 'X / Twitter: Fabrizio Romano Post', 
    category: 'Run Live Scrape', 
    icon: MessageCircle, 
    url: 'https://x.com/FabrizioRomano/status/1683559267524136962', 
    type: 'x',
    color: '#06b6d4'
  },
  { 
    id: 'preset-amazon', 
    title: 'Amazon: Sony WH-1000XM5 Headphones', 
    category: 'Run Live Scrape', 
    icon: ShoppingBag, 
    url: 'https://www.amazon.com/dp/B09XS7JWHH', 
    type: 'products',
    color: '#ec4899'
  },
  { 
    id: 'preset-instagram', 
    title: 'Instagram: Cristiano Profile', 
    category: 'Run Live Scrape', 
    icon: Sparkles, 
    url: 'https://www.instagram.com/cristiano/', 
    type: 'instagram',
    color: '#f59e0b'
  },
  { 
    id: 'preset-reddit', 
    title: 'Reddit: Technology Discussion', 
    category: 'Run Live Scrape', 
    icon: MessageCircle, 
    url: 'https://www.reddit.com/r/technology/comments/1example_thread/', 
    type: 'reddit',
    color: '#ef4444'
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCommands = COMMANDS.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPresets = DATASET_PRESETS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) || p.type.toLowerCase().includes(query.toLowerCase())
  );

  const totalItems = [...filteredCommands, ...filteredPresets];

  const handleSelect = async (item: any) => {
    if (item.tab) {
      setActiveTab(item.tab);
      onClose();
    } else if (item.url) {
      try {
        setExecuting(true);
        showToast('info', 'Executing Scrape', `Triggering pipeline for ${item.title}...`);
        setActiveTab('studio');
        onClose();
      } catch (e: any) {
        showToast('error', 'Execution Failed', e.message);
      } finally {
        setExecuting(false);
      }
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md animate-fade-in cursor-pointer"
    >
      <div 
        className="w-full max-w-2xl bg-[#060a12] border border-white/15 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[540px] animate-scale-up cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search size={18} className="text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command, URL, or jump to workspace..."
            className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none font-mono"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="kbd-badge text-[10px] hidden sm:inline-flex">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="tactile-press p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Command Palette (Esc)"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Navigation Section */}
          {filteredCommands.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Workspaces
              </div>
              {filteredCommands.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-white/5 text-slate-400 group-hover:text-cyan-400 transition-colors">
                        <Icon size={15} />
                      </div>
                      <span>{item.title}</span>
                    </div>
                    <span className="mono text-[10px] text-slate-600 group-hover:text-slate-400">
                      {item.shortcut}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Datasets Section */}
          {filteredPresets.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Live Dataset Workflows
              </div>
              {filteredPresets.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-transparent transition-all cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <div 
                        className="p-1.5 rounded-lg bg-white/5 transition-colors shrink-0"
                        style={{ color: item.color }}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="truncate">
                        <span className="block truncate font-medium text-white">{item.title}</span>
                        <span className="block truncate text-[10px] mono text-slate-500">{item.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] mono font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <span>Launch</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalItems.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 mono">
              No matching commands or dataset workflows found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] mono text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation <kbd className="text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10">↑↓</kbd></span>
            <span>Select <kbd className="text-[10px] px-1 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd></span>
          </div>
          <span className="text-cyan-400 font-bold">MarketScout Universal Pipeline</span>
        </div>
      </div>
    </div>
  );
};
