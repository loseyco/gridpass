@echo off
echo Starting iRacing Test Script...
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User'); python test_iracing.py"
pause
