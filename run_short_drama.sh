#!/bin/bash

echo "正在启动短剧剧本生成工具..."
echo

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查Python是否安装
if ! command -v python3 &> /dev/null
then
    echo "错误：未检测到Python3，请先安装Python 3.10+版本"
    read -p "按任意键退出"
    exit 1
fi

# 安装依赖
echo "正在检查并安装依赖..."
cd backend || { echo "错误：未找到 backend 目录"; read -p "按任意键退出"; exit 1; }
python3 -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

if [ $? -ne 0 ]; then
    echo "依赖安装失败，请检查网络连接"
    read -p "按任意键退出"
    exit 1
fi

# 启动主程序
echo
echo "依赖安装完成，正在启动剧本生成..."
python3 main.py

read -p "按任意键退出"
