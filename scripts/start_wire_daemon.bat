@echo off
title Gridpass Paddock Wire Local Daemon
echo ========================================================
echo  🏎️ STARTING GRIDPASS PADDOCK WIRE DAEMON
echo  Running on Local Workstation PC (Zero Cloud Serverless Cost)
echo ========================================================
cd /d "%~dp0\.."
npx tsx scripts/paddock_wire_daemon.ts
pause
