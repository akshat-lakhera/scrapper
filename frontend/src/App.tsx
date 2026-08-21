import { useEffect, useState, useCallback, useMemo, Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Globe,
  Terminal,
  Cpu,
  Layers,
  Activity,
  Zap,
  ShieldCheck,
  Wrench,
  Search,
  History,
  Settings as SettingsIcon,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  Command,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Code2,
  Sliders,
  ChevronDown,
  Info
} from 'lucide-react';
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
import type { ConfigModeResponse, ScrapeRun, Metrics, ScraperMetrics } from './types';
import { fetchConfigMode, resetDemo, executeScrape, fetchMetrics, fetchRuns, getExportUrl, ragChat } from './api';
import { WorkflowsStudio } from './components/WorkflowsStudio';
import { IntelligenceStudio } from './components/IntelligenceStudio';
import { RuleBundlesExplorer } from './components/RuleBundlesExplorer';
import { CommandPalette } from './components/CommandPalette';
import { ParticleBackground } from './components/effects/ParticleBackground';
import { CookieConsent } from './components/CookieConsent';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsModal } from './components/TermsModal';
import { Footer } from './components/Footer';
import { StickyMobileCTA } from './components/StickyMobileCTA';
import { NotFoundPage } from './components/NotFoundPage';

// ── ERROR BOUNDARY CLASS COMPONENT ──────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07080c] text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-xl w-full p-8 rounded-2xl bg-[#0e121e] border border-rose-500/30 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8 shrink-0 animate-pulse" />
              <div>
                <h2 className="text-lg font-bold">Runtime Exception Intercepted</h2>
                <p className="text-xs text-slate-400">Application caught an unexpected state exception.</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-rose-300 overflow-x-auto max-h-48 leading-relaxed">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown Error'}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-2 text-[10px] text-slate-500 font-mono whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recover Workstation</span>
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── KEYBOARD SHORTCUTS MODAL ────────────────────────────────────────────────
interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', description: 'Open Universal Command Palette & Actions' },
    { key: '⌘ / Ctrl + J', description: 'Toggle Instant Quick-Extraction HUD Drawer' },
    { key: '⌘ / Ctrl + L', description: 'Toggle Real-Time System Diagnostic Terminal' },
    { key: '⌘ / Ctrl + 1', description: 'Switch to Executive Command Center' },
    { key: '⌘ / Ctrl + 2', description: 'Switch to Multi-Workflow Studio (8 Platforms)' },
    { key: '⌘ / Ctrl + 3', description: 'Switch to Living RAG & Competitive Intel' },
    { key: '⌘ / Ctrl + 4', description: 'Switch to Autonomous Self-Healing Center' },
    { key: '⌘ / Ctrl + 5', description: 'Switch to Execution Audit Runs Log' },
    { key: '⌘ / Ctrl + 6', description: 'Switch to System Settings & API Keys' },
    { key: '?', description: 'Show this Keyboard Shortcuts Cheat Sheet' },
    { key: 'Esc', description: 'Close any active modal, drawer, or overlay' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-lg w-full bg-[#0c101c] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 text-white">
            <Command className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Keyboard Navigation & Hotkeys</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono"
            >
              <span className="text-slate-300">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-black/60 border border-white/20 text-blue-400 font-bold shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-white/10 text-center text-[11px] font-mono text-slate-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Esc</kbd> anytime to dismiss
        </div>
      </div>
    </div>
  );
};

// ── QUICK EXTRACTION HUD DRAWER ─────────────────────────────────────────────
interface QuickHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onScrapeSuccess: (result: any) => void;
}

