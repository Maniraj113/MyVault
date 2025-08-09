@REM @echo off
@REM setlocal enabledelayedexpansion

@REM :: Get current branch name
@REM for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%a

@REM echo Current branch: %CURRENT_BRANCH%

@REM :: Navigate to project root
@REM cd ..

@REM :: Remove all __pycache__ directories from Git tracking
@REM echo Removing __pycache__ directories from Git tracking...
@REM git rm -r --cached "**/__pycache__" > nul 2>&1
@REM git rm -r --cached "backend/**/__pycache__" > nul 2>&1
@REM git rm -r --cached "backend/__pycache__" > nul 2>&1
@REM git rm -r --cached "ai_agent/**/__pycache__" > nul 2>&1
@REM git rm -r --cached "log_analyser/**/__pycache__" > nul 2>&1

@REM :: Get current timestamp for commit message
@REM for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
@REM set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%

@REM :: Check if custom message provided
@REM if "%~1"=="" (
@REM     set "COMMIT_MSG=Auto-commit: Updates as of %TIMESTAMP%"
@REM ) else (
@REM     set "COMMIT_MSG=%~1"
@REM )

@REM echo.
@REM echo Git Automation Script
@REM echo ====================
@REM echo.

@REM :: Add all changes
@REM echo Adding changes...
@REM git add .

@REM :: Check if there are changes to commit
@REM git diff --cached --quiet
@REM if %ERRORLEVEL% NEQ 0 (
@REM     :: Commit changes
@REM     echo.
@REM     echo Committing with message: "%COMMIT_MSG%"
@REM     git commit -m "%COMMIT_MSG%"
@REM ) else (
@REM     echo No changes to commit.
@REM )

@REM :: Fetch remote changes first
@REM echo.
@REM echo Fetching latest changes from remote...
@REM git fetch origin

@REM :: Check if branches have diverged
@REM git rev-list --count --left-right %CURRENT_BRANCH%...origin/%CURRENT_BRANCH% > diverge_check.tmp
@REM set /p DIVERGE_STATUS=<diverge_check.tmp
@REM del diverge_check.tmp

@REM echo Branch status: %DIVERGE_STATUS%
@REM echo.

@REM :: If branches have diverged (both numbers > 0), handle with safe merge strategy
@REM if "%DIVERGE_STATUS%" NEQ "0	0" (
@REM     echo Branches have diverged, using safe merge strategy...
    
@REM     :: Create backup branch of current state
@REM     set BACKUP_BRANCH=backup-%CURRENT_BRANCH%-%TIMESTAMP:-=_%
@REM     echo Creating backup branch: %BACKUP_BRANCH%
@REM     git branch %BACKUP_BRANCH%
    
@REM     :: Try merge approach first (safer than rebase for novices)
@REM     echo Merging remote changes...
@REM     git merge origin/%CURRENT_BRANCH% --no-commit
    
@REM     if %ERRORLEVEL% NEQ 0 (
@REM         :: If merge has conflicts, abort and advise manual resolution
@REM         git merge --abort
@REM         echo.
@REM         echo Merge conflicts detected!
@REM         echo.
@REM         echo Your changes are safely stored in branch: %BACKUP_BRANCH%
@REM         echo.
@REM         echo To resolve manually:
@REM         echo 1. Resolve the conflicts: git pull
@REM         echo 2. Push your changes: git push origin %CURRENT_BRANCH%
@REM         echo.
@REM         goto :END
@REM     )
    
@REM     :: Commit the merge if successful
@REM     git commit -m "Merge remote changes into %CURRENT_BRANCH%"
@REM )

@REM :: Push to remote with current branch
@REM echo.
@REM echo Pushing to remote repository (branch: %CURRENT_BRANCH%)...
@REM git push origin %CURRENT_BRANCH%

@REM if %ERRORLEVEL% EQU 0 (
@REM     echo.
@REM     echo Successfully pushed changes to GitHub on branch: %CURRENT_BRANCH%
@REM ) else (
@REM     echo.
@REM     echo Error pushing changes to GitHub
@REM     echo.
@REM     echo Your changes are safe in your local repository
@REM     echo To fix this issue manually:
@REM     echo 1. git pull origin %CURRENT_BRANCH% --rebase
@REM     echo 2. Resolve any conflicts if they occur
@REM     echo 3. git push origin %CURRENT_BRANCH%
@REM )

@REM :END
@REM endlocal 


@echo off
setlocal enabledelayedexpansion

:: Get current branch name
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%a

echo Current branch: %CURRENT_BRANCH%

:: Navigate to project root
cd ..

:: Remove all __pycache__ directories from Git tracking
echo Removing __pycache__ directories from Git tracking...
git rm -r --cached "**/__pycache__" > nul 2>&1
git rm -r --cached "backend/**/__pycache__" > nul 2>&1
git rm -r --cached "backend/__pycache__" > nul 2>&1
git rm -r --cached "ai_agent/**/__pycache__" > nul 2>&1
git rm -r --cached "log_analyser/**/__pycache__" > nul 2>&1

:: Get current timestamp for commit message
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2% %datetime:~8,2%:%datetime:~10,2%

:: Check if custom message provided
if "%~1"=="" (
    set "COMMIT_MSG=Auto-commit: Updates as of %TIMESTAMP%"
) else (
    set "COMMIT_MSG=%~1"
)

echo.
echo Git Automation Script
echo ====================
echo.

:: Add all changes
echo Adding changes...
git add .

:: Commit changes
echo.
echo Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

:: Push to remote with current branch
echo.
echo Pushing to remote repository (branch: %CURRENT_BRANCH%)...
git push origin %CURRENT_BRANCH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Successfully pushed changes to remote on branch: %CURRENT_BRANCH%
) else (
    echo.
    echo Error pushing changes to GitHub
    echo Please check your git configuration and try again
)

endlocal 