import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  RefreshCw, 
  Zap,
} from 'lucide-react';
import { fetchRuleBundles, fetchCandidatePatches } from '../api';
import type { RuleBundle, CandidateRulePatch } from '../types';
import { useToast } from './ToastContext';

export const RuleBundlesExplorer: React.FC = () => {
  const [bundles, setBundles] = useState<RuleBundle[]>([]);
  const [patches, setPatches] = useState<CandidateRulePatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<RuleBundle | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'bundles' | 'patches'>('bundles');
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        fetchRuleBundles(),
        fetchCandidatePatches()
      ]);
      setBundles(bData || []);
      setPatches(pData || []);
      if (bData && bData.length > 0 && !selectedBundle) {
        setSelectedBundle(bData[0]);
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Rules', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Rule Bundles & Template Signatures
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400">
              Versioned Artifacts
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Autonomous selector versioning and regression holdout test gates partitioned by domain and structural template fingerprint.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh rules and patches"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex border-b border-white/10 gap-4">
        <button
          onClick={() => setActiveSubTab('bundles')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeSubTab === 'bundles' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Active Rule Bundles ({bundles.length})
          {activeSubTab === 'bundles' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('patches')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeSubTab === 'patches' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Candidate Rule Patches ({patches.length})
          {activeSubTab === 'patches' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
          )}
        </button>
      </div>

      {/* Active Rule Bundles View */}
      {activeSubTab === 'bundles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bundle List Sidebar */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-1">
              Active Template Bundles
            </span>
            {bundles.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#0e0e12]/60 border border-white/5 text-center text-xs text-slate-500">
                No active rule bundles found in database.
              </div>
            ) : (
              bundles.map((b) => {
                const isSelected = selectedBundle?.id === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBundle(b)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'bg-[#0e0e12]/60 hover:bg-[#15151b] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white mono">{b.domain}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 mono">
                        v{b.version}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="mono truncate max-w-[150px]">tpl: {b.template_signature}</span>
                      <span className="uppercase text-[10px] text-purple-400 font-semibold">{b.workflow_type}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bundle Detail Panel */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
            {selectedBundle ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white mono">{selectedBundle.domain}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        Version {selectedBundle.version} (Active)
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-1">
                      Template Fingerprint Signature: <span className="mono text-purple-300">{selectedBundle.template_signature}</span>
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 mono">
                    {new Date(selectedBundle.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Field Rules Cascades */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Field Extraction Cascades & Confidence
                  </h3>

                  <div className="space-y-3">
                    {Object.entries(selectedBundle.field_rules || {}).map(([field, rule]: [string, any]) => (
                      <div key={field} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white mono uppercase">{field}</span>
                          <span className="text-xs text-emerald-400 mono font-bold">
                            {Math.round((rule?.confidence || 0.9) * 100)}% Confidence
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Primary CSS Selector</span>
                            <span className="mono text-purple-300 bg-black/40 px-2 py-1 rounded block truncate">
                              {rule?.primary_css || 'None (Semantic Heuristic)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Strategy Stack</span>
                            <span className="mono text-slate-300 bg-black/40 px-2 py-1 rounded block truncate">
                              {Array.isArray(rule?.strategies) ? rule.strategies.join(' → ') : 'css → json_ld → semantic'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                Select a rule bundle to inspect its selector cascades.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidate Rule Patches View */}
      {activeSubTab === 'patches' && (
        <div className="space-y-4">
          {patches.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0e0e12]/60 border border-white/5 text-center text-sm text-slate-500">
              No candidate rule patches synthesized yet. Run a degraded scrape to trigger repair synthesis.
            </div>
          ) : (
            patches.map((patch) => (
              <div key={patch.id} className="p-6 rounded-2xl bg-[#0e0e12]/80 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Zap size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white mono">
                        {patch.domain} · v{patch.from_version} → v{patch.to_version}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        Template: <span className="mono text-purple-300">{patch.template_signature}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mono">
                      {Math.round(patch.confidence_score * 100)}% Composite Confidence
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-purple-500/10 text-purple-300">
                      {patch.status}
                    </span>
                  </div>
                </div>

                {/* Regression Gating Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block">Field Recovery</span>
                    <span className="text-base font-bold text-emerald-400 mono">
                      {Math.round(patch.field_recovery_rate * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block">Non-Regression</span>
                    <span className="text-base font-bold text-blue-400 mono">
                      {Math.round(patch.non_regression_rate * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-slate-500 uppercase block">Promotion Gate</span>
                    <span className="text-base font-bold text-purple-400 mono">
                      {patch.confidence_score >= 0.70 ? 'PASS (≥70%)' : 'HOLD (<70%)'}
                    </span>
                  </div>
                </div>

                {/* Selector Diff Table */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Synthesized Selector Replacements
                  </span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/5 text-slate-500">
                          <th className="pb-2 font-medium">Field</th>
                          <th className="pb-2 font-medium">Broken Old Selector</th>
                          <th className="pb-2 font-medium">Synthesized Candidate Selector</th>
                          <th className="pb-2 font-medium">Stability Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {Object.entries(patch.selector_diff || {}).map(([f, diff]: [string, any]) => (
                          <tr key={f} className="text-slate-300">
                            <td className="py-2.5 font-bold uppercase text-white">{f}</td>
                            <td className="py-2.5 text-rose-400 line-through">{diff?.old_selector || 'None'}</td>
                            <td className="py-2.5 text-emerald-400">{diff?.new_selector || 'None (Schema/Manual)'}</td>
                            <td className="py-2.5 text-purple-400">{Math.round((diff?.stability_score || 0.8) * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
