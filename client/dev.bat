@echo off
cd /d "%~dp0"

echo [DEV MODE] Installing requirements...
python -m pip install -r requirements.txt

:loop
echo.
echo [DEV MODE] Starting GridPass Client...
echo (Press Ctrl+C to Stop)
echo.

python main.py

echo.
echo App exited. Press any key to restart...
pause
goto loop
