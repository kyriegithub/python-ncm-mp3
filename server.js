const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const rateLimit = require('express-rate-limit');
const svgCaptcha = require('svg-captcha');
const bodyParser = require('body-parser');
const config = require('./config');

const app = express();
const appConfig = config.getConfig();
const port = appConfig.port;

// 用于存储验证码，生产环境建议用 redis
const captchaStore = new Map();

// 启用CORS
app.use(cors());

// 解析 json
app.use(bodyParser.json());

// 创建静态文件目录
const staticDir = appConfig.staticDir;
const mp3Dir = appConfig.mp3Dir;
if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir);
}
if (!fs.existsSync(mp3Dir)) {
    fs.mkdirSync(mp3Dir);
}

// 配置静态文件服务
app.use(express.static('public'));
app.use('/static', express.static(staticDir));

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// IP限流：1分钟只能提交一次
const feedbackLimiter = rateLimit({
  windowMs:  60 * 1000, // 1分钟
  max: 1,
  message: { success: false, message: '每1分钟只能提交一次反馈' }
});

const feedbackLimitMap = new Map(); // IP => 时间戳

// 清理静态文件的函数
function cleanupStaticFiles() {
    try {
        const files = fs.readdirSync(mp3Dir);
        const now = Date.now();
        const tenMinutesAgo = now - (10 * 60 * 1000); // 10分钟前

        files.forEach(file => {
            const filePath = path.join(mp3Dir, file);
            const stats = fs.statSync(filePath);
            
            // 如果文件超过10分钟，删除它
            if (stats.mtime.getTime() < tenMinutesAgo) {
                fs.unlinkSync(filePath);
                console.log(`已删除过期文件: ${file}`);
            }
        });
    } catch (error) {
        console.error('清理静态文件时出错:', error);
    }
}

// 每10分钟清理一次静态文件
setInterval(cleanupStaticFiles, 10 * 60 * 1000);

// 环境诊断函数
async function diagnoseEnvironment() {
    console.log('=== 环境诊断开始 ===');
    
    // 检查操作系统
    console.log(`操作系统: ${process.platform}`);
    console.log(`Node.js版本: ${process.version}`);
    console.log(`当前工作目录: ${process.cwd()}`);
    
    // 检查Python虚拟环境
    const venvInfo = config.checkVenvExists();
    const venvPath = venvInfo.venvPath;
    const pythonPath = venvInfo.pythonPath;
    
    console.log(`检查虚拟环境: ${venvPath}`);
    
    if (fs.existsSync(venvPath)) {
        console.log('✅ 虚拟环境目录存在');
        
        if (fs.existsSync(pythonPath)) {
            console.log('✅ Python解释器存在');
            
            try {
                // 检查Python版本
                const { stdout: pythonVersion } = await execPromise(`${pythonPath} --version`);
                console.log(`Python版本: ${pythonVersion.trim()}`);
                
                // 检查ncmdump包
                const { stdout: pipList } = await execPromise(`${pythonPath} -m pip list | grep ncmdump`);
                console.log(`ncmdump包: ${pipList.trim()}`);
                
                // 测试ncmdump导入
                const testScript = `
import sys
try:
    from ncmdump import dump
    print("✅ ncmdump模块导入成功")
except ImportError as e:
    print(f"❌ ncmdump模块导入失败: {e}")
`;
                
                const testScriptPath = path.join(process.cwd(), 'test_ncmdump_import.py');
                fs.writeFileSync(testScriptPath, testScript);
                
                try {
                    const { stdout: importTest } = await execPromise(`${pythonPath} ${testScriptPath}`);
                    console.log(importTest.trim());
                } catch (importError) {
                    console.log('❌ ncmdump模块测试失败');
                }
                
                // 清理测试文件
                try {
                    fs.unlinkSync(testScriptPath);
                } catch (cleanupError) {
                    // 忽略清理错误
                }
                
            } catch (pythonError) {
                console.log('❌ Python环境检查失败:', pythonError.message);
            }
        } else {
            console.log('❌ Python解释器不存在');
        }
    } else {
        console.log('❌ 虚拟环境目录不存在');
        console.log('请确保在项目根目录下存在venv目录');
    }
    
    // 检查目录权限
    const dirs = ['uploads', 'static', 'static/mp3', 'venv'];
    dirs.forEach(dir => {
        try {
            if (fs.existsSync(dir)) {
                const stats = fs.statSync(dir);
                console.log(`✅ 目录 ${dir} 存在，权限: ${stats.mode.toString(8)}`);
            } else {
                console.log(`❌ 目录 ${dir} 不存在`);
            }
        } catch (error) {
            console.error(`❌ 目录 ${dir} 访问失败:`, error.message);
        }
    });
    
    // 检查文件系统空间
    try {
        const { stdout } = await execPromise('df -h .');
        console.log('磁盘空间使用情况:');
        console.log(stdout);
    } catch (error) {
        console.log('无法获取磁盘空间信息');
    }
    
    console.log('=== 环境诊断完成 ===\n');
}

