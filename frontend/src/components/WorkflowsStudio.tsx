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
} from 'lucide-react';
import { executeScrape } from '../api';
import { useToast } from './ToastContext';
import { ScrapeProgressTimeline } from './ScrapeProgressTimeline';
import { StatusBadge } from './StatusBadge';

interface WorkflowPreset {
  id: string;
  name: string;
  workflow: string;
  icon: React.ElementType;
  badge: string;
  accentColor: string;
  description: string;
  placeholder: string;
  presets: { label: string; url: string }[];
  sampleAttributes: string[];
}

const WORKFLOWS: WorkflowPreset[] = [
  {
    id: 'products',
    name: 'E-Commerce Products',
    workflow: 'products',
    icon: ShoppingBag,
    badge: 'Retail Intelligence',
    accentColor: '#ec4899',
    description: 'Extract live product prices, review counts, sellers, and BuyBox stock across Amazon, Flipkart, and global stores.',
    placeholder: 'https://www.amazon.in/dp/B0CX21C8S4 or https://www.flipkart.com/...',
    presets: [
      { label: 'Sony WH-1000XM5 (Amazon)', url: 'https://www.amazon.com/dp/B09XS7JWHH' },
      { label: 'Apple iPhone 15 (Amazon)', url: 'https://www.amazon.com/dp/B0CHX1W1XY' },
      { label: 'Flipkart Electronics', url: 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4' },
    ],
    sampleAttributes: ['title', 'price', 'currency', 'availability', 'rating', 'seller']
  },
  {
    id: 'jobs',
    name: 'Talent & Jobs',
    workflow: 'jobs',
    icon: Briefcase,
    badge: 'Labor Markets',
    accentColor: '#3b82f6',
    description: 'Crawl job postings, salaries, locations, and hiring organizations from LinkedIn, Indeed, and careers portals.',
    placeholder: 'https://www.linkedin.com/jobs/view/... or careers page',
    presets: [
      { label: 'Senior AI Engineer (LinkedIn)', url: 'https://www.linkedin.com/jobs/view/3891029381' },
      { label: 'Staff Backend Architect', url: 'https://jobs.lever.co/example/staff-backend' },
    ],
    sampleAttributes: ['job_title', 'company', 'location', 'salary', 'employment_type']
  },
  {
    id: 'x',
    name: 'X (Twitter) Posts',
    workflow: 'x',
    icon: MessageCircle,
    badge: 'Social Pulse',
    accentColor: '#06b6d4',
    description: 'Extract public status messages, engagement metrics, retweets, likes, and impressions via Datasets v3.',
    placeholder: 'https://x.com/username/status/1683559267524136962',
    presets: [
      { label: 'Fabrizio Romano Transfer News', url: 'https://x.com/FabrizioRomano/status/1683559267524136962' },
      { label: 'CNN Breaking News', url: 'https://x.com/CNN/status/1796673270344810776' },
    ],
    sampleAttributes: ['user_posted', 'description', 'likes', 'reposts', 'replies', 'views', 'date_posted']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Profiles',
    workflow: 'linkedin',
    icon: UserCheck,
    badge: 'Executive Discovery',
    accentColor: '#0284c7',
    description: 'Extract professional backgrounds, current organizations, roles, locations, and educational history.',
    placeholder: 'https://www.linkedin.com/in/username',
    presets: [
      { label: 'Elad Moshe (Director of Eng)', url: 'https://www.linkedin.com/in/elad-moshe-05a90413/' },
      { label: 'Aviv Tal (Tech Executive)', url: 'https://www.linkedin.com/in/aviv-tal-75b81/' },
    ],
    sampleAttributes: ['name', 'current_company', 'location', 'about', 'connections', 'education']
  },
  {
    id: 'instagram',
    name: 'Instagram Creators',
    workflow: 'instagram',
    icon: Camera,
    badge: 'Creator Intelligence',
    accentColor: '#d946ef',
    description: 'Extract creator bios, follower counts, following, post totals, and verified status in real time.',
    placeholder: 'https://www.instagram.com/username/',
    presets: [
      { label: 'Cats of World (1.3M+)', url: 'https://www.instagram.com/cats_of_world_/' },
      { label: 'Dogs of Instagram', url: 'https://www.instagram.com/dogsofinstagram/' },
    ],
    sampleAttributes: ['full_name', 'biography', 'followers_count', 'following_count', 'posts_count', 'is_verified']
  },
  {
    id: 'google_maps',
    name: 'Google Maps Places',
    workflow: 'google_maps',
    icon: MapPin,
    badge: 'Local Business',
    accentColor: '#10b981',
    description: 'Extract place names, physical addresses, star ratings, review counts, categories, and contact websites.',
    placeholder: 'https://www.google.com/maps/place/...',
    presets: [
      { label: 'Pizza Inn Magdeburg (Germany)', url: 'https://www.google.com/maps/place/Pizza+Inn+Magdeburg/@52.1263086,11.6094743,761m/data=!3m2!1e3!4b1!4m6!3m5!1s0x47a5f50c083530a3:0xfdba8746b538141!8m2!3d52.1263086!4d11.6094743!16s%2Fg%2F11kqmtk3dt' },
      { label: 'The CrossFit Bar', url: 'https://www.google.com/maps/place/The+CrossFit+Bar/@-32.7434276,151.856234,17z' },
    ],
    sampleAttributes: ['address', 'rating', 'reviews_count', 'category', 'website']
  },
  {
    id: 'reddit',
    name: 'Reddit Discussions',
    workflow: 'reddit',
    icon: MessageSquare,
    badge: 'Community Sentiment',
    accentColor: '#f97316',
    description: 'Extract thread headings, discussion bodies, upvote scores, comment counts, and submission dates.',
    placeholder: 'https://www.reddit.com/r/subreddit/comments/...',
    presets: [
      { label: 'Battlefield 2042 Official Update', url: 'https://www.reddit.com/r/battlefield2042/comments/1cmqs1d/official_update_on_the_next_battlefield_game/' },
      { label: 'Singularity AI Discussion', url: 'https://www.reddit.com/r/singularity/comments/1cmoa52/former_google_ceo_on_ai_its_underhyped/' },
    ],
    sampleAttributes: ['title', 'upvotes', 'num_comments', 'date_posted']
  }
];

export const WorkflowsStudio: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPreset>(WORKFLOWS[0]);
  const [targetUrl, setTargetUrl] = useState(WORKFLOWS[0].presets[0].url);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeView, setActiveView] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);
  const { showToast, showCopyToast } = useToast();

  const handleSelectWorkflow = (wf: WorkflowPreset) => {
    setSelectedWorkflow(wf);
    setTargetUrl(wf.presets[0]?.url || '');
  };

  const handleScrape = async () => {
    if (!targetUrl.trim()) {
      showToast('error', 'Input Required', 'Please enter a target URL.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      showToast('info', 'Cluster Scrape Dispatched', `Triggering ${selectedWorkflow.name} extraction pipeline...`);

      const res = await executeScrape({
        target_url: targetUrl.trim(),
        workflow_type: selectedWorkflow.workflow,
        schema_name: selectedWorkflow.workflow,
      });

      setResult(res);

      if (res.status === 'success') {
        showToast('success', 'Extraction Completed', `Extracted record with ${res.quality_score}% quality score.`);
      } else if (res.status === 'repaired') {
        const recovered = res.heal_outcome?.fields_recovered?.join(', ') || 'fields';
        showToast('success', '⚡ Auto-Healed', `Self-healing recovered: ${recovered} — bundle v${res.heal_outcome?.from_bundle_version}→v${res.heal_outcome?.to_bundle_version}.`);
      } else if (res.status === 'healing_failed') {
        showToast('warning', 'Heal Failed', `Confidence ${Math.round((res.heal_outcome?.confidence || 0) * 100)}% too low to auto-promote. Run flagged.`);
      } else {
        showToast('warning', 'Extraction Degraded', 'Autonomous healing was attempted. Run flagged for review.');
      }
    } catch (err: any) {
      showToast('error', 'Extraction Error', err.message || 'Upstream provider connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.extracted_data || result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showCopyToast('JSON data copied to clipboard.');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Universal Intelligence Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Bright Data Datasets v3 Live
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Autonomous schema-driven intelligence workstation across e-commerce, talent markets, social networks, and community threads.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('repair')}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all duration-150 flex items-center gap-2"
            >
              <Zap size={14} className="text-purple-400" />
              Self-Healing Workstation
            </button>
          )}
        </div>
      </div>

      {/* Interactive Platform Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {WORKFLOWS.map((wf) => {
          const Icon = wf.icon;
          const isSelected = selectedWorkflow.id === wf.id;
          return (
            <button
              key={wf.id}
              onClick={() => handleSelectWorkflow(wf)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10'
                  : 'bg-[#0e0e12]/60 hover:bg-[#15151b] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className="p-2 rounded-xl transition-colors"
                  style={{
                    backgroundColor: isSelected ? `${wf.accentColor}20` : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? wf.accentColor : '#94a3b8',
                  }}
                >
                  <Icon size={18} />
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white block truncate">{wf.name}</span>
                <span className="text-[10px] text-slate-500 block truncate">{wf.badge}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scraper Input Console */}
      <div className="p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">
              Active Extraction Pipeline
            </span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {selectedWorkflow.name}
              <span className="text-xs font-normal text-slate-400">({selectedWorkflow.description})</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Schema Attributes:</span>
            <div className="flex flex-wrap gap-1.5">
              {selectedWorkflow.sampleAttributes.map((attr) => (
                <span key={attr} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] mono text-slate-300">
                  {attr}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* URL Input Bar */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-slate-400 block">
            Target Public Link or Entity URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder={selectedWorkflow.placeholder}
                className="w-full px-4 py-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 font-mono transition-all"
              />
              <Globe size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={handleScrape}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all duration-150 flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Live Data...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Run Autonomous Scraper</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Curated Live Presets:</span>
            {selectedWorkflow.presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setTargetUrl(preset.url)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 text-[11px] text-slate-300 hover:text-white transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Stepper Timeline */}
        {loading && (
          <div className="pt-4 border-t border-white/5">
            <ScrapeProgressTimeline 
              isActive={loading} 
              targetUrl={targetUrl} 
              workflowType={selectedWorkflow.workflow} 
            />
          </div>
        )}
      </div>

      {/* Extraction Result Workstation */}
      {result && (
        <div className="p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6 animate-fade-in">
          {/* Result Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={result.status} />
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  Scrape Run #{result.run_id}
                  <span className="text-slate-500">·</span>
                  <span className="text-purple-400 mono">{result.selected_strategy || 'multi_strategy_engine'}</span>
                </span>
                <span className="text-[11px] text-slate-400 block truncate max-w-md">{result.target_url}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400">Quality Score:</span>
                <span className="text-sm font-bold text-emerald-400 mono">{result.quality_score}%</span>
              </div>

              {/* View Switcher Buttons */}
              <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                <button
                  onClick={() => setActiveView('visual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeView === 'visual' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Visual Card
                </button>
                <button
                  onClick={() => setActiveView('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeView === 'json' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              <button
                onClick={handleCopyJson}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
                title="Copy JSON to clipboard"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Visual View */}
          {activeView === 'visual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(result.extracted_data || {}).map(([key, val]) => {
                if (val === null || val === undefined) return null;
                const isUrl = typeof val === 'string' && val.startsWith('http');
                return (
                  <div key={key} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {key.replace(/_/g, ' ')}
                    </span>
                    {isUrl ? (
                      <a
                        href={String(val)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-purple-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <span className="truncate">{String(val)}</span>
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    ) : (
                      <p className="text-sm font-bold text-white break-words line-clamp-3">
                        {String(val)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* JSON Tree View */}
          {activeView === 'json' && (
            <div className="relative">
              <pre className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96">
                {JSON.stringify(result.extracted_data || result, null, 2)}
              </pre>
            </div>
          )}

          {/* ── AUTO-HEAL OUTCOME PANEL ───────────────────────────── */}
          {result.heal_outcome && (
            <div
              className={`rounded-2xl border p-5 space-y-4 animate-fade-in ${
                result.heal_outcome.outcome === 'repaired'
                  ? 'bg-violet-500/5 border-violet-500/20'
                  : 'bg-orange-500/5 border-orange-500/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {result.heal_outcome.outcome === 'repaired' ? (
                    <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400">
                      <ShieldCheck size={16} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
                      <Shield size={16} />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {result.heal_outcome.outcome === 'repaired'
                        ? '⚡ Autonomous Heal — Succeeded'
                        : '⚡ Autonomous Heal — Confidence Too Low'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Rule Bundle v{result.heal_outcome.from_bundle_version}
                      <ChevronRight size={10} className="inline mx-0.5" />
                      v{result.heal_outcome.to_bundle_version}
                      {' · '}
                      Confidence: {Math.round((result.heal_outcome.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
                <StatusBadge status={result.heal_outcome.outcome === 'repaired' ? 'repaired' : 'healing_failed'} />
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Recovered */}
                {result.heal_outcome.fields_recovered?.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp size={11} /> Fields Recovered
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.heal_outcome.fields_recovered.map((f: string) => (
                        <span key={f} className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Still missing */}
                {result.heal_outcome.fields_still_missing?.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 space-y-1.5">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <XCircle size={11} /> Still Missing
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.heal_outcome.fields_still_missing.map((f: string) => (
                        <span key={f} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[11px] font-mono text-red-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* New selectors discovered */}
              {Object.keys(result.heal_outcome.new_selectors || {}).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Wrench size={11} /> New CSS Selectors Promoted
                  </span>
                  <div className="space-y-1">
                    {Object.entries(result.heal_outcome.new_selectors).map(([field, sel]) => (
                      <div key={field} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.025] border border-white/5">
                        <span className="text-[11px] font-semibold text-slate-400 w-28 shrink-0">{field}</span>
                        <ChevronRight size={10} className="text-slate-600 shrink-0" />
                        <code className="text-[11px] font-mono text-violet-300 truncate">{String(sel)}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
