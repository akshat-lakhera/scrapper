import React from 'react';
import { AlertTriangle, ArrowLeft, Home, RefreshCw, Terminal, Search } from 'lucide-react';
import { SpotlightCard } from './effects/SpotlightCard';

interface NotFoundPageProps {
  onReturnHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onReturnHome }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-mono">
      <SpotlightCard className="max-w-2xl w-full p-8 sm:p-12 text-center space-y-6 bg-[#090d18] border border-white/15 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs text-rose-400 font-bold uppercase tracking-widest">[HTTP_STATUS // 404_NOT_FOUND]</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Target Route Unreachable</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
            The requested intelligence workstation or extraction entity does not exist in the active cluster routing table.
          </p>
        </div>

        {/* Mock Terminal Output */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-left text-[11px] text-slate-300 space-y-1 font-mono">
          <div className="text-slate-500">$ curl -I http://127.0.0.1:8000/unknown_target</div>
          <div className="text-rose-400">HTTP/1.1 404 Not Found</div>
          <div className="text-slate-400">X-Cluster-Error: ROUTE_UNREGISTERED</div>
          <div className="text-emerald-400">Action: Returning to main command center recommended.</div>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onReturnHome}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Command Center</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
        </div>
      </SpotlightCard>
    </div>
  );
};
