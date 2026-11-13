@echo off
TITLE Autofix-AI Launcher
COLOR 0A

echo ======================================================================
echo    AUTOFIX-AI : SELF-HEALING L1/L2 IT SUPPORT AGENT
echo    Side-by-Side Dual Console Launch (AI Backend + Localhost Frontend)
echo ======================================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Locate Python launcher script
if exist "%SCRIPT_DIR%scripts\start_side_by_side.py" (
    set "LAUNCHER_SCRIPT=%SCRIPT_DIR%scripts\start_side_by_side.py"
) else if exist "%SCRIPT_DIR%autofix-ai\scripts\start_side_by_side.py" (
    set "LAUNCHER_SCRIPT=%SCRIPT_DIR%autofix-ai\scripts\start_side_by_side.py"
) else (
    echo [ERROR] Could not find start_side_by_side.py launcher script.
    pause
    exit /b 1
)

REM Verify Python and npm
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ and try again.
    pause
    exit /b 1
)

call npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node/npm is not installed or not in your PATH.
    echo Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

echo [OK] Requirements detected.
echo Spawning exactly 2 CMD windows tiled side-by-side:
echo   - Left  Half: AI Backend Engine (FastAPI :8000)
echo   - Right Half: Localhost Frontend (Next.js :3000)
echo.

python "%LAUNCHER_SCRIPT%"

REM Cleanly exit launcher so only the 2 server CMD windows remain open
exit /b 0
