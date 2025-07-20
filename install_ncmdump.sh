#!/bin/bash

echo "=== NCMDump 安装脚本 (阿里云专用) ==="
echo "时间: $(date)"
echo ""

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    echo "⚠️ 检测到root用户，建议使用普通用户运行"
fi

# 更新系统包
echo "1. 更新系统包..."
sudo apt-get update

# 安装编译依赖
echo "2. 安装编译依赖..."
sudo apt-get install -y build-essential git curl wget

# 检查是否已安装ncmdump
echo "3. 检查现有ncmdump安装..."
if command -v ncmdump &> /dev/null; then
    echo "发现现有ncmdump安装:"
    which ncmdump
    ls -la $(which ncmdump)
    
    echo "测试现有版本..."
    if ncmdump --version &> /dev/null; then
        echo "现有版本工作正常"
        ncmdump --version
    else
        echo "现有版本有问题，将重新安装"
        sudo rm -f $(which ncmdump)
    fi
fi

echo ""

# 方法1: 尝试从包管理器安装
echo "4. 尝试从包管理器安装..."
if sudo apt-get install -y ncmdump; then
    echo "✅ 包管理器安装成功"
    ncmdump --version
else
    echo "❌ 包管理器安装失败，尝试从源码编译"
    
    # 方法2: 从源码编译
    echo "5. 从源码编译安装..."
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    echo "克隆ncmdump源码..."
    if git clone https://github.com/anonymous5l/ncmdump.git; then
        cd ncmdump
        
        echo "编译ncmdump..."
        if make; then
            echo "✅ 编译成功"
            
            # 安装到系统路径
            sudo cp ncmdump /usr/local/bin/
            sudo chmod +x /usr/local/bin/ncmdump
            
            echo "✅ 安装完成"
            echo "路径: $(which ncmdump)"
            echo "权限: $(ls -la $(which ncmdump))"
            
            # 测试安装
            if ncmdump --version &> /dev/null; then
                echo "✅ 安装验证成功"
                ncmdump --version
            else
                echo "⚠️ 安装验证失败，但文件已复制"
            fi
        else
            echo "❌ 编译失败"
            echo "尝试备用编译方法..."
            
            # 备用编译方法
            if gcc -o ncmdump ncmdump.c; then
                echo "✅ 备用编译成功"
                sudo cp ncmdump /usr/local/bin/
                sudo chmod +x /usr/local/bin/ncmdump
            else
                echo "❌ 备用编译也失败"
            fi
        fi
    else
        echo "❌ 无法克隆源码"
    fi
    
    # 清理临时目录
    cd /
    rm -rf "$TEMP_DIR"
fi

echo ""

# 方法3: 如果上述方法都失败，尝试下载预编译版本
if ! command -v ncmdump &> /dev/null; then
    echo "6. 尝试下载预编译版本..."
    
    # 检测系统架构
    ARCH=$(uname -m)
    echo "系统架构: $ARCH"
    
    # 下载预编译版本（如果有的话）
    if [ "$ARCH" = "x86_64" ]; then
        echo "尝试下载x86_64版本..."
        # 这里可以添加预编译版本的下载链接
        echo "⚠️ 预编译版本下载功能需要手动配置"
    else
        echo "⚠️ 不支持的架构: $ARCH"
    fi
fi

echo ""

# 最终验证
echo "7. 最终验证..."
if command -v ncmdump &> /dev/null; then
    echo "✅ ncmdump安装成功"
    echo "路径: $(which ncmdump)"
    echo "版本信息:"
    ncmdump --version 2>/dev/null || echo "无法获取版本信息"
    
    # 基本功能测试
    echo "基本功能测试..."
    echo "test" > test_input.txt
    if ncmdump test_input.txt > test_output.txt 2>/dev/null; then
        echo "✅ 基本功能测试通过"
        rm -f test_input.txt test_output.txt
    else
        echo "⚠️ 基本功能测试失败"
        rm -f test_input.txt test_output.txt
    fi
else
    echo "❌ ncmdump安装失败"
    echo ""
    echo "手动安装步骤："
    echo "1. 访问: https://github.com/anonymous5l/ncmdump"
    echo "2. 下载源码并手动编译"
    echo "3. 或联系系统管理员安装"
fi

echo ""
echo "=== 安装完成 ==="
echo ""
echo "如果安装成功，请重启Node.js应用："
echo "pm2 restart ncm-converter"
echo ""
echo "然后测试文件转换功能。" 