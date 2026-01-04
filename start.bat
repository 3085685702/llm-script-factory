@echo off
chcp 65001 >nul
echo 启动 Script Factory AI...

:: 启动后端（新窗口）
start "后端服务" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\uvicorn main:app --host 127.0.0.1 --port 8000"

:: 等待后端启动
timeout /t 2 /nobreak >nul

:: 启动前端（新窗口，生产模式）
start "前端服务" cmd /k "cd /d "%~dp0frontend" && npm run start"

:: 等待前端启动后打开浏览器
timeout /t 3 /nobreak >nul
start http://127.0.0.1:3000

echo.
echo 已启动后端和前端服务，浏览器即将打开...
echo 关闭此窗口不会影响服务运行
timeout /t 3 >nul
