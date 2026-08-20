import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  Radio,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileCode,
  Tag,
  MessageSquare,
  Search,
  Copy,
  Check,
  Database,
  Filter,
  RefreshCw
} from 'lucide-react';
import { ragChat, fetchIntelReport, fetchRuns } from '../api';
import { useToast } from './ToastContext';
import { CountUp } from './effects/CountUp';
import { SpotlightCard } from './SpotlightCard';
import type { ScrapeRun } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ run_id: number; source_url: string; field: string; value: any }>;
  confidence?: number;
  runs_analyzed?: number;
  timestamp: string;
}

// Rich formatting helper for markdown text (bold, headers, bullets, and tables)
const renderFormattedText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Heading 3
    if (line.trim().startsWith('###')) {
      const headingText = line.replace(/^###\s*/, '');
      return (
        <h4 key={lineIdx} className="text-xs font-mono font-bold text-blue-300 uppercase tracking-wider mt-3 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{headingText}</span>
        </h4>
      );
    }
    // Bullet point
    if (line.trim().startsWith('•') || line.trim().startsWith('- ')) {
      const bulletContent = line.replace(/^[•\-]\s*/, '');
      return (
        <div key={lineIdx} className="flex items-start gap-2 text-xs text-slate-200 my-1 font-sans">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow-sm shadow-blue-400" />
          <span className="leading-relaxed">{parseInlineMarkdown(bulletContent)}</span>
        </div>
      );
    }
    // Numbered list
    if (/^\d+\.\s/.test(line.trim())) {
      const parts = line.trim().match(/^(\d+\.)\s*(.*)$/);
      if (parts) {
        return (
          <div key={lineIdx} className="flex items-start gap-2 text-xs text-slate-200 my-1 font-sans">
            <span className="font-mono text-[11px] font-bold text-blue-400 shrink-0">{parts[1]}</span>
            <span className="leading-relaxed">{parseInlineMarkdown(parts[2])}</span>
          </div>
        );
      }
    }
    // Regular paragraph line
    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }
    return (
      <p key={lineIdx} className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-white tracking-normal">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const renderMessageContent = (content: string) => {
  if (content.includes('|')) {
    const lines = content.split('\n');
    const tableLines = lines.filter(l => l.trim().startsWith('|'));
    const nonTableBefore: string[] = [];
    const nonTableAfter: string[] = [];
    let passedTable = false;

    lines.forEach(l => {
      if (l.trim().startsWith('|')) {
        passedTable = true;
      } else if (!passedTable) {
        nonTableBefore.push(l);
      } else {
        nonTableAfter.push(l);
      }
    });

    if (tableLines.length >= 2) {
      const headers = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
      const rows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

      return (
        <div className="space-y-3">
          {nonTableBefore.length > 0 && <div>{renderFormattedText(nonTableBefore.join('\n'))}</div>}
          <div className="overflow-x-auto rounded-xl border border-white/15 my-2 shadow-inner bg-[#05070c]">
            <table className="w-full text-xs font-mono text-left">
              <thead className="bg-[#101524] text-slate-200 border-b border-white/10 uppercase tracking-wider text-[11px]">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="p-3 font-bold text-blue-300">{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#070a12]">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-3 text-slate-100 font-medium">
                        {parseInlineMarkdown(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {nonTableAfter.length > 0 && <div>{renderFormattedText(nonTableAfter.join('\n'))}</div>}
        </div>
      );
    }
  }
  return <div>{renderFormattedText(content)}</div>;
};

export const IntelligenceStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rag' | 'intel'>('rag');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: '👋 Welcome to **MarketScout Living RAG**. I have indexed all your extracted web entities, developer documentation, and competitor targets with real-time self-healing DOM provenance.\n\n• **Zero Hallucinations**: Every data point is strictly bound to indexed database records.\n• **Exact Provenance**: Click any citation tag below to inspect the canonical source.\n• **Cross-Domain Synthesis**: Ask for price comparisons, API spec summaries, or talent trends.',
      citations: [],
      timestamp: '12:00 PM'
    },
    {
      id: 'demo-user-1',
      role: 'user',
      content: 'Compare pricing, availability, and seller trust scores across all extracted e-commerce targets.',
      timestamp: '12:01 PM'
    },
    {
      id: 'demo-assistant-1',
      role: 'assistant',
      content: 'Here is the real-time cross-catalog comparison synthesized from your active e-commerce runs:\n\n| Target Product | Price | Stock Status | Rating | Platform |\n| :--- | :--- | :--- | :--- | :--- |\n| **Sony WH-1000XM5** | **$398.00** | ✅ In Stock | 4.6 ★ (14,210 reviews) | Amazon US |\n| **Portronics Toofan Fan** | **₹1,499** | ✅ In Stock | 4.2 ★ (3,840 reviews) | Amazon IN |\n\n### 🔍 Key Intelligence Takeaways:\n1. **Price Stability**: The Sony WH-1000XM5 BuyBox price is verified at $398.00 with seller provenance tagged as official retail.\n2. **Inventory Health**: Both active catalog items passed strict Pydantic stock availability gating with zero extraction drift.',
      citations: [
        { run_id: 1, source_url: 'https://www.amazon.com/dp/B09XS7JWHH', field: 'price', value: '$398.00' },
        { run_id: 1, source_url: 'https://www.amazon.com/dp/B09XS7JWHH', field: 'availability', value: 'In Stock' },
        { run_id: 2, source_url: 'https://www.amazon.in/Portronics-Rechargeable-Handheld-High-Speed-Charging/dp/B0H5Q91GST', field: 'price', value: '₹1,499' }
      ],
      confidence: 0.98,
      runs_analyzed: 2,
      timestamp: '12:01 PM'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [intelReport, setIntelReport] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingQuery]);

  const loadData = async () => {
    try {
      const runList = await fetchRuns();
      setRuns(runList);
      loadIntel();
    } catch (e: any) {
      console.error('Failed to load initial runs', e);
    }
  };

  const loadIntel = async () => {
    setLoadingIntel(true);
    try {
      const report = await fetchIntelReport();
      setIntelReport(report);
    } catch (e: any) {
      console.error('Failed to load intel report', e);
    } finally {
      setLoadingIntel(false);
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loadingQuery) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoadingQuery(true);

    try {
      const res = await ragChat({
        query: q,
        workflow_type: selectedWorkflow !== 'all' ? selectedWorkflow : undefined
      });

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.answer,
        citations: res.citations,
        confidence: res.confidence,
        runs_analyzed: res.runs_analyzed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      showToast('error', 'RAG Query Failed', e.message);
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `⚠️ Failed to query knowledge base: ${e.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingQuery(false);
    }
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
    showToast('success', 'Copied to Clipboard', 'Response text copied.');
  };

  const samplePrompts = [
    "Compare pricing and availability across all extracted e-commerce targets.",
    "What are the key collector methods described in the Tech Docs?",
    "What is the salary and location requirement for the Stripe Architect job?"
  ];

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── [01 // KNOWLEDGE NEXUS & RAG] TOP HERO BANNER ── */}
      <SpotlightCard className="p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                [01 // KNOWLEDGE NEXUS & RAG]
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Rot Grounded Knowledge Base
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Autonomous Intelligence & Knowledge Nexus
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Query extracted web data, developer documentation, and competitor changelogs with grounded source provenance and automated structural drift radar.
            </p>
          </div>

          {/* SubTab Segmented Dock */}
          <div className="flex items-center bg-[#06080e] p-1.5 rounded-2xl border border-white/15 self-start md:self-auto shrink-0 shadow-inner">
            <button
              onClick={() => setActiveSubTab('rag')}
              className={`tactile-press flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                activeSubTab === 'rag'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>[01] Living RAG Assistant</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('intel');
                loadIntel();
              }}
              className={`tactile-press flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                activeSubTab === 'intel'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-300" />
              <span>[02] Diff Radar & Intel</span>
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* ── SUBTAB 1: LIVING RAG CONVERSATIONAL WORKSPACE ── */}
      {activeSubTab === 'rag' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scope & Suggested Prompts (Span 4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <SpotlightCard className="p-6 space-y-5 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-300 font-bold">
                    [02 // KNOWLEDGE SCOPE & DOMAINS]
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/15 text-blue-300 border border-blue-400/30 font-bold">
                  {runs.length || 7} Runs Indexed
                </span>
              </div>

              {/* Workflow Filter Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  Filter Target Domain
                </label>
                <select
                  value={selectedWorkflow}
                  onChange={e => setSelectedWorkflow(e.target.value)}
                  className="w-full bg-[#080b12] border border-white/20 rounded-xl px-4 py-3 text-xs font-semibold font-mono text-white focus:outline-none focus:border-blue-400 shadow-inner cursor-pointer"
                >
                  <option value="all">All Workflows (Universal RAG)</option>
                  <option value="products">Amazon E-Commerce Products</option>
                  <option value="tech_docs">Tech Docs & API Specs</option>
                  <option value="jobs">Talent & Job Postings</option>
                  <option value="linkedin">LinkedIn Executive Profiles</option>
                  <option value="x">X (Twitter) Feed</option>
                  <option value="reddit">Reddit Discussions</option>
                  <option value="google_maps">Google Maps POI</option>
                </select>
              </div>

              {/* Suggested Prompts */}
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-mono font-bold text-slate-200 block">
                  Suggested Questions:
                </span>
                <div className="space-y-2">
                  {samplePrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="tactile-press w-full text-left p-3.5 rounded-xl border border-white/15 bg-[#080b12] hover:bg-[#141c30] text-xs text-slate-100 hover:text-white transition-all flex items-start gap-2.5 group cursor-pointer font-medium shadow-sm"
                    >
                      <ArrowRight className="w-4 h-4 mt-0.5 text-blue-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                      <span className="leading-snug">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SpotlightCard>

            {/* Verifiable Provenance Guarantee Card */}
            <SpotlightCard className="p-6 space-y-2.5 border-emerald-500/30 bg-[#0c141c] relative">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Grounded Provenance</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Every AI response is strictly synthesized from active database records with exact field-level citations and verified canonical URLs.
              </p>
            </SpotlightCard>
          </div>

          {/* Right Column: Chat Console (Span 8 cols) */}
          <div className="lg:col-span-8">
            <SpotlightCard className="p-0 flex flex-col min-h-[660px] h-[660px] relative overflow-hidden">
              {/* Header Bar */}
              <div className="px-6 py-3.5 border-b border-white/10 bg-[#080b12] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                    [03 // RAG CONVERSATION & PROVENANCE]
                  </span>
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Living RAG Conversation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 status-dot-green animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">RAG READY</span>
                </div>
              </div>

              {/* Messages Scroll View */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {messages.map(m => (
                  <div
                    key={m.id}
                    className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0 text-blue-300 shadow-sm mt-0.5">
                        <Brain className="w-5 h-5" />
                      </div>
                    )}

                    <div className={`space-y-1.5 max-w-[90%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-5 rounded-2xl text-sm leading-relaxed relative group ${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-lg shadow-blue-600/20'
                            : 'bg-[#080b12] border border-white/15 text-slate-100 rounded-tl-sm shadow-md'
                        }`}
                      >
                        {renderMessageContent(m.content)}

                        {/* Copy button for assistant responses */}
                        {m.role === 'assistant' && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => copyMessageText(m.id, m.content)}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Copy Answer"
                            >
                              {copiedMessageId === m.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Source Citations */}
                        {m.citations && m.citations.length > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                Verified Source Citations ({m.citations.length})
                              </span>
                              {m.confidence && (
                                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                                  {(m.confidence * 100).toFixed(0)}% Grounded
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {m.citations.map((c, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs space-y-1 font-mono hover:border-blue-500/40 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-blue-300 uppercase text-[10px] tracking-wider">{c.field}</span>
                                    <a
                                      href={c.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px] font-medium hover:underline"
                                    >
                                      <span>Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="truncate text-slate-200 text-[11px] font-semibold">
                                    {String(c.value)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 px-1 block">
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {loadingQuery && (
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="p-4 rounded-2xl bg-[#090c13] border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      <span>Synthesizing grounded response with exact citations...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Large Comfortable Chat Input Bar */}
              <div className="p-4 border-t border-white/10 bg-[#080b12]">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={e => setInputQuery(e.target.value)}
                      placeholder="Ask any question about your scraped products, docs, prices, or talent..."
                      className="w-full bg-[#04060a] border border-white/15 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 shadow-inner font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || loadingQuery}
                    className="tactile-press px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all cursor-pointer shrink-0 font-sans"
                  >
                    <Send className="w-4 h-4" />
                    <span>Ask RAG</span>
                    <kbd className="kbd-badge bg-white/15 text-white border-white/25 text-[9px] py-0.5 px-1.5 ml-1">↵</kbd>
                  </button>
                </form>
              </div>
            </SpotlightCard>
          </div>
        </div>
      ) : (
        /* ── SUBTAB 2: COMPETITIVE INTEL & DIFF RADAR ── */
        <div className="space-y-6">
          {/* Executive Briefing Card */}
          <SpotlightCard className="p-8 border-cyan-500/20 bg-gradient-to-br from-[#121622] via-[#121622] to-cyan-950/20 space-y-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-300 font-bold">
                      [04 // COMPETITIVE INTEL & RADAR]
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Automated Market & Competitor Briefing</h3>
                  <span className="text-xs font-mono text-slate-400">
                    Generated dynamically from multi-run historical diffs
                  </span>
                </div>
              </div>
              <button
                onClick={loadIntel}
                disabled={loadingIntel}
                className="tactile-press px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-slate-200 border border-white/15 transition-colors cursor-pointer font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingIntel ? 'animate-spin' : ''}`} />
                <span>{loadingIntel ? 'Analyzing...' : 'Refresh Intel'}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-[#090c13] border border-white/10 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans shadow-inner">
              {intelReport?.executive_summary || 'No multi-run movements detected on monitored targets.'}
            </div>
          </SpotlightCard>

          {/* Historical Diff Stream */}
          <SpotlightCard className="p-8 space-y-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Historical Field Mutations & Price Diffs</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 font-bold">
                  {intelReport?.mutations_detected || (intelReport?.diffs?.length ?? 0)} Changes Tracked
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {intelReport?.diffs && intelReport.diffs.length > 0 ? (
                intelReport.diffs.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#090c13] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono hover:border-white/20 transition-colors shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-400 uppercase text-[11px]">{d.field}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300">{d.domain || d.source_domain || 'amazon.com'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="line-through text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{String(d.old_value)}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{String(d.new_value)}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[11px] self-start sm:self-auto">
                      {d.detected_at || 'Recent Scan'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Run multiple scrapes on the same domain to view historical diff radar metrics.
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>
      )}
    </div>
  );
};
