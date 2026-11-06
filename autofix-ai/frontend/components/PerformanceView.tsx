"use client";

import React from "react";
import {
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Ticket } from "../types/ticket";

interface PerformanceViewProps {
  tickets: Ticket[];
}

export const PerformanceView: React.FC<PerformanceViewProps> = ({ tickets }) => {
  const total = tickets.length;
  const autonomous = tickets.filter((t) => t.status === "RESOLVED_AUTONOMOUSLY").length;
  const humanVerified = tickets.filter((t) => t.status === "RESOLVED_HUMAN_VERIFIED").length;
  const pending = tickets.filter((t) => t.status === "PENDING_HUMAN_REVIEW").length;
  const autoRate = total > 0 ? Math.round((autonomous / total) * 100) : 0;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0e0e13] p-8 overflow-y-auto select-none transition-colors">
      <div className="max-w-5xl mx-auto space-y-7">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-yellow-500" />
            <span>Agent Performance & Self-Healing Telemetry</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Real-time analytics measuring Vectorize Hindsight recall precision, MTTR reduction, and autonomous self-healing progression.
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Autonomous Rate</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{autoRate}%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% this month</span>
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Avg Resolution MTTR</span>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">42s</div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
              Down from 38m manual queue
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Hindsight Recall Latency</span>
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">18ms</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1.5">
              Vector parallel multi-search
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out">
            <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 mb-2">
              <span className="text-xs uppercase font-bold tracking-wider">Human-Verified Loops</span>
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{humanVerified}</div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
              Continuous knowledge ingestion
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="rounded-2xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#262635] p-6 space-y-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Knowledge Progression & Resolution Breakdown
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1.5">
                <span>Autonomous Resolutions ({autonomous} tickets)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{autoRate}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${autoRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1.5">
                <span>Human-Verified Resolutions ({humanVerified} tickets)</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {total > 0 ? Math.round((humanVerified / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (humanVerified / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-700 dark:text-zinc-300 font-semibold mb-1.5">
                <span>Pending Human Review ({pending} tickets)</span>
                <span className="text-amber-600 dark:text-yellow-400 font-bold">
                  {total > 0 ? Math.round((pending / total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