const QuickHUD: React.FC<QuickHUDProps> = ({ isOpen, onClose, onScrapeSuccess }) => {
  const [hudUrl, setHudUrl] = useState('');
  const [hudWorkflow, setHudWorkflow] = useState('products');
  const [hudLoading, setHudLoading] = useState(false);
  const [hudResult, setHudResult] = useState<any>(null);
  const [hudCopied, setHudCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (!hudUrl.trim()) return;
    setHudLoading(true);
    setHudResult(null);
    try {
      showToast('info', 'Executing Quick Scrape', `Dispatching to ${hudWorkflow}...`);
      const res = await executeScrape({
        target_url: hudUrl.trim(),
        workflow_type: hudWorkflow,
        schema_name: hudWorkflow,
      });
      setHudResult(res);
      onScrapeSuccess(res);
      if (res.status === 'success' || res.status === 'repaired') {
        showToast('success', 'Extraction Completed', `Extracted with ${res.quality_score}% quality score`);
      } else {
        showToast('warning', 'Extraction Degraded', 'Drift detected — routed to Self-Healing Lab');
      }
    } catch (e: any) {
      showToast('error', 'Scrape Failed', e.message);
    } finally {
      setHudLoading(false);
    }
  };

  const copyJson = () => {
    if (!hudResult) return;
    navigator.clipboard.writeText(JSON.stringify(hudResult.extracted_data, null, 2));
    setHudCopied(true);
    setTimeout(() => setHudCopied(false), 2000);
    showToast('success', 'JSON Copied', 'Extracted payload copied to clipboard');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0a0d17] border-l border-white/15 shadow-2xl flex flex-col animate-slide-left font-mono">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0e1220]">
        <div className="flex items-center gap-2.5 text-white">
          <Zap className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-bold">Instant Quick-Extraction HUD</h3>
            <span className="text-[10px] text-slate-400">Ad-hoc single-target crawler</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input Area */}
      <div className="p-5 space-y-4 border-b border-white/10">
        <div>
          <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1.5">Platform Workflow</label>
          <select
            value={hudWorkflow}
            onChange={(e) => setHudWorkflow(e.target.value)}
            className="w-full bg-[#07080c] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="products">E-Commerce Products (Amazon, Walmart, Shopify)</option>
            <option value="tech_docs">Tech Docs & API Specs (FastAPI, ReadTheDocs)</option>
            <option value="linkedin">LinkedIn Profiles & Talent</option>
            <option value="jobs">Job Postings (Lever, Greenhouse, Indeed)</option>
            <option value="x_posts">X (Twitter) Posts & Threads</option>
            <option value="instagram">Instagram Profiles & Influencer Intel</option>
            <option value="reddit">Reddit Discussions & Sentiment</option>
            <option value="maps">Google Maps Local Business & POI</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 font-bold uppercase block mb-1.5">Target URL</label>
          <input
            type="text"
            value={hudUrl}
            onChange={(e) => setHudUrl(e.target.value)}
            placeholder="Paste target URL here..."
            className="w-full bg-[#07080c] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={hudLoading || !hudUrl.trim()}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
        >
          {hudLoading ? (
            <>
              <Zap className="w-4 h-4 animate-spin" />
              <span>Extracting Dataset...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Deploy Instant Extraction</span>
            </>
          )}
        </button>
      </div>

      {/* Result Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {hudResult ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Strategy Selected</span>
                <span className="text-cyan-400 font-bold">{hudResult.selected_strategy}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px] uppercase">Quality Score</span>
                <span className="text-emerald-400 font-bold">{hudResult.quality_score}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Normalized Output</span>
              <button
                onClick={copyJson}
                className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline cursor-pointer"
              >
                {hudCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{hudCopied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-[11px] text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed">
              {JSON.stringify(hudResult.extracted_data, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Globe className="w-8 h-8 mx-auto text-slate-600" />
            <p>Ready for instant ad-hoc scraping.</p>
            <p className="text-[10px] text-slate-600">Enter a URL above and click Deploy.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-white/10 bg-[#0e1220] text-[10px] text-slate-400 flex items-center justify-between">
        <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘J</kbd></span>
        <button onClick={onClose} className="hover:text-white cursor-pointer">Close HUD</button>
      </div>
    </div>
  );
};

// ── REALTIME DIAGNOSTIC LOGS TERMINAL DRAWER ────────────────────────────────
interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: Metrics | null;
  runs: ScrapeRun[];
}

const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({ isOpen, onClose, metrics, runs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-[#0a0d17] border-r border-white/15 shadow-2xl flex flex-col animate-slide-right font-mono">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0e1220]">
        <div className="flex items-center gap-2.5 text-white">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold">System Diagnostics & Cluster Stream</h3>
            <span className="text-[10px] text-slate-400">Live background heartbeat & metrics</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Health Vitals */}
      <div className="p-5 grid grid-cols-2 gap-3 border-b border-white/10 bg-black/20 text-xs">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Engine Status</span>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>OPTIMAL</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">WAL Database</span>
          <div className="text-blue-400 font-bold">CONCURRENT OK</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Reliability Rate</span>
          <div className="text-emerald-400 font-bold">{metrics?.overall_reliability || 96}%</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase">Healing Rate</span>
          <div className="text-amber-400 font-bold">{metrics?.healing_success_rate || 100}%</div>
        </div>
      </div>

      {/* Live Event Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3">
        <span className="text-[11px] text-slate-400 font-bold uppercase block">Recent Execution Trace Log</span>
        {runs.length > 0 ? (
          runs.slice(0, 15).map((r) => (
            <div
              key={r.id}
              className="p-3 rounded-xl bg-black/50 border border-white/5 text-[11px] space-y-1.5 hover:border-white/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Trace #{r.id}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  r.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (r.status === 'repaired' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')
                }`}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              <div className="text-slate-300 truncate text-[10px]">{r.target_url}</div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                <span>Quality: <strong className="text-emerald-400">{r.data_quality_score}%</strong></span>
                <span>Latency: <strong className="text-slate-300">{r.duration_ms}ms</strong></span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            No execution events recorded yet.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t border-white/10 bg-[#0e1220] text-[10px] text-slate-400 flex items-center justify-between">
        <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘L</kbd></span>
        <button onClick={onClose} className="hover:text-white cursor-pointer">Close Diagnostics</button>
      </div>
    </div>
  );
};

// ── FLOATING AI COPILOT DRAWER (⌘I) ─────────────────────────────────────────
interface AICopilotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AICopilot: React.FC<AICopilotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: any[] }>>([
    {
      role: 'assistant',
      text: '👋 **Hello! I am your MarketScout AI Copilot.** I have real-time access to all indexed scrape runs, schema changes, and competitive diffs.\n\nAsk me anything about your extracted data, or click a quick prompt below!',
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg = { role: 'user' as const, text: q.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await ragChat({ query: q.trim() });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          text: res.answer || 'No answer generated.',
          citations: res.citations || [],
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          text: `⚠️ **AI Copilot Error**: ${err.message || 'Could not query Living RAG engine.'}`,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'What are the cheapest products scraped?',
    'Summarize recent tech documentation runs',
    'Which selectors drifted and got auto-healed?',
    'Compare talent compensation across job postings',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0a0d17] border-l border-white/15 shadow-2xl flex flex-col animate-slide-left font-mono">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0e1322]">
        <div className="flex items-center gap-2.5 text-white">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>MarketScout AI Copilot</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px]">Living RAG</span>
            </h3>
            <span className="text-[10px] text-slate-400">Conversational Knowledge & Data Synthesis</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              {m.role === 'user' ? 'You' : 'Copilot AI'}
            </div>
            <div
              className={`p-4 rounded-2xl max-w-[92%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                  : 'bg-[#0f1424] text-slate-200 border border-white/10 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">Grounded Citations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.citations.map((c: any, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300 truncate max-w-xs"
                      >
                        <strong>{c.field}:</strong> {String(c.value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Consulting Living RAG Knowledge Base...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-3 border-t border-white/10 bg-black/20 space-y-1.5">
        <span className="text-[10px] text-slate-500 font-bold uppercase block px-1">Suggested Inquiries:</span>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 hover:text-white transition-colors cursor-pointer text-left truncate max-w-full"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-white/10 bg-[#0e1322] flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Ask Copilot about any scraped dataset..."
          className="flex-1 bg-[#07080c] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputQuery.trim()}
          className="py-3 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-cyan-600/30"
        >
          <span>Ask</span>
          <Play className="w-3.5 h-3.5 fill-white" />
        </button>
      </div>
    </div>
  );
};

// ── MAIN APP WORKSPACE COMPONENT ────────────────────────────────────────────
export function AppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configMode, setConfigMode] = useState<ConfigModeResponse | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [quickHUDOpen, setQuickHUDOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const { showToast } = useToast();

  // Dynamic Document Title SEO & Workspace Awareness
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      overview: 'Command Center & Live Scrape | MarketScout',
      studio: 'Workflows & Schema Contracts | MarketScout',
      intel: 'Intelligence Studio & Living RAG | MarketScout',
      products: 'Product & Price Intelligence | MarketScout',
      jobs: 'Talent Radar & Job Discovery | MarketScout',
      repair: 'Self-Healing Engine & Telemetry | MarketScout',
      rules: 'Extractor Rule Bundles | MarketScout',
      scrapers: 'Scraper Cluster Registry | MarketScout',
      search: 'Search History & SERP Traces | MarketScout',
      runs: 'Audit Timeline & Run History | MarketScout',
      settings: 'Cluster Configurations | MarketScout',
    };
    document.title = tabTitles[activeTab] || 'MarketScout — Autonomous Self-Healing Web Intelligence';
  }, [activeTab]);

  const loadData = useCallback(async () => {
    try {
      const [cfg, m, r] = await Promise.all([
        fetchConfigMode().catch(() => null),
        fetchMetrics().catch(() => null),
        fetchRuns().catch(() => []),
      ]);
      if (cfg) setConfigMode(cfg);
      if (m) setMetrics(m);
      if (r) setRecentRuns(r);
    } catch (err) {
      console.error('Error fetching global telemetry:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Global Keyboard Navigation (⌘1-⌘6, ⌘K, ⌘J, ⌘L, ⌘I, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape closes any open modal/drawer
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsModalOpen(false);
        setQuickHUDOpen(false);
        setDiagnosticsOpen(false);
        setCopilotOpen(false);
        return;
      }

      // '?' opens shortcuts sheet when not typing in an input
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

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
        if (e.key === 'j') {
          e.preventDefault();
          setQuickHUDOpen((prev) => !prev);
        }
        if (e.key === 'l') {
          e.preventDefault();
          setDiagnosticsOpen((prev) => !prev);
        }
        if (e.key === 'i') {
          e.preventDefault();
          setCopilotOpen((prev) => !prev);
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const currentTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'overview': return 'Executive Command Center';
      case 'studio': return 'Multi-Workflow Extraction Studio';
      case 'intel': return 'Living RAG & Competitive Intelligence';
      case 'products': return 'E-Commerce Product Discovery';
      case 'jobs': return 'Talent & Job Market Intelligence';
      case 'repair': return 'Autonomous Self-Healing Lab';
      case 'rules': return 'Extractor Rule Bundles Explorer';
      case 'scrapers': return 'Active Scrapers Registry';
      case 'search': return 'Discovery Search History';
      case 'runs': return 'Execution Runs & Audit Timeline';
      case 'settings': return 'System Settings & Bright Data Config';
      default: return 'Workstation';
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#07080c] mesh-grid-pattern text-[#f1f5f9] overflow-x-hidden relative select-none">
      {/* ── INTERACTIVE CANVAS PARTICLE CONSTELLATION ── */}
      <ParticleBackground />

      {/* Ambient Glows */}
      <div className="ambient-glow-primary" aria-hidden="true" />
      <div className="ambient-glow-secondary" aria-hidden="true" />

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        setActiveTab={switchTab}
      />

      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <QuickHUD
        isOpen={quickHUDOpen}
        onClose={() => setQuickHUDOpen(false)}
        onScrapeSuccess={() => loadData()}
      />

      <DiagnosticsDrawer
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        metrics={metrics}
        runs={recentRuns}
      />

      <AICopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Floating Island Navigation Dock with Integrated Utilities */}
      <Header
        activeTab={activeTab}
        setActiveTab={switchTab}
        configMode={configMode}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenCopilot={() => setCopilotOpen(true)}
        onOpenQuickHUD={() => setQuickHUDOpen(true)}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
        onReset={handleGlobalReset}
        resetting={resetting}
      />

      {/* Breadcrumb Mode Strip */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-4 pb-1 flex items-center justify-between text-xs font-mono text-slate-500 relative z-10">
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-400">MarketScout</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="text-blue-400 font-bold truncate">{currentTabLabel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">
            v2.5 Release
          </span>
        </div>
      </div>

      {/* Main Workstation Viewport */}
      <main
        id="main-content"
        role="main"
        className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6 relative z-10"
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

      {/* ── DEDICATED FLOATING UTILITY RAIL (Bottom Right) ── */}
      <aside 
        aria-label="Quick Actions Rail"
        className="fixed bottom-6 right-6 z-40 p-1.5 rounded-2xl bg-[#090d18]/90 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col items-center gap-2"
      >
        <button
          onClick={() => setCopilotOpen((prev) => !prev)}
          className="tactile-press p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all flex items-center justify-center cursor-pointer group"
          title="AI Knowledge Copilot (⌘I)"
          aria-label="Open AI Copilot"
        >
          <Sparkles className="w-4 h-4 fill-white animate-pulse" />
        </button>

        <button
          onClick={() => setQuickHUDOpen((prev) => !prev)}
          className="tactile-press p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center justify-center cursor-pointer"
          title="Instant Quick-Extraction HUD (⌘J)"
          aria-label="Open Quick Extraction HUD"
        >
          <Zap className="w-4 h-4 fill-white" />
        </button>

        <button
          onClick={() => setDiagnosticsOpen((prev) => !prev)}
          className="tactile-press p-3 rounded-xl bg-[#121728] hover:bg-[#1a2238] border border-white/15 text-slate-300 hover:text-white hover:border-emerald-500/40 shadow-sm transition-all flex items-center justify-center cursor-pointer"
          title="Cluster Diagnostic Stream (⌘L)"
          aria-label="Open Diagnostics Stream"
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
        </button>
      </aside>

      {/* Production Footer */}
      <Footer
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        setActiveTab={switchTab}
      />

      {/* Sticky Mobile Quick-Action CTA Bar */}
      <StickyMobileCTA
        onExecuteScrape={() => {
          switchTab('overview');
        }}
        onSimulateDrift={() => {
          switchTab('overview');
        }}
        loading={false}
        simulatingDrift={false}
        activeTab={activeTab}
        setActiveTab={switchTab}
      />

      {/* Privacy Policy & Terms Modals */}
      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />

      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />

      {/* Zero-PII Cookie & Telemetry Consent Banner */}
      <CookieConsent />
    </div>
  );
}

export function App() {
  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}

export default App;

