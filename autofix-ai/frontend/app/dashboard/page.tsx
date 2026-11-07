"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Columns3,
  FileText,
  CheckSquare,
  Settings,
  Sparkles,
} from "lucide-react";
import { Ticket, UserSession } from "../../types/ticket";
import { useTheme } from "../../context/ThemeContext";
import { Navbar } from "../../components/Navbar";
import { TicketStream } from "../../components/TicketStream";
import { ActiveTicketView } from "../../components/ActiveTicketView";
import { MemoryInspector } from "../../components/MemoryInspector";
import { PerformanceView } from "../../components/PerformanceView";
import { SettingsView } from "../../components/SettingsView";
import { NewTicketModal } from "../../components/NewTicketModal";
import { getApiUrl } from "@/utils/api";

export default function DashboardPage() {
  const apiUrl = getApiUrl();

  const [activeTab, setActiveTab] = useState<"TICKETS" | "PERFORMANCE" | "SETTINGS">("TICKETS");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const { isDarkMode, toggleTheme } = useTheme();
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // User session
  const [user, setUser] = useState<UserSession>({
    email: "admin@autofix.ai",
    name: "Agent Alex",
    role: "Lead Systems Engineer",
    company_id: "acme-corp",
    company_name: "Acme Global Industries",
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user session and cached tickets from storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("autofix_session");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
      const cachedTickets = localStorage.getItem("autofix_tickets_cache");
      if (cachedTickets) {
        try {
          const parsed: Ticket[] = JSON.parse(cachedTickets);
          if (parsed && parsed.length > 0) {
            setTickets(parsed);
            setSelectedTicket(parsed[0]);
            setIsLoading(false);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/tickets`);
      const data: Ticket[] = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setTickets(data);
        if (typeof window !== "undefined") {
          localStorage.setItem("autofix_tickets_cache", JSON.stringify(data));
        }

        // Auto select first ticket if none selected or keep current updated
        setSelectedTicket((prev) => {
          if (!prev) return data[0];
          const fresh = data.find((t) => t.id === prev.id);
          return fresh || data[0];
        });
      }
    } catch (e) {
      console.warn("Could not fetch tickets from backend; using session cache.", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // 5s polling
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => {
      const updated = [newTicket, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("autofix_tickets_cache", JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedTicket(newTicket);
    setActiveTab("TICKETS");
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => {
      const nextTickets = prev.map((t) => (t.id === updated.id ? updated : t));
      if (typeof window !== "undefined") {
        localStorage.setItem("autofix_tickets_cache", JSON.stringify(nextTickets));
      }
      return nextTickets;
    });
    setSelectedTicket(updated);
  };

  const handleTicketDeleted = (deletedId: string) => {
    setTickets((prev) => {
      const nextTickets = prev.filter((t) => t.id !== deletedId);
      if (typeof window !== "undefined") {
        localStorage.setItem("autofix_tickets_cache", JSON.stringify(nextTickets));
      }
      return nextTickets;
    });
    if (selectedTicket?.id === deletedId) {
      const remaining = tickets.filter((t) => t.id !== deletedId);
      setSelectedTicket(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleUpdateUser = async (updated: UserSession) => {
    setUser(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("autofix_session", JSON.stringify(updated));
    }
    try {
      await axios.put(`${apiUrl}/api/auth/profile`, {
        email: updated.email,
        name: updated.name,
        company_name: updated.company_name,
        role: updated.role,
      });
    } catch (e) {
      console.warn("Profile update saved locally", e);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("autofix_session");
    }
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d0d12] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onLogout={handleLogout}
        onOpenNewTicket={() => setIsNewTicketOpen(true)}
        isDarkMode={isDarkMode}
        setIsDarkMode={toggleTheme}
        onUpdateUser={handleUpdateUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Leftmost Mini Icon Rail (Reference UI Layout) */}
        <div className="w-14 border-r border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#0d0d12] flex flex-col items-center py-4 justify-between shrink-0 select-none z-20">
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={() => setActiveTab("TICKETS")}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                activeTab === "TICKETS"
                  ? "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 shadow-xs"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
              }`}
              title="Ticket Management Console (Columns View)"
            >
              <Columns3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveTab("TICKETS");
                setStatusFilter(statusFilter === "PENDING_HUMAN_REVIEW" ? "ALL" : "PENDING_HUMAN_REVIEW");
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                statusFilter === "PENDING_HUMAN_REVIEW"
                  ? "bg-yellow-400 text-slate-950 font-bold shadow-xs"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
              }`}
              title="Pending Human Reviews Queue"
            >
              <FileText className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setActiveTab("TICKETS");
                setStatusFilter(statusFilter === "RESOLVED_AUTONOMOUSLY" ? "ALL" : "RESOLVED_AUTONOMOUSLY");
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                statusFilter === "RESOLVED_AUTONOMOUSLY"
                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
              }`}
              title="Resolved Autonomous Tasks"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
              activeTab === "SETTINGS"
                ? "bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 shadow-xs"
                : "text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            }`}
            title="Hindsight Memory & System Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {activeTab === "TICKETS" && (
          <>
            {/* Column 1: Incoming Tickets Stream */}
            <TicketStream
              tickets={tickets}
              selectedTicketId={selectedTicket?.id || ""}
              onSelectTicket={(t) => setSelectedTicket(t)}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              onDeleteTicket={handleTicketDeleted}
            />

            {/* Column 2: Center Active Ticket Console */}
            <ActiveTicketView
              ticket={selectedTicket}
              apiUrl={apiUrl}
              user={user}
              onTicketUpdated={handleTicketUpdated}
              onDeleteTicket={handleTicketDeleted}
            />

            {/* Column 3: Hindsight Memory Inspector */}
            <MemoryInspector
              currentTicket={selectedTicket}
              apiUrl={apiUrl}
            />
          </>
        )}

        {activeTab === "PERFORMANCE" && <PerformanceView tickets={tickets} />}

        {activeTab === "SETTINGS" && <SettingsView user={user} />}
      </main>

      {/* Modal: New Ticket Submission */}
      <NewTicketModal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        apiUrl={apiUrl}
        onTicketCreated={handleTicketCreated}
      />
    </div>
  );
}
