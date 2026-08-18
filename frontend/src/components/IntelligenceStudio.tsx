import React, { useState, useEffect } from 'react';
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
  Tag
} from 'lucide-react';
import { ragChat, fetchIntelReport, fetchRuns } from '../api';
import { useToast } from './ToastContext';
import { CountUp } from './effects/CountUp';
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

export const IntelligenceStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rag' | 'intel'>('rag');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: '👋 Welcome to **MarketScout Living RAG**. I have indexed all your extracted web data, developer documentation, and competitor targets. Ask me anything about your scraped entities!',
      citations: [],
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [intelReport, setIntelReport] = useState<any>(null);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

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

  const samplePrompts = [
    "What is the price of the Portronics fan and is it in stock?",
    "What are the key collector methods described in the Tech Docs?",
    "Compare prices and ratings across extracted e-commerce targets."
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Living RAG & Competitive Intel
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Zero-Rot Self-Healing Knowledge Base
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Autonomous Intelligence Engine
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Query extracted web data, developer documentation, and competitor changelogs with grounded source provenance and automated structural drift radar.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-muted/60 p-1.5 rounded-xl border border-border/60 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab('rag')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'rag'
                  ? 'bg-background text-foreground shadow-md border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Brain className="w-4 h-4 text-primary" />
              Living RAG Assistant
            </button>
            <button
              onClick={() => {
                setActiveSubTab('intel');
                loadIntel();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'intel'
                  ? 'bg-background text-foreground shadow-md border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              Diff Radar & Intel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'rag' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Scope & Indexed Entities */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Knowledge Scope
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                  {runs.length} Runs Indexed
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Filter Workflow</label>
                <select
                  value={selectedWorkflow}
                  onChange={e => setSelectedWorkflow(e.target.value)}
                  className="w-full bg-background border border-border/80 rounded-lg px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">All Workflows (Universal RAG)</option>
                  <option value="products">E-Commerce Products</option>
                  <option value="tech_docs">Tech Docs & API Specs</option>
                  <option value="jobs">Talent & Job Postings</option>
                  <option value="linkedin">LinkedIn Executive Profiles</option>
                  <option value="x">X (Twitter) Feed</option>
                  <option value="reddit">Reddit Discussions</option>
                </select>
              </div>

              <div className="pt-2 border-t border-border/60 space-y-2">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Suggested Prompts
                </span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p)}
                    className="w-full text-left p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 text-[11px] text-muted-foreground hover:text-foreground transition-all flex items-start gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provenance Guarantee */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Verifiable Grounding
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Every response generates exact attribute citations linked to canonical source URLs with self-healed DOM provenance.
              </p>
            </div>
          </div>

          {/* Right Column: Chat Console */}
          <div className="lg:col-span-3 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md shadow-sm flex flex-col h-[640px]">
            {/* Chat Messages Scroll Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary mt-1 shadow-sm">
                      <Brain className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-primary text-primary-foreground font-medium rounded-tr-sm shadow-md'
                          : 'bg-muted/40 border border-border/80 text-foreground rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>

                      {/* Source Citations */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                              <FileCode className="w-3 h-3 text-primary" />
                              Verified Source Citations ({m.citations.length})
                            </span>
                            {m.confidence && (
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {(m.confidence * 100).toFixed(0)}% Grounded
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.citations.map((c, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2 rounded bg-background/80 border border-border/80 text-[11px] space-y-1"
                              >
                                <div className="flex items-center justify-between font-mono">
                                  <span className="font-semibold text-primary">{c.field}</span>
                                  <a
                                    href={c.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 text-[10px]"
                                  >
                                    Source <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                                <div className="truncate text-muted-foreground font-mono text-[10px]">
                                  {String(c.value)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground px-1 block">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {loadingQuery && (
                <div className="flex gap-3.5 items-start">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 text-primary mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Synthesizing grounded answer from extracted web entities...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border/80 bg-muted/20">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={e => setInputQuery(e.target.value)}
                  placeholder="Ask any question about your scraped web data, docs, or prices..."
                  className="flex-1 bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || loadingQuery}
                  className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ask RAG
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Competitive Intelligence & Diff Radar SubTab */
        <div className="space-y-6">
          {/* Executive Briefing Card */}
          <div className="p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-card via-card/90 to-cyan-950/20 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    AI Executive Intelligence Briefing
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Automated multi-run semantic diff synthesis
                  </span>
                </div>
              </div>
              <button
                onClick={loadIntel}
                disabled={loadingIntel}
                className="px-3 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
              >
                {loadingIntel ? 'Refreshing...' : 'Refresh Radar'}
              </button>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed font-sans p-4 rounded-xl bg-background/60 border border-border/60">
              {intelReport?.executive_summary || 'Analyzing historical change timeline across monitored web targets...'}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tracked Runs</span>
                <span className="text-xl font-bold text-foreground font-mono">
                  <CountUp end={intelReport?.total_tracked_runs || 0} />
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">DOM Templates</span>
                <span className="text-xl font-bold text-primary font-mono">
                  <CountUp end={intelReport?.unique_templates || 0} />
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Diff Events</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  <CountUp end={intelReport?.total_diff_events || 0} />
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Healed Outages</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  <CountUp end={intelReport?.healed_runs_count || 0} />
                </span>
              </div>
            </div>

          </div>

          {/* Timeline & Price Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Stream */}
            <div className="p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Chronological Field Diff Stream
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {intelReport?.timeline_events?.length || 0} Events
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {intelReport?.timeline_events?.length > 0 ? (
                  intelReport.timeline_events.map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1.5 font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-primary flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-muted-foreground" />
                          {ev.field_name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {ev.change_type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-background/80 p-2 rounded border border-border/60">
                        <div className="truncate text-rose-400">
                          <span className="text-muted-foreground">Old:</span> {String(ev.old_value || 'None')}
                        </div>
                        <div className="truncate text-emerald-400">
                          <span className="text-muted-foreground">New:</span> {String(ev.new_value || 'None')}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No structural diffs detected yet. Execute multiple scrape runs on target domains to populate the radar.
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Stock Trajectory */}
            <div className="p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Pricing & Availability Shifts
                </h3>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                {intelReport?.price_events?.length > 0 ? (
                  intelReport.price_events.map((pe: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-1.5 font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">Run #{pe.run_id} Mutation</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                          Shift Detected
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="line-through text-muted-foreground">{pe.old_value}</span>
                        <ArrowRight className="w-3 h-3 text-primary" />
                        <span className="font-bold text-emerald-400">{pe.new_value}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No pricing or salary shifts recorded. Execute recurring scrape jobs to track historical price movements.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
