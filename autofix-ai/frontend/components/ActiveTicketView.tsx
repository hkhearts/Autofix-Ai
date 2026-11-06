"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Send,
  CheckCircle,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Lightbulb,
  FileSearch,
  Upload,
} from "lucide-react";
import { Ticket, UserSession } from "../types/ticket";
import { FileUpload } from "./FileUpload";
import axios from "axios";

interface ActiveTicketViewProps {
  ticket: Ticket | null;
  apiUrl: string;
  user: UserSession;
  onTicketUpdated: (updatedTicket: Ticket) => void;
}

export const ActiveTicketView: React.FC<ActiveTicketViewProps> = ({
  ticket,
  apiUrl,
  user,
  onTicketUpdated,
}) => {
  const [replyText, setReplyText] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);

  // When ticket changes, pre-fill resolution text if pending
  useEffect(() => {
    if (ticket && ticket.status === "PENDING_HUMAN_REVIEW" && ticket.resolution_steps && !replyText) {
      setReplyText(ticket.resolution_steps);
    }
  }, [ticket?.id]);

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0e0e13] text-slate-400 dark:text-zinc-500 p-8 text-center select-none">
        <FileSearch className="w-14 h-14 mb-3 opacity-40 text-yellow-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">
          No Ticket Selected
        </h3>
        <p className="text-sm mt-1.5 max-w-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          Select a ticket from the left stream to inspect visual telemetry, Hindsight memory patterns, and execute resolutions.
        </p>
      </div>
    );
  }

  const isCritical = ticket.priority === "Critical";
  const isPendingReview = ticket.status === "PENDING_HUMAN_REVIEW";
  const guidance = ticket.diagnostic_insights;

  // Upload & Analyze attached screenshot immediately
  const handleUploadScreenshot = async () => {
    if (!screenshotFile) return;
    setIsUploadingScreenshot(true);
    try {
      const formData = new FormData();
      formData.append("file", screenshotFile);

      const res = await axios.post(`${apiUrl}/api/tickets/${ticket.id}/upload-screenshot`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onTicketUpdated(res.data);
      setScreenshotFile(null);
    } catch (e) {
      console.error("Failed to upload screenshot", e);
    } finally {
      setIsUploadingScreenshot(false);
    }
  };

  // Send human reply (optionally with attached screenshot)
  const handleSendReply = async () => {
    if (!replyText.trim() && !screenshotFile) return;
    setIsSubmitting(true);

    try {
      // If a screenshot was attached, upload it first
      if (screenshotFile) {
        const formData = new FormData();
        formData.append("file", screenshotFile);
        const resScreenshot = await axios.post(
          `${apiUrl}/api/tickets/${ticket.id}/upload-screenshot`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        onTicketUpdated(resScreenshot.data);
        setScreenshotFile(null);
      }

      if (replyText.trim()) {
        const res = await axios.post(`${apiUrl}/api/tickets/${ticket.id}/reply`, {
          sender: user.name,
          role: "engineer",
          content: replyText,
        });
        onTicketUpdated(res.data);
        setReplyText("");
      }
    } catch (e) {
      console.error("Failed to post reply", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Human-in-the-loop Approve & Solve Hook
  const handleApproveAndSolve = async () => {
    const stepsToRun =
      replyText.trim() ||
      ticket.resolution_steps ||
      guidance?.recommended_solution ||
      "1. Verified service connectivity and health probes.\n2. Invalidate stale authentication cache.\n3. Test and confirm resolved.";

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${apiUrl}/api/tickets/${ticket.id}/feedback`, {
        resolution_steps: stepsToRun,
        approved_by: user.name,
        notes: "Verified and approved by Lead Engineer via Console",
      });
      onTicketUpdated(res.data);
      setReplyText("");
    } catch (e) {
      console.error("Failed to approve ticket", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Ticket Status
  const handleStatusChange = async (newStatus: string) => {
    setShowStatusMenu(false);
    setIsSubmitting(true);
    try {
      const res = await axios.patch(`${apiUrl}/api/tickets/${ticket.id}/status`, {
        status: newStatus,
        updated_by: user.name,
      });
      onTicketUpdated(res.data);
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplySolution = () => {
    if (guidance?.recommended_solution) {
      setReplyText(guidance.recommended_solution);
      setCopiedSolution(true);
      setTimeout(() => setCopiedSolution(false), 2000);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-[#0e0e13] flex flex-col h-[calc(100vh-4rem)] overflow-y-auto select-none transition-colors">
      {/* Top Banner: ACTIVE TICKET: #123 | Title | Client: Jane Doe | Priority: Critical */}
      <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#14141a] flex items-center justify-between shrink-0 sticky top-0 z-10 transition-colors shadow-2xs">
        <div className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate flex items-center space-x-2.5">
          <span className="text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-xs">
            ACTIVE TICKET:
          </span>
          <span className="text-slate-950 dark:text-white font-extrabold text-base">
            #{ticket.id.replace("TICKET-", "")}
          </span>
          <span className="text-slate-300 dark:text-zinc-600">|</span>
          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate max-w-sm sm:max-w-md text-sm">
            {ticket.title}
          </span>
          <span className="text-slate-300 dark:text-zinc-600 hidden md:inline">|</span>
          <span className="text-slate-400 dark:text-zinc-500 hidden md:inline text-xs uppercase font-medium">
            Client:
          </span>
          <span className="text-slate-900 dark:text-zinc-200 font-bold hidden md:inline text-sm">
            {ticket.client_name}
          </span>
          <span className="text-slate-300 dark:text-zinc-600">|</span>
          <span className="text-slate-400 dark:text-zinc-500 text-xs uppercase font-medium">
            Priority:
          </span>
          <span
            className={`font-extrabold text-xs px-2 py-0.5 rounded ${
              isCritical
                ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                : "bg-amber-500/15 text-amber-600 dark:text-yellow-400 border border-amber-500/30"
            }`}
          >
            {ticket.priority}
          </span>
        </div>

        {/* Status Badge */}
        <div className="shrink-0 ml-4">
          {ticket.status === "RESOLVED_AUTONOMOUSLY" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RESOLVED AUTONOMOUSLY</span>
            </span>
          ) : ticket.status === "RESOLVED_HUMAN_VERIFIED" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HUMAN VERIFIED</span>
            </span>
          ) : ticket.status === "IN_PROGRESS" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 flex items-center space-x-1.5">
              <span>IN PROGRESS</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border border-yellow-500/40 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>PENDING HUMAN REVIEW</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* SECTION 1: ISSUE DESCRIPTION & VISUAL TELEMETRY */}
        <div className="rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#242432] p-5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
            </div>
            <span>
              ISSUE DESCRIPTION ({ticket.client_name} · Tier {ticket.category})
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-900 dark:text-zinc-100 leading-relaxed font-normal whitespace-pre-line pl-8">
            {ticket.description}
          </p>

          {/* Screenshot Telemetry Preview */}
          {ticket.screenshot_preview && (
            <div className="mt-4 pl-8">
              <p className="text-xs uppercase font-extrabold text-yellow-600 dark:text-yellow-400 mb-2 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Uploaded Error Screenshot & OCR Telemetry</span>
              </p>
              <div className="inline-block rounded-xl border border-yellow-500/40 p-2 bg-black/5 dark:bg-black/50 shadow-xs">
                <img
                  src={ticket.screenshot_preview}
                  alt="Error Screenshot"
                  className="max-h-72 rounded-lg object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: DYNAMIC HINDSIGHT INTELLIGENCE & PATTERN-MATCHED GUIDANCE */}
        <div className="rounded-xl bg-white dark:bg-[#16161e] border-2 border-yellow-500/40 dark:border-yellow-500/40 overflow-hidden shadow-xs">
          <button
            onClick={() => setSuggestionsOpen(!suggestionsOpen)}
            className="w-full p-4 flex items-center justify-between text-left bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors border-b border-yellow-500/20"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 flex items-center justify-center font-black">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  AGENT SUGGESTIONS (Hindsight Memory-Based)
                </h3>
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mt-0.5">
                  {guidance?.matched_pattern_title || `Matched Signature: ${ticket.error_signature}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-yellow-400/25 border border-yellow-500/40 text-yellow-900 dark:text-yellow-300 font-extrabold text-xs shadow-2xs">
                <span>{(ticket.confidence_score * 100).toFixed(0)}% Vector Match</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ease-out ${
                  suggestionsOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {suggestionsOpen && (
            <div className="p-5 space-y-4 text-sm bg-slate-50/70 dark:bg-[#121219]">
              {/* Error Signature & Root Cause */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-zinc-800">
                  <p className="text-xs uppercase font-extrabold text-slate-500 dark:text-zinc-400 mb-1.5">
                    Normalized Error Signature
                  </p>
                  <code className="text-xs sm:text-sm font-mono font-bold text-yellow-600 dark:text-yellow-400 break-all">
                    {ticket.error_signature}
                  </code>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-zinc-800">
                  <p className="text-xs uppercase font-extrabold text-slate-500 dark:text-zinc-400 mb-1.5">
                    Diagnostic Root Cause Analysis
                  </p>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-normal">
                    {guidance?.root_cause_analysis || "Correlated with enterprise diagnostic runbook telemetry."}
                  </p>
                </div>
              </div>

              {/* Actionable Recommended Solution */}
              <div className="p-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 dark:bg-yellow-500/10">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-400 font-extrabold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    <span>Recommended Step-by-Step Remediation Protocol</span>
                  </div>

                  {guidance?.recommended_solution && (
                    <button
                      onClick={handleApplySolution}
                      className="px-3 py-1 rounded-md bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-2xs"
                    >
                      {copiedSolution ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSolution ? "Applied to Response!" : "Apply to Response"}</span>
                    </button>
                  )}
                </div>

                <div className="text-sm font-mono text-slate-900 dark:text-zinc-100 whitespace-pre-line leading-relaxed bg-white dark:bg-black/40 p-4 rounded-lg border border-yellow-500/30 font-medium">
                  {guidance?.recommended_solution || ticket.resolution_steps || "No historical resolution recorded yet."}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: AGENT REPLIES & CONVERSATION THREAD */}
        <div className="rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#242432] p-5 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-3.5">
            <div className="w-6 h-6 rounded-full bg-yellow-400/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span>AGENT REPLIES (Hindsight Agent Conversation Stream)</span>
          </div>

          <div className="space-y-3.5 pl-8">
            {ticket.messages.length > 0 ? (
              ticket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl text-sm sm:text-base leading-relaxed border ${
                    m.role === "agent"
                      ? "bg-yellow-500/5 dark:bg-yellow-500/5 border-yellow-500/20 text-slate-900 dark:text-zinc-100"
                      : m.role === "engineer"
                      ? "bg-blue-500/5 dark:bg-blue-500/5 border-blue-500/20 text-slate-900 dark:text-zinc-100"
                      : "bg-slate-100/70 dark:bg-[#13131a] border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
                      {m.sender}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="whitespace-pre-line font-medium text-sm leading-relaxed">
                    {m.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 dark:text-zinc-500 italic">No agent conversation recorded.</p>
            )}
          </div>
        </div>

        {/* SECTION 4: SIMULATED EXECUTION TERMINAL (If resolved) */}
        {ticket.execution_result && (
          <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-5 font-mono text-xs shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Terminal className="w-4 h-4" />
                <span>AUTONOMOUS REMEDIATION TRACE ({ticket.execution_result.execution_time_ms}ms)</span>
              </div>
              <span className="text-xs text-zinc-400">Exit Status: 0 (OK)</span>
            </div>

            <div className="bg-black/70 p-4 rounded-lg border border-zinc-800 space-y-1.5 text-zinc-300 overflow-x-auto max-h-56 overflow-y-auto leading-relaxed">
              {ticket.execution_result.simulated_output.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.startsWith("[EXEC]")
                      ? "text-yellow-300 font-semibold"
                      : line.startsWith("[OK]") || line.startsWith("[VERIFY]")
                      ? "text-emerald-400 font-bold"
                      : "text-zinc-400"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: RESPONSE COMPOSER & ACTION BAR */}
        <div className="rounded-xl bg-white dark:bg-[#16161e] border border-slate-200 dark:border-[#242432] p-5 space-y-4 shadow-2xs">
          {/* Rich Text Toolbar */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 dark:border-zinc-800 pb-2.5 text-slate-500 dark:text-zinc-400">
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Bold">
              <Bold className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Italic">
              <Italic className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Underline">
              <Underline className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Strikethrough">
              <Strikethrough className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-slate-200 dark:bg-zinc-800 mx-1.5" />
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Bullet List">
              <List className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Numbered List">
              <ListOrdered className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Add Link">
              <LinkIcon className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Insert Image">
              <ImageIcon className="w-4 h-4" />
            </button>
            <span className="w-px h-4 bg-slate-200 dark:bg-zinc-800 mx-1.5" />
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Undo">
              <Undo className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white" title="Redo">
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Text Area */}
          <textarea
            rows={4}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={
              isPendingReview
                ? "Enter or review the verified remediation steps to approve and self-heal, or type a reply..."
                : "Compose your response..."
            }
            className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-3.5 text-sm sm:text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400 font-normal leading-relaxed"
          />

          {/* ADD SCREENSHOT AREA (Yellow Dashed Box matching reference UI) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                ADD SCREENSHOT (OPTIONAL TELEMETRY)
              </label>
              {screenshotFile && (
                <button
                  type="button"
                  onClick={handleUploadScreenshot}
                  disabled={isUploadingScreenshot}
                  className="px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingScreenshot ? "Analyzing OCR..." : "Analyze Telemetry Now"}</span>
                </button>
              )}
            </div>

            <FileUpload
              onFileSelect={(file) => setScreenshotFile(file)}
              selectedFile={screenshotFile}
            />
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            {/* SEND REPLY Button */}
            <button
              onClick={handleSendReply}
              disabled={isSubmitting || (!replyText.trim() && !screenshotFile)}
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 ease-out hover:scale-102 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 shadow-xs hover:shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>SEND REPLY</span>
            </button>

            {/* UPDATE STATUS Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#1f1f28] dark:hover:bg-[#282834] text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-[#303040] hover:border-slate-400 dark:hover:border-zinc-500 font-semibold text-xs tracking-wider transition-all duration-200 ease-out hover:scale-102 active:scale-98 flex items-center space-x-1.5 shadow-2xs"
              >
                <span>UPDATE STATUS ({ticket.status.replace(/_/g, " ")})</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    showStatusMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 bottom-full mb-1.5 w-60 rounded-xl bg-white dark:bg-[#181824] border border-slate-200 dark:border-[#2e2e3e] shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-500 mb-1.5 px-2">
                    Set Ticket Status
                  </p>
                  {[
                    { key: "PENDING_HUMAN_REVIEW", label: "Pending Human Review" },
                    { key: "IN_PROGRESS", label: "In Progress" },
                    { key: "RESOLVED_AUTONOMOUSLY", label: "Resolved Autonomously" },
                    { key: "RESOLVED_HUMAN_VERIFIED", label: "Resolved (Human Verified)" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleStatusChange(s.key)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs mb-0.5 font-medium hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors duration-150"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* APPROVE & SOLVE Button (When Pending Review) */}
            {isPendingReview && (
              <button
                onClick={handleApproveAndSolve}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 ease-out hover:scale-105 active:scale-95 shadow hover:shadow-lg shadow-yellow-500/20 flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                <span>APPROVE & SOLVE (HUMAN IN LOOP)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
