#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Script Factory AI - 安装脚本 (Mac/Linux)"
echo "========================================"
echo ""

# 1. 检查 Python
echo "[1/6] 检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ [错误] 未找到 python3，请先安装 Python 3.10+"
    exit 1
fi
echo "      ✅ Python 已安装 ($(python3 --version))"

# 2. 检查 Node.js
echo "[2/6] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ [错误] 未找到 node，请先安装 Node.js 18+"
    exit 1
fi
echo "      ✅ Node.js 已安装 ($(node --version))"

# 3. 初始化后端
echo "[3/6] 初始化后端环境..."
cd backend

if [ ! -d ".venv" ]; then
    echo "      🔨 创建 Python 虚拟环境..."
    python3 -m venv .venv
else
    echo "      Using existing venv..."
fi

source .venv/bin/activate

echo "      📦 安装后端依赖..."
pip install -r requirements.txt

# 自动配置 .env
if [ ! -f ".env" ]; then
    echo "      ⚙️  未检测到 .env，正在从 .env.example 复制..."
    cp .env.example .env
    echo "      ⚠️  请稍后编辑 backend/.env 填入您的 API Key！"
else
    echo "      ✅ .env文件已存在"
fi

cd ..
echo "      ✅ 后端环境已就绪"

# 4. 安装前端依赖
echo "[4/6] 安装前端依赖..."
cd frontend
npm install
echo "      ✅ 前端依赖已安装"

# 5. 构建前端
echo "[5/6] 构建前端生产版本..."
npm run build
cd ..
echo "      ✅ 前端构建完成"

echo ""
echo "========================================"
echo "  🎉 安装完成！"
echo "========================================"
echo ""
echo "👉 运行方式: ./start.sh"
echo "👉 记得配置 API Key: 编辑 backend/.env 文件"
echo ""
