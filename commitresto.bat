@echo off
echo Current commits (copy the hash on the left, not the message):
echo.

REM List all commits with their hashes and messages
git log --oneline

echo.
echo Example: For "381cb2e add chat work now", enter: 381cb2e
echo.
set /p commit_hash="Enter the commit hash (left column): "

REM Verify if commit hash exists
git rev-parse --verify %commit_hash% >nul 2>&1
if errorlevel 1 (
    echo.
    echo Error: Invalid commit hash. Please enter the hash from the left column.
    echo Example: 381cb2e
    pause
    exit /b 1
)

echo.
echo Restoring to commit %commit_hash%...

REM Reset to specified commit
git reset --hard %commit_hash%

REM Clean untracked files and directories
git clean -fd

echo.
echo Successfully restored to commit %commit_hash%!
pause
