import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, FileCode, CheckCheck, X } from 'lucide-react';
import { useToast } from './ToastContext';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  workflowType: string;
  schemaFields?: string[];
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  workflowType,
  schemaFields = [],
}) => {
  const [activeLang, setActiveLang] = useState<'python' | 'javascript' | 'curl'>('python');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const pythonSnippet = `import requests

url = "http://localhost:8000/api/scrape"
payload = {
    "target_url": "${targetUrl}",
    "workflow_type": "${workflowType}",
    "schema_name": "${workflowType}"
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print(f"Status: {data.get('status')}")
print(f"Quality Score: {data.get('data_quality_score')}%")
print("Extracted Record:", data.get("normalized_result"))`;

  const jsSnippet = `const executeScrape = async () => {
  const response = await fetch("http://localhost:8000/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_url: "${targetUrl}",
      workflow_type: "${workflowType}",
      schema_name: "${workflowType}"
    })
  });

  const data = await response.json();
  console.log("Quality Score:", data.data_quality_score);
  console.log("Extracted Data:", data.normalized_result);
};

executeScrape();`;

  const curlSnippet = `curl -X POST "http://localhost:8000/api/scrape" \\
     -H "Content-Type: application/json" \\
     -d '{
       "target_url": "${targetUrl}",
       "workflow_type": "${workflowType}",
       "schema_name": "${workflowType}"
     }'`;

  const currentSnippet = 
    activeLang === 'python' ? pythonSnippet :
    activeLang === 'javascript' ? jsSnippet : curlSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('success', 'Code Copied', `${activeLang.toUpperCase()} snippet copied to clipboard`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#060a12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <Code2 size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white mono">Integration Code Snippet</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language Tabs & Copy */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-black/40 border-b border-white/10">
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                activeLang === 'python' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python (requests)
            </button>
            <button
              onClick={() => setActiveLang('javascript')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                activeLang === 'javascript' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              JavaScript (fetch)
            </button>
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                activeLang === 'curl' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL CLI
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            {copied ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="p-5 bg-[#030712] overflow-x-auto">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
            <code>{currentSnippet}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] mono text-slate-500">
          <span>Target Workflow: <span className="text-cyan-400 uppercase font-bold">{workflowType}</span></span>
          <span className="text-slate-400">Endpoint: POST /api/scrape</span>
        </div>
      </div>
    </div>
  );
};
