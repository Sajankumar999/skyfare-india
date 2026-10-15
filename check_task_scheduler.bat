@echo off
chcp 65001 >nul
title SkyFare India - Task Scheduler Status
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Write-Host '===================================================' -ForegroundColor Cyan; Write-Host '  SkyFare Scheduled Ingestion Status' -ForegroundColor Cyan; Write-Host '===================================================' -ForegroundColor Cyan; $tasks = Get-ScheduledTask -TaskName 'SkyFare_*' -ErrorAction SilentlyContinue; if ($tasks) { $tasks | ForEach-Object { $info = Get-ScheduledTaskInfo -TaskName $_.TaskName; [PSCustomObject]@{ TaskName = $_.TaskName; State = $_.State; LastRunTime = $info.LastRunTime; LastResult = $info.LastTaskResult; NextRunTime = $info.NextRunTime } } | Format-Table -AutoSize } else { Write-Host 'No SkyFare tasks registered yet. Run setup_task_scheduler.bat to install.' -ForegroundColor Yellow }; if (Test-Path 'logs\ingestion_audit.log') { Write-Host '' ; Write-Host '--- Latest 15 Lines from logs\ingestion_audit.log ---' -ForegroundColor Yellow; Get-Content 'logs\ingestion_audit.log' -Tail 15 } else { Write-Host 'No logs\ingestion_audit.log found yet.' -ForegroundColor Gray }"

echo.
pause
