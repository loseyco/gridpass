@echo off
title GridPass Sim Racing Apex Core (All-In-One Master Daemon)
color 0C
cls

:: -----------------------------------------------------------------------------
:: 1. SELF-HEALING RUNTIME & PYTHON VERIFICATION
:: -----------------------------------------------------------------------------
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ======================================================================
    echo     ⚠️  PYTHON RUNTIME NOT DETECTED
    echo ======================================================================
    echo.
    echo   GridPass is installing the lightweight Python runtime via Windows winget...
    echo.
    winget install Python.Python.3.11 --silent --accept-source-agreements --accept-package-agreements >nul 2>nul
    echo.
)

:: -----------------------------------------------------------------------------
:: 2. AUTO-INSTALL MISSING LIBRARIES ON FIRST RUN (SILENT & FAST)
:: -----------------------------------------------------------------------------
python -c "import websockets, requests, pystray, PIL, sounddevice, numpy, cv2, serial, win32com" >nul 2>nul
if %errorlevel% neq 0 (
    echo ======================================================================
    echo     📦  GRIDPASS FIRST-RUN SETUP (AUTO-CONFIGURING DEPENDENCIES)
    echo ======================================================================
    echo.
    echo   Configuring audio, video, and hardware drivers... (~10 seconds)
    echo.
    pip install --quiet --disable-pip-version-check websockets requests pystray pillow sounddevice numpy opencv-python pyserial pywin32
    echo   [✓] Dependencies installed successfully!
    echo.
    timeout /t 2 /nobreak >nul
    cls
)

:: -----------------------------------------------------------------------------
:: 3. FIRST-RUN WINDOWS AUTO-START CONFIGURATION PROMPT
:: -----------------------------------------------------------------------------
if not exist "%APPDATA%\GridPass" mkdir "%APPDATA%\GridPass"

if not exist "%APPDATA%\GridPass\startup_configured.txt" (
    echo ======================================================================
    echo     🏎️  GRIDPASS SRCOMMANDER — WINDOWS AUTO-START SETUP  🏁
    echo ======================================================================
    echo.
    echo   Would you like GridPass SRCommander to automatically start in the
    echo   background when you turn on your PC / sim rig?
    echo.
    echo   [Y] Yes (Recommended - Auto-starts silently on PC boot)
    echo   [N] No  (Manual desktop launch only)
    echo.
    echo ======================================================================
    set /p USER_CHOICE="  Enter Choice [Y/N] (Default=Y): "
    
    if /i "%USER_CHOICE%"=="N" (
        echo auto_start=false > "%APPDATA%\GridPass\startup_configured.txt"
        echo.
        echo   [INFO] Configured for manual launch only.
    ) else (
        echo auto_start=true > "%APPDATA%\GridPass\startup_configured.txt"
        powershell -NoProfile -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\GridPass_SRCommander.lnk'); $Shortcut.TargetPath = '%~dp0Launch_GridPass_Apex_Core.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.WindowStyle = 7; $Shortcut.Save()"
        echo.
        echo   [SUCCESS] ✓ GridPass SRCommander registered to auto-start with Windows!
    )
    echo.
    timeout /t 2 /nobreak >nul
    cls
)

:: -----------------------------------------------------------------------------
:: 4. MAIN DAEMON LAUNCH & AUTO-RESTART SUPERVISOR LOOP
:: -----------------------------------------------------------------------------
echo ======================================================================
echo     🏎️  GRIDPASS SIM RACING APEX CORE — UNIFIED DAEMON  🏁
echo ======================================================================
echo.
echo   1. Windows Taskbar System Tray Icon (Next to Clock)
echo   2. Auto-Updater Engine (Checks on Startup, Every 30m, and Pre-Race)
echo   3. Live Telemetry & OBS Broadcast Engine (ws://127.0.0.1:8080)
echo   4. Paint Scheme & Custom Livery Sync (Documents\iRacing\paint)
echo   5. Championship Setup Auto-Deploy (Documents\iRacing\setups)
echo   6. SRCommander Hardware Control (Speed Fans, Halo RGB LEDs)
echo   7. Proactive AI Spotter Voice Engine (Windows Native SAPI)
echo   8. In-Ear Steward Intercom & Automated Race Control Announcer
echo.
echo ======================================================================
echo.

cd /d "%~dp0"

:loop
if exist "scripts\gridpass_core_daemon.py" (
    python scripts\gridpass_core_daemon.py
) else if exist "gridpass_core_daemon.py" (
    python gridpass_core_daemon.py
) else (
    echo [ERROR] Could not find gridpass_core_daemon.py
    pause
    exit /b 1
)

echo.
echo [DAEMON RESTART] Process exited. Seamlessly hot-restarting in 1 second...
timeout /t 1 /nobreak >nul
goto loop
