@echo off
chcp 65001 >nul
echo ========================================
echo   Script Factory AI - 安装脚本
echo ========================================
echo.

:: Check Python
echo [1/5] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)
echo       Python 已安装

:: Check Node.js
echo [2/5] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
echo       Node.js 已安装

:: Setup Backend
echo [3/5] 初始化后端环境...
cd backend
if not exist ".venv" (
    echo       创建 Python 虚拟环境...
    python -m venv .venv
)
echo       安装后端依赖...
.venv\Scripts\pip install -r requirements.txt -q
cd ..
echo       后端环境已就绪

:: Setup Frontend
echo [4/5] 安装前端依赖...
cd frontend
call npm install
echo       前端依赖已安装

:: Build Frontend
echo [5/5] 构建前端生产版本...
call npm run build
cd ..
echo       前端构建完成

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 运行方式: 双击 start.bat 一键启动
echo.
pause
