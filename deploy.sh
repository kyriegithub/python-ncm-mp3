#!/bin/bash

# 阿里云部署脚本
echo "=== 阿里云部署脚本 ==="

# 设置环境变量
export NODE_ENV=production
echo "设置环境变量: NODE_ENV=production"

# 检查当前目录
echo "当前目录: $(pwd)"

# 进入项目目录
if [ ! -f "server.js" ]; then
    echo "未找到server.js，尝试进入项目目录..."
    if [ -d "/home/project/python-ncm-mp3" ]; then
        cd /home/project/python-ncm-mp3
        echo "已进入项目目录: $(pwd)"
    else
        echo "错误: 找不到项目目录 /home/project/python-ncm-mp3"
        exit 1
    fi
fi

# 检查虚拟环境
echo "检查虚拟环境..."
if [ ! -d "/home/project/venv" ]; then
    echo "虚拟环境不存在，正在创建..."
    cd /home/project
    python3 -m venv venv
    source venv/bin/activate
    pip install ncmdump
    cd /home/project/python-ncm-mp3
    echo "虚拟环境创建完成"
else
    echo "虚拟环境已存在: /home/project/venv"
fi

# 检查Node.js依赖
echo "检查Node.js依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装Node.js依赖..."
    npm install
fi

# 停止现有服务
echo "停止现有服务..."
pm2 stop ncm-converter 2>/dev/null || echo "没有运行中的ncm-converter服务"
pm2 delete ncm-converter 2>/dev/null || echo "没有ncm-converter服务配置"

# 启动服务
echo "启动服务..."
pm2 start server.js --name ncm-converter

# 保存PM2配置
echo "保存PM2配置..."
pm2 save

# 显示状态
echo "=== 部署完成 ==="
pm2 status

echo ""
echo "=== 测试健康检查 ==="
sleep 3
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || echo "健康检查失败，请稍后重试"

echo ""
echo "=== 部署完成！ ==="
echo "服务名称: ncm-converter"
echo "端口: 3000"
echo "健康检查: http://localhost:3000/api/health" 