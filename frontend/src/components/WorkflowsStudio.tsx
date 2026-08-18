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
    description: 'Extract real-time BuyBox prices, stock availability, seller details, review counts, and high-res images.',
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
    description: 'Extract API guides, code snippets, documentation sections, and version changes from long-tail developer sites.',
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
    description: 'Extract professional profile names, current organizations, locations, education, and connections.',
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
    description: 'Extract live post text, author usernames, like counts, reposts, reply metrics, and timestamps.',
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
    description: 'Extract creator handles, follower counts, following, post counts, and bios.',
    placeholder: 'https://www.instagram.com/username/',
    presets: [
      { label: 'Cristiano Ronaldo (679M)', url: 'https://www.instagram.com/cristiano/' },
    ],
    sampleAttributes: ['username', 'full_name', 'biography', 'followers_count', 'posts_count']
  },
  {
    id: 'reddit',
    name: 'Reddit Discussions',
    workflow: 'reddit',
    icon: MessageCircle,
    tag: 'Community Threads',
    description: 'Extract thread titles, subreddits, user submissions, upvote counts, and comment volume.',
    placeholder: 'https://www.reddit.com/r/.../comments/...',
    presets: [
      { label: 'Battlefield Update (2.1k Upvotes)', url: 'https://www.reddit.com/r/battlefield2042/comments/1cmqs1d/official_update_on_the_next_battlefield_game/' },
    ],
    sampleAttributes: ['title', 'subreddit', 'user_posted', 'upvotes', 'num_comments']
  },
  {
    id: 'google_maps',
    name: 'Google Maps Places',
    workflow: 'google_maps',
    icon: MapPin,
    tag: 'Local POI',
    description: 'Extract business titles, physical addresses, review counts, ratings, and categories.',
    placeholder: 'https://www.google.com/maps/place/...',
    presets: [
      { label: 'Pizza Inn Magdeburg (Germany)', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/' },
    ],
    sampleAttributes: ['title', 'address', 'rating', 'reviews_count', 'phone', 'category']
  },
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
      {/* ── TOP HERO HEADER ── */}
      <div className="bento-card p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Platform Scraper Studio</span>
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
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md self-start md:self-auto cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Generate SDK Snippet</span>
          </button>
        </div>
      </div>

      {/* ── 8 PLATFORM BENTO DECK (4x2 GRID) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Select Target Platform:
          </span>
          <span className="text-xs font-mono text-slate-500">8 Supported Schemas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WORKFLOWS.map((wf) => {
            const Icon = wf.icon;
            const isSelected = selectedWorkflow.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => handleSelectWorkflow(wf)}
                className={`bento-card p-5 cursor-pointer flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-[#151a26] shadow-xl shadow-blue-500/10 scale-[1.01]'
                    : 'hover:bg-[#151824]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                      {wf.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{wf.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{wf.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                    {isSelected ? '● Active Target' : 'Select'}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`} />
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
          <div className="bento-card p-7 space-y-6">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Target Configuration
              </span>
              <h2 className="text-xl font-bold text-white">{selectedWorkflow.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedWorkflow.description}
              </p>
            </div>

            {/* Target URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-300">Target URL</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={selectedWorkflow.placeholder}
                className="w-full bg-[#090c13] border border-white/15 rounded-xl px-4 py-3.5 text-xs sm:text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 shadow-inner"
              />
            </div>

            {/* Verified Sample Presets */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono text-slate-400 block font-bold">Verified Presets:</span>
              <div className="space-y-2">
                {selectedWorkflow.presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTargetUrl(p.url)}
                    className="w-full text-left p-3 rounded-xl bg-[#090c13] hover:bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate">{p.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Contract Attributes */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-[11px] font-mono uppercase text-slate-400 block font-bold">Schema Contract Attributes</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWorkflow.sampleAttributes.map((attr) => (
                  <span
                    key={attr}
                    className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-white/5 text-slate-300 border border-white/10"
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
              className="btn-pulse w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 disabled:opacity-50 cursor-pointer transition-all"
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
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Entity Inspector (Span 7) */}
        <div className="lg:col-span-7 bento-card p-7 flex flex-col min-h-[540px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                Live Entity Inspector
              </h3>
            </div>

            {result && (
              <div className="flex items-center gap-2">
                <div className="flex bg-[#090c13] p-1 rounded-lg border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActiveView('card')}
                    className={`px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'card' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Visual Card
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`px-4 py-1.5 rounded transition-colors cursor-pointer ${activeView === 'json' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Raw JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-200 border border-white/10 transition-colors cursor-pointer"
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
              <div className="p-4 rounded-xl bg-[#090c13] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <StatusBadge status={result.status} />
                  <span className="text-slate-400">
                    Quality: <strong className="text-emerald-400">{result.quality_score}%</strong>
                  </span>
                </div>
                <div className="text-slate-400">
                  Latency: <strong className="text-white">{result.duration_ms}ms</strong> · Strategy: <strong className="text-cyan-400">{result.selected_strategy}</strong>
                </div>
              </div>

              {activeView === 'card' ? (
                <div className="p-6 rounded-xl bg-[#090c13] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    {/* Product Image Preview */}
                    {(result.extracted_data?.image_url || result.extracted_data?.image) && (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-black/60 border border-white/15 p-2 flex items-center justify-center shrink-0 overflow-hidden group shadow-lg">
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
                        className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <span>{result.target_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {result.extracted_data?.price !== undefined && (
                      <div className="text-left sm:text-right shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
                        <span className="text-2xl font-extrabold font-mono text-emerald-400 block">
                          {result.extracted_data?.currency || '$'} {result.extracted_data?.price}
                        </span>
                        {result.extracted_data?.availability && (
                          <span className="text-xs font-mono text-slate-300">
                            {result.extracted_data?.availability}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Attributes Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 font-mono text-xs">
                    {Object.entries(result.extracted_data || {}).map(([k, v]) => {
                      if (k.includes('_url') || k === 'title' || k === 'price' || !v) return null;
                      return (
                        <div key={k} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">{k}</span>
                          <div className="text-slate-200 text-sm">{formatFieldValue(v)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <pre className="p-6 rounded-xl bg-[#090c13] border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed">
                  {JSON.stringify(result.extracted_data, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 font-mono space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 mb-2">
                <Layers className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold text-slate-300">No Active Extraction Results</div>
              <p className="text-xs max-w-md text-slate-500 leading-relaxed">
                Select a target on the left and click "Deploy Scraper Pipeline" to view real-time extracted entities and JSON payloads.
              </p>
            </div>
          )}
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
