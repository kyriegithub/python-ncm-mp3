# Python虚拟环境修复指南

## 问题描述

你的ncmdump是通过pip安装在Python虚拟环境中的包，而不是系统命令。需要修改Node.js代码来使用Python的ncmdump包。

## 解决方案

### 1. 已完成的修改

我已经修改了 `server.js` 文件，现在它会：

1. **检测虚拟环境**: 自动查找 `venv` 目录
2. **使用Python脚本**: 创建临时Python脚本来调用ncmdump包
3. **执行转换**: 通过Python的ncmdump包进行文件转换
4. **清理临时文件**: 转换完成后自动清理临时脚本

### 2. 测试步骤

#### 步骤1: 重启Node.js应用

```bash
# 如果使用PM2
pm2 restart ncm-converter

# 或者直接重启
node server.js
```

#### 步骤2: 查看启动日志

服务器启动时会显示环境诊断信息，包括：
- 虚拟环境检查
- Python版本
- ncmdump包状态
- 模块导入测试

#### 步骤3: 测试Python环境

在虚拟环境中运行测试脚本：

```bash
# 激活虚拟环境
source venv/bin/activate

# 运行Python测试脚本
python test_python_ncmdump.py

# 或者测试真实文件
python test_python_ncmdump.py uploads/your_file.ncm
```

### 3. 验证安装

确保虚拟环境中正确安装了ncmdump：

```bash
# 激活虚拟环境
source venv/bin/activate

# 检查已安装的包
pip list | grep ncmdump

# 应该显示类似：
# ncmdump      0.1.1
```

### 4. 手动测试转换

在虚拟环境中手动测试转换：

```python
# 激活虚拟环境后运行Python
python

# 在Python中测试
>>> from ncmdump import NCMDump
>>> ncm = NCMDump('uploads/your_file.ncm')
>>> result = ncm.dump('test_output.mp3')
>>> print(result)
```

### 5. 常见问题解决

#### 问题1: 虚拟环境路径错误

如果虚拟环境不在项目根目录的 `venv` 文件夹中，需要修改 `server.js` 中的路径：

```javascript
// 修改这一行
const venvPath = path.join(process.cwd(), 'venv');
// 改为你的实际虚拟环境路径
const venvPath = '/path/to/your/venv';
```

#### 问题2: Python版本不兼容

确保虚拟环境中的Python版本与ncmdump包兼容：

```bash
# 检查Python版本
source venv/bin/activate
python --version

# 如果版本太旧，可能需要重新创建虚拟环境
python3 -m venv venv_new
source venv_new/bin/activate
pip install ncmdump
```

#### 问题3: 权限问题

确保Node.js进程有权限访问虚拟环境：

```bash
# 检查虚拟环境权限
ls -la venv/

# 如果需要，修改权限
chmod -R 755 venv/
```

### 6. 调试信息

修改后的代码会输出详细的调试信息：

- 虚拟环境路径
- Python解释器路径
- 转换过程日志
- 文件大小检查
- 错误信息

### 7. 性能优化

如果转换速度较慢，可以考虑：

1. **增加超时时间**: 修改 `timeout` 参数
2. **优化文件路径**: 使用绝对路径
3. **缓存Python脚本**: 避免每次都创建临时脚本

### 8. 安全考虑

- 临时Python脚本会在转换完成后自动删除
- 使用绝对路径避免路径注入
- 限制文件大小和类型

## 测试清单

- [ ] 虚拟环境存在且可访问
- [ ] Python解释器正常工作
- [ ] ncmdump包已正确安装
- [ ] 模块导入测试通过
- [ ] 基本功能测试通过
- [ ] 真实文件转换测试通过
- [ ] Node.js应用重启成功
- [ ] 环境诊断信息正常
- [ ] 文件转换功能正常

## 联系支持

如果问题仍然存在，请提供：

1. 服务器启动时的环境诊断输出
2. Python测试脚本的运行结果
3. 虚拟环境的详细信息
4. 具体的错误信息 