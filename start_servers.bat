@echo off
echo Starting Restaurant IA Application...

echo.
echo Starting Backend Server...
cd /d "c:\Users\YANN\Desktop\Emergent-app\backend"
start "Backend Server" cmd /k "C:/Users/YANN/Desktop/Emergent-app/.venv/Scripts/python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server...
cd /d "c:\Users\YANN\Desktop\Emergent-app\frontend"
start "Frontend Server" cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
