import React, { useEffect, useState } from 'react';
import { ArrowRight, RotateCcw, Sparkles, ShoppingBag, Briefcase, Cpu, Wrench, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import type { Metrics, ConfigModeResponse, ScrapeRun } from '../types';
import { fetchMetrics, fetchRuns, resetDemo, clearRuns } from '../api';
import { useCounter, stagger } from '../hooks';
import { SpotlightCard } from './SpotlightCard';
import { StatusBadge } from './StatusBadge';
import { ScraperHealthRing, StatusDistributionBar } from './DataVisualizations';
import { MetricCardSkeleton, ChartSkeleton } from './SkeletonLoader';
import { useToast } from './ToastContext';
import { TypewriterText } from './TextEffects';

interface OverviewProps {
  configMode: ConfigModeResponse | null;
  setActiveTab: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ configMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentRuns, setRecentRuns] = useState<ScrapeRun[]>([]);
  const [resetting, setResetting] = useState(false);
  const [metricsError, setMetricsError] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const isLive = configMode?.provider === 'brightdata';
  const { showToast } = useToast();

  const scrapers = useCounter(metrics?.total_scrapers ?? 0);
  const totalRuns = useCounter(metrics?.total_runs ?? 0);
  const successRuns = useCounter(metrics?.successful_runs ?? 0);
  const degradedRuns = useCounter(metrics?.degraded_runs ?? 0);
  const repairedRuns = useCounter(metrics?.repaired_runs ?? 0);
  const manualRuns = useCounter(metrics?.manual_review_runs ?? 0);

  const loadData = async () => {
    try {
      setMetricsLoading(true);
      setMetricsError(false);
      const [m, r] = await Promise.all([fetchMetrics(), fetchRuns()]);
      if (m) setMetrics(m);
      if (r) setRecentRuns(r.slice(0, 6));
    } catch {
      setMetricsError(true);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      showToast('success', 'Reset Complete', 'Demo database restored to initial clean baseline state');
      await loadData();
    } catch (e: any) {
      showToast('error', 'Reset Failed', e.message);
    } finally {
      setResetting(false);
    }
  };

  const metricCards = [
    { label: 'Active Scrapers', value: scrapers, color: 'var(--accent)', icon: Cpu },
    { label: 'Total Runs', value: totalRuns, color: 'var(--text-primary)', icon: Zap },
    { label: 'Successful', value: successRuns, color: 'var(--success)', icon: CheckCircle2 },
    { label: 'Degraded', value: degradedRuns, color: 'var(--warning)', icon: Wrench },
    { label: 'Self-Repaired', value: repairedRuns, color: 'var(--healed)', icon: ShieldCheck },
    { label: 'Manual Review', value: manualRuns, color: 'var(--danger)', icon: RotateCcw },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="stagger-in pt-2" style={stagger(0)} aria-labelledby="hero-title">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-cyan-400" aria-hidden="true" />
          <span className="text-[11px] mono uppercase tracking-[0.25em] font-semibold text-cyan-400">
            Schema-Driven Autonomous Scraping
          </span>
        </div>
        <h1 id="hero-title" className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
          <TypewriterText text="Web Intelligence & Scraping OS" speed={28} className="text-white font-extrabold" />
        </h1>
        <p className="text-xs sm:text-sm mt-3 max-w-xl leading-relaxed text-slate-400">
          Automated web extraction, real DOM parsing, self-healing scraper maintenance, and verified schema compliance — powered by Bright Data.
        </p>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-7">
          <button
            onClick={() => setActiveTab('studio')}
            className="btn-spring scale-spring flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider focus-ring text-white shadow-lg shadow-purple-500/25"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Sparkles size={14} className="animate-pulse" aria-hidden="true" />
            <span>Universal Intelligence Studio (7 Datasets)</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="btn-spring flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold focus-ring"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            <ShoppingBag size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span>Product Intelligence</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className="btn-spring flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold focus-ring"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            <Briefcase size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <span>Talent & Jobs</span>
          </button>

          <button
            onClick={() => setActiveTab('repair')}
            className="btn-spring flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold focus-ring"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              cursor: 'pointer',
            }}
          >
            <Wrench size={14} style={{ color: 'var(--warning)' }} aria-hidden="true" />
            <span>Self-Healing Center</span>
          </button>
        </div>
      </section>

      {/* Metrics Bento Grid */}
      <section className="stagger-in" style={stagger(1)} aria-label="System Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metricsLoading
            ? Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)
            : metricCards.map((m, i) => {
                const Icon = m.icon;
                return (
                  <SpotlightCard
                    key={m.label}
                    spotlightColor="rgba(168, 85, 247, 0.2)"
                    className="p-5 flex flex-col justify-between"
                    style={{ minHeight: 110, ...stagger(i) }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.15em] font-semibold mono" style={{ color: 'var(--text-tertiary)' }}>
                        {m.label}
                      </span>
                      <Icon size={14} style={{ color: m.color, opacity: 0.8 }} aria-hidden="true" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold mono count-roll mt-2" style={{ color: m.color }}>
                      {metricsError ? 'N/A' : m.value}
                    </div>
                  </SpotlightCard>
                );
              })}
        </div>
      </section>

      {/* Visualizations Row */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-in" style={stagger(1.5)} aria-label="Visual Insights">
        <div className="lg:col-span-6">
          <ScraperHealthRing metrics={metrics} loading={metricsLoading} />
        </div>
        <div className="lg:col-span-6">
          <StatusDistributionBar runs={recentRuns} loading={metricsLoading} />
        </div>
      </section>

      {/* Recent Execution Audit Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-in" style={stagger(2)} aria-label="Execution Pipeline and Specs">
        {/* Left 8 cols: Recent Runs */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Zap size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <span>Real-Time Scraping Pipeline</span>
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (confirm('Clear all execution audit records?')) {
                    await clearRuns();
                    showToast('info', 'Audit Log Cleared', 'All execution records cleared');
                    loadData();
                  }
                }}
                className="text-xs mono font-semibold text-slate-500 hover:text-red-400 transition-colors btn-spring focus-ring rounded-lg px-2 py-1"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Clear Log
              </button>
              <button
                onClick={() => setActiveTab('runs')}
                className="text-xs mono font-semibold flex items-center gap-1 btn-spring focus-ring rounded-lg px-2 py-1"
                style={{ color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <span>View Full Log</span>
                <ArrowRight size={12} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {metricsLoading ? (
              <ChartSkeleton />
            ) : recentRuns.length === 0 ? (
              <div className="p-8 rounded-2xl text-center space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <div className="empty-orb mx-auto mb-2" />
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>No runs recorded yet</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Execute your first scrape to populate live metrics.</p>
              </div>
            ) : (
              recentRuns.slice(0, 6).map((r, i) => (
                <SpotlightCard
                  key={r.id}
                  spotlightColor="rgba(168, 85, 247, 0.12)"
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer focus-ring"
                  onClick={() => setActiveTab('runs')}
                  style={stagger(i)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveTab('runs');
                  }}
                  aria-label={`Run #${r.id} for ${r.workflow_type}: ${r.status}, quality ${r.data_quality_score}%`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="pulse-dot"
                      style={{
                        color: r.status === 'success' ? 'var(--success)' : r.status === 'repaired' ? 'var(--healed)' : 'var(--warning)',
                        backgroundColor: r.status === 'success' ? 'var(--success)' : r.status === 'repaired' ? 'var(--healed)' : 'var(--warning)',
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="mono text-xs font-bold text-white">Run #{r.id}</span>
                        <span className="text-[10px] mono uppercase px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--bg-root)', color: 'var(--accent)' }}>
                          {r.workflow_type}
                        </span>
                      </div>
                      <div className="mono text-[11px] truncate max-w-md mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {r.target_url}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>Quality</div>
                      <div
                        className="mono text-xs font-bold"
                        style={{
                          color:
                            r.data_quality_score >= 80
                              ? 'var(--success)'
                              : r.data_quality_score >= 50
                              ? 'var(--warning)'
                              : 'var(--danger)',
                        }}
                      >
                        {r.data_quality_score}%
                      </div>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                </SpotlightCard>
              ))
            )}
          </div>
        </div>

        {/* Right 4 cols: Architecture & Diagnostics */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ShieldCheck size={14} style={{ color: 'var(--success)' }} aria-hidden="true" />
            <span>Engine Specs</span>
          </h2>

          <div className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="space-y-1">
              <div className="text-[10px] uppercase mono font-bold tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Provider Architecture</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{isLive ? 'Bright Data Datasets v3' : 'Offline Test Provider'}</div>
            </div>

            <div className="space-y-2 text-xs pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>DOM Parser:</span>
                <span className="mono font-semibold" style={{ color: 'var(--accent)' }}>BeautifulSoup + JSON-LD</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Normalization:</span>
                <span className="mono font-semibold" style={{ color: 'var(--success)' }}>Active (Type Strict)</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Self-Healing:</span>
                <span className="mono font-semibold" style={{ color: 'var(--healed)' }}>3-Stage Interactive</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 btn-spring focus-ring"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                aria-label="Reset demo database records"
              >
                <RotateCcw size={12} className={resetting ? 'animate-spin' : ''} aria-hidden="true" />
                <span>{resetting ? 'Resetting…' : 'Reset Demo Records'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
