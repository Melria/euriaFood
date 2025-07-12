# Start Backend Server Script
Set-Location -Path "c:\Users\YANN\Desktop\Emergent-app\backend"

Write-Host "Starting FastAPI Backend Server..." -ForegroundColor Green
Write-Host "Backend will be available at: http://localhost:8001" -ForegroundColor Yellow

# Start the backend server
& "C:/Users/YANN/Desktop/Emergent-app/.venv/Scripts/python.exe" -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
