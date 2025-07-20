#!/usr/bin/env python3
"""
测试服务器转换功能
"""

import requests
import os
import time

def test_server_conversion():
    """测试服务器转换功能"""
    print("=== 测试服务器转换功能 ===")
    
    # 服务器地址
    base_url = "http://localhost:3000"
    
    # 1. 测试健康检查
    print("1. 测试健康检查...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ 服务器健康状态: {health['status']}")
            print(f"   Python环境: {'✅' if health['python']['pythonExists'] else '❌'}")
        else:
            print(f"❌ 健康检查失败: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ 无法连接到服务器: {e}")
        return
    
    # 2. 测试文件上传和转换
    print("\n2. 测试文件转换...")
    
    # 检查测试文件是否存在
    test_file = "uploads/test.ncm"
    if not os.path.exists(test_file):
        print(f"❌ 测试文件不存在: {test_file}")
        return
    
    print(f"使用测试文件: {test_file}")
    
    try:
        # 上传文件
        with open(test_file, 'rb') as f:
            files = {'file': ('test.ncm', f, 'application/octet-stream')}
            response = requests.post(f"{base_url}/api/convert", files=files)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ 转换成功!")
                print(f"   文件URL: {result['fileUrl']}")
                print(f"   文件名: {result['filename']}")
                
                # 验证文件是否可以访问
                file_response = requests.get(f"{base_url}{result['fileUrl']}")
                if file_response.status_code == 200:
                    print(f"✅ 文件可以正常访问，大小: {len(file_response.content)} bytes")
                else:
                    print(f"⚠️ 文件访问失败: {file_response.status_code}")
            else:
                print(f"❌ 转换失败: {result.get('error', '未知错误')}")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"   响应: {response.text}")
            
    except Exception as e:
        print(f"❌ 测试过程中出错: {e}")

if __name__ == "__main__":
    test_server_conversion() 