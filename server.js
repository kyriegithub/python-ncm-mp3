const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const port = process.env.PORT || 3000;

// 启用CORS
app.use(cors());

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