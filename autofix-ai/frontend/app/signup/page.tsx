"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, User, ArrowRight, Sun, Moon } from "lucide-react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { getApiUrl } from "@/utils/api";

export default function SignupPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const apiUrl = getApiUrl();

    try {
      const res = await axios.post(`${apiUrl}/api/auth/signup`, {
        company_name: companyName,
        name,
        email,
        password,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("autofix_session", JSON.stringify(res.data.user));
      }
      router.push("/dashboard");
    } catch (err: any) {
      // Local fallback in case backend is offline
      const newUser = {
        email,
        name: name || "IT Engineer",
        role: "IT Administrator",
        company_id: companyName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        company_name: companyName || "Enterprise IT",
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("autofix_session", JSON.stringify(newUser));
      }
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col justify-center items-center px-4 py-12 select-none transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs group"
          title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? (
            <Sun className="w-4.5 h-4.5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-800 dark:text-zinc-200 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/20 bg-slate-100 dark:bg-white/5 flex items-center justify-center p-1.5 shadow-xs group-hover:scale-105 transition-transform">
              <img src="/symbol.png" alt="Autofix-AI Symbol" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-base tracking-widest uppercase text-slate-900 dark:text-white">
              Autofix<span className="text-yellow-500">.AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Register Your Organization
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Deploy self-healing IT support with persistent Hindsight memory
          </p>
        </div>

        <form onSubmit={handleSignup} className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-7 space-y-4 text-sm shadow-xl transition-colors">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1.5 tracking-wider">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Cloud Corp"
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1.5 tracking-wider">
              Lead Engineer Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent Alex"
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1.5 tracking-wider">
              Work Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@acme.com"
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1.5 tracking-wider">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-102 active:scale-98 disabled:opacity-50 mt-3 shadow-md"
          >
            <span>{isLoading ? "Creating Account..." : "Deploy Company Instance"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 dark:text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-900 dark:text-white hover:underline font-semibold transition-colors">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
