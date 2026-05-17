@echo off
title Agent Hub — Local Server
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════╗
echo  ║         AGENT HUB                ║
echo  ║  http://localhost:5500           ║
echo  ║  Press Ctrl+C to stop            ║
echo  ╚══════════════════════════════════╝
echo.

:: Open browser after 1.5s (gives http-server time to bind)
start /b cmd /c "ping localhost -n 2 > nul && start http://localhost:5500/"

npx http-server . -p 5500 --cors -c-1
pause
