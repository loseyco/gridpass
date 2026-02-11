@echo off
echo Killing Edge...
taskkill /F /IM msedge.exe >nul 2>&1
taskkill /F /IM msedge.exe >nul 2>&1
timeout /t 2 >nul

echo Launching Edge with Debug Port 9222...
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222 --user-data-dir="C:\Users\pjlos\AppData\Local\Microsoft\Edge\User Data" https://mail.google.com https://www.facebook.com

echo Done.
