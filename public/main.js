class NCMConverter {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileList = document.getElementById('fileList');
        this.files = new Map();

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
    }

    handleFiles(fileList) {
        Array.from(fileList).forEach(file => {
            if (file.name.toLowerCase().endsWith('.ncm')) {
                this.addFile(file);
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
            
            // 更新UI显示下载按钮
            const escapedFileName = this.escapeHtml(fileData.file.name);
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-name">${escapedFileName}</div>
                    <div class="file-status">转换完成</div>
                </div>
                <a href="${url}" download="${fileData.file.name.replace('.ncm', '.mp3')}" class="download-btn">下载</a>
            `;

            this.files.set(fileId, { ...fileData, status: 'completed' });
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