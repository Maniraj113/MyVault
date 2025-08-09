@echo off
echo Setting up MyVault Backend...

echo Current directory: %CD%
echo Changing to backend directory...
cd /d "%~dp0..\backend"
echo Now in: %CD%

echo Creating virtual environment in backend\venv...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo ✅ Backend setup complete!
echo Virtual environment created at: %CD%\venv
echo.
echo To start the backend server, run: scripts\start_backend.bat
echo Or manually run: cd backend && venv\Scripts\activate && python -m uvicorn main:app --reload
pause
