@echo off
echo Starting CardioGuard Backend...
start "CardioGuard API" cmd /k "cd /d %~dp0 && py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"
timeout /t 2 /nobreak > nul
echo Starting CardioGuard Frontend...
start "CardioGuard UI" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo CardioGuard is starting!
echo   Frontend: http://127.0.0.1:5173
echo   API:      http://127.0.0.1:8000/docs
pause
