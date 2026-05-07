@echo off
chcp 65001
echo 正在启动短剧剧本生成工具...
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误：未检测到Python，请先安装Python 3.10+版本
    pause
    exit /b 1
)

:: 进入 backend 目录
cd /d "%~dp0backend"
if errorlevel 1 (
    echo 错误：未找到 backend 目录
    pause
    exit /b 1
)

:: 安装依赖
echo 正在检查并安装依赖...
python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
if errorlevel 1 (
    echo 依赖安装失败，请检查网络连接
    pause
    exit /b 1
)

:: 启动主程序
echo.
echo 依赖安装完成，正在启动剧本生成...
python main.py

pause
