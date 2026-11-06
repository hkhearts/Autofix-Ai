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
  BookOpen,
  Sparkles,
  TrendingUp,
  Database,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { MemoryStats, Ticket } from "../types/ticket";

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
  const [similarCasesOpen, setSimilarCasesOpen] = useState(true);
  const [interactionsOpen, setInteractionsOpen] = useState(true);
  const [articlesOpen, setArticlesOpen] = useState(true);
  const [patternsOpen, setPatternsOpen] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCaseModal, setSelectedCaseModal] = useState<any | null>(null);

  // Fetch memory stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/memory/stats`);
        setStats(res.data);
      } catch (e) {
        setStats({
          bank_id: "autofix_ai_tickets",
          is_cloud_connected: false,
          total_records: 16,
          autonomous_resolutions: 9,
          human_verified_resolutions: 7,
          confidence_threshold: 0.85,
          last_updated: new Date().toISOString(),
        });
      }
    };
    fetchStats();
  }, [apiUrl, currentTicket]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`${apiUrl}/api/memory/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (e) {
      console.error("Memory search failed", e);
    }
  };

  const clientName = currentTicket?.client_name || "Jane Doe";

  return (
    <div className="w-80 xl:w-92 border-l border-slate-200 dark:border-[#22222e] bg-slate-50 dark:bg-[#101015] flex flex-col h-[calc(100vh-4rem)] shrink-0 select-none overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-[#22222e] flex items-center justify-between bg-white dark:bg-[#121217]">
        <div className="flex items-center space-x-2.5">
          <Brain className="w-4.5 h-4.5 text-yellow-500" />
          <h2 className="text-sm font-extrabold tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
            MEMORY INSPECTOR <span className="text-slate-400 dark:text-zinc-500 font-semibold">(Hindsight)</span>
          </h2>
        </div>
        <span
          className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"
          title="Vectorize Hindsight Memory Bank Online"
        />
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-slate-200 dark:border-[#22222e] bg-white/70 dark:bg-[#14141b]">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search Memory Vectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-9 pr-3 text-xs font-medium rounded-lg bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2c2c3c] text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </form>
      </div>

      {/* Accordion Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Section 1: SIMILAR CASES (Tree Line Structure matching reference UI) */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setSimilarCasesOpen(!similarCasesOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              SIMILAR CASES (3 found):
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${
                similarCasesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {similarCasesOpen && (
            <div className="p-3 pt-0 border-t border-slate-100 dark:border-zinc-800/60">
              {/* Tree line container */}
              <div className="relative pl-3 space-y-3 before:absolute before:left-1 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                {/* Case 1 */}
                <div
                  onClick={() =>
                    setSelectedCaseModal({
                      id: "#101, #95",
                      title: "Critical: Unable to access Salesforce",
                      match: "96% Vector Match",
                      solution:
                        "1. Resync local workstation NTP clock: w32tm /resync /force\n2. Invalidate expired Okta SAML assertion tokens in identity lifecycle pool\n3. Clear Chrome/Edge browser SAML authentication cookies\n4. Re-issue clean SAML challenge; verify 200 OK.",
                    })
                  }
                  className="relative cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                        #101, #95
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-snug">
                        Critical: Unable to access Salesforce
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/30">
                        96% Vector Match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case 2 */}
                <div
                  onClick={() =>
                    setSelectedCaseModal({
                      id: "#95",
                      title: "Critical: Unable to access Salesforce",
                      match: "88% Vector Match",
                      solution:
                        "1. Purge stale Kerberos tickets\n2. Rebind user authentication scope in Okta console\n3. Confirm SSO callback URL handshake.",
                    })
                  }
                  className="relative cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                        #95
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-snug">
                        Critical: Unable to access Salesforce
                      </p>
                    </div>
                  </div>
                </div>

                {/* Case 3 */}
                <div
                  onClick={() =>
                    setSelectedCaseModal({
                      id: "#88",
                      title: "Critical: Unable to access Salesforce",
                      match: "82% Vector Match",
                      solution:
                        "1. Check Okta System Log for clock skew warning events\n2. Verify client device time against pool.ntp.org\n3. Restart authentication worker.",
                    })
                  }
                  className="relative cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs">
                        #88
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold leading-snug">
                        Critical: Unable to access Salesforce
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: PAST INTERACTIONS WITH JANE DOE */}
        <div className="rounded-xl bg-white dark:bg-[#15151e] border border-slate-200 dark:border-[#242432] overflow-hidden shadow-2xs">
          <button
            onClick={() => setInteractionsOpen(!interactionsOpen)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 truncate">
              PAST INTERACTIONS WITH {clientName.toUpperCase()}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                interactionsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {interactionsOpen && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-zinc-800/60">
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 hover:border-yellow-500/40 hover:translate-x-0.5 transition-all duration-150">
                <User className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-800 dark:text-zinc-300 leading-snug">
                  Summary Interaction with {clientName}... (Resolved Okta 2FA push storm on Oct 24).
                </p>
              </div>
              <div className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 hover:border-yellow-500/40 hover:translate-x-0.5 transition-all duration-150">
                <Users className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-800 dark:text-zinc-300 leading-snug">
                  Summary Agent cases with {clientName}... (3 incidents autonomously healed).
                </p>
              </div>
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
              RELEVANT ARTICLES
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
                articlesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {articlesOpen && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-100 dark:border-zinc-800/60">
              <div
                onClick={() =>
                  setSelectedCaseModal({
                    id: "KB-4091",
                    title: "Resolving NTP Clock Skew on Enterprise Workstations",
                    match: "Runbook Article",
                    solution:
                      "Execute in elevated terminal:\n1. w32tm /config /syncfromflags:manual /manualpeerlist:time.windows.com\n2. net stop w32time && net start w32time\n3. w32tm /resync /force",
                  })
                }
                className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-yellow-400 hover:translate-x-1 transition-all duration-150"
              >
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-800 dark:text-zinc-300 leading-snug">
                  Summary relevant information to and how to settle visual persist to... (KB-4091 NTP sync)
                </p>
              </div>
              <div
                onClick={() =>
                  setSelectedCaseModal({
                    id: "KB-1022",
                    title: "Okta Identity Cloud SAML Token Assertion Protocol",
                    match: "Runbook Article",
                    solution:
                      "1. Review SAML audience URI restriction\n2. Validate certificate fingerprint\n3. Flush expired token session in Okta Directory.",
                  })
                }
                className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-50/70 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 cursor-pointer hover:border-yellow-400 hover:translate-x-1 transition-all duration-150"
              >
                <BookOpen className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-800 dark:text-zinc-300 leading-snug">
                  Summary relevant information all and sanitize case tonish... (KB-1022 Okta SAML)
                </p>
              </div>
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
                  LEARNED PATTERNS
                </span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                Agent performance insights
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
              <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25">
                <div className="flex items-center space-x-1.5 text-yellow-800 dark:text-yellow-400 font-bold mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Summary learning telemetry</span>
                </div>
                <p className="text-xs text-slate-800 dark:text-zinc-300 leading-relaxed">
                  Summary real-time memory object during agent performance insights. Autonomous precision is at{" "}
                  <strong className="text-slate-950 dark:text-white">94.2%</strong> across {stats?.total_records || 16} indexed vectors.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memory Footer Telemetry */}
      <div className="p-3.5 border-t border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#121217] text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Bank: <strong className="text-slate-900 dark:text-zinc-200">{stats?.bank_id || "autofix_ai_tickets"}</strong>
          </span>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
          {stats?.total_records || 16} Vectors Active
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
