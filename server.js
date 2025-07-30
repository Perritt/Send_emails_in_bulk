const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');

// 加载配置文件
let config;
try {
    config = require('./config.js');
    console.log('✅ 配置文件加载成功');
} catch (error) {
    console.error('❌ 配置文件加载失败，请确保已创建 config.js 文件');
    console.error('💡 请复制 config.example.js 为 config.js 并填入您的配置信息');
    process.exit(1);
}

const app = express();
const PORT = config.server.port || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 发件人管理
let senders = [
    {
        id: 1,
        email: config.smtp.auth.user,
        password: config.smtp.auth.pass,
        provider: 'feishu',
        dailyLimit: config.limits.daily.emails,
        dailyUsed: 0,
        isConfigured: true,
        isActive: true,
        lastUsed: 0
    }
];

let currentSenderIndex = 0;

// 发送限制跟踪
let sendCount = 0;
let lastSendTime = 0;
let dailySendCount = 0;
let lastDailyReset = new Date().toDateString();

// 检查发送限制
function checkSendLimits() {
    const now = Date.now();
    const today = new Date().toDateString();
    
    // 重置每日计数
    if (today !== lastDailyReset) {
        dailySendCount = 0;
        lastDailyReset = today;
        // 重置所有发件人的每日使用量
        senders.forEach(sender => {
            sender.dailyUsed = 0;
        });
    }
    
    // 检查频率限制
    if (now - lastSendTime < (config.limits.frequency.seconds * 1000 / config.limits.frequency.emails)) {
        throw new Error(`发送频率过高，请等待 ${Math.ceil((config.limits.frequency.seconds * 1000 / config.limits.frequency.emails) / 1000)} 秒后重试`);
    }
    
    return true;
}

// 更新发送计数
function updateSendCount() {
    sendCount++;
    lastSendTime = Date.now();
    dailySendCount++;
}

// 获取下一个可用发件人
function getNextAvailableSender() {
    const availableSenders = senders.filter(s => s.isConfigured && s.isActive && s.dailyUsed < s.dailyLimit);
    if (availableSenders.length === 0) {
        return null;
    }
    
    // 轮询选择发件人
    currentSenderIndex = (currentSenderIndex + 1) % availableSenders.length;
    return availableSenders[currentSenderIndex];
}

// 更新发件人使用情况
function updateSenderUsage(senderId, count = 1) {
    const sender = senders.find(s => s.id === senderId);
    if (sender) {
        sender.dailyUsed += count;
        sender.lastUsed = Date.now();
    }
}

// 获取飞书访问令牌
async function getFeishuAccessToken() {
    try {
        const response = await axios.post(`${config.api.baseUrl}/auth/v3/tenant_access_token/internal`, {
            app_id: config.api.appId,
            app_secret: config.api.appSecret
        });
        
        if (response.data.code === 0) {
            return response.data.tenant_access_token;
        } else {
            throw new Error(`获取访问令牌失败: ${response.data.msg}`);
        }
    } catch (error) {
        console.error('获取飞书访问令牌失败:', error);
        throw error;
    }
}

// 使用飞书API发送邮件
async function sendEmailViaFeishuAPI(emailData, sender) {
    try {
        const accessToken = await getFeishuAccessToken();
        
        // 飞书邮件API调用
        const response = await axios.post(`${config.api.baseUrl}/mail/v1/messages`, {
            msg_type: 'text',
            content: {
                text: emailData.content
            },
            email_message: {
                subject: emailData.subject,
                to: [emailData.to],
                from: sender.email
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('飞书API发送邮件失败:', error);
        throw error;
    }
}

// 使用SMTP发送邮件
async function sendEmailViaSMTP(emailData, sender) {
    try {
        const transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: {
                user: sender.email,
                pass: sender.password
            }
        });
        
        const mailOptions = {
            from: sender.email,
            to: emailData.to,
            subject: emailData.subject,
            html: emailData.content
        };
        
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        console.error('SMTP发送邮件失败:', error);
        throw error;
    }
}

// 发送邮件API端点
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, content, method = 'smtp' } = req.body;
        
        if (!to || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: '缺少必要参数'
            });
        }
        
        // 检查发送限制
        checkSendLimits();
        
        // 获取可用发件人
        const sender = getNextAvailableSender();
        if (!sender) {
            return res.status(400).json({
                success: false,
                message: '没有可用的发件人，请检查发件人配置或等待每日限制重置'
            });
        }
        
        const emailData = {
            to,
            subject,
            content
        };
        
        let result;
        if (method === 'api') {
            result = await sendEmailViaFeishuAPI(emailData, sender);
        } else {
            result = await sendEmailViaSMTP(emailData, sender);
        }
        
        // 更新发送计数
        updateSendCount();
        updateSenderUsage(sender.id);
        
        res.json({
            success: true,
            message: '邮件发送成功',
            data: result,
            sender: {
                email: sender.email,
                dailyUsed: sender.dailyUsed,
                dailyLimit: sender.dailyLimit
            },
            limits: {
                dailyRemaining: config.limits.daily.emails - dailySendCount,
                frequencyRemaining: Math.ceil((config.limits.frequency.seconds * 1000 / config.limits.frequency.emails) / 1000)
            }
        });
        
    } catch (error) {
        console.error('发送邮件失败:', error);
        res.status(500).json({
            success: false,
            message: '邮件发送失败',
            error: error.message
        });
    }
});

