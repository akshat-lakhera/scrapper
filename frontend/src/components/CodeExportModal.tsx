import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2, FileCode, CheckCheck, X, Globe, Shield } from 'lucide-react';
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
  const [activeLang, setActiveLang] = useState<'python' | 'typescript' | 'curl' | 'go' | 'brightdata'>('python');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const pythonSnippet = `import httpx
import asyncio

async def scrape_target():
    url = "http://localhost:8000/api/scrape"
    payload = {
        "target_url": "${targetUrl}",
        "workflow_type": "${workflowType}",
        "schema_name": "${workflowType}"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        data = response.json()
        
        print(f"Status: {data.get('status')}")
        print(f"Quality Score: {data.get('data_quality_score')}%")
        print("Extracted Entity Payload:", data.get("normalized_result"))

asyncio.run(scrape_target())`;

  const tsSnippet = `import axios from 'axios';

interface ScrapeResponse {
  status: string;
  data_quality_score: number;
  normalized_result: Record<string, any>;
  duration_ms: number;
}

async function runScrape() {
  const { data } = await axios.post<ScrapeResponse>('http://localhost:8000/api/scrape', {
    target_url: '${targetUrl}',
    workflow_type: '${workflowType}',
    schema_name: '${workflowType}',
  });

  console.log(\`Extraction Status: \${data.status}\`);
  console.log(\`Quality Score: \${data.data_quality_score}%\`);
  console.log('Structured Record:', data.normalized_result);
}

runScrape();`;

  const curlSnippet = `curl -X POST "http://localhost:8000/api/scrape" \\
     -H "Content-Type: application/json" \\
     -d '{
       "target_url": "${targetUrl}",
       "workflow_type": "${workflowType}",
       "schema_name": "${workflowType}"
     }'`;

  const goSnippet = `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"io"
)

func main() {
	payload, _ := json.Marshal(map[string]string{
		"target_url":    "${targetUrl}",
		"workflow_type": "${workflowType}",
		"schema_name":   "${workflowType}",
	})

	resp, err := http.Post("http://localhost:8000/api/scrape", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body))
}`;

  const brightDataSnippet = `// Official Bright Data Datasets v3 / Scraper Studio Trigger
const axios = require('axios');

const API_KEY = process.env.BRIGHTDATA_API_KEY;
const DATASET_ID = process.env.BRIGHTDATA_PRODUCT_DATASET_ID || 'your_dataset_id';

axios.post(\`https://api.brightdata.com/datasets/v3/trigger?dataset_id=\${DATASET_ID}&include_errors=true\`, 
  [{ url: '${targetUrl}' }],
  {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    }
  }
).then(res => {
  console.log('Bright Data Snapshot ID:', res.data.snapshot_id);
});`;

  const snippets: Record<string, string> = {
    python: pythonSnippet,
    typescript: tsSnippet,
    curl: curlSnippet,
    go: goSnippet,
    brightdata: brightDataSnippet,
  };

  const currentSnippet = snippets[activeLang];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('success', 'Code Copied', `${activeLang.toUpperCase()} SDK snippet copied to clipboard`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-3xl bg-[#090c13] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f131f]">
          <div className="flex items-center gap-2.5">
            <Code2 size={20} className="text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-white font-mono">Multi-Language SDK & API Generator</h2>
              <span className="text-[11px] text-slate-400 font-mono">Deploy extraction pipelines from any codebase</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'python', label: 'Python (httpx)' },
              { id: 'typescript', label: 'TypeScript / Node' },
              { id: 'curl', label: 'cURL' },
              { id: 'go', label: 'Go' },
              { id: 'brightdata', label: 'Bright Data Proxy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLang(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeLang === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content Area */}
        <div className="p-6 bg-[#04060a] overflow-x-auto max-h-[420px]">
          <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
            {currentSnippet}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#0f131f] flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Target: <strong className="text-white">{workflowType}</strong></span>
          <span>Endpoint: <strong className="text-blue-400">/api/scrape</strong></span>
        </div>
      </div>
    </div>
  );
};
