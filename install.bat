@echo off
REM 7ta hadi bach dir installe lkolchy

echo Installing root dependencies...
call npm install

echo.
echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo All dependencies installed successfully!
pause
