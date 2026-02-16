@echo off
echo Starting GridPass Setup...
cd /d "%~dp0"

:: If running from nested zip structure
if exist "system\setup_portable.ps1" (
    cd system
)

powershell -NoProfile -ExecutionPolicy Bypass -File setup_portable.ps1
pause
