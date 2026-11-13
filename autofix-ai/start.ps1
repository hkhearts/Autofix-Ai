# ======================================================================
# Autofix-AI PowerShell Launcher
# Side-by-Side Dual Console Launch (AI Backend + Localhost Frontend)
# ======================================================================

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   AUTOFIX-AI : SELF-HEALING L1/L2 IT SUPPORT AGENT" -ForegroundColor Green
Write-Host "   Side-by-Side Dual Console Launch" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot

$launcherPath = "$scriptDir\scripts\start_side_by_side.py"
if (-not (Test-Path $launcherPath)) {
    $launcherPath = "$scriptDir\..\scripts\start_side_by_side.py"
}

if (-not (Test-Path $launcherPath)) {
    Write-Error "Could not find start_side_by_side.py launcher script."
    exit 1
}

# Run side-by-side launcher
python $launcherPath
