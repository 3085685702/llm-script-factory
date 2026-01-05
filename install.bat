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
if not exist "%ROOT_DIR%backend" (
    echo [错误] backend 目录不存在
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%backend"

if exist ".venv" (
    echo       检测到旧的虚拟环境，正在删除...
    rmdir /s /q .venv 2>nul
    if exist ".venv" (
        echo [错误] 删除旧虚拟环境失败，可能有进程正在使用
        cd /d "%ROOT_DIR%"
        pause
        exit /b 1
    )
)

echo       创建 Python 虚拟环境...
python -m venv .venv
if errorlevel 1 (
    echo [错误] 创建虚拟环境失败
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)

echo       安装后端依赖...
call .venv\Scripts\pip install -r requirements.txt -q
if errorlevel 1 (
    echo [错误] 安装后端依赖失败
    cd /d "%ROOT_DIR%"
    pause
    exit /b 1
)

:: 自动配置 .env
if not exist ".env" (
    echo       未检测到 .env，正在从 .env.example 复制...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo       [注意] 请稍后编辑 backend\.env 填入您的 API Key！
    ) else (
        echo       [注意] .env.example 不存在，请手动创建 backend\.env 文件
    )
) else (
    echo       .env 文件已存在
)

cd /d "%ROOT_DIR%"
echo       后端环境已就绪

:: Setup Frontend
echo [4/5] 安装前端依赖...
if not exist "%ROOT_DIR%frontend" (
    echo [错误] frontend 目录不存在
    pause
    exit /b 1
)
cd /d "%ROOT_DIR%frontend"

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
