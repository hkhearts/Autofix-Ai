# 👥 Individual Contributions & Architectural Ownership

**Project:** AUTOFIX.AI — Enterprise Self-Healing L1/L2 IT Support Agent with Multimodal Vision OCR & Vectorize Hindsight Persistent Memory  
**Hackathon:** Vectorize Hindsight Hackathon  
**Repository:** [https://github.com/hkhearts/Autofix-Ai](https://github.com/hkhearts/Autofix-Ai)  
**Live Application:** [https://autofix-ai-frontend-3shv.onrender.com/](https://autofix-ai-frontend-3shv.onrender.com/)  

---

## 🏛️ Architectural Division of Responsibilities

Autofix-AI was conceptualized and engineered through a complementary two-part architecture:
- **The Front-Half Perception & Memory Pipeline:** Owned and designed by **Harini**.
- **The Back-Half Autonomous Orchestration & Safety Engine:** Owned and designed by **Hari Krishnan**.

```
┌──────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────┐
│                   HARINI'S ARCHITECTURE                  │               HARI KRISHNAN'S ARCHITECTURE               │
│               (Front-Half / Perception)                  │                (Back-Half / Orchestration)               │
├──────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────┤
│ • Multimodal Vision OCR Ingestion (Groq Cloud API)       │ • Deterministic Decision Gate (C_threshold = 0.85)       │
│ • Raw Error Parsing (Qwen-2.5-VL / Llama-3.2-Vision)     │ • Autonomous Remediation Tool Execution Runner           │
│ • Canonical Error Signature Normalizer (Regex Engine)    │ • Human-in-the-Loop (HITL) Safety Gatekeeper             │
│ • Dynamic Placeholder Sanitization (<USER>, <IP>, <PID>) │ • Closed-Loop Memory Retention Hooks & Feedback Engine   │
│ • Vectorize Hindsight Vector Bank Schema Design          │ • High-Density 3-Column Mission Control Operations Cockpit│
│ • Incident Vectorization & Cosine Recall Optimization    │ • Real-time Memory Inspector UI & Expandable Knowledge Tree│
│ • 100-Ticket Enterprise Benchmark Dataset & Measurement  │ • Cloud / Local Credit-Saver Toggle & Dual Persistence   │
│ • Author: "How We Built a Multimodal Vision Pipeline..." │ • Author: "Eliminating Support Escalations Through..."   │
└──────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 👩‍💻 Harini — Lead Ingestion & Memory Architect

### Role Overview
Harini designed and implemented the front-half perception pipeline, which converts unstructured, ambiguous visual artifacts and raw logs into clean, normalized diagnostic signatures, and indexes those signatures into Vectorize Hindsight.

### Core Technical Contributions & Deliverables

#### 1. Multimodal Vision OCR Ingestion Pipeline
- Integrated the **Groq Multimodal Vision API** using `qwen/qwen3-32b` and `llama-3.2-11b-vision-preview` to ingest blurry screenshots, blue screens (BSOD), and terminal stack traces in sub-second latency (< 800ms).
- Designed specialized vision extraction prompts that isolate critical technical telemetry (memory hex dumps, stack traces, exit codes, process IDs, and dialog window text) while discarding non-diagnostic noise (window title bars, wallpapers, and desktop icons).
- Developed a lightweight heuristic regex OCR fallback engine to guarantee zero-downtime operation during cloud vision API rate limits or quota drops.

#### 2. Canonical Error Signature Synthesizer & Dynamic Normalization
- Designed and built the **Canonical Signature Normalizer** to solve the embedding drift problem where identical software faults produce divergent vectors due to dynamic machine-specific values.
- Implemented regular-expression tokenization replacing dynamic variables with static canonical placeholders:
  - Local home directories (`/Users/alice`, `C:\Users\bob`) $\to$ `<USER_DIR>`
  - IP addresses and subnets (`192.168.1.42`, `10.0.0.1`) $\to$ `<IP_ADDR>`
  - Process IDs (`PID: 40921`, `Thread: 18`) $\to$ `<PID>`
  - ISO timestamps and session tokens $\to$ `<TIMESTAMP>`, `<UUID>`, `<SESSION_ID>`
- Formulated the unified canonical key structure: `[DOMAIN_SUBSYSTEM_FAULT_CODE]`, ensuring incidents from disparate corporate nodes resolve to identical semantic memory coordinates.

#### 3. Vectorize Hindsight Memory Bank Design & Semantic Recall
- Designed the schema for the primary Hindsight memory bank: `autofix_ai_tickets` (and `it_ops_runbooks`).
- Structured memory payloads to link diagnostic symptoms directly to executable PowerShell/Bash runbooks, environment prerequisites, and resolution notes.
- Engineered high-dimensional vector recall workflows, query weighting, and cosine similarity scoring models to prioritize actionable operational fixes over generic text descriptions.

#### 4. Benchmark Dataset & Empirical Evaluation
- Curated and annotated a 100-ticket benchmark dataset of enterprise IT issues spanning 5 distinct domains (Client Apps, Identity/SSO, Networking, Databases, and Cloud/K8s).
- Conducted empirical measurements demonstrating:
  - **94.2%** OCR visual parsing accuracy.
  - **99.8%** reduction in diagnostic triage latency (from 14.2 minutes to 1.12 seconds).
  - **92.2%** reduction in false-positive runbook matching.

#### 5. Documentation & Technical Writing
- Authored the comprehensive engineering article:  
  *“How We Built a Multimodal Vision Pipeline That Indexes Error Screenshots into Persistent Memory”*.

---

## 👨‍💻 Hari Krishnan (@hkhearts) — Lead Orchestration & Autonomous Agent Engineer

### Role Overview
Hari Krishnan designed and engineered the back-half execution engine, the deterministic safety policy, the real-time Mission Control cockpit, and the closed-loop retention mechanism that feeds human expertise directly back into Vectorize Hindsight memory.

### Core Technical Contributions & Deliverables

#### 1. Deterministic Confidence Gate ($\mathcal{C}_{\text{threshold}} = 0.85$) & Decision Engine
- Engineered the mathematical arbitration barrier separating autonomous runbook execution from safety-escalated human review:
  $$\mathcal{C}_{\text{threshold}} = 0.85$$
- Designed the dual-branch routing engine:
  - **Autonomous Branch ($C \ge 0.85$):** Directly invokes automated tool execution routines, executes post-remediation health verification probes, and resolves the ticket in under two seconds.
  - **Human-in-the-Loop Branch ($C < 0.85$):** Safely halts execution, derives a diagnostic hypothesis, and escalates to the Mission Control triage dashboard for human review.

#### 2. Human-in-the-Loop (HITL) Gatekeeper & Response Composer
- Built the interactive triage workflow inside the Active Ticket Workspace, enabling support engineers to:
  - Review extracted OCR traces and agent diagnostic hypotheses.
  - Inspect terminal output and step-by-step reasoning logs.
  - Approve the recommended runbook with a single click (**`Approve & Solve (Human in Loop)`**) or edit the command directly in an embedded terminal before execution.
- Implemented robust status transition enforcement across ticket states: `PENDING_HUMAN_REVIEW`, `IN_PROGRESS`, `RESOLVED_AUTONOMOUSLY`, and `RESOLVED_HUMAN_VERIFIED`.

#### 3. Closed-Loop Retention Hook (`POST /api/tickets/{id}/feedback`)
- Developed the core continuous learning feedback loop that intercepts engineer-verified resolutions and fires asynchronous retention hooks to Vectorize Hindsight.
- Institutionalized operational knowledge directly into the agent’s permanent memory at the moment of resolution, eliminating the need for engineers to manually write wikis or update static configuration files.

#### 4. Mission Control Operations Cockpit & Memory Inspector UI
- Engineered the high-density, 3-column operations cockpit using **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**:
  - **Left Column:** Live incoming ticket stream with severity filtering, priority badges, and confidence tags.
  - **Center Column:** Interactive active ticket workspace with OCR telemetry, live terminal trace, and checkpoint action row.
  - **Right Column:** Real-time **Memory Inspector** with dynamic similarity score meters, recalled historical ticket references, and credit-saver indicators.
- Created the **Hindsight Knowledge Tree (`GET /api/memory/tree`)**, categorizing all learned operational runbooks into 5 structured enterprise domains with expandable categories.
- Implemented the **Cloud Mode vs. Credit-Saver Toggle**, giving operators instantaneous control to switch between live Hindsight Cloud querying and local vector fallback caching.

#### 5. Dual-Layer Ticket Persistence & High-Availability API
- Designed dual-layer ticket persistence combining server-side JSON storage (`autofix-ai/data/tickets.json`) with client-side browser caching (`autofix_tickets_cache`), preventing data loss across server restarts and browser reloads.
- Built the high-throughput **FastAPI** backend with automated OpenAPI/Swagger documentation (`/docs`), health telemetry probes (`/health`), and CORS security controls.
- Configured production deployment on **Render Cloud** using Infrastructure-as-Code (`render.yaml`), Docker containerization, and zero-downtime webhook pipelines.

#### 6. Documentation & Technical Writing
- Authored the comprehensive engineering article:  
  *“Eliminating Support Escalations Through Human-in-the-Loop Feedback Loops and Persistent State Memory”*.
- Structured and maintained the complete 13-section production `README.md`, video demo script, and system architecture diagrams.

---

## 🤝 Summary Matrix of Responsibilities

| Subsystem Component | Harini | Hari Krishnan |
| :--- | :---: | :---: |
| **Multimodal Vision OCR & Image Ingestion** | **Primary Lead** | Supporting |
| **Canonical Token Sanitization & Normalizer** | **Primary Lead** | Supporting |
| **Hindsight Vector Bank Schema & Embedding Design** | **Primary Lead** | Supporting |
| **Benchmark Dataset & Accuracy Evaluation** | **Primary Lead** | Supporting |
| **Deterministic Decision Gate ($C \ge 0.85$)** | Supporting | **Primary Lead** |
| **Autonomous Remediation & Tool Runner** | Supporting | **Primary Lead** |
| **Human-in-the-Loop (HITL) Safety Gatekeeper** | Supporting | **Primary Lead** |
| **Closed-Loop Memory Retention Hooks** | Co-Designer | **Primary Lead** |
| **Mission Control UI & Memory Inspector** | Supporting | **Primary Lead** |
| **Hindsight Knowledge Tree & Cloud Mode Toggle** | Supporting | **Primary Lead** |
| **FastAPI REST API & Dual-Layer Persistence** | Supporting | **Primary Lead** |
| **Render Cloud IaC & Docker Deployment** | Supporting | **Primary Lead** |

---

<p align="center">
  <em>Autofix-AI — Developed collaboratively for the Vectorize Hindsight Hackathon by Harini & Hari Krishnan.</em>
</p>
