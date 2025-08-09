@echo off
echo Starting MyVault Backend Server...

echo Changing to backend directory...
cd /d "%~dp0..\backend"
echo Current directory: %CD%

echo Activating virtual environment...
call venv\Scripts\activate.bat
echo ✅ Virtual environment activated.

echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/api/docs
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

pause
