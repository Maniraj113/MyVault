@echo off
echo Starting MyVault Frontend...

cd frontend
echo Installing dependencies if needed...
npm install

echo Starting development server...
npm run dev

pause
