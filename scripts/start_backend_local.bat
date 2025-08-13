@echo off
echo Starting MyVault Backend Server...

REM Set environment variables for local development
set ENV=local
set GOOGLE_CLOUD_PROJECT=myvault-f3f99
set FIRESTORE_DATABASE_ID=myvault
set FRONTEND_ORIGIN=http://localhost:5173
set PORT=8000

echo Setting up environment variables...
echo - ENV=%ENV%
echo - Project: %GOOGLE_CLOUD_PROJECT%
echo - Database: %FIRESTORE_DATABASE_ID%
echo - Frontend Origin: %FRONTEND_ORIGIN%
echo - Port: %PORT%

REM Navigate to backend directory
cd /d "%~dp0..\backend"

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Start the server
echo Starting FastAPI server...
python -m uvicorn main:app --host 127.0.0.1 --port %PORT% --reload

pause
