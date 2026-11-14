# Autofix-AI Production Release Package
**Autonomous L1/L2 Self-Healing IT Support Platform**
*Multimodal Vision OCR • Persistent Vector Memory • SQLite Knowledge Bank Fallback • Human-in-the-Loop*

---

## 📦 What's Inside

1. **`AutofixAI.exe`** (Embedded Brand Icon):
   - The primary standalone desktop executable.
   - When opened:
     - Automatically starts the FastAPI Backend Engine on `http://localhost:8000`.
     - Automatically starts the Next.js Production Web Server on `http://localhost:3000`.
     - Performs health checks and automatically pops open the complete web application in your default browser.
     - Provides a modern dark-themed desktop management controller to monitor server status, access Hind Visuals and API Docs, or gracefully stop all daemons.

2. **`start-side-by-side.bat`**:
   - Spawns exactly **two** CMD windows tiled side-by-side on your primary display:
     - **Left Half**: AI Backend Engine (FastAPI on Port 8000).
     - **Right Half**: Localhost Frontend (Next.js on Port 3000).
   - Automatically opens `http://localhost:3000` in the browser and closes the launcher script so no third window clutters the desktop.

3. **`Run-AutofixAI.bat`**:
   - Quick one-click launcher for `AutofixAI.exe`.

4. **`app_icon.ico` & `symbol.png`**:
   - Official product logo and icon assets.

---

## 🚀 How to Run

### Method 1: Desktop Application Executable (Recommended)
Simply double-click:
```
AutofixAI.exe
```
Your browser will automatically open to `http://localhost:3000` once both server engines are online.

### Method 2: Side-by-Side Dual Console Mode
Double-click:
```
start.bat (in project root) OR start-side-by-side.bat
```
This opens the AI backend on the left half and localhost frontend on the right half.

---

## 🔑 Default Credentials

- **Email**: `admin@autofix.ai`
- **Password**: `password123`
- **Company**: `Acme Global Industries` (`acme-corp`)

---

## 🌐 Endpoints

- **Frontend Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
