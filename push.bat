@echo off
echo Starting Git Push Process...

REM Add all changes
echo Adding all changes...
git add .

REM Get commit message from user
set /p commit_msg=Enter your commit message: 

REM Commit changes with the provided message
echo Committing changes...
git commit -m "%commit_msg%"

REM Push to remote repository
echo Pushing to remote repository...
git push

echo Push process completed!
pause
