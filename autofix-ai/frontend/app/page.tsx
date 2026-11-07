"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Brain,
  Camera,
  Building2,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function LandingPage() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white selection:bg-yellow-400 selection:text-black font-sans antialiased transition-colors duration-200">
      {/* Top Header — Aligned to the corners on both ends (w-full edge-to-edge) */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/85 dark:bg-black/85 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="w-full px-6 sm:px-10 lg:px-14 h-20 sm:h-24 flex items-center justify-between">
          {/* Left Corner: Brand Logo & Title */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/20 bg-slate-100 dark:bg-white/5 flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform duration-200">
              <img src="/symbol.png" alt="Autofix-AI Symbol" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-black text-xl sm:text-2xl tracking-widest uppercase text-slate-950 dark:text-white">
                AUTOFIX<span className="text-yellow-500">.AI</span>
              </span>
            </div>
          </Link>

          {/* Right Corner: Theme Toggle, Sign In, and Console Launch Buttons */}
          <div className="flex items-center space-x-3.5 sm:space-x-5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xs group"
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300 ease-out" />
              ) : (
                <Moon className="w-5 h-5 text-slate-800 dark:text-zinc-200 group-hover:-rotate-12 transition-transform duration-300 ease-out" />
              )}
            </button>

            <Link
              href="/how-it-works"
              className="px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all"
            >
              How It Works
            </Link>

            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all hover:scale-105"
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-slate-950 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section — Scaled ~125% at 100% zoom for bold, commanding visual presence */}
      <main className="max-w-6xl mx-auto px-6 sm:px-10 pt-24 pb-28 text-center">
        {/* Technology Pill Badge */}
        <div className="inline-flex items-center space-x-2.5 px-5 py-2 rounded-full border border-slate-300 dark:border-white/20 bg-white dark:bg-white/5 text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider mb-10 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Vectorize Hindsight Persistent Memory &bull; Groq Multimodal Vision</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-slate-950 dark:text-white max-w-5xl mx-auto leading-[1.08] sm:leading-[1.1]">
          Self-Healing L1/L2 IT Support. <br />
          <span className="text-slate-400 dark:text-zinc-500">Never Solves the Same Incident Twice.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-8 text-lg sm:text-2xl text-slate-600 dark:text-zinc-300 max-w-3xl mx-auto leading-relaxed font-normal">
          Autofix-AI deploys alongside your enterprise service desk. When an engineer verifies an L1/L2 remediation, it is permanently retained into Hindsight memory. Future identical incidents are diagnosed and resolved autonomously in under 60 seconds.
        </p>

        {/* Prominent Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-zinc-200 transition-all duration-200 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 text-sm sm:text-base font-extrabold uppercase tracking-wider"
          >
            <span>Open Ticketing Console</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-10 py-5 rounded-2xl border-2 border-slate-300 dark:border-white/20 bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-900 dark:text-zinc-200 transition-all duration-200 flex items-center justify-center space-x-3 text-sm sm:text-base font-extrabold uppercase tracking-wider hover:scale-105 active:scale-95 shadow-sm"
          >
            <Building2 className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
            <span>Company Sign In (Demo)</span>
          </Link>
        </div>

        {/* Default Testing Credentials Banner */}
        <div className="mt-10 inline-block p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 text-sm sm:text-base text-slate-700 dark:text-zinc-400 shadow-sm transition-all hover:border-yellow-400/50">
          <span className="font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">Default Testing Credentials: </span>
          <span className="ml-1.5 font-medium">
            Email: <code className="text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">admin@autofix.ai</code> | Password:{" "}
            <code className="text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">password123</code>
          </span>
        </div>

        {/* Official Brand Symbol & Title Showcase */}
        <div className="mt-14 max-w-xl mx-auto rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-md transition-all duration-200 hover:shadow-2xl hover:scale-[1.01]">
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl bg-slate-100/80 dark:bg-[#121218] border border-slate-200/80 dark:border-zinc-800/80 transition-colors">
            <img
              src="/symbol.png"
              alt="Autofix-AI Official Symbol"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
            <div className="text-center mt-5 space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Autofix<span className="text-yellow-500">-AI</span>
              </h2>
              <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-zinc-400">
                Self-Healing Operations Platform
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 text-center mt-4 font-bold uppercase tracking-wider">
            Autofix-AI &bull; Self-Healing IT Operations Engine
          </p>
        </div>

        {/* Minimalist 3-Column Features (Generously Sized) */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950/60 space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 ease-out">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white">Multimodal Vision OCR</h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
              Upload photos of bluescreens, stack traces, and modal alerts. Groq vision models synthesize normalized error signatures.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950/60 space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 ease-out">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500" />
            </div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white">Hindsight Persistent Memory</h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
              Every resolved incident updates the vector memory bank. Retrieval combines semantic search, BM25, and entity linking.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-zinc-800/90 bg-white dark:bg-zinc-950/60 space-y-4 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 ease-out">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-950 dark:text-white">Human-In-The-Loop Barrier</h3>
            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
              Tickets below 85% confidence require engineer verification before execution, preventing data poisoning and hallucinations.
            </p>
          </div>
        </div>

        {/* Step-by-Step Architecture Section */}
        <div className="mt-28 border-t border-slate-200 dark:border-zinc-800 pt-20 text-left">
          <h2 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white text-center mb-14 tracking-tight">
            Self-Healing IT Support Workflow
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="p-7 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150">
              <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs sm:text-sm uppercase font-black">Step 01</span>
              <p className="font-extrabold text-lg text-slate-950 dark:text-white mt-1.5 mb-2">Ticket Ingestion</p>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">User raises ticket with text description and optional error screenshot.</p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150">
              <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs sm:text-sm uppercase font-black">Step 02</span>
              <p className="font-extrabold text-lg text-slate-950 dark:text-white mt-1.5 mb-2">Vision OCR & Signature</p>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">Error trace and traceback strings are normalized into a unified signature.</p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150">
              <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs sm:text-sm uppercase font-black">Step 03</span>
              <p className="font-extrabold text-lg text-slate-950 dark:text-white mt-1.5 mb-2">Hindsight Vector Recall</p>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">Agent checks memory with 85% decision gate for autonomous execution.</p>
            </div>

            <div className="p-7 rounded-2xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-150">
              <span className="text-slate-400 dark:text-zinc-500 font-mono text-xs sm:text-sm uppercase font-black">Step 04</span>
              <p className="font-extrabold text-lg text-slate-950 dark:text-white mt-1.5 mb-2">Self-Healing Memory Loop</p>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">Autonomous or human fix is permanently retained into Hindsight.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-900 py-12 text-center text-sm sm:text-base text-slate-500 dark:text-zinc-500">
        <p>Autofix-AI &bull; Self-Healing L1/L2 IT Support Agent with Hindsight Memory &bull; Promo Code: MEMHACK99</p>
      </footer>
    </div>
  );
}
