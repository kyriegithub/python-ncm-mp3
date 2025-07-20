# 阿里云部署步骤指南

## 正确的部署步骤

### 1. 进入项目目录
```bash
cd /home/project/python-ncm-mp3-1
```

### 2. 在上一级目录创建虚拟环境
```bash
# 回到上一级目录
cd /home/project

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install ncmdump
```

### 3. 回到项目目录并启动服务
```bash
# 回到项目目录
cd /home/project/python-ncm-mp3-1

# 设置生产环境变量
export NODE_ENV=production

# 使用PM2启动服务（指定完整路径）
pm2 start /home/project/python-ncm-mp3-1/server.js --name ncm-converter
```

## 或者使用相对路径启动

### 方法1：在项目目录下启动
```bash
# 确保在项目目录下
cd /home/project/python-ncm-mp3-1

# 设置环境变量
export NODE_ENV=production

# 启动服务
pm2 start server.js --name ncm-converter
```

### 方法2：使用完整路径
```bash
# 在任何目录下都可以
export NODE_ENV=production
pm2 start /home/project/python-ncm-mp3-1/server.js --name ncm-converter
```

## 验证部署

### 1. 检查PM2状态
```bash
pm2 status
pm2 logs ncm-converter
```

### 2. 测试健康检查
```bash
curl http://localhost:3000/api/health
```

### 3. 测试文件转换
```bash
# 上传测试文件
curl -X POST -F "file=@/path/to/test.ncm" http://localhost:3000/api/convert
```

## 常见问题解决

### 问题1：PM2找不到server.js
**错误**: `[PM2][ERROR] Script not found: /home/project/server.js`

**解决方案**: 
- 确保在正确的项目目录下：`cd /home/project/python-ncm-mp3-1`
- 或使用完整路径：`pm2 start /home/project/python-ncm-mp3-1/server.js`

### 问题2：虚拟环境路径错误
**错误**: Python虚拟环境不存在

**解决方案**:
- 确保虚拟环境在 `/home/project/venv`
- 检查环境变量：`export NODE_ENV=production`

### 问题3：端口被占用
**错误**: `EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 停止现有服务
pm2 stop ncm-converter
pm2 delete ncm-converter

# 重新启动
pm2 start server.js --name ncm-converter
```

## 完整的部署脚本

创建一个部署脚本 `deploy.sh`:

```bash
#!/bin/bash

# 设置环境变量
export NODE_ENV=production

# 进入项目目录
cd /home/project/python-ncm-mp3-1

# 停止现有服务
pm2 stop ncm-converter 2>/dev/null || true
pm2 delete ncm-converter 2>/dev/null || true

# 启动服务
pm2 start server.js --name ncm-converter

# 保存PM2配置
pm2 save

# 显示状态
pm2 status
```

## 目录结构确认

确保你的目录结构如下：
```
/home/project/
├── venv/                    # 虚拟环境（在上一级目录）
│   ├── bin/
│   │   └── python
│   └── lib/
└── python-ncm-mp3-1/        # 项目目录
    ├── server.js
    ├── config.js
    ├── package.json
    ├── uploads/
    ├── static/
    └── public/
```

## 环境检测验证

在启动服务前，可以验证环境检测：

```bash
cd /home/project/python-ncm-mp3-1
export NODE_ENV=production
node -e "const config = require('./config'); console.log(config.getConfig())"
```

应该输出：
```json
{
  "environment": "production",
  "isProduction": true,
  "venv": {
    "venvPath": "/home/project/venv",
    "pythonPath": "/home/project/venv/bin/python",
    "venvExists": true,
    "pythonExists": true
  }
}
``` 