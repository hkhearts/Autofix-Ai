# ======================================================================
# Autofix-AI PowerShell Launcher
# ======================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   AUTOFIX-AI : SELF-HEALING L1/L2 IT SUPPORT AGENT" -ForegroundColor Green
Write-Host "   With Groq Multimodal Vision OCR and Vectorize Hindsight Memory" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot

# Locate directories dynamically
if (Test-Path "$scriptDir\autofix-ai\backend\main.py") {
    $backendDir = "$scriptDir\autofix-ai"
    $frontendDir = "$scriptDir\autofix-ai\frontend"
} elseif (Test-Path "$scriptDir\backend\main.py") {
    $backendDir = "$scriptDir"
    $frontendDir = "$scriptDir\frontend"
} else {
    Write-Error "Could not locate backend/main.py directory."
    exit 1
}

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$backendDir`" && python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$frontendDir`" && npm run dev"

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "   SERVERS STARTED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   - Frontend UI Console: http://localhost:3000" -ForegroundColor White
Write-Host "   - Backend API Service: http://localhost:8000" -ForegroundColor White
Write-Host "   - Interactive API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "   DEFAULT TESTING CREDENTIALS:" -ForegroundColor Yellow
Write-Host "   - Username: admin@autofix.ai" -ForegroundColor White
Write-Host "   - Password: password123" -ForegroundColor White
Write-Host "   - Company:  Acme Global Industries (acme-corp)" -ForegroundColor White
Write-Host "======================================================================`n" -ForegroundColor Cyan
