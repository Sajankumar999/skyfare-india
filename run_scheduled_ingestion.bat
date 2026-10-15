@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

:: Navigate to script's directory
cd /d "%~dp0"

:: Create logs directory if missing
if not exist "logs" mkdir "logs"

:: Determine shift argument (morning, afternoon, night, all)
set SHIFT=%1
if "%SHIFT%"=="" set SHIFT=morning

:: Validate shift parameter (morning, afternoon, night, all)
if not "%SHIFT%"=="morning" if not "%SHIFT%"=="afternoon" if not "%SHIFT%"=="night" if not "%SHIFT%"=="all" (
    echo [ERROR] Invalid shift parameter: "%SHIFT%". Must be morning, afternoon, night, or all. >> logs\ingestion_audit.log
    echo [ERROR] Invalid shift parameter: "%SHIFT%". Must be morning, afternoon, night, or all.
    exit /b 1
)

set TIMESTAMP=%date% %time%
echo ================================================================================ >> logs\ingestion_audit.log
echo [TASK STARTED] Shift: %SHIFT% ^| Timestamp: %TIMESTAMP% >> logs\ingestion_audit.log
echo Directory: %~dp0 >> logs\ingestion_audit.log
echo ================================================================================ >> logs\ingestion_audit.log

:: Execute Python batch ingestion engine and append stdout + stderr to audit log
.\.venv\Scripts\python.exe batch_fetch_real_data.py --shift %SHIFT% >> logs\ingestion_audit.log 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

echo. >> logs\ingestion_audit.log
if "%EXIT_CODE%"=="0" (
    echo [TASK COMPLETED] Shift: %SHIFT% succeeded - Exit code 0 at %date% %time% >> logs\ingestion_audit.log
) else if "%EXIT_CODE%"=="42" (
    echo [TASK SKIPPED] Shift: %SHIFT% skipped - Active lock file detected at %date% %time% >> logs\ingestion_audit.log
) else (
    echo [TASK FAILED] Shift: %SHIFT% failed - Exit code %EXIT_CODE% at %date% %time% >> logs\ingestion_audit.log
)
echo ================================================================================ >> logs\ingestion_audit.log
echo. >> logs\ingestion_audit.log

exit /b %EXIT_CODE%
