import React, { useState } from 'react';
import { 
  Layers, 
  Play, 
  ExternalLink, 
  Copy, 
  Check, 
  ShoppingBag, 
  Briefcase, 
  MessageCircle, 
  MessageSquare,
  Camera, 
  MapPin, 
  Zap, 
  Code2, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  Sparkles,
  Terminal,
  Activity,
  Send,
  Globe,
  Database
} from 'lucide-react';
import { executeScrape } from '../api';
import { useToast } from './ToastContext';
import { StatusBadge } from './StatusBadge';
import { CodeExportModal } from './CodeExportModal';
import { SpotlightCard } from './SpotlightCard';

interface WorkflowPreset {
  id: string;
  name: string;
  workflow: string;
  icon: React.ElementType;
  tag: string;
  description: string;
  placeholder: string;
  presets: { label: string; url: string }[];
  sampleAttributes: string[];
}

const WORKFLOWS: WorkflowPreset[] = [
  {
    id: 'products',
    name: 'Amazon E-Commerce',
    workflow: 'products',
    icon: ShoppingBag,
    tag: 'Retail & Pricing',
    description: 'Extract BuyBox prices, stock availability, seller details, review metrics, and high-res images.',
    placeholder: 'https://www.amazon.com/dp/... or https://www.amazon.in/dp/...',
    presets: [
      { label: 'Sony WH-1000XM5 (Amazon US)', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
      { label: 'Portronics Toofan Fan (Amazon IN)', url: 'https://www.amazon.in/Portronics-Rechargeable-Handheld-High-Speed-Charging/dp/B0H5Q91GST' },
    ],
    sampleAttributes: ['title', 'price', 'currency', 'availability', 'rating', 'seller']
  },
  {
    id: 'tech_docs',
    name: 'Tech Docs & API Specs',
    workflow: 'tech_docs',
    icon: Code2,
    tag: 'API Docs & Guides',
    description: 'Extract API guides, code snippets, documentation sections, and version changes from developer portals.',
    placeholder: 'https://fastapi.tiangolo.com/ or https://docs.example.com/...',
    presets: [
      { label: 'FastAPI Python Framework Docs', url: 'https://fastapi.tiangolo.com/' },
      { label: 'Requests HTTP Developer Guide', url: 'https://requests.readthedocs.io/en/latest/' },
    ],
    sampleAttributes: ['doc_title', 'section_heading', 'content_body', 'code_snippet', 'last_updated']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profiles',
    workflow: 'linkedin',
    icon: Briefcase,
    tag: 'Executive Talent',
    description: 'Extract professional profile names, current organizations, locations, titles, and public headlines.',
    placeholder: 'https://www.linkedin.com/in/username',
    presets: [
      { label: 'CodingStark Profile', url: 'https://www.linkedin.com/in/codingstark/' },
      { label: 'Elad Moshe (Director)', url: 'https://www.linkedin.com/in/elad-moshe-05a90413/' },
    ],
    sampleAttributes: ['name', 'headline', 'current_company', 'location', 'education', 'connections']
  },
  {
    id: 'x',
    name: 'X (Twitter) Feed',
    workflow: 'x',
    icon: MessageCircle,
    tag: 'Social Intelligence',
    description: 'Extract live post text, author usernames, like counts, repost metrics, and accurate timestamps.',
    placeholder: 'https://x.com/username/status/...',
    presets: [
      { label: 'Konig Hiring Post', url: 'https://x.com/konig0000/status/2089565885149466685?s=20' },
      { label: 'Fabrizio Romano Breaking', url: 'https://x.com/FabrizioRomano/status/1683559267524136962' },
    ],
    sampleAttributes: ['user_posted', 'description', 'likes', 'reposts', 'replies', 'date_posted']
  },
  {
    id: 'jobs',
    name: 'Talent & Job Careers',
    workflow: 'jobs',
    icon: Briefcase,
    tag: 'Labor Markets',
    description: 'Extract career postings, hiring organizations, compensation, locations, and requirements.',
    placeholder: 'https://jobs.lever.co/... or careers URL',
    presets: [
      { label: 'Stripe Staff Architect (Lever)', url: 'https://jobs.lever.co/stripe/staff-backend-engineer' },
    ],
    sampleAttributes: ['job_title', 'company', 'location', 'employment_type', 'description']
  },
  {
    id: 'instagram',
    name: 'Instagram Profiles',
    workflow: 'instagram',
    icon: Camera,
    tag: 'Creator Metrics',
    description: 'Extract creator handles, follower counts, following stats, total post counts, and bios.',
    placeholder: 'https://www.instagram.com/username/',
    presets: [
      { label: 'Google Profile', url: 'https://www.instagram.com/google/' },
    ],
    sampleAttributes: ['username', 'full_name', 'followers', 'following', 'posts_count', 'bio']
  },
  {
    id: 'reddit',
    name: 'Reddit Discussions',
    workflow: 'reddit',
    icon: MessageSquare,
    tag: 'Community Threads',
    description: 'Extract thread titles, subreddits, author submissions, upvote scores, and comment volume.',
    placeholder: 'https://reddit.com/r/.../comments/...',
    presets: [
      { label: 'Python Web Scraping Discussion', url: 'https://www.reddit.com/r/Python/comments/123456/best_web_scraping_tools/' },
    ],
    sampleAttributes: ['title', 'subreddit', 'author', 'score', 'num_comments', 'body']
  },
  {
    id: 'google_maps',
    name: 'Google Maps Places',
    workflow: 'google_maps',
    icon: MapPin,
    tag: 'Local POI',
    description: 'Extract business titles, physical addresses, review scores, ratings, and categories.',
    placeholder: 'https://maps.google.com/?q=...',
    presets: [
      { label: 'Blue Bottle Coffee SF', url: 'https://www.google.com/maps/place/Blue+Bottle+Coffee/@37.7825,-122.4075,17z' },
    ],
    sampleAttributes: ['title', 'address', 'rating', 'reviews_count', 'category', 'phone']
  }
];

interface WorkflowsStudioProps {
  setActiveTab?: (tab: string) => void;
}

const formatFieldValue = (val: any): React.ReactNode => {
  if (val === null || val === undefined) return <span className="text-slate-600 italic">None</span>;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number') return val.toLocaleString();
  if (typeof val === 'string') {
    // If it's a raw stringified dict like "{'link': '...'}"
    const s = val.trim();
    if (s.startsWith('{') || s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s.replace(/'/g, '"'));
        return formatFieldValue(parsed);
      } catch {
        const m = s.match(/['"](?:name|title|company|school)['"]:\s*['"]([^'"]+)['"]/i);
        if (m) return m[1];
      }
    }
    return <span className="break-words line-clamp-3">{val}</span>;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-600 italic">Empty</span>;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1 max-h-36 overflow-y-auto">
        {val.map((item, idx) => {
          let label = '';
          if (typeof item === 'object' && item !== null) {
            label = item.name || item.title || item.school || item.company || item.degree || item.label || Object.values(item).filter(x => typeof x === 'string')[0] || JSON.stringify(item);
          } else {
            label = String(item);
          }
          return (
            <span key={idx} className="px-2 py-0.5 rounded-md text-[11px] bg-blue-500/10 text-blue-300 border border-blue-500/20 max-w-full truncate">
              {label}
            </span>
          );
        })}
      </div>
    );
  }
  if (typeof val === 'object') {
    const label = val.name || val.title || val.company || val.school || val.label || val.city || val.text;
    if (label) {
      return (
        <span className="text-slate-200">
          {label}
          {val.link && (
            <a href={val.link} target="_blank" rel="noreferrer" className="ml-1 text-blue-400 hover:underline text-[10px]">
              ↗
            </a>
          )}
        </span>
      );
    }
    if (val.link || val.url) {
      const url = val.link || val.url;
      const slug = url.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || url;
      return (
        <a href={url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
          <span className="capitalize">{slug}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      );
    }
    return (
      <div className="space-y-0.5 text-[11px] text-slate-300">
        {Object.entries(val).map(([k, v]) => (
          <div key={k} className="truncate"><span className="text-slate-500">{k}:</span> {String(v)}</div>
        ))}
      </div>
    );
  }
  return String(val);
};

export const WorkflowsStudio: React.FC<WorkflowsStudioProps> = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPreset>(WORKFLOWS[0]);
  const [targetUrl, setTargetUrl] = useState<string>(WORKFLOWS[0].presets[0].url);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'card' | 'json'>('card');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
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
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
    showToast('info', 'JSON Copied', 'Extracted payload copied to clipboard');
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── [01 // WORKFLOW PRESETS] TOP HERO HEADER ── */}
      <SpotlightCard className="p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                [01 // WORKFLOW PRESETS & SCHEMAS]
              </span>
              <span className="text-[11px] font-mono text-slate-500">SCHEMAS: 8 ACTIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Extraction Studio & Schema Engine
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Select a target schema, configure custom collectors, or paste any live URL. The multi-strategy engine executes ordered extraction and normalizes payloads into strict Pydantic schemas.
            </p>
          </div>

          <button
            onClick={() => setShowCodeModal(true)}
            className="tactile-press px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md self-start md:self-auto cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Generate SDK Snippet</span>
            <kbd className="kbd-badge bg-white/10 text-white border-white/20 text-[9px] py-0.5 px-1.5 ml-1">⌘I</kbd>
          </button>
        </div>
      </SpotlightCard>

      {/* ── [02 // PROTOCOL MATRIX] 8 PLATFORM BENTO DECK (4x2 GRID) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-slate-400 font-bold">
              [02 // PROTOCOL MATRIX]
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Target Platform Protocol:
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500 font-bold">8 Supported Schemas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOWS.map((wf) => {
            const Icon = wf.icon;
            const isSelected = selectedWorkflow.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => handleSelectWorkflow(wf)}
                className={`tactile-press p-5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? 'border-blue-400 bg-[#141b2e] shadow-xl shadow-blue-500/20 scale-[1.01]'
                    : 'border-white/15 bg-[#0a0e18] hover:bg-[#121829] hover:border-blue-400/40 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50' : 'bg-white/10 text-blue-400 border border-white/15'}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15 font-semibold">
                      {wf.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{wf.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{wf.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  {isSelected ? (
                    <span className="text-blue-300 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 status-dot-blue animate-pulse" />
                      <span>Active Target</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 font-semibold group-hover:text-white transition-colors">
                      Select
                    </span>
                  )}
                  <ArrowRight className={`w-3.5 h-3.5 transition-all ${isSelected ? 'text-blue-300' : 'text-slate-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── WORKSPACE SPLIT: CONFIGURATION & LIVE INSPECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Configuration (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <SpotlightCard className="p-7 space-y-6 relative">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                  [03 // TARGET CONFIGURATION]
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedWorkflow.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedWorkflow.description}
              </p>
            </div>

            {/* Target URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-200">Target URL</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={selectedWorkflow.placeholder}
                className="w-full bg-[#080b12] border border-white/20 rounded-xl px-4 py-3.5 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 shadow-inner"
              />
            </div>

            {/* Verified Sample Presets */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono text-slate-200 block font-bold">Verified Presets:</span>
              <div className="space-y-2">
                {selectedWorkflow.presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTargetUrl(p.url)}
                    className="tactile-press w-full text-left p-3 rounded-xl bg-[#080b12] hover:bg-[#141b2e] border border-white/15 text-xs font-mono text-slate-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer font-medium shadow-sm"
                  >
                    <span className="truncate">{p.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 opacity-75 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Contract Attributes */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-300 block font-bold">Schema Contract Attributes</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWorkflow.sampleAttributes.map((attr) => (
                  <span
                    key={attr}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/10 text-slate-200 border border-white/15 font-semibold"
                  >
                    {attr}
                  </span>
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleRunScrape}
              disabled={loading || !targetUrl.trim()}
              className="tactile-press w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono rounded-xl flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
            >
              {loading ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-white" />
                  <span>Extracting Live Dataset...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Deploy Scraper Pipeline</span>
                  <kbd className="kbd-badge bg-white/15 text-white border-white/25 text-xs py-0.5 px-1.5 ml-1">↵</kbd>
                </>
              )}
            </button>
          </SpotlightCard>
        </div>

        {/* Right Column: Live Entity Inspector (Span 7) */}
        <div className="lg:col-span-7">
          <SpotlightCard className="p-7 flex flex-col min-h-[540px] relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 font-bold tracking-wider">
                  [04 // ENTITY INSPECTOR]
                </span>
                <Terminal className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-100">
                  Live Entity Inspector
                </h3>
              </div>

              {result && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#080b12] p-1 rounded-lg border border-white/15 text-xs font-mono">
                    <button
                      onClick={() => setActiveView('card')}
                      className={`tactile-press px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                    >
                      Visual Card
                    </button>
                    <button
                      onClick={() => setActiveView('json')}
                      className={`tactile-press px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                    >
                      Raw JSON
                    </button>
                  </div>

                  <button
                    onClick={handleCopyJson}
                    className="tactile-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-slate-100 border border-white/15 transition-colors cursor-pointer font-bold"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Results Area */}
            {result ? (
              <div className="flex-1 space-y-5">
                {/* Telemetry Header */}
                <div className="p-4 rounded-xl bg-[#080b12] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={result.status} />
                    <span className="text-slate-300">
                      Quality: <strong className="text-emerald-400 font-bold">{result.quality_score}%</strong>
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Latency: <strong className="text-white font-bold">{result.duration_ms}ms</strong> · Strategy: <strong className="text-cyan-300 font-bold">{result.selected_strategy}</strong>
                  </div>
                </div>

                {activeView === 'card' ? (
                  <div className="p-6 rounded-xl bg-[#080b12] border border-white/15 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      {/* Product Image Preview */}
                      {(result.extracted_data?.image_url || result.extracted_data?.image) && (
                        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/60 border border-white/20 p-2 flex items-center justify-center shrink-0 overflow-hidden group shadow-lg">
                          <img
                            src={result.extracted_data.image_url || result.extracted_data.image}
                            alt={result.extracted_data?.title || 'Product'}
                            className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 max-w-2xl">
                        <h4 className="text-xl font-bold text-white leading-snug">
                          {result.extracted_data?.title || result.extracted_data?.name || result.extracted_data?.job_title || result.extracted_data?.doc_title || 'Extracted Entity'}
                        </h4>
                        <a
                          href={result.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 truncate font-medium"
                        >
                          <span>{result.target_url}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {result.extracted_data?.price !== undefined && (
                        <div className="text-left sm:text-right shrink-0 bg-emerald-500/15 border border-emerald-500/30 px-4 py-2.5 rounded-xl">
                          <span className="text-2xl font-extrabold font-mono text-emerald-400 block">
                            {result.extracted_data.currency || '$'}{typeof result.extracted_data.price === 'number' ? result.extracted_data.price.toFixed(2) : result.extracted_data.price}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300 uppercase font-bold">
                            {result.extracted_data.availability || 'In Stock'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dynamic Attributes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                      {Object.entries(result.extracted_data || {}).map(([key, value]) => {
                        if (['title', 'name', 'job_title', 'doc_title', 'image_url', 'image', 'price', 'currency', 'availability'].includes(key)) {
                          return null;
                        }
                        return (
                          <div key={key} className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                            <span className="text-[10px] font-mono uppercase text-slate-300 font-bold block mb-1">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <div className="text-xs font-mono text-slate-100 break-words font-medium">
                              {formatFieldValue(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <pre className="p-6 rounded-xl bg-[#080b12] border border-white/15 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed font-semibold">
                    {JSON.stringify(result.extracted_data, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              /* Interactive Schema Contract Blueprint Preview */
              <div className="flex-1 flex flex-col justify-between space-y-6">
                <div className="p-5 rounded-2xl bg-[#080b12] border border-blue-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                        Schema Blueprint Contract: {selectedWorkflow.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                      Armed for Deployment
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    The multi-strategy pipeline is initialized. Once deployed, the extractor will execute the 5-stage waterfall and populate these structured attributes:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    {selectedWorkflow.sampleAttributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1 shadow-sm"
                      >
                        <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">{attr}</span>
                        <span className="text-[11px] font-mono text-slate-300 italic">string · validated</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/20 to-cyan-950/20 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">Ready to Test Real-Time Extraction?</h4>
                    <p className="text-xs text-slate-300 font-mono">
                      Target URL: <span className="text-blue-300 font-medium">{targetUrl.substring(0, 45)}...</span>
                    </p>
                  </div>
                  <button
                    onClick={handleRunScrape}
                    disabled={loading}
                    className="tactile-press px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Execute Sample</span>
                  </button>
                </div>
              </div>
            )}
          </SpotlightCard>
        </div>
      </div>

      {/* Code Export Modal */}
      {showCodeModal && (
        <CodeExportModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          targetUrl={targetUrl}
          workflowType={selectedWorkflow.workflow}
        />
      )}
    </div>
  );
};
