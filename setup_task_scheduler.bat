@echo off
chcp 65001 >nul
title SkyFare India - Task Scheduler Installer
cd /d "%~dp0"

echo ===================================================
echo   Installing SkyFare Scheduled Ingestion Tasks
echo ===================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_task_scheduler.ps1"

echo.
pause
