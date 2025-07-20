# NCM转换器死循环问题解决方案

## 问题描述

在运行ncm-converter应用时，出现了死循环问题，主要原因是Python虚拟环境路径解析错误。

## 错误日志分析

从PM2日志可以看出主要问题：

```
/bin/sh: 1: /home/project/python-ncm-mp3/venv/bin/python: not found
```

错误原因：
- 代码使用 `process.cwd()` 获取当前工作目录
- 在PM2环境下，工作目录可能不是项目根目录
- 导致Python虚拟环境路径解析错误

## 解决方案

### 1. 修复路径解析问题

将 `process.cwd()` 替换为 `__dirname`：

```javascript
// 修复前
const venvPath = path.join(process.cwd(), 'venv');

// 修复后  
const projectRoot = __dirname;
const venvPath = path.join(projectRoot, 'venv');
```

### 2. 添加路径验证

```javascript
// 检查虚拟环境是否存在
if (!fs.existsSync(venvPath)) {
    throw new Error(`虚拟环境不存在: ${venvPath}`);
}

if (!fs.existsSync(pythonPath)) {
    console.warn(`虚拟环境Python不存在: ${pythonPath}`);
    // 尝试使用系统Python作为备选
}
```

### 3. 增加错误处理

```javascript
// 检查Python脚本是否成功执行
if (stderr && stderr.includes('错误:')) {
    throw new Error(`Python转换失败: ${stderr}`);
}
```

### 4. 优化超时和缓冲区设置

```javascript
const { stdout, stderr } = await execPromise(command, {
    timeout: 120000, // 120秒超时，给大文件更多时间
    maxBuffer: 10 * 1024 * 1024 // 10MB缓冲区，处理大文件
});
```

### 5. 添加健康检查端点

```javascript
app.get('/api/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        python: {
            venvPath: path.join(__dirname, 'venv'),
            pythonPath: path.join(__dirname, 'venv', 'bin', 'python'),
            venvExists: fs.existsSync(venvPath),
            pythonExists: fs.existsSync(pythonPath)
        }
    };
    res.json(health);
});
```

## 验证修复

### 1. 健康检查
```bash
curl http://localhost:3000/api/health
```

### 2. 文件转换测试
```bash
curl -X POST -F "file=@uploads/test.ncm" http://localhost:3000/api/convert
```

## 预防措施

1. **使用绝对路径**：始终使用 `__dirname` 而不是 `process.cwd()`
2. **路径验证**：在关键操作前验证路径是否存在
3. **错误处理**：添加详细的错误信息和异常处理
4. **监控端点**：提供健康检查端点监控服务状态
5. **超时设置**：为长时间运行的操作设置合理的超时时间

## 总结

通过修复路径解析问题、添加错误处理和监控机制，成功解决了ncm-converter的死循环问题。现在应用可以正常运行并处理NCM文件转换。 