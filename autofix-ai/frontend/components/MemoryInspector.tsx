"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Users,
  Sparkles,
  TrendingUp,
  Database,
  ExternalLink,
  Cloud,
} from "lucide-react";
import axios from "axios";
import { MemorySearchResult, MemoryStats, Ticket } from "../types/ticket";

interface MemoryInspectorProps {
  currentTicket: Ticket | null;
  apiUrl: string;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({
  currentTicket,
  apiUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [similarCasesOpen, setSimilarCasesOpen] = useState(true);
  const [interactionsOpen, setInteractionsOpen] = useState(true);
  const [articlesOpen, setArticlesOpen] = useState(true);
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [selectedCaseModal, setSelectedCaseModal] = useState<any | null>(null);
  const [isCloudMode, setIsCloudMode] = useState(true);
  const [isTogglingCloud, setIsTogglingCloud] = useState(false);

  // Fetch memory stats
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/memory/stats`);
      setStats(res.data);
      if (res.data.cloud_mode_enabled !== undefined) {
        setIsCloudMode(res.data.cloud_mode_enabled);
      }
      setStatsError("");
    } catch {
      setStats(null);
      setStatsError("Memory status is unavailable.");
    }
  };

  useEffect(() => {
    fetchStats();
  }, [apiUrl]);

  // Automatically fetch and display relevant Hindsight memory matches for the selected ticket
  const fetchMatchesForTicket = async (ticket: Ticket | null) => {
    try {
      setSearchError("");
      const query = ticket
        ? (ticket.error_signature || ticket.title || "").trim()
        : "incident failure recovery";
      const res = await axios.get(
        `${apiUrl}/api/memory/search?q=${encodeURIComponent(query)}&limit=5`
      );
      let matches: MemorySearchResult[] = res.data || [];

      // If no direct matches returned, synthesize the ticket's own verified or suggested pattern
      if (ticket && matches.length === 0 && ticket.diagnostic_insights) {
        matches = [
          {
            ticket_id: ticket.diagnostic_insights.matched_ticket_id || ticket.id,
            confidence: (ticket.diagnostic_insights.confidence_percent || 85) / 100,
            resolution_steps: ticket.diagnostic_insights.recommended_solution,
            error_signature:
              ticket.diagnostic_insights.detected_signature || ticket.error_signature,
            resolution_type: ticket.resolution_type || "AUTONOMOUS",
            metadata: { title: ticket.diagnostic_insights.matched_pattern_title },
            timestamp: new Date().toISOString(),
          },
        ];
      }
      setSearchResults(matches);
    } catch (error) {
      console.error("Error fetching Hindsight memory matches", error);
    }
  };

  // Re-fetch matches whenever the active ticket changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      fetchMatchesForTicket(currentTicket);
    }
  }, [currentTicket?.id, apiUrl]);

  const handleToggleCloudMode = async () => {
    setIsTogglingCloud(true);
    try {
      const res = await axios.post(`${apiUrl}/api/memory/toggle-cloud-mode`, {
        enabled: !isCloudMode,
      });
      setIsCloudMode(res.data.cloud_mode_enabled);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
      // Re-fetch matches in the new mode
      fetchMatchesForTicket(currentTicket);
    } catch (err) {
      console.error("Failed to toggle cloud mode", err);
    } finally {
      setIsTogglingCloud(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchMatchesForTicket(currentTicket);
      return;
    }
    try {
      setSearchError("");
      const res = await axios.get(
        `${apiUrl}/api/memory/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(res.data);
    } catch (error) {
      setSearchResults([]);
      setSearchError("Memory search failed. Check the API connection and try again.");
      console.error("Memory search failed", error);
    }
  };

  const clientName = currentTicket?.client_name;

