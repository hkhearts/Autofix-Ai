"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import {
  Network,
  Share2,
  Database,
  Cloud,
  Server,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ShieldCheck,
  Activity,
  BarChart3,
  PieChart,
  Layers,
  Cpu,
  FileText,
  Terminal,
  Folder,
  FolderOpen,
  X,
  Search,
  Zap,
} from "lucide-react";
import { getApiUrl } from "@/utils/api";

interface GraphNode {
  id: string;
  label: string;
  node_type: "ticket" | "category" | "signature" | "resolution";
  properties: Record<string, any>;
  source: string;
  created_at: string;
}

interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship: string;
  weight: number;
  properties?: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: Record<string, any>;
  cloud_status?: string;
  bank_status?: string;
  cloud_mode_enabled?: boolean;
}

interface TreeCategory {
  category: string;
  icon: string;
  total_tickets: number;
  signatures: {
    signature: string;
    ticket_count: number;
    tickets: {
      id: string;
      title: string;
      status: string;
      priority: string;
      confidence: number;
      resolution: string;
      source: string;
      created_at: string;
    }[];
  }[];
}

interface AnalyticsData {
  confidence_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  total_nodes: number;
  total_edges: number;
  total_tickets: number;
  cloud_status?: string;
  bank_status?: string;
  cloud_mode_enabled?: boolean;
  is_cloud_connected?: boolean;
}

