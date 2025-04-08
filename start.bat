@echo off
echo Installing backend dependencies...
cd backend
call npm install

echo.
echo Installing frontend dependencies...
cd ../frontend
call npm install

echo.
echo Starting backend server...
start cmd /k "cd ../backend && npm run dev"

echo.
echo Starting frontend development server...
start cmd /k "cd ../frontend && npm start"

echo.
echo Services are starting up...
echo Backend will run on http://localhost:3000 (or check terminal for port)
echo Frontend will run on http://localhost:3000 (will auto-select next available port if 3000 is taken)
echo.
echo Press any key to close this window...
pause > nul