// 健康检查端点
app.get('/api/health', (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        python: config.checkVenvExists()
    };
    
    // 检查虚拟环境是否存在
    const venvInfo = config.checkVenvExists();
    
    health.python.venvExists = venvInfo.venvExists;
    health.python.pythonExists = venvInfo.pythonExists;
    
    res.json(health);
});

// 生成验证码
app.get('/api/captcha', (req, res) => {
  const captcha = svgCaptcha.create({
    noise: 0,              // 无干扰线
    color: false,          // 黑色字体
    background: '#fff',    // 白底
    size: 4,               // 字符数
    width: 160,            // 宽
    height: 60,            // 高
    fontSize: 54           // 字体大
  });
  const ip = req.ip;
  captchaStore.set(ip, captcha.text.toLowerCase());
  res.type('svg');
  res.send(captcha.data);
});

// 留言反馈接口
app.post('/api/feedback', (req, res) => {
  const ip = req.ip;
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);

  // 检查是否在1分钟内提交过
  if (feedbackLimitMap.has(ip) && now - feedbackLimitMap.get(ip) < 60 * 1000) {
    return res.json({ success: false, message: '每分钟只能提交一次反馈' });
  }

  const { name, email, content, captcha } = req.body;
  if (!name || !email  || !content || !captcha) {
    return res.json({ success: false, message: '请填写所有字段' });
  }
  const code = captchaStore.get(ip);
  if (!code || code !== captcha.toLowerCase()) {
    return res.json({ success: false, message: '验证码错误或已过期' });
  }
  captchaStore.delete(ip);

  // 写入日志
  const logLine = `[${now.toISOString()}] IP:${ip} Name:${name} Email:${email} Content:${content}\n`;
  fs.appendFile(path.join(__dirname, 'feedback.log'), logLine, err => {
    if (err) {
      return res.json({ success: false, message: '服务器错误，稍后再试' });
    }
    feedbackLimitMap.set(ip, Date.now());
    res.json({ success: true });
  });
});

