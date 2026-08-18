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
  Activity
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
    tag: 'Scraper Studio Custom',
    description: 'Extract API guides, code snippets, documentation sections, and version changes from long-tail developer sites.',
    placeholder: 'https://docs.example.com/...',
    presets: [
      { label: 'Scraper Studio DCA Guide v1', url: 'https://demo.local/tech_docs_v1.html' },
      { label: 'Scraper Studio Redesigned v2', url: 'https://demo.local/tech_docs_redesign.html' },
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

export const WorkflowsStudio: React.FC<WorkflowsStudioProps> = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPreset>(WORKFLOWS[0]);
  const [targetUrl, setTargetUrl] = useState<string>(WORKFLOWS[0].presets[0].url);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'card' | 'json' | 'code'>('card');
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
    <div className="space-y-6 pb-12 font-sans">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-bold font-sans text-white flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            Extraction Studio & Multi-Schema Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a target workflow, paste any URL, or test built-in production presets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCodeModal(true)}
            className="hw-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 text-xs font-mono"
          >
            <FileCode size={13} className="text-cyan-400" />
            <span>Generate SDK Code</span>
          </button>
        </div>
      </div>

      {/* ── WORKFLOW TABS ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {WORKFLOWS.map((wf) => {
          const Icon = wf.icon;
          const isSelected = selectedWorkflow.id === wf.id;
          return (
            <button
              key={wf.id}
              onClick={() => handleSelectWorkflow(wf)}
              className={`hw-panel p-3 text-left transition-all hw-btn ${
                isSelected
                  ? 'border-blue-500 bg-blue-600/10 shadow-sm'
                  : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon size={14} className={isSelected ? 'text-blue-400' : 'text-slate-500'} />
                <span className="text-[9px] font-mono text-slate-500">{wf.tag}</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{wf.name}</div>
            </button>
          );
        })}
      </div>

      {/* ── MAIN WORKSPACE SPLIT: TARGET CONTROLS & LIVE INSPECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Configuration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="hw-panel p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Target Platform Specification
              </span>
              <h2 className="text-base font-bold text-white">{selectedWorkflow.name}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedWorkflow.description}
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300">Target URL</label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={selectedWorkflow.placeholder}
                className="w-full bg-[#0c0e14] border border-white/[0.1] rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Built-in Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-slate-400 block">Verified Sample Targets:</span>
              <div className="space-y-1.5">
                {selectedWorkflow.presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTargetUrl(p.url)}
                    className="w-full text-left p-2 rounded bg-[#0c0e14] hover:bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span className="truncate">{p.label}</span>
                    <ArrowRight size={12} className="text-blue-400 opacity-50 group-hover:opacity-100 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Attributes Chip List */}
            <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Schema Contract Attributes</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedWorkflow.sampleAttributes.map((attr) => (
                  <span
                    key={attr}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/[0.06]"
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
              className="w-full hw-btn py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Zap size={14} className="animate-spin text-white" />
                  <span>Extracting Live Dataset...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Execute Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Holographic Entity Inspector */}
        <div className="lg:col-span-7 hw-panel p-5 flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal size={15} className="text-blue-400" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                Live Entity Inspector
              </h3>
            </div>

            {result && (
              <div className="flex items-center gap-2">
                <div className="flex bg-[#0c0e14] p-0.5 rounded-lg border border-white/[0.06] text-xs font-mono">
                  <button
                    onClick={() => setActiveView('card')}
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'card' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    Card
                  </button>
                  <button
                    onClick={() => setActiveView('json')}
                    className={`px-3 py-1 rounded transition-colors ${activeView === 'json' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
                  >
                    JSON
                  </button>
                </div>

                <button
                  onClick={handleCopyJson}
                  className="hw-btn flex items-center gap-1 px-3 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-slate-300 border border-white/[0.08]"
                >
                  {copiedJson ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Results Body */}
          {result ? (
            <div className="flex-1 space-y-4">
              {/* Telemetry Header */}
              <div className="p-3 rounded-lg bg-[#0c0e14] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <StatusBadge status={result.status} />
                  <span className="text-slate-400">
                    Quality: <strong className="text-emerald-400">{result.quality_score}%</strong>
                  </span>
                </div>
                <div className="text-slate-400">
                  Duration: <strong className="text-white">{result.duration_ms}ms</strong> · Strategy: <strong className="text-cyan-400">{result.selected_strategy}</strong>
                </div>
              </div>

              {activeView === 'card' ? (
                /* Formatted Entity Card */
                <div className="p-4 rounded-lg bg-[#0c0e14] border border-white/[0.06] space-y-3">
                  <h4 className="text-base font-bold text-white">
                    {result.extracted_data?.title || result.extracted_data?.name || result.extracted_data?.job_title || result.extracted_data?.doc_title || 'Extracted Entity'}
                  </h4>

                  {result.extracted_data?.price !== undefined && (
                    <div className="text-lg font-mono font-bold text-emerald-400">
                      {result.extracted_data?.currency || '$'} {result.extracted_data?.price}
                    </div>
                  )}

                  {/* Attribute Chips Grid */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-2 border-t border-white/[0.04]">
                    {Object.entries(result.extracted_data || {}).map(([k, v]) => {
                      if (k.includes('_url') || k === 'title' || k === 'price' || !v) return null;
                      return (
                        <div key={k} className="p-2 rounded bg-black/40 border border-white/[0.04]">
                          <span className="text-[10px] text-slate-500 uppercase block">{k}</span>
                          <span className="text-slate-200 truncate block">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Raw Syntax JSON Tree */
                <pre className="p-4 rounded-lg bg-black/60 border border-white/[0.06] text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px]">
                  {JSON.stringify(result.extracted_data, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono space-y-2">
              <Layers size={32} className="text-slate-700 mb-2" />
              <div className="text-xs text-slate-400">No active extraction results</div>
              <p className="text-[11px] max-w-sm">
                Click "Execute Extraction" to trigger the multi-strategy pipeline and view live structured payloads.
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
