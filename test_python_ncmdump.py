#!/usr/bin/env python3
"""
Python NCMDump 测试脚本
用于测试虚拟环境中的ncmdump包是否正常工作
"""

import sys
import os
import tempfile
import shutil

def test_ncmdump_import():
    """测试ncmdump模块导入"""
    print("=== 测试ncmdump模块导入 ===")
    try:
        from ncmdump import dump
        print("✅ ncmdump模块导入成功")
        return True
    except ImportError as e:
        print(f"❌ ncmdump模块导入失败: {e}")
        return False

def test_ncmdump_basic():
    """测试ncmdump基本功能"""
    print("\n=== 测试ncmdump基本功能 ===")
    
    try:
        from ncmdump import dump
        
        # 创建一个测试文件
        test_file = "test_input.ncm"
        with open(test_file, 'wb') as f:
            # 写入一些测试数据
            f.write(b'CTENFDAM')  # 模拟NCM文件头
            f.write(b'0' * 1000)  # 添加一些数据
        
        print(f"创建测试文件: {test_file}")
        
        # 尝试使用dump函数
        try:
            output_file = "test_output.mp3"
            result = dump(test_file, output_file)
            
            if result:
                print("✅ dump操作成功")
                if os.path.exists(output_file):
                    size = os.path.getsize(output_file)
                    print(f"输出文件大小: {size} bytes")
                else:
                    print("⚠️ 输出文件未生成")
            else:
                print("❌ dump操作失败")
                
        except Exception as e:
            print(f"❌ dump操作失败: {e}")
        
        # 清理测试文件
        for file in [test_file, output_file]:
            if os.path.exists(file):
                os.remove(file)
                print(f"清理文件: {file}")
                
    except Exception as e:
        print(f"❌ 基本功能测试失败: {e}")

def test_real_ncm_file(ncm_file_path):
    """测试真实的NCM文件"""
    print(f"\n=== 测试真实NCM文件: {ncm_file_path} ===")
    
    if not os.path.exists(ncm_file_path):
        print(f"❌ 文件不存在: {ncm_file_path}")
        return False
    
    try:
        from ncmdump import dump
        
        # 检查文件大小
        file_size = os.path.getsize(ncm_file_path)
        print(f"文件大小: {file_size} bytes")
        
        if file_size == 0:
            print("❌ 文件为空")
            return False
        
        # 执行转换
        output_file = ncm_file_path.replace('.ncm', '_test.mp3')
        print(f"开始转换到: {output_file}")
        
        result = dump(ncm_file_path, output_file)
        
        if result:
            print("✅ 转换成功")
            if os.path.exists(output_file):
                output_size = os.path.getsize(output_file)
                print(f"输出文件大小: {output_size} bytes")
                
                if output_size > 0:
                    print("✅ 转换结果正常")
                    # 清理输出文件
                    os.remove(output_file)
                    return True
                else:
                    print("❌ 输出文件为空")
                    return False
            else:
                print("❌ 输出文件未生成")
                return False
        else:
            print("❌ 转换失败")
            return False
            
    except Exception as e:
        print(f"❌ 真实文件测试失败: {e}")
        return False

def check_environment():
    """检查环境信息"""
    print("=== 环境信息 ===")
    print(f"Python版本: {sys.version}")
    print(f"Python路径: {sys.executable}")
    print(f"工作目录: {os.getcwd()}")
    print(f"虚拟环境: {os.environ.get('VIRTUAL_ENV', '未激活')}")
    
    # 检查ncmdump包信息
    try:
        import ncmdump
        print(f"ncmdump包路径: {ncmdump.__file__}")
        print(f"ncmdump版本: {getattr(ncmdump, '__version__', '未知')}")
    except ImportError:
        print("ncmdump包未安装")

def main():
    """主函数"""
    print("Python NCMDump 测试工具")
    print("=" * 50)
    
    # 检查环境
    check_environment()
    
    # 测试导入
    if not test_ncmdump_import():
        print("\n❌ ncmdump模块无法导入，请检查安装")
        sys.exit(1)
    
    # 测试基本功能
    test_ncmdump_basic()
    
    # 测试真实文件（如果提供）
    if len(sys.argv) > 1:
        ncm_file = sys.argv[1]
        test_real_ncm_file(ncm_file)
    
    print("\n=== 测试完成 ===")
    print("如果所有测试都通过，说明ncmdump包工作正常")

if __name__ == "__main__":
    main() 