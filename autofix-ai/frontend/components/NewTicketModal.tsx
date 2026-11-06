"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertTriangle, Send } from "lucide-react";
import { FileUpload } from "./FileUpload";
import axios from "axios";
import { Ticket } from "../types/ticket";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
  onTicketCreated: (ticket: Ticket) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  apiUrl,
  onTicketCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("Jane Doe");
  const [priority, setPriority] = useState<"Critical" | "High" | "Medium" | "Low">("Critical");
  const [category, setCategory] = useState<"L1" | "L2">("L1");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg("Please provide both ticket title and description.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("client_name", clientName);
      formData.append("priority", priority);
      formData.append("category", category);
      formData.append("company_id", "acme-corp");
      if (screenshot) {
        formData.append("file", screenshot);
      }

      const res = await axios.post(`${apiUrl}/api/tickets`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onTicketCreated(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to submit ticket. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#181822] border border-slate-200 dark:border-[#2e2e3e] shadow-2xl overflow-hidden text-sm animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              Create IT Support Ticket
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Ticket Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Unable to access Salesforce - SAML timeout 401"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Client / User
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Support Tier
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white"
              >
                <option value="L1">L1 Support</option>
                <option value="L2">L2 Support</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Issue Description & Symptoms *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the failure, affected service, error code, and user workflow..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
              Upload Error Screenshot (Groq Multimodal OCR)
            </label>
            <FileUpload
              onFileSelect={(file) => setScreenshot(file)}
              selectedFile={screenshot}
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold uppercase tracking-wider text-xs flex items-center space-x-2 transition-all shadow hover:shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Ingesting & Analyzing..." : "Submit Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
