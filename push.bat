@echo off
REM hadi bach ydir psh l projet aml bga3 es file li fih

echo === Git Status ===
git status

echo.
echo === Fixing detached HEAD ===
REM Get current commit hash
for /f %%i in ('git rev-parse HEAD') do set current_commit=%%i

REM Force checkout main and reset to current commit
git checkout -B main %current_commit%

echo.
echo === Staging Changes ===
git add .

echo.
echo === Committing Changes ===
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="Update changes"
git commit -m "%commit_msg%"

echo.
echo === Pushing Changes ===
git push -f origin main

echo.
echo === Operation Complete ===
pause
