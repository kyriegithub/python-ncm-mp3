class NCMConverter {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.files = new Map();

        // 新增按钮
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');


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

    }

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (file.name.toLowerCase().endsWith('.ncm')) {
                this.addFile(file);
            }
        });
    }

    resetAll() {
        this.files.clear();
        this.fileList.innerHTML = '';
        this.fileInput.value = '';
    }

    downloadAll() {
        // 下载所有已转换完成的文件
        this.files.forEach((data, fileId) => {
            if (data.status === 'completed' && data.blobUrl) {
                const a = document.createElement('a');
                a.href = data.blobUrl;
                a.download = data.file.name.replace('.ncm', '.mp3');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });
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

            if (!response.ok) throw new Error('转换失败');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

             // 更新UI显示音频播放器和下载按钮
        const escapedFileName = this.escapeHtml(fileData.file.name);
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-name">${escapedFileName}</div>
                <div class="file-status">转换完成</div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px; margin-top: 8px;">
                <audio controls style="width: 320px; min-width: 220px;">
                    <source src="${url}" type="audio/mpeg">
                    您的浏览器不支持 audio 元素。
                </audio>
                <a href="${url}" download="${fileData.file.name.replace('.ncm', '.mp3')}" class="download-btn nice-btn" style="margin-left:10px;">下载</a>
            </div>
        `;


            // 更新文件数据
            this.files.set(fileId, { ...fileData, status: 'completed', blobUrl: url });

        } catch (error) {
            console.error('转换失败:', error);
            statusEl.textContent = '转换失败';
            convertBtn.disabled = false;
            fileData.status = 'failed';
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new NCMConverter();
});