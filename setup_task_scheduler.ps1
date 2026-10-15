# SkyFare India - Windows Task Scheduler Auto-Registration Script
# Configures twice-daily ingestion with battery support and wake-up catch-up.

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RunnerScript = Join-Path $ProjectDir "run_scheduled_ingestion.bat"

if (-not (Test-Path $RunnerScript)) {
    Write-Error "Runner script not found at: $RunnerScript"
    exit 1
}

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  SkyFare India - Task Scheduler Installer (Autonomous Twice-Daily Collection)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "Project Directory: $ProjectDir"
Write-Host "Runner Script:     $RunnerScript"
Write-Host ""

# Define common robust task settings:
# 1. StartWhenAvailable: Catches up missed runs if laptop was turned off or asleep
# 2. AllowStartIfOnBatteries: Allows execution when laptop is running on battery
# 3. DontStopIfGoingOnBatteries: Does not kill running job if charger is unplugged
# 4. ExecutionTimeLimit: 45 minutes max safety limit
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 45) `
    -MultipleInstances IgnoreNew

# -----------------------------------------------------------------------------
# 1. Morning Shift Task (10:00 AM IST) - T+1 & T+7
# -----------------------------------------------------------------------------
$MorningTaskName = "SkyFare_Morning_Ingestion"
$MorningTrigger = New-ScheduledTaskTrigger -Daily -At "10:00 AM"
$MorningAction = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$RunnerScript`" morning" `
    -WorkingDirectory $ProjectDir

Register-ScheduledTask `
    -TaskName $MorningTaskName `
    -Trigger $MorningTrigger `
    -Action $MorningAction `
    -Settings $Settings `
    -Description "SkyFare India: Morning Batch Ingestion (T+1 opening spot & T+7 business peak) across 14 DGCA corridors." `
    -Force | Out-Null

Write-Host "[OK] Registered Task: $MorningTaskName" -ForegroundColor Green
Write-Host "     Schedule: Daily at 10:00 AM IST (Runs when laptop turns on if missed)" -ForegroundColor Gray

# -----------------------------------------------------------------------------
# 2. Night Shift Task (10:30 PM IST) - All Horizons (T+1 to T+45)
# -----------------------------------------------------------------------------
$NightTaskName = "SkyFare_Night_Ingestion"
$NightTrigger = New-ScheduledTaskTrigger -Daily -At "10:30 PM"
$NightAction = New-ScheduledTaskAction `
    -Execute "cmd.exe" `
    -Argument "/c `"$RunnerScript`" night" `
    -WorkingDirectory $ProjectDir

Register-ScheduledTask `
    -TaskName $NightTaskName `
    -Trigger $NightTrigger `
    -Action $NightAction `
    -Settings $Settings `
    -Description "SkyFare India: Night Batch Ingestion (T+1 to T+45 all booking horizons) across 14 DGCA corridors." `
    -Force | Out-Null

Write-Host "[OK] Registered Task: $NightTaskName" -ForegroundColor Green
Write-Host "     Schedule: Daily at 10:30 PM IST (Runs when laptop turns on if missed)" -ForegroundColor Gray

Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! Active Scheduled Tasks:" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

Get-ScheduledTask -TaskName "SkyFare_*" | Select-Object TaskName, State, @{Name="NextRunTime"; Expression={(Get-ScheduledTaskInfo -TaskName $_.TaskName).NextRunTime}} | Format-Table -AutoSize

Write-Host "All output is automatically logged to:" -ForegroundColor Yellow
Write-Host "  $(Join-Path $ProjectDir 'logs\ingestion_audit.log')" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan
