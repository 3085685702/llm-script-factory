#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Script Factory AI - Installation (Mac)"
echo "========================================"
echo ""

# 1. Check Python
echo "[1/5] Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 not found. Please install Python 3.10+"
    exit 1
fi
echo "      Python is installed ($(python3 --version))"

# 2. Check Node.js
echo "[2/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] node not found. Please install Node.js 18+"
    exit 1
fi
echo "      Node.js is installed ($(node --version))"

# 3. Setup backend
echo "[3/5] Setting up backend..."
cd backend || { echo "[ERROR] Cannot enter backend directory"; exit 1; }

if [ -d ".venv" ]; then
    echo "      Removing old virtual environment..."
    rm -rf .venv || { echo "[ERROR] Failed to remove old venv"; exit 1; }
fi

echo "      Creating Python virtual environment..."
python3 -m venv .venv || { echo "[ERROR] Failed to create virtual environment"; exit 1; }

source .venv/bin/activate || { echo "[ERROR] Failed to activate virtual environment"; exit 1; }

echo "      Installing backend dependencies..."
pip install -r requirements.txt || { echo "[ERROR] Failed to install backend dependencies"; exit 1; }

# Auto configure .env
if [ ! -f ".env" ]; then
    echo "      .env not found, copying from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env || { echo "[ERROR] Failed to copy .env file"; exit 1; }
        echo "      [NOTE] Please edit backend/.env to add your API Key!"
    else
        echo "      [NOTE] .env.example not found. Please create backend/.env manually."
    fi
else
    echo "      .env file exists"
fi

cd "$SCRIPT_DIR"
echo "      Backend is ready"

# 4. Install frontend dependencies
echo "[4/5] Installing frontend dependencies..."
cd frontend || { echo "[ERROR] Cannot enter frontend directory"; exit 1; }
npm install || { echo "[ERROR] Failed to install frontend dependencies"; exit 1; }
echo "      Frontend dependencies installed"

# 5. Build frontend
echo "[5/5] Building frontend for production..."
npm run build || { echo "[ERROR] Frontend build failed"; exit 1; }
cd "$SCRIPT_DIR"
echo "      Frontend build complete"

echo ""
echo "========================================"
echo "  Installation Complete!"
echo "========================================"
echo ""
echo "To start: ./start.sh"
echo "Remember to configure your API Key in backend/.env"
echo ""
