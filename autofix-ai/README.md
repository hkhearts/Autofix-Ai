# ⚡ Autofix-AI
### Self-Healing L1/L2 IT Support Agent with Multimodal Vision & Hindsight Persistent Memory

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![Vectorize Hindsight](https://img.shields.io/badge/Memory-Vectorize%20Hindsight-6366F1.svg)](https://vectorize.io/)
[![Groq Vision](https://img.shields.io/badge/Vision%20OCR-Groq%20Llama%203.2-F55036.svg)](https://groq.com/)
[![Render Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7.svg)](https://render.com/)

Autofix-AI is a production-ready, deployable L1/L2 IT support ticketing agent designed to eradicate repetitive ticket churn in enterprise service desks. Equipped with **Groq Multimodal Vision OCR** to ingest screenshots of stack traces and bluescreens, and **Vectorize Hindsight Persistent Memory**, Autofix-AI permanently retains verified resolutions so the system never makes the same mistake twice.

---

## 📸 Enterprise Console Design Reference

The ticketing console faithfully implements the high-contrast enterprise design:
- **Left Column**: Incoming Ticket Stream with severity badges, client tags, and priority filtering.
- **Center Column**: Active Ticket Console with Issue Description, Agent Replies, Hindsight Memory Suggestions, Rich Text Response Composer, and Yellow Dashed Screenshot Upload Box.
- **Right Column**: Hindsight Memory Inspector featuring live semantic search, similar historical cases, past client interactions, and learned patterns telemetry.
- **Light & Dark Theme Switcher**: Toggle between the sleek dark theme and a clean, high-contrast light theme.

---

## 🏗️ Architecture & Self-Healing Feedback Loop

```text
       [Employee / Client]
                 │  (Submits Title, Description & Screenshot)
                 ▼
       ┌───────────────────────────────┐
       │   Groq Vision OCR Ingestion   │
       │   (Extracts trace & error)   │
       └──────────────┬────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │   Normalized Error Signature  │
       └──────────────┬────────────────┘
                      ▼
       ┌───────────────────────────────┐
       │  Hindsight Memory Recall      │ ◄────────┐
       │  (Vector + BM25 + Graph)      │          │
       └──────────────┬────────────────┘          │
                      │                           │
          Decision Gate (Threshold: 85%)          │
         ┌────────────┴────────────┐              │
         │                         │              │
     [>= 85%]                   [< 85%]           │
         │                         │              │
         ▼                         ▼              │
  Autonomous Fix           Pending Human Review   │
         │                         │              │
         │ (Simulate Remediation)  │ (Lead Review)│
         │                         ▼              │
         │                Engineer Verifies Fix   │
         │                         │              │
         └────────────┬────────────┘              │
                      ▼                           │
       ┌───────────────────────────────┐          │
       │  Universal Learning Hook      │          │
       │  record_ticket_resolution()   ├──────────┘
       │  (Stored into Hindsight)      │ (Future tickets auto-heal!)
       └───────────────────────────────┘
```

---

## 🔑 Default Credentials for Testing

Use the built-in demo credentials on the `/login` portal (or click **"1-Click Auto Fill"**):
- **Organization**: `Acme Global Industries (acme-corp)`
- **Email**: `admin@autofix.ai`
- **Password**: `password123`

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**
- **Groq API Key** ([console.groq.com](https://console.groq.com))
- **Vectorize Hindsight API Key** ([vectorize.io](https://vectorize.io) — Use promo code **`MEMHACK99`** for free credits)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `GROQ_API_KEY` and `HINDSIGHT_API_KEY`. (Note: If keys are omitted during offline development, the system automatically uses its built-in local vector memory engine).

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```
The backend initializes automatically, preloading 16 realistic L1/L2 tickets into the memory bank. Check health at `http://localhost:8000/health`.

### 4. Seed Data Runner (Optional Standalone)
To re-seed or verify the 15 enterprise IT tickets into Hindsight:
```bash
python scripts/seed_data.py
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser:
- Landing Page: `http://localhost:3000/`
- Login Page: `http://localhost:3000/login`
- Signup Page: `http://localhost:3000/signup`
- Main IT Console: `http://localhost:3000/dashboard`

---

## 🌐 Deploying to Render (render.com)

Autofix-AI is fully optimized for **Render**:

### Option A: 1-Click Blueprint Deploy (`render.yaml`)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** &rarr; **Blueprint**.
3. Select your repository. Render automatically reads `render.yaml` and spins up:
   - **`autofix-ai-backend`**: Python FastAPI Web Service
   - **`autofix-ai-frontend`**: Next.js Node Web Service
4. Add your `GROQ_API_KEY` and `HINDSIGHT_API_KEY` in the Render Environment Variables tab.

### Option B: Manual Web Service Setup
- **Backend Service**:
  - Runtime: `Python 3`
  - Build Command: `pip install -r backend/requirements.txt`
  - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Frontend Service**:
  - Runtime: `Node`
  - Build Command: `npm install && npm run build`
  - Start Command: `npm start`
  - Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com`

---

## 🐳 Docker Deployment

To spin up both services containerized:
```bash
docker compose up --build
```
Access the console at `http://localhost:3000` and API docs at `http://localhost:8000/docs`.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service status & Hindsight connection telemetry |
| `GET` | `/api/tickets` | Returns all tickets with filtering and search |
| `GET` | `/api/tickets/{id}` | Returns single ticket details |
| `POST` | `/api/tickets` | Ingests ticket (multipart with optional screenshot) |
| `POST` | `/api/tickets/{id}/feedback` | **Human-in-the-Loop hook**: Approves fix & vectors into Hindsight |
| `POST` | `/api/tickets/{id}/reply` | Appends agent or engineer reply message |
| `GET` | `/api/memory/stats` | Live Hindsight vector statistics |
| `GET` | `/api/memory/search?q={q}` | Interactive semantic vector search |
| `POST` | `/api/auth/login` | Company authentication with default credentials |

---

## 💡 Hindsight Credits Promo Code
Use promo code **`MEMHACK99`** on [Vectorize.io](https://vectorize.io) to obtain developer credits for Hindsight Cloud API.
