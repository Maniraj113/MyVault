@echo off
setlocal ENABLEDELAYEDEXPANSION
title MyVault - Production Deployment Setup

echo Setting up MyVault for Production Deployment...

REM Resolve absolute paths
set ROOT=%~dp0..
set BACKEND_DIR=%ROOT%\backend
set FRONTEND_DIR=%ROOT%\frontend

echo.
echo This script prepares your environment for production deployment
echo It will copy production environment files to active .env files
echo.

REM Copy production environment files
echo Setting up production environment...
copy "%BACKEND_DIR%\.env.production" "%BACKEND_DIR%\.env" >nul
copy "%FRONTEND_DIR%\.env.production" "%FRONTEND_DIR%\.env" >nul

echo.
echo Production environment configured:
echo - Backend: Using .env.production settings
echo - Frontend: Using .env.production settings
echo - Database: myvaultdb (production)
echo - CORS: Production frontend origins allowed
echo.
echo Next steps:
echo 1. Deploy backend to Cloud Run
echo 2. Deploy frontend to Cloud Run
echo 3. Update environment variables in Cloud Run if needed
echo.
echo For local testing with production config:
echo - Backend: cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000
echo - Frontend: cd frontend/apps/web && npm run build && npm run preview
echo.
pause
endlocal
