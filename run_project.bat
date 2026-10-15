@echo off
chcp 65001 >nul
title SkyFare India Launcher
echo ===================================================
echo   Starting SkyFare India Intelligence Platform
echo ===================================================
echo.

echo Starting FastAPI Backend (Port 8000)...
start "SkyFare Backend" /D "%~dp0" cmd /k ".\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting React + Vite Frontend (Port 3000)...
start "SkyFare Frontend" /D "%~dp0" cmd /k "npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ===================================================
echo SkyFare India is now running!
echo - Local Web App: http://localhost:3000
echo - Mobile LAN Web App: http://192.168.29.111:3000
echo - Backend API: http://localhost:8000
echo - Swagger Docs: http://localhost:8000/docs
echo ===================================================
echo.