// 批量发送邮件API端点
app.post('/api/send-bulk-emails', async (req, res) => {
    try {
        const { emails, interval = 2000, method = 'smtp' } = req.body;
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少邮件数据'
            });
        }
        
        // 检查可用发件人
        const availableSenders = senders.filter(s => s.isConfigured && s.isActive && s.dailyUsed < s.dailyLimit);
        if (availableSenders.length === 0) {
            return res.status(400).json({
                success: false,
                message: '没有可用的发件人，请检查发件人配置或等待每日限制重置'
            });
        }
        
        // 计算总可用发送量
        const totalAvailable = availableSenders.reduce((sum, sender) => sum + (sender.dailyLimit - sender.dailyUsed), 0);
        if (emails.length > totalAvailable) {
            return res.status(400).json({
                success: false,
                message: `批量发送数量超过可用发件人的总剩余限制，最多可发送 ${totalAvailable} 封`
            });
        }
        
        const results = [];
        const errors = [];
        let currentSenderIndex = 0;
        
        for (let i = 0; i < emails.length; i++) {
            try {
                // 检查发送限制
                checkSendLimits();
                
                // 获取当前可用发件人
                const sender = availableSenders[currentSenderIndex % availableSenders.length];
                if (sender.dailyUsed >= sender.dailyLimit) {
                    // 切换到下一个发件人
                    currentSenderIndex++;
                    const nextSender = availableSenders[currentSenderIndex % availableSenders.length];
                    if (!nextSender || nextSender.dailyUsed >= nextSender.dailyLimit) {
                        throw new Error('所有发件人都已达到每日发送限制');
                    }
                }
                
                const emailData = emails[i];
                let result;
                
                if (method === 'api') {
                    result = await sendEmailViaFeishuAPI(emailData, sender);
                } else {
                    result = await sendEmailViaSMTP(emailData, sender);
                }
                
                // 更新发送计数
                updateSendCount();
                updateSenderUsage(sender.id);
                
                results.push({
                    index: i + 1,
                    to: emailData.to,
                    sender: sender.email,
                    success: true,
                    data: result
                });
                
                // 添加发送间隔
                if (i < emails.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
                
            } catch (error) {
                errors.push({
                    index: i + 1,
                    to: emails[i].to,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `批量发送完成，成功: ${results.length}，失败: ${errors.length}`,
            results,
            errors,
            senders: senders.map(s => ({
                email: s.email,
                dailyUsed: s.dailyUsed,
                dailyLimit: s.dailyLimit,
                isAvailable: s.isConfigured && s.isActive && s.dailyUsed < s.dailyLimit
            })),
            limits: {
                dailyRemaining: config.limits.daily.emails - dailySendCount,
                frequencyRemaining: Math.ceil((config.limits.frequency.seconds * 1000 / config.limits.frequency.emails) / 1000)
            }
        });
        
    } catch (error) {
        console.error('批量发送邮件失败:', error);
        res.status(500).json({
            success: false,
            message: '批量发送失败',
            error: error.message
        });
    }
});

