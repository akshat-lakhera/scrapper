import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Key, 
  Database, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Radio, 
  Webhook, 
  Zap, 
  Check, 
  Save,
  Server,
  Lock
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { resetDemo } from '../api';
import { useScrambleText, stagger } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';

interface SettingsProps {
  configMode: ConfigModeResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ configMode }) => {
  const [resetting, setResetting] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const title = useScrambleText('System Settings & Provider Configuration', true);
  const isLive = configMode?.provider === 'brightdata';
  const { showToast } = useToast();

  // Enterprise setting state toggles
  const [concurrency, setConcurrency] = useState(10);
  const [requestTimeout, setRequestTimeout] = useState(30);
  const [autoHealEnabled, setAutoHealEnabled] = useState(true);
  const [strictValidation, setStrictValidation] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://api.marketscout.internal/v1/webhooks/ingest');
  const [webhookEvents, setWebhookEvents] = useState({
    onSuccess: true,
    onDrift: true,
    onRepair: true
  });

  const handleReset = async () => {
    try {
      setResetting(true);
      await resetDemo();
      showToast('success', 'Database Reset', 'Demo database restored to initial clean baseline state');
    } catch (e: any) {
      showToast('error', 'Reset Failed', e.message);
    } finally {
      setResetting(false);
    }
  };

  const handleSaveSettings = () => {
    setSavingConfig(true);
    setTimeout(() => {
      setSavingConfig(false);
      showToast('success', 'Configuration Saved', 'System execution parameters updated and hot-reloaded');
    }, 600);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Header */}
      <section className="bento-card p-6 sm:p-8 bg-[#0a0d16] border-white/15 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-400/30">
                <SettingsIcon size={13} className="animate-spin" />
                SYSTEM ADMINISTRATION
              </span>
              <span className="text-[11px] font-mono text-slate-300 font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                v2.5 Enterprise
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Manage Bright Data provider credentials, rate-limiting worker pools, autonomous healing gates, and database state.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingConfig}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            {savingConfig ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingConfig ? 'Applying...' : 'Save Configuration'}</span>
          </button>
        </div>
      </section>

      {/* ── ROW 1: PROVIDER STATUS & DATABASE STATE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scraper Provider Config Card (Span 7) */}
        <div className="lg:col-span-7 bento-card p-6 space-y-5 bg-[#0e1320] border-white/15">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center justify-center shadow-md">
                <Key size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Bright Data Scraper Studio</h2>
                <p className="text-xs text-slate-300">Active provider connectivity and proxy tunnel gateway</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              ● Web Unlocker Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#080b12] border border-white/15 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Provider Mode</span>
              <StatusBadge status={isLive ? 'success' : 'warning'} labelOverride={configMode?.provider || 'brightdata'} size="sm" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#080b12] border border-white/15 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Auth Status</span>
              <span className="font-bold text-emerald-400">AUTHENTICATED (v3)</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#080b12] border border-white/15 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Proxy Cluster</span>
              <span className="font-bold text-cyan-300">US / EU / APAC Res.</span>
            </div>
          </div>
        </div>

        {/* Database & Demo Seed Control (Span 5) */}
        <div className="lg:col-span-5 bento-card p-6 space-y-4 bg-[#0e1320] border-white/15 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40 flex items-center justify-center shadow-md">
                <Database size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Database Seed Control</h2>
                <p className="text-xs text-slate-300">Reset execution runs & repair history</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Purges all historical scrape runs and selector modifications, restoring the verified clean baseline demo state.
            </p>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full py-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 transition-all cursor-pointer disabled:opacity-50"
            aria-label="Reset database to initial clean state"
          >
            <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'Resetting Database...' : 'Reset Demo Database'}</span>
          </button>
        </div>
      </div>

      {/* ── ROW 2: WORKER CONCURRENCY & AUTONOMOUS GATING ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Worker Pool & Rate Limiter (Span 6) */}
        <div className="lg:col-span-6 bento-card p-6 space-y-5 bg-[#0e1320] border-white/15">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shadow-md">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Execution Engine & Rate Limits</h2>
              <p className="text-xs text-slate-300">Asynchronous crawler concurrency and worker quotas</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-200">
                <span className="font-bold">Max Concurrent Scrapers</span>
                <span className="text-blue-400 font-extrabold">{concurrency} Workers</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="25" 
                value={concurrency}
                onChange={e => setConcurrency(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-200">
                <span className="font-bold">HTTP Request Timeout</span>
                <span className="text-blue-400 font-extrabold">{requestTimeout}s</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="60" 
                value={requestTimeout}
                onChange={e => setRequestTimeout(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Autonomous Healing & Quality Policy (Span 6) */}
        <div className="lg:col-span-6 bento-card p-6 space-y-5 bg-[#0e1320] border-white/15">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shadow-md">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Quality Gating & Self-Healing</h2>
              <p className="text-xs text-slate-300">Automatic schema contract repair and validation</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#080b12] border border-white/15 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Autonomous AST Selector Synthesis</span>
                <span className="text-[11px] text-slate-400">Generate hot-patches on DOM breaking changes</span>
              </div>
              <input 
                type="checkbox" 
                checked={autoHealEnabled}
                onChange={e => setAutoHealEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#080b12] border border-white/15 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Strict Pydantic Schema Gating</span>
                <span className="text-[11px] text-slate-400">Enforce field constraints and type safety</span>
              </div>
              <input 
                type="checkbox" 
                checked={strictValidation}
                onChange={e => setStrictValidation(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: ENTERPRISE WEBHOOKS & PIPELINE DISPATCH ── */}
      <div className="bento-card p-6 space-y-5 bg-[#0e1320] border-white/15">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shadow-md">
            <Webhook size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Real-Time Webhook Pipeline Dispatch</h2>
            <p className="text-xs text-slate-300">Stream normalized JSON records and drift alerts to downstream consumers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-2">
            <label className="text-xs font-mono font-bold text-slate-200">Destination Endpoint URL</label>
            <input 
              type="text"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="w-full bg-[#080b12] border border-white/20 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-400 shadow-inner"
            />
          </div>

          <div className="lg:col-span-4 space-y-2">
            <label className="text-xs font-mono font-bold text-slate-200 block">Trigger Events</label>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5">
                <Check size={12} /> Scrape Ingestion
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5">
                <Check size={12} /> DOM Drift Alert
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
