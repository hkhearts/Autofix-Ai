# ==============================================================
# Multi-Stage Dockerfile for Autofix-AI
# Target: Render / Docker / Cloud Container Runtime
# ==============================================================

# --------------------------------------------------------------
# Stage 1: Backend (Python FastAPI)
# --------------------------------------------------------------
FROM python:3.12-slim AS backend

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements & install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy application files
COPY backend/ ./backend/
COPY data/ ./data/
COPY scripts/ ./scripts/

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]


# --------------------------------------------------------------
# Stage 2: Frontend (Next.js App Router)
# --------------------------------------------------------------
FROM node:20-alpine AS frontend

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Copy package manifests & install
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
