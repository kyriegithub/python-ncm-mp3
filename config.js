/**
 * 环境配置文件
 * 用于区分本地开发环境和阿里云生产环境
 */

const path = require('path');
const fs = require('fs');

// 检测当前环境
function detectEnvironment() {
    // 通过多种方式检测环境
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.PM2_HOME || 
                        process.env.PM2_INSTALL_PATH ||
                        process.cwd().includes('/home/project') ||
                        process.cwd().includes('/root');
    
    return isProduction ? 'production' : 'development';
}

// 获取虚拟环境路径
function getVenvPath() {
    const env = detectEnvironment();
    const projectRoot = __dirname;
    
    if (env === 'production') {
        // 阿里云生产环境 - 虚拟环境在上一级目录
        return path.join(projectRoot, '..', 'venv');
    } else {
        // 本地开发环境 - 虚拟环境在当前目录
        return path.join(projectRoot, 'venv');
    }
}

// 获取Python解释器路径
function getPythonPath() {
    const venvPath = getVenvPath();
    return path.join(venvPath, 'bin', 'python');
}

// 检查虚拟环境是否存在
function checkVenvExists() {
    const venvPath = getVenvPath();
    const pythonPath = getPythonPath();
    
    return {
        venvPath,
        pythonPath,
        venvExists: fs.existsSync(venvPath),
        pythonExists: fs.existsSync(pythonPath),
        environment: detectEnvironment()
    };
}

// 获取配置信息
function getConfig() {
    const env = detectEnvironment();
    const venvInfo = checkVenvExists();
    
    return {
        environment: env,
        isProduction: env === 'production',
        isDevelopment: env === 'development',
        venv: venvInfo,
        port: process.env.PORT || 3000,
        uploadDir: 'uploads',
        staticDir: 'static',
        mp3Dir: path.join('static', 'mp3')
    };
}

module.exports = {
    detectEnvironment,
    getVenvPath,
    getPythonPath,
    checkVenvExists,
    getConfig
}; 