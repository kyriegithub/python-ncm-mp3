#!/bin/bash

echo "=== NCMDump 诊断工具 ==="
echo "时间: $(date)"
echo ""

# 检查ncmdump安装
echo "1. 检查ncmdump安装状态..."
if command -v ncmdump &> /dev/null; then
    echo "✅ ncmdump已安装"
    echo "路径: $(which ncmdump)"
    echo "权限: $(ls -la $(which ncmdump))"
else
    echo "❌ ncmdump未安装"
    echo "请运行: sudo apt-get install ncmdump"
    exit 1
fi

echo ""

# 检查ncmdump版本
echo "2. 检查ncmdump版本..."
if ncmdump --version &> /dev/null; then
    echo "✅ 版本信息:"
    ncmdump --version
else
    echo "⚠️ 无法获取版本信息，但工具存在"
fi

echo ""

# 检查ncmdump帮助
echo "3. 检查ncmdump帮助信息..."
if ncmdump --help &> /dev/null; then
    echo "✅ 帮助信息可用"
    echo "用法示例:"
    ncmdump --help | head -10
else
    echo "⚠️ 无法获取帮助信息"
fi

echo ""

# 检查工作目录
echo "4. 检查工作目录..."
echo "当前目录: $(pwd)"
echo "目录内容:"
ls -la | head -10

echo ""

# 检查uploads目录
echo "5. 检查uploads目录..."
if [ -d "uploads" ]; then
    echo "✅ uploads目录存在"
    echo "权限: $(ls -ld uploads)"
    echo "内容:"
    ls -la uploads/ | head -5
else
    echo "❌ uploads目录不存在"
fi

echo ""

# 检查static目录
echo "6. 检查static目录..."
if [ -d "static" ]; then
    echo "✅ static目录存在"
    echo "权限: $(ls -ld static)"
    if [ -d "static/mp3" ]; then
        echo "✅ static/mp3目录存在"
        echo "权限: $(ls -ld static/mp3)"
        echo "内容:"
        ls -la static/mp3/ | head -5
    else
        echo "❌ static/mp3目录不存在"
    fi
else
    echo "❌ static目录不存在"
fi

echo ""

# 查找NCM文件
echo "7. 查找NCM文件..."
ncm_files=$(find . -name "*.ncm" -type f 2>/dev/null)
if [ -n "$ncm_files" ]; then
    echo "✅ 找到NCM文件:"
    echo "$ncm_files" | head -3
else
    echo "ℹ️ 当前目录下没有找到NCM文件"
fi

echo ""

# 测试ncmdump基本功能
echo "8. 测试ncmdump基本功能..."
echo "创建一个测试文件..."
echo "test content" > test_input.txt

echo "测试ncmdump命令..."
if ncmdump test_input.txt > test_output.txt 2>&1; then
    echo "✅ ncmdump命令执行成功"
    echo "输出文件大小: $(wc -c < test_output.txt) bytes"
    echo "输出内容:"
    head -5 test_output.txt
else
    echo "❌ ncmdump命令执行失败"
    echo "错误信息:"
    cat test_output.txt 2>/dev/null || echo "无错误输出"
fi

# 清理测试文件
rm -f test_input.txt test_output.txt

echo ""

# 检查系统信息
echo "9. 系统信息..."
echo "操作系统: $(uname -a)"
echo "用户: $(whoami)"
echo "PATH: $PATH"
echo "磁盘空间:"
df -h . | head -2

echo ""

# 检查进程
echo "10. 检查相关进程..."
echo "Node.js进程:"
ps aux | grep node | grep -v grep || echo "没有找到Node.js进程"

echo ""

echo "=== 诊断完成 ==="
echo ""
echo "如果ncmdump测试失败，请尝试以下解决方案："
echo "1. 重新安装ncmdump: sudo apt-get install --reinstall ncmdump"
echo "2. 从源码编译: git clone https://github.com/anonymous5l/ncmdump.git && cd ncmdump && make && sudo cp ncmdump /usr/local/bin/"
echo "3. 检查文件权限: chmod +x $(which ncmdump)"
echo "4. 检查工作目录权限: chmod 755 uploads/ static/ static/mp3/" 