  return (
    <div className="w-80 xl:w-92 border-l border-slate-200 dark:border-[#22222e] bg-slate-50 dark:bg-[#101015] flex flex-col h-[calc(100vh-4rem)] shrink-0 select-none overflow-hidden transition-colors">
      {/* Header with Cloud Mode Toggle Button */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-[#22222e] flex items-center justify-between bg-white dark:bg-[#121217]">
        <div className="flex items-center space-x-2">
          <Brain className="w-4.5 h-4.5 text-yellow-500" />
          <h2 className="text-sm font-extrabold tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
            MEMORY INSPECTOR <span className="text-slate-400 dark:text-zinc-500 font-semibold">(Hindsight)</span>
          </h2>
        </div>

        {/* Toggle Cloud Mode Button */}
        <button
          onClick={handleToggleCloudMode}
          disabled={isTogglingCloud}
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center space-x-1.5 transition-all duration-150 border shadow-2xs hover:scale-102 active:scale-98 ${
            isCloudMode
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25"
              : "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25"
          }`}
          title={
            isCloudMode
              ? "Hindsight Cloud Active (Using Live Credits). Click to toggle Credit Saver."
              : "Credit Saver Active (Local Vector Cache). Click to toggle Cloud Mode."
          }
        >
          <Cloud
            className={`w-3.5 h-3.5 ${
              isCloudMode ? "text-emerald-500 animate-pulse" : "text-amber-500"
            }`}
          />
          <span>{isCloudMode ? "CLOUD (ONLINE)" : "LOCAL (SAVER)"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-200 dark:border-[#22222e] bg-white/70 dark:bg-[#14141b]">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search Hindsight memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-3 text-xs font-medium rounded-lg bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2c2c3c] text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </form>

        <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold px-0.5">
          {isCloudMode ? (
            <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Hindsight Cloud Online</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span>Credit Saver (Local)</span>
            </span>
          )}
          <span
            className={
              isCloudMode
                ? "text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-wider"
                : "text-yellow-600 dark:text-yellow-400 text-[10px] uppercase font-bold tracking-wider"
            }
          >
            {isCloudMode ? "Credits Active" : "Credits Protected"}
          </span>
        </div>
        {searchError && (
          <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
            {searchError}
          </p>
        )}
      </div>

      {/* Accordion Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Section 1: Hindsight search results */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setSimilarCasesOpen(!similarCasesOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              HINDSIGHT MATCHES ({searchResults.length} found)
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${
                similarCasesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {similarCasesOpen && (
            <div className="p-3 pt-0 border-t border-slate-100 dark:border-zinc-800/60">
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={`${result.ticket_id}-${result.error_signature}`}
                    onClick={() =>
                      setSelectedCaseModal({
                        id: result.ticket_id,
                        title: result.error_signature || "Hindsight memory",
                        match: `${Math.round(result.confidence * 100)}% Hindsight match`,
                        solution: result.resolution_steps,
                      })
                    }
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      <FileText className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                          {result.ticket_id}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 font-semibold leading-snug">
                          {result.error_signature || "Historical resolution"}
                        </p>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30">
                          {Math.round(result.confidence * 100)}% match
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {searchResults.length === 0 && (
                  <p className="p-2 text-xs text-slate-500 dark:text-zinc-400">
                    Search for an error or symptom to retrieve matching memories.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Ticket conversation */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setInteractionsOpen(!interactionsOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 truncate">
              {clientName ? `TICKET HISTORY WITH ${clientName.toUpperCase()}` : "CURRENT TICKET HISTORY"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                interactionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {interactionsOpen && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-zinc-800/60">
              {currentTicket?.messages.length ? currentTicket.messages.slice(-4).reverse().map((message) => (
                <div key={message.id} className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800">
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs text-slate-800 dark:text-zinc-300 leading-snug">
                    <strong>{message.sender}:</strong> {message.content}
                  </p>
                </div>
              )) : (
                <p className="p-2 text-xs text-slate-500 dark:text-zinc-400">
                  No conversation history is available for this ticket.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Section 3: RELEVANT ARTICLES */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setArticlesOpen(!articlesOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              HINDSIGHT KNOWLEDGE
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                articlesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {articlesOpen && (
            <div className="p-3 pt-0 border-t border-slate-100 dark:border-zinc-800/60">
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                Search above to retrieve relevant ticket resolutions from this memory bank.
              </p>
              <a
                href="https://ui.hindsight.vectorize.io/banks/autofix_ai_tickets?view=documents"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 dark:text-yellow-400 hover:underline"
              >
                Browse cloud documents <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Section 4: LEARNED PATTERNS (✨ Agent performance insights) */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setPatternsOpen(!patternsOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  MEMORY BANK STATUS
                </span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                Live counts from the configured bank
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${
                patternsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {patternsOpen && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-zinc-800/60">
              {statsError ? (
                <p role="alert" className="p-2.5 text-xs text-red-600 dark:text-red-400">
                  {statsError}
                </p>
              ) : (
                <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25">
                  <div className="flex items-center space-x-1.5 text-yellow-800 dark:text-yellow-400 font-bold mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{stats?.is_cloud_connected ? "Hindsight Cloud connected" : "Local memory fallback"}</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-zinc-300 leading-relaxed">
                    {stats?.total_records ?? "—"} memory units · {stats?.autonomous_resolutions ?? "—"} autonomous ·{" "}
                    {stats?.human_verified_resolutions ?? "—"} human-verified.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Memory Footer Telemetry */}
      <div className="p-3.5 border-t border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#121217] text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Bank: <strong className="text-slate-900 dark:text-zinc-200">{stats?.bank_id || "—"}</strong>
          </span>
        </div>
        <span className={stats?.is_cloud_connected ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
          {stats?.is_cloud_connected ? `${stats.total_records} memories` : "offline"}
        </span>
      </div>

      {/* Quick Modal for Inspecting Past Case or Runbook */}
      {selectedCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase">
                  {selectedCaseModal.match}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {selectedCaseModal.id} — {selectedCaseModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-black/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 font-mono text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
              {selectedCaseModal.solution}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCaseModal(null)}
                className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs uppercase"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
