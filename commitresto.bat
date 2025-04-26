@echo off
REM hadi bach ay commit 3titiha tjibo dir resto
REM List all commits with their hashes and messages
git log --oneline
echo.
echo === Git Restore to Commit ===
set /p commit_hash="Enter the commit hash to restore to: "

echo.
echo === Restoring to Commit %commit_hash% ===
git checkout %commit_hash%

echo.
echo === Operation Complete ===
pause
