@echo off
echo Starting Motor Shop Application...

echo.
echo Starting backend server...
start cmd /k "cd backend && npm run dev"

echo.
echo Starting frontend server...
start cmd /k "cd frontend && npm start"

echo.
echo Servers started successfully!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:5000
