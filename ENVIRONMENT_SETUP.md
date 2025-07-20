# 环境设置指南

## 概述

本项目支持本地开发环境和阿里云生产环境的自动识别和配置。通过智能的环境检测，系统会自动选择正确的Python虚拟环境路径。

## 环境检测机制

### 本地开发环境 (development)
- **检测条件**: 不在PM2环境下，工作目录不包含 `/home/project` 或 `/root`
- **虚拟环境路径**: `./venv` (项目根目录下的venv文件夹)
- **适用场景**: 本地开发、测试

### 阿里云生产环境 (production)
- **检测条件**: 
  - `NODE_ENV=production`
  - 存在 `PM2_HOME` 环境变量
  - 存在 `PM2_INSTALL_PATH` 环境变量
  - 工作目录包含 `/home/project` 或 `/root`
- **虚拟环境路径**: `../venv` (项目根目录的上一级目录)
- **适用场景**: 阿里云服务器部署

## 文件结构

```
python-ncm-mp3-1/
├── config.js              # 环境配置文件
├── server.js              # 主服务器文件
├── test_environment.js    # 环境检测测试脚本
├── .gitignore            # Git忽略文件
├── venv/                 # 本地虚拟环境 (不提交到Git)
├── uploads/              # 上传文件目录
├── static/               # 静态文件目录
│   └── mp3/             # 转换后的MP3文件
└── public/              # 前端文件
```

## 本地开发环境设置

### 1. 创建虚拟环境
```bash
# 在项目根目录下创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install ncmdump
```

### 2. 安装Node.js依赖
```bash
npm install
```

### 3. 测试环境配置
```bash
node test_environment.js
```

### 4. 启动服务器
```bash
node server.js
```

## 阿里云生产环境设置

### 1. 在阿里云服务器上创建虚拟环境
```bash
# 进入项目目录的上一级
cd /home/project
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
pip install ncmdump
```

### 2. 使用PM2启动服务
```bash
# 设置生产环境变量
export NODE_ENV=production

# 使用PM2启动
pm2 start server.js --name ncm-converter
```

### 3. 验证部署
```bash
# 检查健康状态
curl http://your-domain.com/api/health
```

## 环境变量

### 本地开发环境
```bash
# 可选：明确设置开发环境
export NODE_ENV=development
```

### 阿里云生产环境
```bash
# 必须：设置生产环境
export NODE_ENV=production
```

## 配置系统功能

### 自动环境检测
- 根据环境变量和工作目录自动识别环境
- 自动选择正确的虚拟环境路径
- 提供详细的配置信息

### 健康检查
- 提供 `/api/health` 端点
- 检查虚拟环境状态
- 监控服务运行状态

### 错误处理
- 虚拟环境不存在时的友好错误提示
- 自动回退到系统Python（如果可用）
- 详细的错误日志

## 测试和验证

### 1. 环境检测测试
```bash
node test_environment.js
```

### 2. 健康检查测试
```bash
curl http://localhost:3000/api/health
```

### 3. 文件转换测试
```bash
curl -X POST -F "file=@uploads/test.ncm" http://localhost:3000/api/convert
```

## 常见问题

### Q: 为什么本地venv不能上传到Git？
A: 虚拟环境包含大量二进制文件和依赖，通常很大且与系统相关。我们通过 `.gitignore` 忽略 `venv/` 目录，每个环境需要单独创建虚拟环境。

### Q: 如何确保阿里云环境使用正确的虚拟环境？
A: 系统会自动检测PM2环境变量和工作目录，自动选择 `../venv` 路径。确保在项目根目录的上一级创建虚拟环境。

### Q: 如何手动指定虚拟环境路径？
A: 可以修改 `config.js` 中的 `getVenvPath()` 函数来自定义路径逻辑。

## 部署检查清单

### 本地开发环境
- [ ] 虚拟环境已创建 (`python3 -m venv venv`)
- [ ] 依赖已安装 (`pip install ncmdump`)
- [ ] Node.js依赖已安装 (`npm install`)
- [ ] 环境检测正常 (`node test_environment.js`)
- [ ] 服务器启动正常 (`node server.js`)

### 阿里云生产环境
- [ ] 虚拟环境已创建在上一级目录 (`../venv`)
- [ ] 依赖已安装 (`pip install ncmdump`)
- [ ] 环境变量已设置 (`NODE_ENV=production`)
- [ ] PM2已配置并启动
- [ ] 健康检查正常 (`/api/health`)
- [ ] 文件转换功能正常 