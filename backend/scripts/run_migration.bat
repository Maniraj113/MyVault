@echo off
echo ========================================
echo SQLite to Firestore Migration Tool
echo ========================================
echo.

REM Check if SQLite file path is provided
if "%~1"=="" (
    echo Usage: run_migration.bat <path_to_sqlite_file>
    echo.
    echo Example: run_migration.bat C:\Users\cmani\Desktop\my_finance_data.db
    echo.
    pause
    exit /b 1
)

REM Check if SQLite file exists
if not exist "%~1" (
    echo ERROR: SQLite file not found: %~1
    echo.
    pause
    exit /b 1
)

echo Starting migration from: %~1
echo.

REM Activate virtual environment if it exists
if exist "..\venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call "..\venv\Scripts\activate.bat"
)

REM Run the migration script
echo Running migration script...
python migrate_sqlite_to_firestore.py "%~1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Your data has been migrated to Firestore.
    echo You can now view it in your MyVault application.
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Check the error messages above for details.
    echo.
)

pause

