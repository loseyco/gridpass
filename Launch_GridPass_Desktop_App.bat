@echo off
title GridPass SRCommander — Desktop Application
color 0C
cls

echo ===============================================================================
echo                GRIDPASS // SRCOMMANDER NATIVE DESKTOP APP
echo ===============================================================================
echo.
echo [1/2] Checking Python Environment and Core Daemon...

:: Start background daemon if not already running on port 8080
powershell -Command "if (!(Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue)) { Start-Process python -ArgumentList 'scripts/gridpass_core_daemon.py' -WindowStyle Hidden }"

echo [2/2] Launching GridPass Native Windows Desktop App Window...
echo.

python scripts/gridpass_desktop_app.py %*

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Native Desktop App exited with an error.
    pause
)
