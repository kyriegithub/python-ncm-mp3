class NCMConverter {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.files = new Map();

        // 新增按钮
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.convertAllBtn = document.getElementById('convertAllBtn');
                this.actionBtns = document.getElementById('actionBtns');

        this.initializeEventListeners();
    }

    // 转义HTML特殊字符
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    initializeEventListeners() {
        // 点击上传区域触发文件选择
        this.dropZone.addEventListener('click', () => this.fileInput.click());

        // 文件选择变化
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // 拖拽事件
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 清理重置
        this.resetBtn.addEventListener('click', () => this.resetAll());

        // 一键下载
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());

        this.convertAllBtn.addEventListener('click', () => this.convertAll());

    }

    //有文件拖入
    handleFiles(fileList) {
        let hasNew = false;
        Array.from(fileList).forEach(file => {
            if (file.name.toLowerCase().endsWith('.ncm')) {
                 if (!this.files.has(file.name)) {
                    this.addFile(file);
                    hasNew = true;
                }
            }
        });
        if (this.files.size > 0) {
            this.actionBtns.style.display = '';
        }
    }

    resetAll() {
        this.files.clear();
        this.fileList.innerHTML = '';
        this.fileInput.value = '';
        this.actionBtns.style.display = 'none';
    }

    downloadAll() {
        // 下载所有已转换完成的文件
        this.files.forEach((data, fileId) => {
            if (data.status === 'completed' && data.fileUrl) {
                const a = document.createElement('a');
                a.href = data.fileUrl;
                a.download = data.filename || data.file.name.replace('.ncm', '.mp3');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
    }

    // 新增方法：一键全部转换
    async convertAll() {
        for (const [fileId, data] of this.files.entries()) {
            if (data.status === 'pending') {
                // eslint-disable-next-line no-await-in-loop
                await this.convertFile(fileId);
            }
        }
    }

    addFile(file) {
        if (this.files.has(file.name)) return;

        const fileId = Date.now() + '-' + file.name;
        this.files.set(fileId, {
            file,
            status: 'pending',
            progress: 0
        });

        this.renderFileItem(fileId, file);
    }

    renderFileItem(fileId, file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.id = `file-${fileId}`;

        const escapedFileName = this.escapeHtml(file.name);
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">${escapedFileName}</div>
                <div class="file-status">等待转换</div>
                <div class="progress-bar">
                    <div class="progress-bar-fill"></div>
                </div>
            </div>
            <button class="convert-btn" data-file-id="${fileId}">转换</button>
        `;

        this.fileList.appendChild(fileItem);

        // 添加转换按钮事件监听
        const convertBtn = fileItem.querySelector('.convert-btn');
        convertBtn.addEventListener('click', () => this.convertFile(fileId));
    }

    async convertFile(fileId) {
        const fileData = this.files.get(fileId);
        if (!fileData || fileData.status === 'converting') return;

        const fileItem = document.getElementById(`file-${fileId}`);
        const statusEl = fileItem.querySelector('.file-status');
        const progressBar = fileItem.querySelector('.progress-bar-fill');
        const convertBtn = fileItem.querySelector('.convert-btn');

        fileData.status = 'converting';
        convertBtn.disabled = true;
        statusEl.textContent = '转换中...';

        try {
            const formData = new FormData();
            formData.append('file', fileData.file);

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`转换失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || '转换失败');
            }

            // 使用静态文件URL
            const fileUrl = result.fileUrl;
            console.log('转换完成，文件URL:', fileUrl);

            // 更新UI显示音频播放器和下载按钮
            const escapedFileName = this.escapeHtml(fileData.file.name);
            fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">${escapedFileName}</div>
                <div class="file-status">转换完成</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px;">
                <audio controls style="width: 320px; min-width: 220px;" preload="metadata">
                    <source src="${fileUrl}" type="audio/mpeg">
                    您的浏览器不支持 audio 元素。
                </audio>
                <a href="${fileUrl}" download="${result.filename}" class="download-btn nice-btn" style="margin-left:10px;">下载</a>
            </div>
        `;

            // 更新文件数据
            this.files.set(fileId, { 
                ...fileData, 
                status: 'completed', 
                fileUrl: fileUrl,
                filename: result.filename
            });

        } catch (error) {
            console.error('转换失败:', error);
            statusEl.textContent = `转换失败: ${error.message}`;
            convertBtn.disabled = false;
            fileData.status = 'failed';
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new NCMConverter();
    // 广告轮播
    const ads = [
        `<b style="color:#d35400;">🔥 热门推荐：</b> <a href="https://uncao.cn" target="_blank" style="color:#ff9800;">AI工具箱</a>`,
        `<span style="color:#388e3c;">🎵 音乐转换更快更稳，试试我们的 <a href="https://ncm-mp3.uncao.cn" target="_blank" style="color:#388e3c;text-decoration:underline;">专业版</a></span>`,
        `<span style="color:#1976d2;">💡 关注公众号 <b>云草AI</b> 获取更多资源</span>`
    ];
    let adIndex = 0;
    const adTag = document.getElementById('adTag');
    function showAd() {
        adTag.innerHTML = ads[adIndex];
        adIndex = (adIndex + 1) % ads.length;
    }
    showAd();
    setInterval(showAd, 5000);

    // 顶部按钮弹窗逻辑
    const feedbackBtn = document.getElementById('feedbackBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const aboutModal = document.getElementById('aboutModal');
    const closeFeedback = document.getElementById('closeFeedback');
    const closeAbout = document.getElementById('closeAbout');
    const captchaImg = document.getElementById('captchaImg');

    feedbackBtn.onclick = () => { feedbackModal.style.display = 'flex'; };
    aboutBtn.onclick = () => { aboutModal.style.display = 'flex'; };
    closeFeedback.onclick = () => { feedbackModal.style.display = 'none'; };
    closeAbout.onclick = () => { aboutModal.style.display = 'none'; };
    window.onclick = (e) => {
        if (e.target === feedbackModal) feedbackModal.style.display = 'none';
        if (e.target === aboutModal) aboutModal.style.display = 'none';
    };
    // 刷新验证码
    captchaImg.onclick = () => {
        captchaImg.src = '/api/captcha?ts=' + Date.now();
    };

    // 留言表单提交
    document.getElementById('feedbackForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const data = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            content: form.content.value.trim(),
            captcha: form.captcha.value.trim()
        };
        const msgEl = document.getElementById('feedbackMsg');
        msgEl.textContent = '提交中...';
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                msgEl.textContent = '提交成功，感谢您的反馈！';
                form.reset();
                captchaImg.src = '/api/captcha?ts=' + Date.now();
            } else {
                msgEl.textContent = result.message || '提交失败，请重试';
                captchaImg.src = '/api/captcha?ts=' + Date.now();
            }
        } catch {
            msgEl.textContent = '提交失败，请检查网络';
        }
    };

    // 顶部菜单折叠
    const menuIcon = document.getElementById('headerMenuIcon');
    const dropdown = document.getElementById('headerDropdown');
    menuIcon.onclick = function(e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    };
    // 点击空白处关闭下拉
    document.addEventListener('click', function(e) {
        if (!menuIcon.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // 移动端按钮事件
    document.getElementById('feedbackBtnMobile').onclick = function() {
        dropdown.style.display = 'none';
        document.getElementById('feedbackModal').style.display = 'flex';
    };
    document.getElementById('aboutBtnMobile').onclick = function() {
        dropdown.style.display = 'none';
        document.getElementById('aboutModal').style.display = 'flex';
    };
});