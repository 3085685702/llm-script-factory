@echo off
chcp 65001 >nul
echo 启动 Script Factory AI...
echo.

:: 保存当前目录
set "ROOT=%~dp0"

:: 启动后端（新窗口）
echo 正在启动后端服务...
start "后端服务" cmd /k "cd /d %ROOT%backend && .venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000"

:: 等待后端启动
timeout /t 2 /nobreak >nul

:: 启动前端（新窗口）
echo 正在启动前端服务...
start "前端服务" cmd /k "cd /d %ROOT%frontend && npm run start"

:: 等待前端启动后打开浏览器
timeout /t 3 /nobreak >nul
start http://127.0.0.1:3000

echo.
echo 后端和前端已在独立窗口中启动，浏览器即将打开...
echo 此窗口将自动关闭
timeout /t 2 >nul
exit