// 测试连接API端点
app.get('/api/test-connection', async (req, res) => {
    try {
        const availableSender = getNextAvailableSender();
        if (!availableSender) {
            return res.status(400).json({
                success: false,
                message: '没有可用的发件人'
            });
        }
        
        // 测试SMTP连接
        const transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: {
                user: availableSender.email,
                pass: availableSender.password
            }
        });
        await transporter.verify();
        
        res.json({
            success: true,
            message: '连接测试成功',
            sender: {
                email: availableSender.email,
                dailyUsed: availableSender.dailyUsed,
                dailyLimit: availableSender.dailyLimit
            },
            config: {
                host: config.smtp.host,
                port: config.smtp.port,
                secure: config.smtp.secure
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '连接测试失败',
            error: error.message
        });
    }
});

// 获取发送限制信息
app.get('/api/send-limits', (req, res) => {
    res.json({
        frequency: config.limits.frequency,
        daily: {
            limit: config.limits.daily.emails,
            used: dailySendCount,
            remaining: config.limits.daily.emails - dailySendCount
        },
        senders: senders.map(s => ({
            email: s.email,
            dailyUsed: s.dailyUsed,
            dailyLimit: s.dailyLimit,
            isAvailable: s.isConfigured && s.isActive && s.dailyUsed < s.dailyLimit
        })),
        current: {
            sendCount,
            lastSendTime,
            dailySendCount
        }
    });
});

// 获取发件人列表
app.get('/api/senders', (req, res) => {
    res.json({
        success: true,
        senders: senders.map(s => ({
            id: s.id,
            email: s.email,
            provider: s.provider,
            dailyUsed: s.dailyUsed,
            dailyLimit: s.dailyLimit,
            isConfigured: s.isConfigured,
            isActive: s.isActive,
            isAvailable: s.isConfigured && s.isActive && s.dailyUsed < s.dailyLimit
        }))
    });
});

// 添加发件人
app.post('/api/senders', (req, res) => {
    try {
        const { email, password, provider = 'feishu', dailyLimit = 100 } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '邮箱和密码不能为空'
            });
        }
        
        const newSender = {
            id: Date.now(),
            email,
            password,
            provider,
            dailyLimit,
            dailyUsed: 0,
            isConfigured: true,
            isActive: true,
            lastUsed: 0
        };
        
        senders.push(newSender);
        
        res.json({
            success: true,
            message: '发件人添加成功',
            sender: {
                id: newSender.id,
                email: newSender.email,
                provider: newSender.provider,
                dailyUsed: newSender.dailyUsed,
                dailyLimit: newSender.dailyLimit,
                isConfigured: newSender.isConfigured,
                isActive: newSender.isActive
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '添加发件人失败',
            error: error.message
        });
    }
});

// 更新发件人
app.put('/api/senders/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { email, password, dailyLimit, isActive } = req.body;
        
        const sender = senders.find(s => s.id === parseInt(id));
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: '发件人不存在'
            });
        }
        
        if (email) sender.email = email;
        if (password) sender.password = password;
        if (dailyLimit !== undefined) sender.dailyLimit = dailyLimit;
        if (isActive !== undefined) sender.isActive = isActive;
        
        sender.isConfigured = sender.email && sender.password;
        
        res.json({
            success: true,
            message: '发件人更新成功',
            sender: {
                id: sender.id,
                email: sender.email,
                provider: sender.provider,
                dailyUsed: sender.dailyUsed,
                dailyLimit: sender.dailyLimit,
                isConfigured: sender.isConfigured,
                isActive: sender.isActive
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新发件人失败',
            error: error.message
        });
    }
});

// 删除发件人
app.delete('/api/senders/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        if (senders.length <= 1) {
            return res.status(400).json({
                success: false,
                message: '至少需要保留一个发件人'
            });
        }
        
        const index = senders.findIndex(s => s.id === parseInt(id));
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: '发件人不存在'
            });
        }
        
        senders.splice(index, 1);
        
        res.json({
            success: true,
            message: '发件人删除成功'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '删除发件人失败',
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log('📧 飞书邮箱API集成已启动');
    console.log(`📊 发送限制：${config.limits.frequency.emails}封/${config.limits.frequency.seconds}秒，每日${config.limits.daily.emails}封`);
    console.log(`👤 当前发件人：${senders.length}个`);
    console.log('🔒 安全提醒：请确保 config.js 文件不会被提交到版本控制系统');
});

module.exports = app;
