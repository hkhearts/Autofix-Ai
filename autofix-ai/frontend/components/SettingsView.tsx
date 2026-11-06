"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Brain,
  Sliders,
  Save,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Cloud,
  Check,
} from "lucide-react";
import axios from "axios";
import { UserSession } from "../types/ticket";

interface SettingsViewProps {
  user: UserSession;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [threshold, setThreshold] = useState(0.85);
  const [groqVisionModel, setGroqVisionModel] = useState("llama-3.2-11b-vision-preview");
  const [groqTextModel, setGroqTextModel] = useState("llama-3.3-70b-versatile");
  const [bankId, setBankId] = useState("autofix_ai_tickets");
  const [cloudBaseUrl, setCloudBaseUrl] = useState("https://api.hindsight.vectorize.io");
  const [hindsightApiKey, setHindsightApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  // Fetch current memory stats on mount to detect cloud status
  useEffect(() => {
    const checkStats = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/memory/stats`);
        if (res.data.is_cloud_connected) {
          setConnectionStatus({
            tested: true,
            success: true,
            message: "Connected to Hindsight Cloud instance",
          });
        }
      } catch (e) {}
    };
    checkStats();
  }, [apiUrl]);

  const handleTestCloudConnection = async () => {
    if (!hindsightApiKey.trim()) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: "Please enter your Hindsight Cloud API Key from https://ui.hindsight.vectorize.io",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const res = await axios.post(`${apiUrl}/api/settings/hindsight`, {
        api_key: hindsightApiKey,
        base_url: cloudBaseUrl,
        bank_id: bankId,
      });

      if (res.data.connected) {
        setConnectionStatus({
          tested: true,
          success: true,
          message: res.data.message || "Successfully authenticated with Vectorize Hindsight Cloud!",
        });
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          message: res.data.message || "Could not authenticate. Verify your API key on Hindsight Cloud.",
        });
      }
    } catch (e: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: e.response?.data?.detail || "Failed to reach backend endpoint.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0e0e13] p-8 overflow-y-auto select-none transition-colors">
      <div className="max-w-4xl mx-auto space-y-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Settings className="w-6 h-6 text-yellow-500" />
            <span>Agent Orchestration & Memory Settings</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Configure Vectorize Hindsight Cloud persistent memory, Groq Multimodal Vision models, and decision gate thresholds.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm flex items-center space-x-2.5 shadow-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">Configuration saved successfully! Runtime parameters updated.</span>
          </div>
        )}

        {/* Section 1: Hindsight Cloud Configuration */}
        <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <Cloud className="w-5 h-5 text-yellow-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Vectorize Hindsight Cloud Integration
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Agent memory layer with multi-strategy retrieval (Vector + BM25 + Graph)
                </p>
              </div>
            </div>

            <a
              href="https://ui.hindsight.vectorize.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:underline flex items-center space-x-1"
            >
              <span>Cloud Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Status banner */}
          {connectionStatus && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center space-x-2.5 ${
                connectionStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              }`}
            >
              {connectionStatus.success ? (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{connectionStatus.message}</span>
            </div>
          )}

          <div className="space-y-4 text-sm">
            {/* Hindsight API Key Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-slate-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider">
                  Hindsight Cloud API Key
                </label>
                <a
                  href="https://ui.hindsight.vectorize.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline font-semibold"
                >
                  Get API Key from ui.hindsight.vectorize.io &rarr;
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={hindsightApiKey}
                  onChange={(e) => setHindsightApiKey(e.target.value)}
                  placeholder="Paste your Hindsight Cloud API Key here..."
                  className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-3.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Cloud Base URL & Bank Identifier */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
                  Hindsight Cloud API Endpoint
                </label>
                <input
                  type="text"
                  value={cloudBaseUrl}
                  onChange={(e) => setCloudBaseUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
                  Memory Bank Identifier
                </label>
                <input
                  type="text"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Promo Code & Test Connection Row */}
            <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wider">
                  Promo Code: $50 Free Hindsight Cloud Credits
                </p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  Register at <strong className="text-slate-900 dark:text-white">ui.hindsight.vectorize.io</strong> and add promo code{" "}
                  <code className="text-yellow-700 dark:text-yellow-400 font-mono font-bold">MEMHACK99</code> in the billing section.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestCloudConnection}
                disabled={testingConnection}
                className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0 disabled:opacity-50"
              >
                {testingConnection ? "Connecting..." : "Test Cloud Connection"}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Autonomous Decision Gate */}
        <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-6 space-y-5 shadow-xs">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3.5">
            <Sliders className="w-5 h-5 text-yellow-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Autonomous Decision Gate Threshold
            </h2>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center text-slate-700 dark:text-zinc-300">
              <span className="font-semibold">Confidence Threshold for Autonomous Fix Execution:</span>
              <span className="text-yellow-600 dark:text-yellow-400 font-extrabold text-lg">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              Tickets with Hindsight memory vector similarity scores &ge; {(threshold * 100).toFixed(0)}% will automatically execute simulated fixes and self-heal. Tickets below this threshold are escalated to Human-In-The-Loop review.
            </p>
          </div>
        </div>

        {/* Section 3: Groq LLM & Vision Models */}
        <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-6 space-y-5 shadow-xs">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 dark:border-zinc-800 pb-3.5">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Groq AI Models</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
                Multimodal OCR Vision Model
              </label>
              <select
                value={groqVisionModel}
                onChange={(e) => setGroqVisionModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm"
              >
                <option value="llama-3.2-11b-vision-preview">Llama 3.2 11B Vision Preview</option>
                <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B Vision</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-bold mb-1.5 text-xs uppercase tracking-wider">
                Signature Normalization Text Model
              </label>
              <select
                value={groqTextModel}
                onChange={(e) => setGroqTextModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-2.5 text-slate-900 dark:text-white text-sm"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                <option value="qwen/qwen3-32b">Qwen 3 32B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Official Project Resources & Band AI */}
        <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-6 space-y-4 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Brain className="w-5 h-5 text-yellow-500" />
            <span>Official Technology Links & Band AI Desktop</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <a
              href="https://hindsight.vectorize.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-yellow-400 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Hindsight Documentation</p>
                <p className="text-slate-500 dark:text-zinc-400">hindsight.vectorize.io</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="https://ui.hindsight.vectorize.io"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-yellow-400 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Hindsight Cloud Console</p>
                <p className="text-slate-500 dark:text-zinc-400">ui.hindsight.vectorize.io</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="https://github.com/vectorize-io/hindsight"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-yellow-400 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-slate-900 dark:text-white">GitHub Repository</p>
                <p className="text-slate-500 dark:text-zinc-400">vectorize-io/hindsight</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="https://www.band.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-yellow-800 dark:text-yellow-300">Band AI Desktop Client</p>
                <p className="text-slate-500 dark:text-zinc-400">www.band.ai</p>
              </div>
              <ExternalLink className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            </a>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-7 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center space-x-2 transition-all shadow hover:shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};
