# 阿里云服务器部署指南 - 解决文件转换为空问题

## 问题描述

在阿里云服务器上部署NCM转换器后，文件转换结果为空，但本地开发环境正常。

## 常见原因和解决方案

### 1. ncmdump工具未安装或版本不兼容

**问题**: 阿里云服务器可能没有安装ncmdump工具，或者版本不兼容。

**解决方案**:

```bash
# 方法1: 使用包管理器安装
sudo apt-get update
sudo apt-get install ncmdump

# 方法2: 从源码编译安装（推荐）
sudo apt-get update
sudo apt-get install build-essential git

# 克隆ncmdump源码
git clone https://github.com/anonymous5l/ncmdump.git
cd ncmdump

# 编译
make

# 安装到系统路径
sudo cp ncmdump /usr/local/bin/
sudo chmod +x /usr/local/bin/ncmdump

# 验证安装
ncmdump --help
which ncmdump
```

### 2. 文件权限问题

**问题**: 服务器用户没有足够的权限执行ncmdump或访问文件。

**解决方案**:

```bash
# 检查当前用户
whoami

# 设置目录权限
sudo chown -R $USER:$USER /path/to/your/project
chmod 755 uploads/
chmod 755 static/
chmod 755 static/mp3/

# 确保ncmdump可执行
sudo chmod +x /usr/local/bin/ncmdump

# 检查ncmdump权限
ls -la /usr/local/bin/ncmdump
```

### 3. 工作目录问题

**问题**: 服务器上的工作目录与本地不同，导致路径解析错误。

**解决方案**:

```bash
# 检查当前工作目录
pwd

# 确保在项目根目录运行
cd /path/to/your/project

# 使用绝对路径启动
node /path/to/your/project/server.js
```

### 4. 环境变量问题

**问题**: 服务器环境变量与本地不同。

**解决方案**:

```bash
# 检查环境变量
echo $PATH
echo $HOME
echo $PWD

# 设置必要的环境变量
export PATH="/usr/local/bin:$PATH"
export NODE_ENV=production
```

### 5. 系统资源限制

**问题**: 服务器内存或磁盘空间不足。

**解决方案**:

```bash
# 检查磁盘空间
df -h

# 检查内存使用
free -h

# 检查进程限制
ulimit -a

# 增加文件描述符限制
ulimit -n 4096
```

## 诊断步骤

### 1. 使用诊断工具

访问 `https://your-domain.com/diagnose.html` 进行远程诊断：

1. **基础连接测试**: 检查服务器基本功能
2. **文件转换测试**: 上传NCM文件测试转换
3. **静态文件访问测试**: 检查文件存储和访问
4. **目录权限测试**: 验证文件系统权限
5. **完整诊断报告**: 生成详细的状态报告

### 2. 检查服务器日志

```bash
# 查看Node.js应用日志
pm2 logs ncm-converter

# 或者直接查看控制台输出
node server.js

# 查看系统日志
sudo tail -f /var/log/syslog
```

### 3. 手动测试ncmdump

```bash
# 测试ncmdump是否工作
echo "test" > test.txt
ncmdump test.txt > test_output.txt
cat test_output.txt

# 测试真实的NCM文件
ncmdump your_file.ncm > output.mp3
ls -la output.mp3
```

## 阿里云特定配置

### 1. 安全组配置

确保阿里云安全组允许以下端口：
- 80 (HTTP)
- 443 (HTTPS)
- 3000 (Node.js应用端口，如果直接使用)

### 2. 系统镜像选择

推荐使用以下系统镜像：
- Ubuntu 20.04 LTS
- CentOS 7.x
- Alibaba Cloud Linux 2

### 3. 实例规格建议

- **CPU**: 至少1核
- **内存**: 至少2GB
- **存储**: 至少20GB

### 4. 网络配置

```bash
# 检查网络连接
ping 8.8.8.8

# 检查DNS解析
nslookup google.com

# 检查端口监听
netstat -tlnp | grep :3000
```

## 部署脚本

创建一个自动化部署脚本：

```bash
#!/bin/bash
# deploy.sh

echo "开始部署NCM转换器..."

# 更新系统
sudo apt-get update

# 安装依赖
sudo apt-get install -y build-essential git curl

# 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 安装ncmdump
if ! command -v ncmdump &> /dev/null; then
    git clone https://github.com/anonymous5l/ncmdump.git
    cd ncmdump
    make
    sudo cp ncmdump /usr/local/bin/
    sudo chmod +x /usr/local/bin/ncmdump
    cd ..
    rm -rf ncmdump
fi

# 安装PM2 (进程管理器)
sudo npm install -g pm2

# 安装项目依赖
npm install

# 创建必要目录
mkdir -p uploads static/mp3

# 设置权限
chmod 755 uploads/ static/ static/mp3/

# 启动应用
pm2 start server.js --name ncm-converter

# 设置开机自启
pm2 startup
pm2 save

echo "部署完成！"
echo "访问 https://your-domain.com/diagnose.html 进行诊断"
```

## 故障排除清单

- [ ] ncmdump工具已正确安装
- [ ] 文件权限设置正确
- [ ] 工作目录正确
- [ ] 环境变量配置正确
- [ ] 系统资源充足
- [ ] 网络连接正常
- [ ] 安全组配置正确
- [ ] 应用日志无错误
- [ ] 诊断工具测试通过

## 联系支持

如果问题仍然存在，请提供以下信息：

1. **服务器信息**:
   - 操作系统版本
   - 实例规格
   - 系统镜像

2. **应用信息**:
   - Node.js版本
   - 项目目录结构
   - 启动命令

3. **错误信息**:
   - 服务器控制台日志
   - 诊断工具报告
   - 浏览器控制台错误

4. **测试结果**:
   - ncmdump手动测试结果
   - 文件权限检查结果
   - 网络连接测试结果 