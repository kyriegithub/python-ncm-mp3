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

const app = express();
const port = process.env.PORT || 3000;

// 用于存储验证码，生产环境建议用 redis
const captchaStore = new Map();

// 启用CORS
app.use(cors());

// 解析 json
app.use(bodyParser.json());

// 配置静态文件服务
app.use(express.static('public'));

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
        const command = `ncmdump "${inputPath}" > "${outputPath}"`;
        await execPromise(command);
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

    const inputPath = req.file.path;
    const outputPath = inputPath.replace('.ncm', '.mp3');

    try {
        const success = await convertNcmToMp3(inputPath, outputPath);
        
        if (success) {
            // 发送转换后的文件
            res.download(outputPath, path.basename(outputPath), (err) => {
                if (err) {
                    console.error('文件下载失败:', err);
                }
                // 清理临时文件
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            });
        } else {
            res.status(500).json({ error: '文件转换失败' });
        }
    } catch (error) {
        console.error('处理失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});