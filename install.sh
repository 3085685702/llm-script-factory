#!/bin/bash

set -e  # 任何命令失败时自动退出

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Script Factory AI - 安装脚本 (Mac/Linux)"
echo "========================================"
echo ""

# 1. 检查 Python
echo "[1/5] 检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ [错误] 未找到 python3，请先安装 Python 3.10+"
    exit 1
fi
echo "      ✅ Python 已安装 ($(python3 --version))"

# 2. 检查 Node.js
echo "[2/5] 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ [错误] 未找到 node，请先安装 Node.js 18+"
    exit 1
fi
echo "      ✅ Node.js 已安装 ($(node --version))"

# 3. 初始化后端
echo "[3/5] 初始化后端环境..."
cd backend || { echo "❌ [错误] 无法进入 backend 目录"; exit 1; }

if [ ! -d ".venv" ]; then
    echo "      🔨 创建 Python 虚拟环境..."
    python3 -m venv .venv || { echo "❌ [错误] 创建虚拟环境失败"; exit 1; }
else
    echo "      Using existing venv..."
fi

source .venv/bin/activate || { echo "❌ [错误] 激活虚拟环境失败"; exit 1; }

echo "      📦 安装后端依赖..."
pip install -r requirements.txt || { echo "❌ [错误] 安装后端依赖失败"; exit 1; }

# 自动配置 .env
if [ ! -f ".env" ]; then
    echo "      ⚙️  未检测到 .env，正在从 .env.example 复制..."
    if [ -f ".env.example" ]; then
        cp .env.example .env || { echo "❌ [错误] 复制 .env 文件失败"; exit 1; }
        echo "      ⚠️  请稍后编辑 backend/.env 填入您的 API Key！"
    else
        echo "      ⚠️  .env.example 不存在，请手动创建 backend/.env 文件"
    fi
else
    echo "      ✅ .env文件已存在"
fi

cd "$SCRIPT_DIR"
echo "      ✅ 后端环境已就绪"

# 4. 安装前端依赖
echo "[4/5] 安装前端依赖..."
cd frontend || { echo "❌ [错误] 无法进入 frontend 目录"; exit 1; }
npm install || { echo "❌ [错误] 安装前端依赖失败"; exit 1; }
echo "      ✅ 前端依赖已安装"

# 5. 构建前端
echo "[5/5] 构建前端生产版本..."
npm run build || { echo "❌ [错误] 前端构建失败"; exit 1; }
cd "$SCRIPT_DIR"
echo "      ✅ 前端构建完成"

echo ""
echo "========================================"
echo "  🎉 安装完成！"
echo "========================================"
echo ""
echo "👉 运行方式: ./start.sh"
echo "👉 记得配置 API Key: 编辑 backend/.env 文件"
echo ""