export default function HindVisualsPage() {
  const apiUrl = getApiUrl();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [treeData, setTreeData] = useState<TreeCategory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cloudMode, setCloudMode] = useState(true);
  const [isTogglingCloud, setIsTogglingCloud] = useState(false);

  // Active Windows Tab or Layout mode
  const [activeWindowTab, setActiveWindowTab] = useState<"all" | "graph" | "tree" | "dashboard">("all");

  // Graph interaction state
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [graphSearch, setGraphSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Tree expansion state
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Client Applications & Workplace": true,
    "Identity, SSO & Access": true,
  });
  const [openSignatures, setOpenSignatures] = useState<Record<string, boolean>>({});

  // Fetch all visual data
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [graphRes, treeRes, analyticsRes] = await Promise.all([
        axios.get(`${apiUrl}/api/knowledge/graph`),
        axios.get(`${apiUrl}/api/knowledge/tree`),
        axios.get(`${apiUrl}/api/knowledge/analytics`),
      ]);

      setGraphData(graphRes.data);
      setTreeData(treeRes.data);
      setAnalytics(analyticsRes.data);

      if (analyticsRes.data.cloud_mode_enabled !== undefined) {
        setCloudMode(analyticsRes.data.cloud_mode_enabled);
      }
    } catch (e) {
      console.error("Error loading Hind-Visuals data", e);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Toggle Cloud Memory Mode
  const handleToggleCloud = async () => {
    setIsTogglingCloud(true);
    try {
      const res = await axios.post(`${apiUrl}/api/memory/toggle-cloud-mode`, {
        enabled: !cloudMode,
      });
      setCloudMode(res.data.cloud_mode_enabled);
      fetchData();
    } catch (e) {
      console.error("Failed to toggle cloud mode", e);
    } finally {
      setIsTogglingCloud(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleSignature = (sig: string) => {
    setOpenSignatures((prev) => ({ ...prev, [sig]: !prev[sig] }));
  };

  // Filtered nodes for the interactive graph
  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes) return [];
    return graphData.nodes.filter((node) => {
      const matchesType = filterType === "ALL" || node.node_type === filterType.toLowerCase();
      const matchesSearch =
        !graphSearch.trim() ||
        node.label.toLowerCase().includes(graphSearch.toLowerCase()) ||
        node.id.toLowerCase().includes(graphSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [graphData?.nodes, filterType, graphSearch]);

  // Build mapped positions for the visual graph
  const positionedNodes = useMemo(() => {
    if (!filteredNodes.length) return [];

    // Group by node type for categorized cluster arrangement
    const groups: Record<string, GraphNode[]> = {
      category: [],
      signature: [],
      ticket: [],
      resolution: [],
    };

    filteredNodes.forEach((n) => {
      if (groups[n.node_type]) groups[n.node_type].push(n);
      else groups.ticket.push(n);
    });

    const positions: { node: GraphNode; x: number; y: number }[] = [];
    const width = 900;
    const height = 550;

    // 1. Categories at the center/top arc
    const catCount = Math.max(groups.category.length, 1);
    groups.category.forEach((n, idx) => {
      const x = width * 0.15 + (idx * (width * 0.7)) / Math.max(catCount - 1, 1);
      const y = 90;
      positions.push({ node: n, x, y });
    });

    // 2. Signatures in the upper middle layer
    const sigCount = Math.max(groups.signature.length, 1);
    groups.signature.forEach((n, idx) => {
      const x = 80 + (idx * (width - 160)) / Math.max(sigCount - 1, 1);
      const y = 210;
      positions.push({ node: n, x, y });
    });

    // 3. Tickets in the lower middle layer (Dynamically spaced)
    const tickCount = Math.max(groups.ticket.length, 1);
    groups.ticket.forEach((n, idx) => {
      const row = Math.floor(idx / 8);
      const col = idx % 8;
      const x = 70 + (col * (width - 140)) / Math.max(Math.min(tickCount, 8) - 1, 1);
      const y = 330 + row * 85;
      positions.push({ node: n, x, y });
    });

    // 4. Resolutions in the bottom layer
    const resCount = Math.max(groups.resolution.length, 1);
    groups.resolution.forEach((n, idx) => {
      const x = 100 + (idx * (width - 200)) / Math.max(resCount - 1, 1);
      const y = 475;
      positions.push({ node: n, x, y });
    });

    return positions;
  }, [filteredNodes]);

  // Positions dictionary for drawing edges
  const positionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    positionedNodes.forEach((p) => map.set(p.node.id, { x: p.x, y: p.y }));
    return map;
  }, [positionedNodes]);

  // Edges connecting currently positioned nodes
  const visibleEdges = useMemo(() => {
    if (!graphData?.edges) return [];
    return graphData.edges.filter((e) => positionMap.has(e.source_id) && positionMap.has(e.target_id));
  }, [graphData?.edges, positionMap]);

  const cloudStatusText = analytics?.cloud_status || (cloudMode ? "Online" : "Offline");
  const bankStatusText = analytics?.bank_status || "Online";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0b10] text-slate-900 dark:text-zinc-100 flex flex-col select-none transition-colors">
      {/* Top Header Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-[#22222e] bg-white dark:bg-[#121218] px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors flex items-center space-x-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-extrabold">
              <Network className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
                HINDSIGHT CLOUD & KNOWLEDGE BANK
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Live Knowledge Graph &bull; Hierarchical Taxonomy &bull; Telemetry Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center space-x-3">
          {/* Cloud Memory Status */}
          <div
            className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center space-x-2 shadow-2xs ${
              cloudStatusText === "Online"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-yellow-500" />
            <span
              className={`w-2 h-2 rounded-full ${
                cloudStatusText === "Online" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span>Cloud Memory: {cloudStatusText}</span>
          </div>

          {/* SQLite Bank Status */}
          <div className="px-3 py-1 rounded-lg border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-bold flex items-center space-x-2 shadow-2xs">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Bank: {bankStatusText} ({analytics?.total_nodes || 0} nodes)</span>
          </div>

          {/* Quick Cloud Toggle */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#161622] text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 hidden md:inline">
              Cloud Toggle:
            </span>
            <button
              onClick={handleToggleCloud}
              disabled={isTogglingCloud}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                cloudMode ? "bg-yellow-400" : "bg-slate-300 dark:bg-zinc-700"
              }`}
              title={cloudMode ? "Disable Cloud (test fallback)" : "Enable Cloud"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  cloudMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            title="Refresh Knowledge Graph & Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-yellow-500" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Container: 3 Windows Grid */}
      <div className="flex-1 p-5 space-y-5 overflow-y-auto">
        {/* Navigation / Window View Pills */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#22222e] pb-3">
          <div className="flex items-center space-x-2">
            {[
              { id: "all", label: "3-Windows View", icon: Layers },
              { id: "graph", label: "Window 1: Knowledge Graph", icon: Network },
              { id: "tree", label: "Window 2: Knowledge Tree", icon: FolderOpen },
              { id: "dashboard", label: "Window 3: Cloud Dashboard", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWindowTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all ${
                    activeWindowTab === tab.id
                      ? "bg-yellow-400 text-slate-950 shadow-xs"
                      : "bg-slate-100 dark:bg-[#181822] border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Dual Sync Engine Active: Cloud &bull; SQLite Fallback Bank</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* WINDOW 1: INTERACTIVE KNOWLEDGE GRAPH                          */}
        {/* ============================================================== */}
        {(activeWindowTab === "all" || activeWindowTab === "graph") && (
          <div className="rounded-2xl bg-white dark:bg-[#14141c] border border-slate-200 dark:border-[#262635] shadow-xs overflow-hidden flex flex-col">
            {/* Window Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#262635] flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#171722]">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    WINDOW 1: INTERACTIVE KNOWLEDGE GRAPH (LIVE MEMORY NODES)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Directed semantic links between Categories, Error Signatures, Raised Tickets, and Runbooks
                  </p>
                </div>
              </div>

              {/* Controls: Search, Filter, Zoom */}
              <div className="flex items-center space-x-2">
                {/* Search Bar */}
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search graph..."
                    value={graphSearch}
                    onChange={(e) => setGraphSearch(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>

                {/* Filter by Node Type */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white dark:bg-[#1a1a26] border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="ALL">All Nodes</option>
                  <option value="TICKET">Tickets Only</option>
                  <option value="SIGNATURE">Signatures Only</option>
                  <option value="CATEGORY">Categories Only</option>
                  <option value="RESOLUTION">Resolutions Only</option>
                </select>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-1 border border-slate-200 dark:border-zinc-800 rounded-lg p-0.5 bg-white dark:bg-[#1a1a26]">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.0))}
                    className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.6))}
                    className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1.0)}
                    className="p-1 rounded text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas / SVG Area */}
            <div className="relative h-[480px] bg-slate-900/95 dark:bg-[#0c0c12] overflow-hidden flex items-center justify-center">
              {/* Dot Grid Background */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(#facc15 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div
                className="w-full h-full transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <svg className="w-[950px] h-[550px] overflow-visible">
                  {/* Defs for arrowheads and gradients */}
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#eab308" opacity="0.6" />
                    </marker>
                    <marker
                      id="arrow-cyan"
                      viewBox="0 0 10 10"
                      refX="18"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" opacity="0.5" />
                    </marker>
                  </defs>

                  {/* Draw Edges */}
                  {visibleEdges.map((edge) => {
                    const src = positionMap.get(edge.source_id);
                    const tgt = positionMap.get(edge.target_id);
                    if (!src || !tgt) return null;

                    const isSimilar = edge.relationship === "SIMILAR_TO";

                    return (
                      <g key={edge.id} className="transition-opacity">
                        <line
                          x1={src.x}
                          y1={src.y}
                          x2={tgt.x}
                          y2={tgt.y}
                          stroke={isSimilar ? "#06b6d4" : "#eab308"}
                          strokeWidth={isSimilar ? 1.5 : 1.8}
                          strokeDasharray={isSimilar ? "4,4" : undefined}
                          opacity={0.45}
                          markerEnd={isSimilar ? "url(#arrow-cyan)" : "url(#arrow)"}
                        />
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {positionedNodes.map(({ node, x, y }) => {
                    const isSelected = selectedNode?.id === node.id;

                    // Color & Style based on node type
                    let fillBg = "#1f2937";
                    let strokeColor = "#4b5563";
                    let textColor = "#f3f4f6";

                    if (node.node_type === "category") {
                      fillBg = "#7c3aed";
                      strokeColor = "#a78bfa";
                    } else if (node.node_type === "signature") {
                      fillBg = "#ca8a04";
                      strokeColor = "#facc15";
                    } else if (node.node_type === "resolution") {
                      fillBg = "#059669";
                      strokeColor = "#34d399";
                    } else if (node.node_type === "ticket") {
                      const st = node.properties.status;
                      if (st === "RESOLVED_AUTONOMOUSLY") {
                        fillBg = "#065f46";
                        strokeColor = "#10b981";
                      } else if (st === "RESOLVED_HUMAN_VERIFIED") {
                        fillBg = "#1e40af";
                        strokeColor = "#3b82f6";
                      } else {
                        fillBg = "#854d0e";
                        strokeColor = "#eab308";
                      }
                    }

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer group"
                      >
                        {/* Glowing ring if selected */}
                        {isSelected && (
                          <circle r={28} fill="none" stroke="#facc15" strokeWidth={3} className="animate-pulse" />
                        )}

                        {/* Node circle */}
                        <circle
                          r={node.node_type === "category" ? 22 : node.node_type === "ticket" ? 18 : 16}
                          fill={fillBg}
                          stroke={strokeColor}
                          strokeWidth={isSelected ? 3 : 2}
                          className="transition-transform group-hover:scale-110 drop-shadow-md"
                        />

                        {/* Node Label Text */}
                        <text
                          y={node.node_type === "category" ? 34 : 30}
                          textAnchor="middle"
                          fill={textColor}
                          fontSize={node.node_type === "category" ? 11 : 9.5}
                          fontWeight="bold"
                          className="pointer-events-none drop-shadow-sm select-none"
                        >
                          {node.label.length > 20 ? node.label.slice(0, 18) + "..." : node.label}
                        </text>

                        {/* Subtype Badge */}
                        <text
                          y={node.node_type === "category" ? 45 : 40}
                          textAnchor="middle"
                          fill="#9ca3af"
                          fontSize={7.5}
                          fontWeight="600"
                          className="pointer-events-none uppercase tracking-wider"
                        >
                          {node.node_type} &bull; {node.source}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Node Inspection Drawer Modal (if node clicked) */}
              {selectedNode && (
                <div className="absolute right-4 top-4 bottom-4 w-80 rounded-xl bg-white/95 dark:bg-[#181824]/95 backdrop-blur-md border border-slate-200 dark:border-[#2e2e3e] shadow-2xl p-4 overflow-y-auto text-xs z-20 animate-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2.5 mb-3">
                    <span className="font-extrabold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 text-[11px]">
                      Node Telemetry Inspector
                    </span>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Node Identifier</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-zinc-100">{selectedNode.id}</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Label / Name</p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedNode.label}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Type</p>
                        <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-700 dark:text-yellow-400 font-bold uppercase text-[10px]">
                          {selectedNode.node_type}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Memory Source</p>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 font-bold uppercase text-[10px]">
                          {selectedNode.source}
                        </span>
                      </div>
                    </div>

                    {selectedNode.properties.status && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Resolution Status</p>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedNode.properties.status}
                        </span>
                      </div>
                    )}

                    {selectedNode.properties.confidence !== undefined && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Vector Confidence Match</p>
                        <p className="text-yellow-600 dark:text-yellow-400 font-extrabold text-sm">
                          {(selectedNode.properties.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}

                    {selectedNode.properties.resolution_steps && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Remediation Runbook</p>
                        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-zinc-800 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                          {selectedNode.properties.resolution_steps}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 2-COLUMN LOWER ROW: WINDOW 2 (TREE) & WINDOW 3 (NORMAL GRAPHS) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ============================================================ */}
          {/* WINDOW 2: HIERARCHICAL KNOWLEDGE TREE & CLOUD MEMORY INDEX   */}
          {/* ============================================================ */}
          {(activeWindowTab === "all" || activeWindowTab === "tree") && (
            <div className="rounded-2xl bg-white dark:bg-[#14141c] border border-slate-200 dark:border-[#262635] shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#262635] flex items-center justify-between bg-slate-50/50 dark:bg-[#171722]">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      WINDOW 2: HIERARCHICAL KNOWLEDGE TREE
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Taxonomy: Categories &rarr; Error Signatures &rarr; Tickets &rarr; Runbooks
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {treeData.reduce((acc, c) => acc + c.total_tickets, 0)} Total Tickets
                </span>
              </div>

              {/* Tree Content */}
              <div className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto text-xs">
                {treeData.map((cat) => {
                  const isOpen = openCategories[cat.category];
                  return (
                    <div
                      key={cat.category}
                      className="rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#161622] overflow-hidden"
                    >
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(cat.category)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          {isOpen ? (
                            <FolderOpen className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Folder className="w-4 h-4 text-yellow-500" />
                          )}
                          <span className="font-extrabold text-slate-900 dark:text-zinc-100">{cat.category}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                            {cat.total_tickets} tickets
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Signatures and Tickets inside Category */}
                      {isOpen && (
                        <div className="p-3 pl-6 space-y-3 border-t border-slate-200 dark:border-zinc-800/60 bg-white dark:bg-[#13131b]">
                          {cat.signatures.map((sigGroup) => {
                            const isSigOpen = openSignatures[sigGroup.signature] ?? true;
                            return (
                              <div key={sigGroup.signature} className="space-y-1.5">
                                <button
                                  onClick={() => toggleSignature(sigGroup.signature)}
                                  className="w-full flex items-center justify-between text-left py-1 text-[11px] font-mono font-bold text-yellow-600 dark:text-yellow-400 hover:underline"
                                >
                                  <span>&bull; {sigGroup.signature}</span>
                                  <span className="text-[10px] text-slate-400">({sigGroup.ticket_count})</span>
                                </button>

                                {isSigOpen && (
                                  <div className="pl-4 space-y-2 border-l border-yellow-500/30 ml-2">
                                    {sigGroup.tickets.map((t) => (
                                      <div
                                        key={t.id}
                                        className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#1a1a24] text-[11px] space-y-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                                            #{t.id}: {t.title}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                              t.status === "RESOLVED_AUTONOMOUSLY"
                                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                : t.status === "RESOLVED_HUMAN_VERIFIED"
                                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                                : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
                                            }`}
                                          >
                                            {t.status.replace(/_/g, " ")}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                                          <span>Confidence: {(t.confidence * 100).toFixed(0)}%</span>
                                          <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <ShieldCheck className="w-3 h-3" />
                                            <span>Bank & Cloud Synced</span>
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* WINDOW 3: CLOUD & BANK TELEMETRY DASHBOARD ("NORMAL GRAPHS") */}
          {/* ============================================================ */}
          {(activeWindowTab === "all" || activeWindowTab === "dashboard") && (
            <div className="rounded-2xl bg-white dark:bg-[#14141c] border border-slate-200 dark:border-[#262635] shadow-xs overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#262635] flex items-center justify-between bg-slate-50/50 dark:bg-[#171722]">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      WINDOW 3: CLOUD ANALYTICS & NORMAL GRAPHS
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Vector similarity confidence distribution, category volume & resolution telemetry
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  <span>Live Metrics</span>
                </span>
              </div>

              {/* Normal Charts Content */}
              <div className="p-5 space-y-6 max-h-[500px] overflow-y-auto">
                {/* CHART 1: Vector Match Confidence Distribution */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      1. Vector Match Confidence Distribution (%)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Across All Ingested Incidents</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {analytics?.confidence_distribution &&
                      Object.entries(analytics.confidence_distribution).map(([range, count]) => {
                        const total = analytics.total_tickets || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={range} className="space-y-0.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-mono text-slate-600 dark:text-zinc-300 font-semibold">{range}</span>
                              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                                {count} tickets ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-500"
                                style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* CHART 2: Incident Volume by Domain / Category */}
                <div className="space-y-2.5 border-t border-slate-200 dark:border-zinc-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                      2. Incidents by Category Domain
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Knowledge Clusters</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {analytics?.category_distribution &&
                      Object.entries(analytics.category_distribution).map(([cat, count]) => {
                        const total = analytics.total_tickets || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={cat} className="space-y-0.5">
                            <div className="flex justify-between text-[11px]">
                              <span className="font-medium text-slate-700 dark:text-zinc-300 truncate max-w-[220px]">
                                {cat}
                              </span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* CHART 3: Resolution Status Breakdown */}
                <div className="space-y-2.5 border-t border-slate-200 dark:border-zinc-800 pt-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 block">
                    3. Autonomous vs Human-in-the-Loop Ratio
                  </span>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Autonomous
                      </p>
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-300 mt-1">
                        {analytics?.status_distribution?.RESOLVED_AUTONOMOUSLY || 0}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <p className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                        Human Verified
                      </p>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-300 mt-1">
                        {analytics?.status_distribution?.RESOLVED_HUMAN_VERIFIED || 0}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-400">
                        Pending Review
                      </p>
                      <p className="text-lg font-black text-yellow-600 dark:text-yellow-300 mt-1">
                        {analytics?.status_distribution?.PENDING_HUMAN_REVIEW || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CHART 4: Memory Storage Metrics */}
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      Storage Resiliency
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      SQLite Fallback DB &bull; Vector Graph Engine
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-yellow-600 dark:text-yellow-400 text-sm">
                      {analytics?.total_nodes || 0} Nodes / {analytics?.total_edges || 0} Edges
                    </span>
                    <p className="text-[10px] text-slate-400">Dual Sync Enabled</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
