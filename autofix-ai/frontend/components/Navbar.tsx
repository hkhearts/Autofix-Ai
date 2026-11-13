"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Search,
  Moon,
  Sun,
  Building2,
  LogOut,
  User,
  ShieldCheck,
  Plus,
  Sparkles,
  Check,
  Network,
} from "lucide-react";
import { UserSession } from "../types/ticket";
import { useTheme } from "../context/ThemeContext";

interface NavbarProps {
  activeTab: "TICKETS" | "PERFORMANCE" | "SETTINGS";
  setActiveTab: (tab: "TICKETS" | "PERFORMANCE" | "SETTINGS") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: UserSession;
  onLogout: () => void;
  onOpenNewTicket: () => void;
  isDarkMode?: boolean;
  setIsDarkMode?: (val: boolean) => void;
  onUpdateUser?: (updated: UserSession) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  user,
  onLogout,
  onOpenNewTicket,
  isDarkMode: propDarkMode,
  setIsDarkMode: propSetDarkMode,
  onUpdateUser,
}) => {
  const { isDarkMode: ctxDarkMode, toggleTheme } = useTheme();
  const isDarkMode = propDarkMode !== undefined ? propDarkMode : ctxDarkMode;

  const handleToggle = () => {
    toggleTheme();
    if (propSetDarkMode) {
      propSetDarkMode(!isDarkMode);
    }
  };

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editCompany, setEditCompany] = useState(user.company_name);

  React.useEffect(() => {
    setEditName(user.name);
    setEditCompany(user.company_name);
  }, [user.name, user.company_name]);

  const handleSaveProfile = () => {
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        name: editName,
        company_name: editCompany,
        company_id: editCompany.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      });
    }
    setShowProfileModal(false);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#121217] px-5 flex items-center justify-between select-none shrink-0 sticky top-0 z-40 transition-colors shadow-xs">
        {/* Left: Logo & Nav Links */}
        <div className="flex items-center space-x-7">
          <div
            onClick={() => setActiveTab("TICKETS")}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#181824] border border-slate-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-105 transition-transform p-1">
              <img src="/symbol.png" alt="Autofix-AI Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white uppercase">
                AUTOFIX<span className="text-yellow-500">.AI</span>
              </span>
              <span className="hidden lg:block text-[11px] text-slate-500 dark:text-zinc-400 font-medium tracking-tight">
                Self-Healing IT Agent
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-2 h-16">
            {(["TICKETS", "PERFORMANCE", "SETTINGS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full px-4 text-xs font-bold tracking-wider transition-all relative flex items-center ${
                  activeTab === tab
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-900 dark:bg-yellow-400 rounded-t" />
                )}
              </button>
            ))}

            <Link
              href="/dashboard/hind-visuals"
              className="h-full px-3 text-xs font-bold tracking-wider transition-all flex items-center space-x-1.5 text-yellow-600 dark:text-yellow-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-400/10"
              title="Open Knowledge Graph & Cloud Analytics (3 Windows)"
            >
              <Network className="w-3.5 h-3.5" />
              <span>HIND VISUALS</span>
            </Link>
          </nav>
        </div>

        {/* Right: Search, Theme Toggle, New Ticket & Profile */}
        <div className="flex items-center space-x-3">
          {/* New Ticket Quick Button */}
          <button
            onClick={onOpenNewTicket}
            className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Ticket</span>
          </button>

          {/* Global Hindsight Search Bar */}
          <div className="relative w-48 sm:w-64 lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Search Hindsight Memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs font-medium rounded-lg bg-slate-100 dark:bg-[#181822] border border-slate-200 dark:border-[#2a2a3a] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors"
            />
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={handleToggle}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#2a2a3a] bg-slate-100 dark:bg-[#181822] text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs group"
            title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <Sun className="w-4.5 h-4.5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300 ease-out" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-slate-800 dark:text-zinc-200 group-hover:-rotate-12 transition-transform duration-300 ease-out" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2a2a3a] bg-slate-100/70 dark:bg-[#181822] hover:bg-slate-200 dark:hover:bg-[#20202e] text-slate-900 dark:text-zinc-200 text-xs transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-500/40 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-black text-xs">
                {user.name ? user.name.charAt(0) : "A"}
              </div>
              <div className="text-left hidden md:block">
                <p className="font-bold text-xs leading-none text-slate-900 dark:text-white truncate max-w-[110px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-none mt-1 truncate max-w-[110px]">
                  {user.company_name}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2e2e3e] shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-zinc-800">
                  <p className="font-bold text-sm text-slate-900 dark:text-zinc-100">{user.name}</p>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs truncate mt-0.5">{user.email}</p>
                  <div className="mt-2 flex items-center space-x-1.5 text-xs text-yellow-600 dark:text-yellow-400 font-semibold bg-yellow-400/10 px-2 py-1 rounded">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.company_name}</span>
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center space-x-2 font-medium"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Edit Profile & Company</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("SETTINGS");
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center space-x-2 font-medium"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span>Agent & Hindsight Settings</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-zinc-800 my-1" />

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center space-x-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2e2e3e] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Account & Organization Settings
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Engineer Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg bg-slate-100 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Organization / Company
                </label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full h-10 px-3 text-sm rounded-lg bg-slate-100 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-1">
                  Email (Account Identifier)
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full h-10 px-3 text-sm rounded-lg bg-slate-100/50 dark:bg-[#121217]/50 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
