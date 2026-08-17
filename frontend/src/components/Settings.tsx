import React, { useState } from 'react';
import { Settings as SettingsIcon, RotateCcw, Key, Database } from 'lucide-react';
import type { ConfigModeResponse } from '../types';
import { resetDemo } from '../api';
import { useScrambleText, stagger } from '../hooks';

interface SettingsProps {
  configMode: ConfigModeResponse | null;
}

export const Settings: React.FC<SettingsProps> = ({ configMode }) => {
  const [resetting, setResetting] = useState(false);
  const title = useScrambleText('System Settings & Provider Configuration', true);
  const isLive = configMode?.provider === 'brightdata';

  const handleReset = async () => {
    try {
      setResetting(true);
      await resetDemo();
      alert('Demo database reset successfully to initial state!');
    } catch (e: any) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="stagger-in" style={stagger(0)}>
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-[11px] mono uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent)' }}>
            System Administration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage Bright Data provider credentials, live vs offline execution mode, and database state.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-in" style={stagger(1)}>
        {/* Scraper Provider Config Card */}
        <div className="p-6 rounded-2xl glow-hover space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Bright Data Scraper Studio</h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active provider connectivity status</p>
            </div>
          </div>

          <div className="p-4 rounded-xl space-y-3 text-xs mono" style={{ background: 'var(--bg-root)', border: '1px solid var(--border-default)' }}>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-tertiary)' }}>Provider Mode:</span>
              <span className="font-bold uppercase px-2 py-0.5 rounded text-[11px]" style={{ background: isLive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: isLive ? 'var(--success)' : 'var(--warning)' }}>
                {configMode?.provider || 'loading…'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-tertiary)' }}>Bright Data Connected:</span>
              <span className="font-bold" style={{ color: configMode?.brightdata_enabled ? 'var(--success)' : 'var(--danger)' }}>
                {configMode?.brightdata_enabled ? 'AUTHENTICATED' : 'OFFLINE FIXTURE'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--text-tertiary)' }}>Display Mode:</span>
              <span style={{ color: 'var(--accent)' }}>{configMode?.display_name || 'Bright Data Live Scraper'}</span>
            </div>
          </div>
        </div>

        {/* Database & Demo Seed Control */}
        <div className="p-6 rounded-2xl glow-hover space-y-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Database Seed Control</h2>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Reset execution runs & repair history</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Purges all historical scrape runs, repair attempts, and field changes, restoring the clean baseline demo state.
          </p>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 btn-spring"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--danger)',
              cursor: resetting ? 'wait' : 'pointer'
            }}
          >
            <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            <span>{resetting ? 'Resetting Database…' : 'Reset Demo Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
