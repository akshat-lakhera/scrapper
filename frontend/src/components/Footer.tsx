import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  ExternalLink, 
  Heart, 
  Cpu, 
  Database,
  Radio,
  FileText,
  Lock
} from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms, setActiveTab }) => {
  return (
    <footer className="w-full mt-16 border-t border-white/10 bg-[#060810]/80 backdrop-blur-md font-mono text-xs text-slate-400">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Status */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="tracking-tight">MarketScout</span>
            </div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              Autonomous Self-Healing Web-Data Intelligence & Living RAG Workstation powered by Bright Data Scraper Studio.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational (FastAPI + Vite)</span>
            </div>
          </div>

          {/* Col 2: Workstations */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white block">Intelligence Workstations</span>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <button onClick={() => setActiveTab('overview')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Overview & Command Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('product_discovery')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Product & Price Intelligence
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('job_discovery')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Talent & Job Market Radar
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('repairs')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Autonomous Self-Healing Center
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('runs')} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Audit Execution Log
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Documentation & Compliance */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white block">Documentation & Legal</span>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>FastAPI Swagger Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>sitemap.xml</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
                  <span>robots.txt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Privacy & Zero-PII Policy</span>
                </button>
              </li>
              <li>
                <button onClick={onOpenTerms} className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>Terms & API License</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Real Support */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-white block">Support & Operations</span>
            <div className="space-y-1.5 text-xs text-slate-300 font-sans">
              <p className="font-mono text-slate-400 text-xs">Headquarters & Engineering:</p>
              <p className="text-slate-200 font-medium">MarketScout Intelligence Lab</p>
              <p className="text-slate-400">450 Mission Street, Suite 400</p>
              <p className="text-slate-400">San Francisco, CA 94105, USA</p>
              <p className="font-mono text-blue-400 pt-1">support@marketscout.dev</p>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} MarketScout Intelligence Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Production Grade v1.0</span>
            <span>·</span>
            <span>Bright Data DCA Compatible</span>
            <span>·</span>
            <span>Multi-Strategy Self-Healing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
