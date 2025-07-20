# NCM转换器 - 静态文件方案

## 修改说明

本项目已修改为使用静态文件存储方案，解决了blob URL在生产环境中的问题。

## 工作原理

### 1. 文件处理流程

1. **上传**: 用户选择NCM文件上传
2. **转换**: 服务器使用ncmdump工具转换文件
3. **存储**: 转换后的MP3文件保存到 `static/mp3/` 目录
4. **返回URL**: 服务器返回静态文件URL
5. **前端访问**: 前端直接使用静态文件URL播放和下载
6. **自动清理**: 每10分钟自动清理超过10分钟的文件

### 2. 目录结构

```
项目根目录/
├── static/
│   └── mp3/          # MP3文件存储目录
├── uploads/          # 临时上传目录
├── public/           # 前端静态文件
└── server.js         # 服务器代码
```

### 3. API接口变化

**转换接口** (`POST /api/convert`):
- **之前**: 返回blob数据
- **现在**: 返回JSON格式的文件信息

```json
{
  "success": true,
  "fileUrl": "/static/mp3/1234567890-abc123-song.mp3",
  "filename": "song.mp3"
}
```

### 4. 前端变化

- 不再使用 `URL.createObjectURL()` 创建blob URL
- 直接使用服务器返回的静态文件URL
- 音频播放和文件下载都使用相同的URL

## 优势

1. **生产环境兼容**: 不依赖blob URL，避免CORS和HTTPS问题
2. **自动清理**: 定期清理临时文件，节省服务器空间
3. **直接访问**: 文件可以直接通过URL访问，无需额外处理
4. **缓存友好**: 静态文件可以被浏览器和CDN缓存

## 部署注意事项

### 1. 确保ncmdump工具已安装

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ncmdump

# 或者从源码编译
git clone https://github.com/anonymous5l/ncmdump.git
cd ncmdump
make
sudo cp ncmdump /usr/local/bin/
```

### 2. 设置文件权限

```bash
# 创建目录并设置权限
mkdir -p static/mp3
chmod 755 static/
chmod 755 static/mp3/
chmod 755 uploads/
```

### 3. 反向代理配置

如果使用Nginx，确保配置正确：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 测试

访问 `https://your-domain.com/test.html` 进行功能测试：

1. **文件转换测试**: 上传NCM文件并测试转换
2. **静态文件访问测试**: 验证静态目录访问
3. **音频播放测试**: 测试音频播放功能

## 监控和日志

### 服务器日志

服务器会输出以下日志：
- 文件转换成功/失败
- 静态文件清理情况
- 错误信息

### 文件清理

- 每10分钟自动清理一次
- 删除超过10分钟的文件
- 清理日志会输出到控制台

## 故障排除

### 常见问题

1. **文件转换失败**
   - 检查ncmdump是否安装
   - 检查文件权限

2. **静态文件无法访问**
   - 检查static目录权限
   - 检查反向代理配置

3. **文件清理不工作**
   - 检查服务器时间设置
   - 查看控制台日志

### 调试方法

1. 查看服务器控制台日志
2. 检查static/mp3目录中的文件
3. 使用test.html页面进行测试
4. 检查浏览器开发者工具的网络请求

## 性能优化

1. **文件大小限制**: 可以在multer配置中设置文件大小限制
2. **并发控制**: 可以添加请求队列避免服务器过载
3. **CDN加速**: 可以将static目录配置到CDN

## 安全考虑

1. **文件类型验证**: 只允许上传.ncm文件
2. **文件大小限制**: 设置合理的文件大小上限
3. **访问控制**: 可以添加访问频率限制
4. **文件清理**: 定期清理防止磁盘空间不足 