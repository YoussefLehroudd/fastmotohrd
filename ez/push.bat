@echo off
echo.
echo === Git Status ===
git status

echo.
echo === Staging Changes ===
git add .

echo.
echo === Committing Changes ===
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    git commit -m "update: project changes"
) else (
    git commit -m "%commit_msg%"
)

echo.
echo === Pushing Changes ===
git push

echo.
echo === Operation Complete ===
pause
