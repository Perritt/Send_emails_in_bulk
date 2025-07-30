// 全局变量
let csvData = [];
let isSending = false;
let currentSenderIndex = 0;
let senders = [];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeSenders();
    setupFileUpload();
    setupProviderSelection();
});

// 初始化发件人列表
function initializeSenders() {
    // 添加默认发件人
    addDefaultSender();
    renderSenderList();
}

// 添加默认发件人
function addDefaultSender() {
    const defaultSender = {
        id: Date.now(),
        email: 'Sean@insty.cc',
        password: 'zcLJcyRvDKWpUb4V',
        provider: 'feishu',
        dailyLimit: 100,
        dailyUsed: 0,
        isConfigured: true,
        isActive: true
    };
    senders.push(defaultSender);
}

// 渲染发件人列表
function renderSenderList() {
    const senderList = document.getElementById('senderList');
    senderList.innerHTML = '';
    
    senders.forEach((sender, index) => {
        const senderElement = createSenderElement(sender, index);
        senderList.appendChild(senderElement);
    });
    
    updateSenderStatus();
}

// 创建发件人元素
function createSenderElement(sender, index) {
    const div = document.createElement('div');
    div.className = `sender-item ${sender.isActive ? 'active' : 'disabled'}`;
    div.innerHTML = `
        <div class="sender-info">
            <div class="sender-email">${sender.email}</div>
            <div class="sender-status ${getSenderStatusClass(sender)}">
                ${getSenderStatusText(sender)}
            </div>
        </div>
        <div class="sender-controls">
            <button class="edit-btn" onclick="editSender(${index})">编辑</button>
            <button class="delete-btn" onclick="deleteSender(${index})">删除</button>
        </div>
    `;
    return div;
}

// 获取发件人状态类
function getSenderStatusClass(sender) {
    if (!sender.isConfigured) return 'not-configured';
    if (sender.dailyUsed >= sender.dailyLimit) return 'limit-reached';
    return 'available';
}

// 获取发件人状态文本
function getSenderStatusText(sender) {
    if (!sender.isConfigured) return '未配置';
    if (sender.dailyUsed >= sender.dailyLimit) return `已达上限 (${sender.dailyUsed}/${sender.dailyLimit})`;
    return `可用 (${sender.dailyUsed}/${sender.dailyLimit})`;
}

// 更新发件人状态
function updateSenderStatus() {
    const availableSenders = senders.filter(s => s.isConfigured && s.dailyUsed < s.dailyLimit);
    if (availableSenders.length === 0) {
        showWarning('⚠️ 没有可用的发件人，请添加或配置发件人');
    }
}

// 添加发件人
function addSender() {
    const sender = {
        id: Date.now(),
        email: '',
        password: '',
        provider: 'feishu',
        dailyLimit: 100,
        dailyUsed: 0,
        isConfigured: false,
        isActive: true
    };
    senders.push(sender);
    renderSenderList();
    editSender(senders.length - 1);
}

// 编辑发件人
function editSender(index) {
    const sender = senders[index];
    const email = prompt('请输入邮箱地址:', sender.email);
    if (email === null) return;
    
    const password = prompt('请输入应用密码:', sender.password);
    if (password === null) return;
    
    sender.email = email;
    sender.password = password;
    sender.isConfigured = email && password;
    
    renderSenderList();
}

// 删除发件人
function deleteSender(index) {
    if (senders.length <= 1) {
        showWarning('⚠️ 至少需要保留一个发件人');
        return;
    }
    
    if (confirm('确定要删除这个发件人吗？')) {
        senders.splice(index, 1);
        renderSenderList();
    }
}

// 获取下一个可用发件人
function getNextAvailableSender() {
    const availableSenders = senders.filter(s => s.isConfigured && s.dailyUsed < s.dailyLimit);
    if (availableSenders.length === 0) {
        return null;
    }
    
    // 轮询选择发件人
    currentSenderIndex = (currentSenderIndex + 1) % availableSenders.length;
    return availableSenders[currentSenderIndex];
}

// 设置邮件服务商选择
function setupProviderSelection() {
    const providerOptions = document.querySelectorAll('input[name="provider"]');
    providerOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'gmail') {
                showWarning('⚠️ Gmail功能即将上线，敬请期待！');
                // 重新选择飞书
                document.querySelector('input[value="feishu"]').checked = true;
            }
        });
    });
}

// 设置文件上传
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    // 点击上传
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽上传
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// 处理文件
function handleFile(file) {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            Papa.parse(e.target.result, {
                header: true,
                complete: function(results) {
                    csvData = results.data;
                    showDataPreview();
                }
            });
        };
        reader.readAsText(file);
    } else {
        showError('请选择CSV格式的文件');
    }
}

