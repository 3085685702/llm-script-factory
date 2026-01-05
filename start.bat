@echo off
echo Starting Script Factory AI...
echo.

:: Store root directory
set "ROOT=%~dp0"

:: Check backend virtual environment
if not exist "%ROOT%backend\.venv" (
    echo [ERROR] Backend venv not found. Please run install.bat first.
    pause
    exit /b 1
)

:: Check frontend dependencies
if not exist "%ROOT%frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found. Please run install.bat first.
    pause
    exit /b 1
)

:: Start backend (new window)
echo Starting backend service...
start "Backend" cmd /k "cd /d "%ROOT%backend" && .venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000"

:: Wait for backend to start
timeout /t 2 /nobreak >nul

:: Start frontend (new window)
echo Starting frontend service...
start "Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run start"

:: Wait for frontend to start, then open browser
timeout /t 3 /nobreak >nul
start http://127.0.0.1:3000

echo.
echo Backend and frontend started in separate windows.
echo Browser will open shortly...
timeout /t 2 >nul
exit
