@echo off
setlocal ENABLEDELAYEDEXPANSION
title MyVault - Start Services

echo Starting MyVault Full Stack Application...

REM Resolve absolute paths
set ROOT=%~dp0..
set BACKEND_DIR=%ROOT%\backend
set FRONTEND_DIR=%ROOT%\frontend

REM Set Google Cloud project for Firestore (replace with your actual Project ID)
set GOOGLE_CLOUD_PROJECT=myvault-f3f99
set FIRESTORE_PROJECT_ID=%GOOGLE_CLOUD_PROJECT%
set FIREBASE_PROJECT_ID=%GOOGLE_CLOUD_PROJECT%
set FIRESTORE_DATABASE_ID=myvault
set FIREBASE_STORAGE_BUCKET=myvault-f3f99.firebasestorage.app
echo Using GCP Project: %GOOGLE_CLOUD_PROJECT%

REM Start Backend in new window with working directory  
echo Starting Backend Server...
start "MyVault Backend" /D "%BACKEND_DIR%" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

REM Wait a bit for backend to come up
echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

REM Start Frontend in new window from frontend root (workspace script will run apps/web)
echo Starting Frontend Development Server...
start "MyVault Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo Both services are starting...
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo API Documentation: http://localhost:8000/api/docs
echo.
echo You can close this window. Services will continue in their own terminals.
endlocal