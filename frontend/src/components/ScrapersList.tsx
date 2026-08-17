import React, { useEffect, useState } from 'react';
import { Cpu, Plus, Globe, Play, X, Sparkles } from 'lucide-react';
import type { Scraper } from '../types';
import { fetchScrapers, createScraper } from '../api';
import { useScrambleText, stagger } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { CardSkeleton } from './SkeletonLoader';
import { useToast } from './ToastContext';

interface ScrapersListProps {
  setActiveTab: (tab: string) => void;
}

export const ScrapersList: React.FC<ScrapersListProps> = ({ setActiveTab }) => {
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [targetDomain, setTargetDomain] = useState('');
  const [workflowType, setWorkflowType] = useState('products');
  const [instructions, setInstructions] = useState('');
  const title = useScrambleText('Active Scrapers & Collector Studio', true);
  const { showToast } = useToast();

  const loadScrapers = async () => {
    try {
      setLoading(true);
      const data = await fetchScrapers();
      setScrapers(data);
    } catch (e: any) {
      showToast('error', 'Failed to Load Collectors', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScrapers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a scraper name');
    try {
      setLoading(true);
      await createScraper({
        name: name.trim(),
        target_domain: targetDomain.trim() || 'all-domains',
        workflow_type: workflowType,
        schema_name: workflowType,
        instructions: instructions.trim(),
      });
      showToast('success', 'Collector Registered', `Collector: ${name.trim()}`);
      setShowModal(false);
      setName('');
      setTargetDomain('');
      setInstructions('');
      await loadScrapers();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="stagger-in flex flex-col md:flex-row md:items-center justify-between gap-4" style={stagger(0)} aria-labelledby="scrapers-title">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
              Collector Catalog
            </span>
          </div>
          <h1 id="scrapers-title" className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            <span className="text-gradient">{title}</span>
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage registered Bright Data Scraper Studio collectors, target domain scopes, and extraction schemas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-spring px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 self-start md:self-auto focus-ring"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(168,85,247,0.3)',
          }}
        >
          <Plus size={14} aria-hidden="true" />
          <span>Register New Collector</span>
        </button>
      </section>

      {/* Scrapers Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-in" style={stagger(1)} aria-label="Registered Scrapers">
        {loading && scrapers.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : scrapers.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-2 rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="empty-orb mx-auto mb-3" />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No Collectors Registered</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Click above to register a new Bright Data collector.</p>
          </div>
        ) : (
          scrapers.map((s, i) => (
            <div
              key={s.id}
              className="p-6 rounded-2xl glow-hover card-reveal flex flex-col justify-between space-y-5"
              style={{ ...stagger(i), background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="mono text-[10px] px-2.5 py-1 rounded font-bold uppercase" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
                    {s.workflow_type}
                  </span>
                  <StatusBadge status={s.status || 'ready'} size="sm" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{s.name}</h3>
                  <div className="text-xs font-mono flex items-center gap-1.5 mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <Globe size={12} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                    <span>{s.target_domain || 'All Domains'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl space-y-1" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase font-semibold mono" style={{ color: 'var(--text-tertiary)' }}>Collector Endpoint</div>
                  <div className="mono text-xs truncate font-semibold" style={{ color: 'var(--accent)' }}>{s.external_scraper_id}</div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab(s.workflow_type === 'jobs' ? 'jobs' : 'products')}
                className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-spring focus-ring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <Play size={12} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                <span>Launch Extraction</span>
              </button>
            </div>
          ))
        )}
      </section>

      {/* Create Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-collector-title"
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl space-y-5 stagger-in"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 id="register-collector-title" className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={16} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                <span>Register Bright Data Scraper</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white btn-spring focus-ring"
                style={{ background: 'var(--bg-elevated)' }}
                aria-label="Close dialog"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Scraper Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Glassdoor Software Engineers Monitor"
                  className="w-full px-4 py-2.5 rounded-xl mono text-xs focus-ring"
                  style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Workflow Type</label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs focus-ring"
                  style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <option value="products">Product Discovery</option>
                  <option value="jobs">Job Discovery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>Target Domain (Custom Allowed)</label>
                <input
                  type="text"
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  placeholder="e.g. glassdoor.com or amazon.in"
                  className="w-full px-4 py-2.5 rounded-xl mono text-xs focus-ring"
                  style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold btn-spring focus-ring"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-spring px-5 py-2 rounded-xl text-xs font-bold focus-ring"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {loading ? 'Registering…' : 'Create Collector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
