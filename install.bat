@echo off
echo ========================================
echo   Script Factory AI - Installation
echo ========================================
echo.

:: Store the root directory
set "ROOT_DIR=%~dp0"

:: Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)
echo       Python is installed

:: Check Node.js
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
echo       Node.js is installed

:: Setup Backend
echo [3/5] Setting up backend...
if not exist "%ROOT_DIR%backend" (
    echo [ERROR] backend directory not found
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%backend"

if exist ".venv" (
    echo       Removing old virtual environment...
    rmdir /s /q .venv 2>nul
    if exist ".venv" (
        echo [ERROR] Failed to remove old venv. A process may be using it.
        cd /d "%ROOT_DIR%"
        pause
        exit /b 1
    )
)

echo       Creating Python virtual environment...
python -m venv .venv
if errorlevel 1 (
    echo [ERROR] Failed to create virtual environment
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)

echo       Installing backend dependencies...
call .venv\Scripts\pip install -r requirements.txt -q
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)

:: Auto configure .env
if not exist ".env" (
    echo       .env not found, copying from .env.example...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo       [NOTE] Please edit backend\.env to add your API Key!
    ) else (
        echo       [NOTE] .env.example not found. Please create backend\.env manually.
    )
) else (
    echo       .env file exists
)

cd /d "%ROOT_DIR%"
echo       Backend is ready

:: Setup Frontend
echo [4/5] Installing frontend dependencies...
if not exist "%ROOT_DIR%frontend" (
    echo [ERROR] frontend directory not found
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%frontend"

call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)
echo       Frontend dependencies installed

:: Build Frontend
echo [5/5] Building frontend for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo       Frontend build complete

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo To start: double-click start.bat
echo.
pause
