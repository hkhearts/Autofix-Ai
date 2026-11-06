@echo off
TITLE Autofix-AI Launcher
COLOR 0A

echo ======================================================================
echo    AUTOFIX-AI : SELF-HEALING L1/L2 IT SUPPORT AGENT
echo    With Groq Multimodal Vision OCR and Vectorize Hindsight Memory
echo ======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Locate backend and frontend directories dynamically
if exist "%SCRIPT_DIR%autofix-ai\backend\main.py" (
    set "BACKEND_DIR=%SCRIPT_DIR%autofix-ai"
    set "FRONTEND_DIR=%SCRIPT_DIR%autofix-ai\frontend"
) else if exist "%SCRIPT_DIR%backend\main.py" (
    set "BACKEND_DIR=%SCRIPT_DIR%"
    set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
) else (
    echo [ERROR] Could not locate backend/main.py directory.
    echo Current location: %SCRIPT_DIR%
    pause
    exit /b 1
)

echo [1/3] Checking environment requirements...

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.11+ and try again.
    pause
    exit /b 1
)

call npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node/npm is not installed or not in your PATH.
    echo Please install Node.js 20+ and try again.
    pause
    exit /b 1
)

echo [OK] Python and npm detected successfully.
echo.

echo [2/3] Starting FastAPI Backend on http://localhost:8000 ...
pushd "%BACKEND_DIR%"
start "Autofix-AI Backend (FastAPI :8000)" cmd /k python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
popd

REM Robust 2-second delay without timeout input redirection error
ping 127.0.0.1 -n 3 >nul

echo [3/3] Starting Next.js Frontend on http://localhost:3000 ...
pushd "%FRONTEND_DIR%"
start "Autofix-AI Frontend (Next.js :3000)" cmd /k npm run dev
popd

echo.
echo ======================================================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ======================================================================
echo    - Frontend UI Console: http://localhost:3000
echo    - Backend API Service: http://localhost:8000
echo    - Interactive API Docs: http://localhost:8000/docs
echo.
echo    DEFAULT TESTING CREDENTIALS:
echo    - Username: admin@autofix.ai
echo    - Password: password123
echo    - Company:  Acme Global Industries (acme-corp)
echo.
echo    Both servers are running in separate labeled command windows.
echo    Keep them open while testing the application.
echo ======================================================================
echo.
pause
