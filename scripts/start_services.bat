@echo off
echo Starting MyVault Full Stack Application...

echo Starting Backend Server...
start "MyVault Backend" cmd /k "cd /d \"%~dp0..\backend\" && call venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting Frontend Development Server...
start "MyVault Frontend" cmd /k "cd /d \"%~dp0..\frontend\" && npm run dev"

echo.
echo ✅ Both services are starting...
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Documentation: http://localhost:8000/api/docs
echo.
echo Press any key to exit this window (services will continue running)
pause