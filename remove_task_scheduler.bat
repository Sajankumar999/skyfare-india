@echo off
chcp 65001 >nul
title SkyFare India - Task Scheduler Uninstaller
cd /d "%~dp0"

echo ===================================================
echo   Removing SkyFare Scheduled Ingestion Tasks
echo ===================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Unregister-ScheduledTask -TaskName 'SkyFare_Morning_Ingestion' -Confirm:$false -ErrorAction SilentlyContinue; Unregister-ScheduledTask -TaskName 'SkyFare_Night_Ingestion' -Confirm:$false -ErrorAction SilentlyContinue; Write-Host '[OK] SkyFare scheduled tasks removed cleanly.' -ForegroundColor Green"

echo.
pause
