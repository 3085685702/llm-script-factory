#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🚀 正在启动 Script Factory AI..."

# 检查后端虚拟环境是否存在
if [ ! -d "backend/.venv" ]; then
    echo "❌ 未检测到后端虚拟环境，请先运行安装脚本或参考 README 配置环境。"
    echo "   (Checked: backend/.venv)"
    exit 1
fi

# 启动后端
echo "🔥 启动后端服务..."
cd backend
source .venv/bin/activate
# 使用 nohup 运行或直接后台运行，这里选择后台运行并将日志输出到文件或保持在终端
# 为了让用户看到日志，我们不重定向输出，或者我们可以选择开新终端
# 这里采用单窗口聚合模式，通过 trap 清理后台进程
uvicorn main:app --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端 PID: $BACKEND_PID (日志: backend.log)"
cd ..

# 等待后端稍微初始化
sleep 2

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "❌ 未检测到 frontend/node_modules，请先运行 npm install。"
    # 尝试清理后端
    kill $BACKEND_PID
    exit 1
fi

npm run start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端 PID: $FRONTEND_PID (日志: frontend.log)"
cd ..

# 等待前端启动
sleep 3

# 打开浏览器
echo "🌐 打开浏览器..."
open "http://127.0.0.1:3000"

echo ""
echo "✅ 服务已启动！"
echo "   - 后端日志见: backend.log"
echo "   - 前端日志见: frontend.log"
echo "👉 按 Ctrl+C 停止所有服务"

# 捕获退出信号以清理子进程
cleanup() {
    echo ""
    echo "🛑正在停止服务..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT SIGTERM

# 保持脚本运行
wait
