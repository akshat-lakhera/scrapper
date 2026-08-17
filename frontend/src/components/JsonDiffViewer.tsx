import React, { useState } from 'react';
import { Copy, CheckCheck, ChevronDown, ChevronRight, Code2, GitCompare } from 'lucide-react';
import { useToast } from './ToastContext';

interface JsonDiffViewerProps {
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  singleData?: Record<string, any> | null;
  title?: string;
}

export const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({
  beforeData,
  afterData,
  singleData,
  title = 'Payload Inspection',
}) => {
  const [viewMode, setViewMode] = useState<'diff' | 'formatted'>('diff');
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    changed: true,
    added: true,
    removed: true,
    unchanged: false,
  });
  const { showCopyToast } = useToast();

  const handleCopy = (obj: any) => {
    if (!obj) return;
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    showCopyToast('Payload copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute Diff
  const computeDiff = () => {
    const before = beforeData || {};
    const after = afterData || {};
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

    const added: Array<{ key: string; val: any }> = [];
    const removed: Array<{ key: string; val: any }> = [];
    const changed: Array<{ key: string; oldVal: any; newVal: any }> = [];
    const unchanged: Array<{ key: string; val: any }> = [];

    for (const k of allKeys) {
      if (!(k in before) && k in after) {
        added.push({ key: k, val: after[k] });
      } else if (k in before && !(k in after)) {
        removed.push({ key: k, val: before[k] });
      } else if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
        changed.push({ key: k, oldVal: before[k], newVal: after[k] });
      } else {
        unchanged.push({ key: k, val: before[k] });
      }
    }

    return { added, removed, changed, unchanged };
  };

  const isDiffMode = Boolean(beforeData && afterData);
  const diff = isDiffMode ? computeDiff() : null;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/5 space-y-0"
      style={{ background: 'var(--bg-surface, #0e0e12)' }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-2">
          {isDiffMode ? (
            <GitCompare size={14} className="text-purple-400" />
          ) : (
            <Code2 size={14} className="text-purple-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          {isDiffMode && (
            <div className="flex gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-md transition-colors ${
                  viewMode === 'diff' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Diff View
              </button>
              <button
                onClick={() => setViewMode('formatted')}
                className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-md transition-colors ${
                  viewMode === 'formatted' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw JSON
              </button>
            </div>
          )}

          <button
            onClick={() => handleCopy(singleData || afterData || beforeData)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors focus-ring"
            title="Copy JSON to Clipboard"
            aria-label="Copy JSON"
          >
            {copied ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Diff Presentation */}
      {isDiffMode && viewMode === 'diff' && diff && (
        <div className="p-4 space-y-3 font-mono text-xs max-h-96 overflow-y-auto">
          {/* Changed Fields (Amber) */}
          {diff.changed.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-amber-500/20 bg-amber-500/[0.03]">
              <button
                onClick={() => toggleSection('changed')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 transition-colors text-left"
              >
                <span>Modified Fields ({diff.changed.length})</span>
                {expandedSections.changed ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSections.changed && (
                <div className="divide-y divide-amber-500/10 p-2 space-y-2">
                  {diff.changed.map(({ key, oldVal, newVal }) => (
                    <div key={key} className="pt-2 first:pt-0 space-y-1">
                      <div className="font-bold text-slate-300">{key}:</div>
                      <div className="flex flex-col sm:flex-row gap-2 pl-3">
                        <div className="flex-1 p-2 rounded bg-red-500/10 text-red-300 text-[11px] overflow-x-auto">
                          <span className="text-[9px] uppercase font-bold text-red-400 block">Old Value:</span>
                          <code>{JSON.stringify(oldVal)}</code>
                        </div>
                        <div className="flex-1 p-2 rounded bg-emerald-500/10 text-emerald-300 text-[11px] overflow-x-auto">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block">New Value:</span>
                          <code>{JSON.stringify(newVal)}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Added Fields (Green) */}
          {diff.added.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-emerald-500/20 bg-emerald-500/[0.03]">
              <button
                onClick={() => toggleSection('added')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors text-left"
              >
                <span>Added Fields (+{diff.added.length})</span>
                {expandedSections.added ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSections.added && (
                <div className="p-3 space-y-1 text-emerald-300 text-[11px]">
                  {diff.added.map(({ key, val }) => (
                    <div key={key} className="flex items-start gap-2 overflow-x-auto">
                      <span className="text-emerald-400 font-bold shrink-0">+ {key}:</span>
                      <code>{JSON.stringify(val)}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Removed Fields (Red) */}
          {diff.removed.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-red-500/20 bg-red-500/[0.03]">
              <button
                onClick={() => toggleSection('removed')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/15 transition-colors text-left"
              >
                <span>Removed Fields (-{diff.removed.length})</span>
                {expandedSections.removed ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSections.removed && (
                <div className="p-3 space-y-1 text-red-300 text-[11px]">
                  {diff.removed.map(({ key, val }) => (
                    <div key={key} className="flex items-start gap-2 overflow-x-auto">
                      <span className="text-red-400 font-bold shrink-0">- {key}:</span>
                      <code>{JSON.stringify(val)}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unchanged Fields (Collapsed by default) */}
          {diff.unchanged.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-white/5 bg-white/[0.01]">
              <button
                onClick={() => toggleSection('unchanged')}
                className="w-full flex items-center justify-between px-3.5 py-2 text-[11px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <span>Unchanged Fields ({diff.unchanged.length})</span>
                {expandedSections.unchanged ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSections.unchanged && (
                <div className="p-3 space-y-1 text-slate-400 text-[11px]">
                  {diff.unchanged.map(({ key, val }) => (
                    <div key={key} className="flex items-start gap-2 overflow-x-auto">
                      <span className="font-semibold text-slate-500 shrink-0">{key}:</span>
                      <code className="text-slate-300">{JSON.stringify(val)}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs">
              No field-level differences detected.
            </div>
          )}
        </div>
      )}

      {/* Raw Formatted JSON View */}
      {(!isDiffMode || viewMode === 'formatted') && (
        <pre
          className="p-4 text-xs font-mono overflow-x-auto leading-relaxed max-h-96 text-slate-300 select-text"
          style={{ background: 'var(--bg-root, #070709)' }}
        >
          {JSON.stringify(singleData || afterData || beforeData || {}, null, 2)}
        </pre>
      )}
    </div>
  );
};