// 转换NCM文件为MP3
async function convertNcmToMp3(inputPath, outputPath) {
    try {
        console.log(`开始转换文件: ${inputPath} -> ${outputPath}`);
        
        // 检查输入文件是否存在
        if (!fs.existsSync(inputPath)) {
            throw new Error(`输入文件不存在: ${inputPath}`);
        }
        
        const inputStats = fs.statSync(inputPath);
        console.log(`输入文件大小: ${inputStats.size} bytes`);
        
        if (inputStats.size === 0) {
            throw new Error('输入文件为空');
        }
        
        // 检查文件头，确认是否为NCM文件
        const fileBuffer = fs.readFileSync(inputPath, { start: 0, end: 8 });
        const fileHeader = fileBuffer.toString('hex');
        console.log(`文件头: ${fileHeader}`);
        
        // NCM文件通常以特定字节开头
        if (!fileHeader.startsWith('4354')) {
            console.warn('警告: 文件头不是标准的NCM格式');
        }
        
        // 使用Python的ncmdump包进行转换
        const absoluteInputPath = path.resolve(inputPath);
        const absoluteOutputPath = path.resolve(outputPath);
        
        // 检查虚拟环境 - 使用配置系统
        const venvInfo = config.checkVenvExists();
        const venvPath = venvInfo.venvPath;
        let pythonPath = venvInfo.pythonPath;
        
        console.log(`当前环境: ${venvInfo.environment}`);
        console.log(`检查虚拟环境: ${venvPath}`);
        console.log(`Python路径: ${pythonPath}`);
        
        // 检查虚拟环境是否存在
        if (!fs.existsSync(venvPath)) {
            throw new Error(`虚拟环境不存在: ${venvPath}`);
        }
        
        if (!fs.existsSync(pythonPath)) {
            console.warn(`虚拟环境Python不存在: ${pythonPath}`);
            console.log('尝试使用系统Python...');
            // 尝试使用系统Python
            try {
                const { stdout } = await execPromise('which python3');
                const systemPython = stdout.trim();
                if (systemPython) {
                    console.log(`使用系统Python: ${systemPython}`);
                    pythonPath = systemPython;
                } else {
                    throw new Error('找不到Python解释器');
                }
            } catch (error) {
                throw new Error(`无法找到Python解释器: ${error.message}`);
            }
        }
        
        // 创建Python转换脚本
        const pythonScript = `
import sys
import os

# 尝试添加虚拟环境的site-packages路径
try:
    import site
    venv_site_packages = '${venvPath}/lib/python3.*/site-packages'
    import glob
    site_packages_dirs = glob.glob(venv_site_packages)
    for site_packages_dir in site_packages_dirs:
        if os.path.exists(site_packages_dir):
            sys.path.insert(0, site_packages_dir)
            break
except:
    pass

try:
    from ncmdump import dump
    import os
    
    input_file = '${absoluteInputPath}'
    output_file = '${absoluteOutputPath}'
    
    print(f"开始转换: {input_file} -> {output_file}")
    
    if not os.path.exists(input_file):
        print(f"错误: 输入文件不存在: {input_file}")
        sys.exit(1)
    
    # 使用dump函数进行转换
    result = dump(input_file, output_file)
    
    if result:
        print(f"转换成功: {output_file}")
        if os.path.exists(output_file):
            size = os.path.getsize(output_file)
            print(f"输出文件大小: {size} bytes")
            if size > 0:
                print("转换完成")
                sys.exit(0)
            else:
                print("错误: 输出文件为空")
                sys.exit(1)
        else:
            print("错误: 输出文件未生成")
            sys.exit(1)
    else:
        print("错误: 转换失败")
        sys.exit(1)
        
except ImportError as e:
    print(f"错误: 无法导入ncmdump模块: {e}")
    sys.exit(1)
except Exception as e:
    print(f"错误: {e}")
    sys.exit(1)
`;
        
        // 将Python脚本写入临时文件
        const tempScriptPath = path.join(__dirname, 'temp_convert.py');
        fs.writeFileSync(tempScriptPath, pythonScript);
        
        console.log(`创建Python转换脚本: ${tempScriptPath}`);
        
        // 执行Python脚本
        const command = `${pythonPath} ${tempScriptPath}`;
        console.log(`执行命令: ${command}`);
        
        const { stdout, stderr } = await execPromise(command, {
            timeout: 120000, // 120秒超时，给大文件更多时间
            maxBuffer: 10 * 1024 * 1024 // 10MB缓冲区，处理大文件
        });
        
        if (stderr) {
            console.log('Python stderr:', stderr);
        }
        
        if (stdout) {
            console.log('Python stdout:', stdout);
        }
        
        // 检查Python脚本是否成功执行
        if (stderr && stderr.includes('错误:')) {
            throw new Error(`Python转换失败: ${stderr}`);
        }
        
        // 清理临时脚本
        try {
            fs.unlinkSync(tempScriptPath);
        } catch (cleanupError) {
            console.log('清理临时脚本失败:', cleanupError.message);
        }
        
        // 检查输出文件
        if (!fs.existsSync(outputPath)) {
            throw new Error('输出文件未生成');
        }
        
        const outputStats = fs.statSync(outputPath);
        console.log(`输出文件大小: ${outputStats.size} bytes`);
        
        if (outputStats.size === 0) {
            throw new Error('输出文件为空');
        }
        
        console.log('文件转换成功');
        return true;
    } catch (error) {
        console.error('转换失败:', error);
        return false;
    }
}

// 处理文件上传和转换
app.post('/api/convert', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '没有上传文件' });
    }

    console.log(`收到文件上传: ${req.file.originalname}, 大小: ${req.file.size} bytes`);

    const inputPath = req.file.path;
    const tempOutputPath = inputPath.replace('.ncm', '.mp3');
    
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const originalName = req.file.originalname.replace('.ncm', '.mp3');
    const staticFileName = `${timestamp}-${randomId}-${originalName}`;
    const staticFilePath = path.join(mp3Dir, staticFileName);

    try {
        const success = await convertNcmToMp3(inputPath, tempOutputPath);
        
        if (success) {
            // 将转换后的文件移动到静态目录
            fs.copyFileSync(tempOutputPath, staticFilePath);
            console.log(`文件已复制到静态目录: ${staticFilePath}`);
            
            // 清理临时文件
            fs.unlinkSync(inputPath);
            fs.unlinkSync(tempOutputPath);
            
            // 返回文件URL
            const fileUrl = `/static/mp3/${staticFileName}`;
            console.log(`返回文件URL: ${fileUrl}`);
            
            res.json({
                success: true,
                fileUrl: fileUrl,
                filename: originalName
            });
        } else {
            // 清理临时文件
            try {
                fs.unlinkSync(inputPath);
                if (fs.existsSync(tempOutputPath)) {
                    fs.unlinkSync(tempOutputPath);
                }
            } catch (cleanupError) {
                console.error('清理临时文件失败:', cleanupError);
            }
            res.status(500).json({ error: '文件转换失败' });
        }
    } catch (error) {
        console.error('处理失败:', error);
        // 清理临时文件
        try {
            fs.unlinkSync(inputPath);
            if (fs.existsSync(tempOutputPath)) {
                fs.unlinkSync(tempOutputPath);
            }
        } catch (cleanupError) {
            console.error('清理临时文件失败:', cleanupError);
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
app.listen(port, async () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log(`静态文件目录: ${mp3Dir}`);
    console.log(`静态文件访问路径: /static/mp3/`);
    
    // 启动时进行环境诊断
    await diagnoseEnvironment();
});