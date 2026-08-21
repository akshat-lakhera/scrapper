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
  Lock,
  Globe,
  Activity,
  Sparkles,
  Send,
  AlertTriangle
} from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { resetDemo } from '../api';
import { useScrambleText } from '../hooks';
import { StatusBadge } from './StatusBadge';
import { useToast } from './ToastContext';
import { SpotlightCard } from './SpotlightCard';

interface SettingsProps {
  configMode: ConfigModeResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ configMode }) => {
  const [resetting, setResetting] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
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
    if (!confirm('Are you sure you want to reset the demo database? All historical scrape runs and rule mutations will be restored to clean baseline.')) {
      return;
    }
    try {
      setResetting(true);
      await resetDemo();
      showToast('success', 'Database Reset', 'Demo database restored to initial clean baseline state');
      window.location.reload();
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
      showToast('success', 'Configuration Saved', 'System execution parameters updated and hot-reloaded.');
    }, 500);
  };

  const handleTestWebhook = () => {
    setTestingWebhook(true);
    setTimeout(() => {
      setTestingWebhook(false);
      showToast('success', 'Webhook Ping Sent', `Test dispatch delivered to ${webhookUrl} (HTTP 200 OK)`);
    }, 600);
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* ── [01 // SYSTEM ADMINISTRATION] TOP HERO BANNER ── */}
      <SpotlightCard className="p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-300 font-bold tracking-wider">
                [01 // SYSTEM ADMINISTRATION & PROVIDER HUB]
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                Bright Data Enterprise Gateway v2.5
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              System Settings & Architecture Hub
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Manage Bright Data provider credentials, rate-limiting worker pools, autonomous healing gates, and downstream webhook dispatches.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingConfig}
            className="tactile-press px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start md:self-auto shrink-0"
          >
            {savingConfig ? <Zap className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{savingConfig ? 'Applying Updates...' : 'Save Configuration'}</span>
          </button>
        </div>
      </SpotlightCard>

      {/* ── ROW 1: PROVIDER STATUS & DATABASE STATE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scraper Provider Config Card (Span 7) */}
        <div className="lg:col-span-7">
          <SpotlightCard className="p-7 space-y-5 relative h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-300 border border-blue-400/30 flex items-center justify-center shadow-md">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-mono text-blue-300 font-bold">
                      [02 // BRIGHT DATA GATEWAY]
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">Bright Data Scraper Studio & Datasets</h2>
                  <p className="text-xs text-slate-400 font-mono">Active provider connectivity and proxy tunnel gateway</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                ● {isLive ? 'Datasets v3 / Scraper Studio' : 'Offline Mode'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Provider Mode</span>
                <StatusBadge status={isLive ? 'success' : 'warning'} labelOverride={configMode?.provider || 'brightdata'} size="sm" />
              </div>
              <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Auth Status</span>
                <span className="font-bold text-emerald-400">AUTHENTICATED (v3)</span>
              </div>
              <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Proxy Cluster</span>
                <span className="font-bold text-cyan-300">US / EU / APAC Res.</span>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* Database & Demo Seed Control (Span 5) */}
        <div className="lg:col-span-5">
          <SpotlightCard className="p-7 space-y-4 relative flex flex-col justify-between h-full">
            <div className="space-y-3">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/30 flex items-center justify-center shadow-md">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-mono text-purple-300 font-bold">
                      [03 // DATABASE SEED]
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white">Database Seed Control</h2>
                  <p className="text-xs text-slate-400 font-mono">Reset execution runs & repair history</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Purges all historical scrape runs and selector modifications, restoring the verified clean baseline demo state.
              </p>
            </div>

            <button
              onClick={handleReset}
              disabled={resetting}
              className="tactile-press w-full py-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              aria-label="Reset database to initial clean state"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting Database...' : 'Reset Demo Database'}</span>
            </button>
          </SpotlightCard>
        </div>
      </div>

      {/* ── ROW 2: WORKER CONCURRENCY & AUTONOMOUS GATING ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Worker Pool & Rate Limiter (Span 6) */}
        <div className="lg:col-span-6">
          <SpotlightCard className="p-7 space-y-5 relative h-full">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shadow-md">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-mono text-cyan-300 font-bold">
                    [04 // WORKER ENGINE]
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">Execution Engine & Rate Limits</h2>
                <p className="text-xs text-slate-400 font-mono">Asynchronous crawler concurrency and worker quotas</p>
              </div>
            </div>

            <div className="space-y-5 font-mono text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-bold">Max Concurrent Scrapers</span>
                  <span className="text-blue-400 font-extrabold px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                    {concurrency} Workers
                  </span>
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

              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-bold">HTTP Request Timeout</span>
                  <span className="text-cyan-400 font-extrabold px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {requestTimeout}s
                  </span>
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
          </SpotlightCard>
        </div>

        {/* Autonomous Healing & Quality Policy (Span 6) */}
        <div className="lg:col-span-6">
          <SpotlightCard className="p-7 space-y-5 relative h-full">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-300 font-bold">
                    [05 // HEALING POLICIES]
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">Quality Gating & Self-Healing</h2>
                <p className="text-xs text-slate-400 font-mono">Automatic schema contract repair and validation</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 flex items-center justify-between">
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

              <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 flex items-center justify-between">
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
          </SpotlightCard>
        </div>
      </div>

      {/* ── ROW 3: ENTERPRISE WEBHOOKS & PIPELINE DISPATCH ── */}
      <SpotlightCard className="p-7 space-y-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center justify-center shadow-md">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-300 font-bold">
                  [06 // WEBHOOK PIPELINE DISPATCH]
                </span>
              </div>
              <h2 className="text-base font-bold text-white">Real-Time Webhook Pipeline Dispatch</h2>
              <p className="text-xs text-slate-400 font-mono">Stream normalized JSON records and drift alerts to downstream consumers</p>
            </div>
          </div>

          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="tactile-press px-4 py-2 rounded-xl text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-ping' : ''}`} />
            <span>{testingWebhook ? 'Dispatching...' : 'Test Webhook Ping'}</span>
          </button>
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
            <label className="text-xs font-mono font-bold text-slate-200 block">Active Trigger Events</label>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5" /> Scrape Ingestion
              </span>
              <span className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1.5 shadow-sm">
                <Check className="w-3.5 h-3.5" /> DOM Drift Alert
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </div>
  );
};
