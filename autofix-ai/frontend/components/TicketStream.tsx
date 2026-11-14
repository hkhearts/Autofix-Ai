"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Flame,
  AlertCircle,
  Info,
  User,
  ChevronDown,
  Zap,
  Trash2,
} from "lucide-react";
import { Ticket } from "../types/ticket";

interface TicketStreamProps {
  tickets: Ticket[];
  selectedTicketId: string;
  onSelectTicket: (ticket: Ticket) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onToggle?: () => void;
}

export const TicketStream: React.FC<TicketStreamProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  onDeleteTicket,
  onToggle,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "priority">("newest");
  const [streamSearch, setStreamSearch] = useState("");

  // Filter
  const filtered = tickets.filter((t) => {
    if (statusFilter && statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (priorityFilter && priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
    if (streamSearch.trim()) {
      const q = streamSearch.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchClient = t.client_name.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchId) return false;
    }
    return true;
  });

  const parseTicketDate = (isoStr: string) => {
    const value = (isoStr || "").trim();
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const hasTimezone = (isoStr: string) =>
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test((isoStr || "").trim());

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const aIsLegacy = !hasTimezone(a.created_at);
    const bIsLegacy = !hasTimezone(b.created_at);
    if (sortOrder === "newest") {
      if (aIsLegacy !== bIsLegacy) return aIsLegacy ? 1 : -1;
      return parseTicketDate(b.created_at) - parseTicketDate(a.created_at);
    }
    if (sortOrder === "oldest") {
      if (aIsLegacy !== bIsLegacy) return aIsLegacy ? -1 : 1;
      return parseTicketDate(a.created_at) - parseTicketDate(b.created_at);
    }
    const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return (weight[b.priority] || 1) - (weight[a.priority] || 1);
  });

  const formatAgo = (isoStr: string) => {
    const diffMs = Date.now() - parseTicketDate(isoStr);
    if (diffMs < 60000) return "just now";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 inline mr-1.5" />;
      case "High":
        return <Flame className="w-4 h-4 text-orange-500 shrink-0 inline mr-1.5" />;
      case "Medium":
        return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 inline mr-1.5" />;
      default:
        return <Info className="w-4 h-4 text-blue-500 shrink-0 inline mr-1.5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "text-red-600 dark:text-red-400 font-bold";
      case "High":
        return "text-orange-600 dark:text-orange-400 font-bold";
      case "Medium":
        return "text-amber-600 dark:text-yellow-400 font-semibold";
      default:
        return "text-slate-600 dark:text-slate-400 font-medium";
    }
  };

  const getStatusBadge = (ticket: Ticket) => {
    if (ticket.status === "RESOLVED_AUTONOMOUSLY") {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          SOLVED
        </span>
      );
    }
    if (ticket.status === "RESOLVED_HUMAN_VERIFIED") {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
          VERIFIED
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
        NEW
      </span>
    );
  };

  return (
    <div className="w-80 xl:w-92 border-r border-slate-200 dark:border-[#22222e] bg-slate-50 dark:bg-[#101015] flex flex-col h-[calc(100vh-4rem)] shrink-0 select-none transition-colors">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-[#22222e] flex items-center justify-between bg-white dark:bg-[#121217]">
        <div className="flex items-center space-x-2.5">
          <h2 className="text-sm font-extrabold tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
            INCOMING TICKETS
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setPriorityFilter("ALL");
              setStreamSearch("");
            }}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reset Filters"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title="Collapse ticket queue"
            aria-label="Collapse ticket queue"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
        </div>
      </div>

      {/* Filter / Sort & Search Row */}
      <div className="p-3 border-b border-slate-200 dark:border-[#22222e] bg-white/70 dark:bg-[#14141b] space-y-2.5">
        {/* Search Input inside ticket stream */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search tickets by title or client..."
            value={streamSearch}
            onChange={(e) => setStreamSearch(e.target.value)}
            className="w-full h-8.5 pl-9 pr-3 text-xs font-medium rounded-lg bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2c2c3c] text-slate-900 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* Filter & Sort Buttons (Side by Side like reference UI) */}
        <div className="flex items-center space-x-2">
          {/* Filter Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setShowFilterMenu(!showFilterMenu);
                setShowSortMenu(false);
              }}
              className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-between transition-colors ${
                statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "bg-yellow-400/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
                  : "bg-white dark:bg-[#181822] border-slate-200 dark:border-[#2c2c3c] text-slate-700 dark:text-zinc-300 hover:border-slate-400"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {priorityFilter !== "ALL"
                    ? priorityFilter
                    : statusFilter !== "ALL"
                    ? statusFilter.replace(/_/g, " ").slice(0, 10)
                    : "Filter"}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFilterMenu && (
              <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-[#2e2e3e] shadow-2xl p-2.5 z-50 text-xs">
                <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1.5">
                  Priority Filter
                </p>
                {["ALL", "Critical", "High", "Medium", "Low"].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriorityFilter(p);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs mb-0.5 font-medium ${
                      priorityFilter === p
                        ? "bg-yellow-400 text-slate-950 font-bold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {p === "ALL" ? "All Priorities" : `${p} Priority`}
                  </button>
                ))}

                <div className="border-t border-slate-200 dark:border-zinc-800 my-1.5" />
                <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1.5">
                  Status Filter
                </p>
                {[
                  { key: "ALL", label: "All Statuses" },
                  { key: "PENDING_HUMAN_REVIEW", label: "Pending Review" },
                  { key: "RESOLVED_AUTONOMOUSLY", label: "Autonomous Solved" },
                  { key: "RESOLVED_HUMAN_VERIFIED", label: "Human Verified" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setStatusFilter(s.key);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs mb-0.5 font-medium ${
                      statusFilter === s.key
                        ? "bg-yellow-400 text-slate-950 font-bold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowFilterMenu(false);
              }}
              className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white dark:bg-[#181822] border-slate-200 dark:border-[#2c2c3c] text-slate-700 dark:text-zinc-300 hover:border-slate-400 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  {sortOrder === "newest"
                    ? "Newest"
                    : sortOrder === "oldest"
                    ? "Oldest"
                    : "Priority"}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-[#2e2e3e] shadow-2xl p-2 z-50 text-xs">
                {[
                  { key: "newest", label: "Newest First" },
                  { key: "oldest", label: "Oldest First" },
                  { key: "priority", label: "Priority (Critical First)" },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSortOrder(s.key as any);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs mb-0.5 font-medium ${
                      sortOrder === s.key
                        ? "bg-yellow-400 text-slate-950 font-bold"
                        : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clean, Uncluttered Ticket Cards List (Exact Reference Layout) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sorted.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-zinc-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No tickets match active filters</p>
          </div>
        ) : (
          sorted.map((ticket) => {
            const isSelected = ticket.id === selectedTicketId;

            return (
              <div
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className={`p-3.5 rounded-xl cursor-pointer text-left transition-all duration-200 ease-out border ${
                  isSelected
                    ? "bg-amber-500/10 dark:bg-[#1a1a26] border-yellow-500 dark:border-yellow-400 shadow-md ring-1 ring-yellow-400/40 -translate-y-0.5"
                    : "bg-white dark:bg-[#14141c] hover:bg-slate-50/90 dark:hover:bg-[#181824] border-slate-200 dark:border-[#22222e] hover:border-slate-400 dark:hover:border-zinc-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                }`}
              >
                {/* Line 1: TICKET #ID + Confidence Match (left) ... TIME AGO (right) */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold tracking-wide text-slate-600 dark:text-zinc-400">
                      TICKET #{ticket.id.replace("TICKET-", "")}
                    </span>
                    {ticket.confidence_score !== undefined && ticket.confidence_score !== null && (
                      <span
                        className={`inline-flex items-center space-x-1 text-[10px] font-black px-1.5 py-0.5 rounded border shadow-2xs ${
                          ticket.confidence_score >= 0.85
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-yellow-400 border-amber-500/30"
                        }`}
                        title={`Hindsight Confidence: ${(ticket.confidence_score * 100).toFixed(0)}%`}
                      >
                        <Zap className="w-2.5 h-2.5 shrink-0" />
                        <span>{(ticket.confidence_score * 100).toFixed(0)}%</span>
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 text-xs font-medium">
                    {formatAgo(ticket.created_at)}
                  </span>
                </div>

                {/* Line 2: Priority Icon + Title (Clean, Readable, Prominent) */}
                <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-3">
                  {getPriorityIcon(ticket.priority)}
                  <span className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}:{" "}
                  </span>
                  <span>{ticket.title}</span>
                </div>

                {/* Line 3: User Avatar + Client Name (left) ... Status Badge & Actions (right) */}
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-zinc-300">
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[10px]">
                      <User className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                    </div>
                    <span className="font-medium truncate max-w-[120px]">
                      {ticket.client_name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {getStatusBadge(ticket)}
                    {onDeleteTicket && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `Delete Ticket #${ticket.id.replace("TICKET-", "")} and purge from Hindsight knowledge?`
                            )
                          ) {
                            onDeleteTicket(ticket.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Delete Ticket and purge memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
