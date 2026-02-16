echo Starting GridPass Client...
cd /d "%~dp0"
cd /d "%~dp0"

:loop
echo Checking for updates...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); python updater.py; exit $LASTEXITCODE"

echo Ensuring dependencies...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); python -m pip install -r requirements.txt; exit $LASTEXITCODE"

echo Starting GridPass Client...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); python main.py; exit $LASTEXITCODE"

:: Check for restart code (42)
if %errorlevel% equ 42 (
    echo.
    echo ♻️  Restarting for update...
    timeout /t 3 /nobreak
    goto loop
)

:: Auto-Cleanup Conflict File
if exist "realtime.py" (
    echo Deleting conflicting realtime.py file...
    del "realtime.py"
)

:: Normal exit - Restart after timeout (Unattended mode)
if %errorlevel% neq 0 (
    echo.
    echo ❌ Client crashed or failed. Restarting in 10 seconds...
    timeout /t 10 /nobreak
    goto loop
)

echo.
echo Client stopped manually.
pause