// 显示数据预览
function showDataPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewTableBody = document.getElementById('previewTableBody');
    const previewCount = document.getElementById('previewCount');

    previewSection.style.display = 'block';
    previewCount.textContent = `共 ${csvData.length} 条记录`;

    previewTableBody.innerHTML = '';
    csvData.slice(0, 10).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Email || ''}</td>
            <td>${row['Creator Name'] || ''}</td>
            <td>${row['Social Media Link'] || ''}</td>
        `;
        previewTableBody.appendChild(tr);
    });

    if (csvData.length > 10) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" style="text-align: center; color: #666;">... 还有 ${csvData.length - 10} 条记录</td>`;
        previewTableBody.appendChild(tr);
    }
}

// 清空数据
function clearData() {
    csvData = [];
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

// 获取 Quill 编辑器内容
function getQuillContent() {
    if (window.getQuillContent) {
        return window.getQuillContent();
    }
    return '';
}

// 测试连接
async function testConnection() {
    const availableSender = getNextAvailableSender();
    if (!availableSender) {
        showError('❌ 没有可用的发件人，请先配置发件人');
        return;
    }

    try {
        const response = await fetch('/api/test-connection', {
            method: 'GET'
        });
        const result = await response.json();
        
        if (result.success) {
            showSuccess('✅ 连接测试成功');
        } else {
            showError(`❌ 连接测试失败: ${result.message}`);
        }
    } catch (error) {
        showError(`❌ 连接测试失败: ${error.message}`);
    }
}

// 开始发送
async function startSending() {
    if (csvData.length === 0) {
        showError('请先上传联系人数据');
        return;
    }

    const availableSender = getNextAvailableSender();
    if (!availableSender) {
        showError('❌ 没有可用的发件人，请先配置发件人');
        return;
    }

    const subject = document.getElementById('emailSubject').value;
    const content = getQuillContent(); // 使用 React Quill 的内容
    const method = document.getElementById('sendMethod').value;
    const interval = parseInt(document.getElementById('sendInterval').value);

    if (!subject || !content) {
        showError('请填写邮件主题和内容');
        return;
    }

    isSending = true;
    updateSendUI(true);

    const emails = csvData.map(row => ({
        to: row.Email,
        subject: replaceVariables(subject, row),
        content: replaceVariables(content, row),
        method: method
    }));

    try {
        const response = await fetch('/api/send-bulk-emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emails: emails,
                interval: interval,
                method: method
            })
        });

        const result = await response.json();
        
        if (result.success) {
            showSuccess(`✅ 批量发送完成！成功: ${result.results.length}，失败: ${result.errors.length}`);
            updateSenderUsage(result.limits);
        } else {
            showError(`❌ 批量发送失败: ${result.message}`);
        }
    } catch (error) {
        showError(`❌ 发送失败: ${error.message}`);
    } finally {
        isSending = false;
        updateSendUI(false);
    }
}

// 停止发送
function stopSending() {
    isSending = false;
    updateSendUI(false);
    showInfo('⏹️ 发送已停止');
}

// 更新发送UI
function updateSendUI(sending) {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const sendStatus = document.getElementById('sendStatus');

    if (sending) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        sendStatus.style.display = 'block';
    } else {
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
        sendStatus.style.display = 'none';
    }
}

// 更新发件人使用情况
function updateSenderUsage(limits) {
    // 更新当前发件人的使用情况
    const currentSender = getNextAvailableSender();
    if (currentSender) {
        currentSender.dailyUsed = currentSender.dailyLimit - limits.dailyRemaining;
        renderSenderList();
    }
}

// 替换变量
function replaceVariables(template, data) {
    return template.replace(/\{([^}]+)\}/g, (match, variableName) => {
        return data[variableName] || match;
    });
}

// 显示成功消息
function showSuccess(message) {
    addLogEntry(message, 'success');
}

// 显示错误消息
function showError(message) {
    addLogEntry(message, 'error');
}

// 显示警告消息
function showWarning(message) {
    addLogEntry(message, 'warning');
}

// 显示信息消息
function showInfo(message) {
    addLogEntry(message, 'info');
}

// 添加日志条目
function addLogEntry(message, type) {
    const logSection = document.getElementById('logSection');
    const logContainer = document.getElementById('logContainer');
    
    logSection.style.display = 'block';
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// 清空日志
function clearLog() {
    document.getElementById('logContainer').innerHTML = '';
}

// 导出日志
function exportLog() {
    const logContainer = document.getElementById('logContainer');
    const logText = logContainer.innerText;
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
}
