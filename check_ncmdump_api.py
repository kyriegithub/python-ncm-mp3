#!/usr/bin/env python3
"""
检查ncmdump包的实际API
"""

import sys
import os

def check_ncmdump_api():
    """检查ncmdump包的API"""
    print("=== 检查ncmdump包API ===")
    
    try:
        import ncmdump
        print(f"✅ ncmdump包导入成功")
        print(f"包路径: {ncmdump.__file__}")
        
        # 检查包的属性
        print("\n包的所有属性:")
        for attr in dir(ncmdump):
            if not attr.startswith('_'):
                print(f"  {attr}")
        
        # 检查是否有__all__属性
        if hasattr(ncmdump, '__all__'):
            print(f"\n__all__属性: {ncmdump.__all__}")
        
        # 尝试导入可能的类或函数
        print("\n尝试导入可能的类或函数:")
        
        # 检查是否有dump函数
        if hasattr(ncmdump, 'dump'):
            print("✅ 找到dump函数")
            print(f"dump函数: {ncmdump.dump}")
        
        # 检查是否有convert函数
        if hasattr(ncmdump, 'convert'):
            print("✅ 找到convert函数")
            print(f"convert函数: {ncmdump.convert}")
        
        # 检查是否有NCMDump类
        if hasattr(ncmdump, 'NCMDump'):
            print("✅ 找到NCMDump类")
            print(f"NCMDump类: {ncmdump.NCMDump}")
        
        # 检查是否有其他可能的类
        for attr in dir(ncmdump):
            if not attr.startswith('_') and attr[0].isupper():
                print(f"✅ 找到类: {attr}")
                print(f"类信息: {getattr(ncmdump, attr)}")
        
        # 尝试查看包的文档
        if hasattr(ncmdump, '__doc__') and ncmdump.__doc__:
            print(f"\n包文档:")
            print(ncmdump.__doc__)
        
        # 尝试查看函数的文档
        if hasattr(ncmdump, 'dump') and hasattr(ncmdump.dump, '__doc__'):
            print(f"\ndump函数文档:")
            print(ncmdump.dump.__doc__)
        
    except ImportError as e:
        print(f"❌ 无法导入ncmdump包: {e}")
    except Exception as e:
        print(f"❌ 检查API时出错: {e}")

def test_basic_usage():
    """测试基本用法"""
    print("\n=== 测试基本用法 ===")
    
    try:
        import ncmdump
        
        # 创建一个测试文件
        test_file = "test_api.ncm"
        with open(test_file, 'wb') as f:
            f.write(b'CTENFDAM' + b'0' * 100)
        
        print(f"创建测试文件: {test_file}")
        
        # 尝试不同的调用方式
        print("\n尝试不同的调用方式:")
        
        # 方式1: 直接调用dump函数
        if hasattr(ncmdump, 'dump'):
            try:
                print("尝试方式1: ncmdump.dump()")
                result = ncmdump.dump(test_file, "test_output1.mp3")
                print(f"方式1结果: {result}")
            except Exception as e:
                print(f"方式1失败: {e}")
        
        # 方式2: 调用convert函数
        if hasattr(ncmdump, 'convert'):
            try:
                print("尝试方式2: ncmdump.convert()")
                result = ncmdump.convert(test_file, "test_output2.mp3")
                print(f"方式2结果: {result}")
            except Exception as e:
                print(f"方式2失败: {e}")
        
        # 方式3: 使用类
        for attr in dir(ncmdump):
            if not attr.startswith('_') and attr[0].isupper():
                try:
                    print(f"尝试方式3: 使用{attr}类")
                    cls = getattr(ncmdump, attr)
                    if callable(cls):
                        instance = cls(test_file)
                        if hasattr(instance, 'dump'):
                            result = instance.dump("test_output3.mp3")
                            print(f"方式3结果: {result}")
                        elif hasattr(instance, 'convert'):
                            result = instance.convert("test_output3.mp3")
                            print(f"方式3结果: {result}")
                except Exception as e:
                    print(f"方式3失败: {e}")
        
        # 清理测试文件
        for file in [test_file, "test_output1.mp3", "test_output2.mp3", "test_output3.mp3"]:
            if os.path.exists(file):
                os.remove(file)
                print(f"清理文件: {file}")
        
    except Exception as e:
        print(f"❌ 测试基本用法时出错: {e}")

if __name__ == "__main__":
    check_ncmdump_api()
    test_basic_usage() 