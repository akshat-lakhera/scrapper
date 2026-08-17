import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  ShoppingBag, 
  Briefcase, 
  MessageCircle, 
  UserCheck, 
  Camera, 
  MapPin, 
  MessageSquare,
  Zap,
  Wrench,
  TrendingUp,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Shield,
  Layers,
  Code2,
  CheckCheck,
  CheckCircle2,
  Terminal,
  Activity
} from 'lucide-react';
import { executeScrape } from '../api';
import { useToast } from './ToastContext';
import { ScrapeProgressTimeline } from './ScrapeProgressTimeline';
import { StatusBadge } from './StatusBadge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CountUp } from './effects/CountUp';
import { CodeExportModal } from './CodeExportModal';

interface WorkflowPreset {
  id: string;
  name: string;
  workflow: string;
  icon: React.ElementType;
  badge: string;
  description: string;
  placeholder: string;
  presets: { label: string; url: string }[];
  sampleAttributes: string[];
}

const WORKFLOWS: WorkflowPreset[] = [
  {
    id: 'google_maps',
    name: 'Google Maps Places',
    workflow: 'google_maps',
    icon: MapPin,
    badge: 'Local Listings',
    description: 'Extract business titles, physical addresses, review counts, ratings, and categories.',
    placeholder: 'https://www.google.com/maps/place/...',
    presets: [
      { label: 'Pizza Inn Magdeburg (Germany)', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/' },
      { label: 'The CrossFit Bar', url: 'https://www.google.com/maps/place/The+CrossFit+Bar/@-32.7434276,151.856234,17z' },
    ],
    sampleAttributes: ['title', 'address', 'rating', 'reviews_count', 'phone', 'category']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profiles',
    workflow: 'linkedin',
    icon: UserCheck,
    badge: 'Executive Talent',
    description: 'Extract professional profiles, titles, current organizations, locations, and connections.',
    placeholder: 'https://www.linkedin.com/in/username',
    presets: [
      { label: 'Elad Moshe (Director)', url: 'https://www.linkedin.com/in/elad-moshe-05a90413/' },
      { label: 'Aviv Tal (Tech Executive)', url: 'https://www.linkedin.com/in/aviv-tal-75b81/' },
    ],
    sampleAttributes: ['name', 'headline', 'current_company', 'location', 'about', 'connections']
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    workflow: 'x',
    icon: MessageCircle,
    badge: 'Social Pulse',
    description: 'Extract post content, author handles, likes, reposts, reply counts, and timestamps.',
    placeholder: 'https://x.com/username/status/...',
    presets: [
      { label: 'Fabrizio Romano Post', url: 'https://x.com/FabrizioRomano/status/1683559267524136962' },
      { label: 'CNN Breaking News', url: 'https://x.com/CNN/status/1796673270344810776' },
    ],
    sampleAttributes: ['user_posted', 'description', 'likes', 'reposts', 'replies', 'date_posted']
  },
  {
    id: 'products',
    name: 'Amazon E-Commerce',
    workflow: 'products',
    icon: ShoppingBag,
    badge: 'Retail Intelligence',
    description: 'Extract live product prices, BuyBox stock status, ratings, sellers, and images.',
    placeholder: 'https://www.amazon.com/dp/...',
    presets: [
      { label: 'Sony WH-1000XM5', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
      { label: 'Apple iPhone 15', url: 'https://www.amazon.com/dp/B0CHX1W1XY' },
    ],
    sampleAttributes: ['title', 'price', 'currency', 'availability', 'rating', 'seller']
  },
  {
    id: 'instagram',
    name: 'Instagram Profiles',
    workflow: 'instagram',
    icon: Camera,
    badge: 'Creator Metrics',
    description: 'Extract creator handles, follower counts, following, post counts, and bios.',
    placeholder: 'https://www.instagram.com/username/',
    presets: [
      { label: 'Cristiano Ronaldo', url: 'https://www.instagram.com/cristiano/' },
      { label: 'Dogs of Instagram', url: 'https://www.instagram.com/dogsofinstagram/' },
    ],
    sampleAttributes: ['username', 'full_name', 'biography', 'followers_count', 'posts_count']
  },
  {
    id: 'reddit',
    name: 'Reddit Discussions',
    workflow: 'reddit',
    icon: MessageSquare,
    badge: 'Community Threads',
    description: 'Extract thread titles, subreddits, user submissions, upvote counts, and comments.',
    placeholder: 'https://www.reddit.com/r/.../comments/...',
    presets: [
      { label: 'Technology Discussion', url: 'https://www.reddit.com/r/technology/comments/1example_thread/' },
      { label: 'Battlefield Update', url: 'https://www.reddit.com/r/battlefield2042/comments/1cmqs1d/official_update_on_the_next_battlefield_game/' },
    ],
    sampleAttributes: ['title', 'subreddit', 'user_posted', 'description', 'upvotes']
  },
  {
    id: 'jobs',
    name: 'Talent & Job Postings',
    workflow: 'jobs',
    icon: Briefcase,
    badge: 'Labor Markets',
    description: 'Extract role titles, organizations, locations, compensation, and descriptions.',
    placeholder: 'https://jobs.lever.co/... or careers URL',
    presets: [
      { label: 'Staff Backend Architect', url: 'https://jobs.lever.co/stripe/staff-backend-engineer' },
    ],
    sampleAttributes: ['job_title', 'company', 'location', 'employment_type', 'description']
  },
];

interface WorkflowsStudioProps {
  setActiveTab?: (tab: string) => void;
}

export const WorkflowsStudio: React.FC<WorkflowsStudioProps> = ({ setActiveTab }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPreset>(WORKFLOWS[0]);
  const [targetUrl, setTargetUrl] = useState<string>(WORKFLOWS[0].presets[0].url);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [activeInspectorView, setActiveInspectorView] = useState<'visual' | 'json' | 'code'>('visual');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleSelectWorkflow = (wf: WorkflowPreset) => {
    setSelectedWorkflow(wf);
    setTargetUrl(wf.presets[0]?.url || '');
    setResult(null);
  };

  const handleRunScrape = async () => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      showToast('info', 'Executing Scrape', `Extracting from ${selectedWorkflow.name}...`);
      const res = await executeScrape({
        target_url: targetUrl.trim(),
        workflow_type: selectedWorkflow.workflow,
        schema_name: selectedWorkflow.workflow,
      });
      setResult(res);
      if (res.status === 'success' || res.status === 'repaired') {
        showToast('success', 'Extraction Completed', `Extracted with ${res.quality_score}% quality score`);
      } else {
        showToast('warning', 'Extraction Degraded', 'Drift detected — routed to Self-Healing Lab');
      }
    } catch (e: any) {
      showToast('error', 'Execution Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.extracted_data, null, 2));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    showToast('info', 'JSON Copied', 'Extracted payload copied to clipboard');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ── WORKSPACE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Universal Extraction Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Production schema pipeline with multi-strategy fallback and automated regression verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-white/[0.04] text-slate-300 border border-white/10">
            Active Engine: Multi-Strategy v2.4
          </span>
        </div>
      </div>

      {/* ── SPLIT WORKBENCH: 35% LEFT CONTROL DOCK / 65% RIGHT LIVE STAGE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Platform Preset Selector */}
          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.08] space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Platform Pipelines ({WORKFLOWS.length})
            </span>

            <div className="space-y-1.5">
              {WORKFLOWS.map((wf) => {
                const isSelected = selectedWorkflow.id === wf.id;
                const Icon = wf.icon;
                return (
                  <button
                    key={wf.id}
                    onClick={() => handleSelectWorkflow(wf)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer border flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm shadow-indigo-500/10'
                        : 'bg-white/[0.015] hover:bg-white/[0.04] border-white/[0.05] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400 group-hover:text-white'}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-semibold block">{wf.name}</span>
                        <span className="text-[10px] mono text-slate-500 block">{wf.badge}</span>
                      </div>
                    </div>

                    <ChevronRight size={14} className={isSelected ? 'text-indigo-400' : 'text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target URL Input Dock */}
          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                Target URL
              </span>
              <span className="text-[10px] mono text-indigo-400 font-bold uppercase">
                {selectedWorkflow.workflow}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={selectedWorkflow.placeholder}
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <Globe size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Quick Sample URL Presets */}
            {selectedWorkflow.presets.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-500 block">Sample Live Fixtures:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedWorkflow.presets.map((pr) => (
                    <button
                      key={pr.label}
                      onClick={() => setTargetUrl(pr.url)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Run Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleRunScrape}
              isLoading={loading}
              leftIcon={<Play size={14} fill="currentColor" />}
              className="w-full shadow-lg shadow-indigo-500/20"
            >
              {loading ? 'Executing Extraction Pipeline...' : 'Run Extraction Pipeline'}
            </Button>
          </div>

          {/* Schema Attributes Checklist */}
          <div className="p-4 rounded-2xl bg-[#0e1017] border border-white/[0.08] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              Schema Target Contract
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedWorkflow.sampleAttributes.map((attr) => (
                <span 
                  key={attr}
                  className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/10 text-[10px] mono text-slate-300"
                >
                  +{attr}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Data Inspector Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl bg-[#0e1017] border border-white/[0.08] overflow-hidden flex flex-col min-h-[580px]">
            {/* Inspector Top Bar */}
            <div className="p-4 border-b border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                {result ? (
                  <>
                    <StatusBadge status={result.status} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white">
                          Run #{result.run_id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs mono text-indigo-400 font-semibold">
                          {result.selected_strategy || 'multi_strategy_engine'}
                        </span>
                      </div>
                      <span className="text-[11px] mono text-slate-500 truncate block max-w-md">
                        {result.target_url}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <Terminal size={15} className="text-indigo-400" />
                    <span>Awaiting Execution Output</span>
                  </div>
                )}
              </div>

              {/* View Switcher & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <button
                    onClick={() => setActiveInspectorView('visual')}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      activeInspectorView === 'visual' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Visual Grid
                  </button>
                  <button
                    onClick={() => setActiveInspectorView('json')}
                    className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                      activeInspectorView === 'json' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>

                {result && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyJson}
                    leftIcon={copiedAll ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  >
                    {copiedAll ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>
            </div>

            {/* Inspector Canvas Body */}
            <div className="flex-1 p-5">
              {loading ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-xs font-mono text-slate-400">
                    Extracting DOM structures & executing heuristic normalizers...
                  </span>
                </div>
              ) : result ? (
                activeInspectorView === 'visual' ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Quality Banner */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <span className="text-xs font-mono text-slate-400">Schema Validation Score:</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        <CountUp end={result.quality_score} suffix="%" />
                      </span>
                    </div>

                    {/* Key Value Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(result.extracted_data || {}).map(([key, val]) => {
                        if (val === null || val === undefined) return null;
                        return (
                          <div key={key} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-mono text-white font-semibold block truncate" title={String(val)}>
                              {String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[500px] animate-fade-in">
                    <pre>
                      <code>{JSON.stringify(result.extracted_data, null, 2)}</code>
                    </pre>
                  </div>
                )
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500">
                    <Terminal size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">No Active Extraction</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select a platform preset on the left or enter a custom target URL, then click Run Extraction Pipeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
