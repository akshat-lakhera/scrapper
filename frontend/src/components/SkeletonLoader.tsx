import React from 'react';

export const MetricCardSkeleton: React.FC = () => (
  <div
    className="p-5 rounded-2xl flex flex-col justify-between"
    style={{
      background: 'var(--bg-surface, #0e0e12)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      minHeight: 110,
    }}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
      <div className="h-4 w-4 rounded-full bg-white/5 animate-pulse" />
    </div>
    <div className="h-7 w-12 rounded bg-white/10 animate-pulse mt-2" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-white/5" aria-hidden="true">
    <td className="py-3.5 px-4"><div className="h-4 w-12 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4"><div className="h-4 w-20 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4"><div className="h-4 w-48 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4"><div className="h-4 w-16 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4"><div className="h-4 w-10 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4"><div className="h-4 w-14 rounded bg-white/5 animate-pulse" /></td>
    <td className="py-3.5 px-4 text-right"><div className="h-6 w-16 rounded bg-white/5 animate-pulse ml-auto" /></td>
  </tr>
);

export const CardSkeleton: React.FC = () => (
  <div
    className="p-6 rounded-2xl space-y-4"
    style={{
      background: 'var(--bg-surface, #0e0e12)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
    }}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
      <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
    </div>
    <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse" />
    <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
    <div className="h-9 w-full rounded-xl bg-white/5 animate-pulse mt-2" />
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div
    className="p-5 rounded-2xl flex flex-col justify-between"
    style={{
      background: 'var(--bg-surface, #0e0e12)',
      border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
      minHeight: 180,
    }}
    aria-hidden="true"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-32 rounded bg-white/5 animate-pulse" />
      <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
    </div>
    <div className="flex items-end gap-3 h-28 pt-4">
      <div className="flex-1 bg-white/5 rounded-t h-40% animate-pulse" />
      <div className="flex-1 bg-white/10 rounded-t h-75% animate-pulse" />
      <div className="flex-1 bg-white/5 rounded-t h-50% animate-pulse" />
      <div className="flex-1 bg-white/10 rounded-t h-90% animate-pulse" />
      <div className="flex-1 bg-white/5 rounded-t h-60% animate-pulse" />
    </div>
  </div>
);
