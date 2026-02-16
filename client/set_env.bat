@echo off
echo.
echo ==========================================
echo      GridPass Environment Switcher
echo ==========================================
echo.
echo 1. Local (localhost:3000)
echo 2. Production (https://gridpass.vercel.app)
echo.
set /p choice="Select Environment (1/2): "

cd /d "%~dp0\system"

if "%choice%"=="1" (
    echo.
    echo Enter the IP address of your Dev Computer (e.g. 192.168.1.100)
    echo Leave empty for localhost
    set /p dev_ip="IP Address: "
    setlocal enabledelayedexpansion
    if "!dev_ip!"=="" set dev_ip=localhost
    
    echo API_BASE_URL = "http://!dev_ip!:3000/api" > config_local.py
    echo.
    echo [OK] Switched to LOCAL environment (!dev_ip!:3000).
    endlocal

) else (
    if exist "config_local.py" del "config_local.py"
    echo.
    echo [OK] Switched to PRODUCTION environment.
)

echo.
pause
