@echo off
chcp 65001 >nul
echo ========================================
echo   Script Factory AI - 安装脚本
echo ========================================
echo.

:: Store the root directory
set "ROOT_DIR=%~dp0"

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
    echo [错误] 未找到 Node.js，请先安装 Node.js 22+
    pause
    exit /b 1
)
echo       Node.js 已安装

:: Setup Backend
echo [3/5] 初始化后端环境...
cd /d "%ROOT_DIR%backend"
if errorlevel 1 (
    echo [错误] 无法进入 backend 目录
    pause
    exit /b 1
)

if not exist ".venv" (
    echo       创建 Python 虚拟环境...
    python -m venv .venv
    if errorlevel 1 (
        echo [错误] 创建虚拟环境失败
        cd /d "%ROOT_DIR%"
        pause
        exit /b 1
    )
)

echo       安装后端依赖...
call .venv\Scripts\pip install -r requirements.txt -q
if errorlevel 1 (
    echo [错误] 安装后端依赖失败
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo       后端环境已就绪

:: Setup Frontend
echo [4/5] 安装前端依赖...
cd /d "%ROOT_DIR%frontend"
if errorlevel 1 (
    echo [错误] 无法进入 frontend 目录
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo [错误] 安装前端依赖失败
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)
echo       前端依赖已安装

:: Build Frontend
echo [5/5] 构建前端生产版本...
call npm run build
if errorlevel 1 (
    echo [错误] 前端构建失败
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%"
echo       前端构建完成

echo.
echo ========================================
echo   安装完成！
echo ========================================
echo.
echo 运行方式: 双击 start.bat 一键启动
echo.
pause
