const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');

// 配置加载 - 支持 Vercel 环境变量
let config;
try {
    // 优先使用环境变量（Vercel 部署）
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        config = {
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.feishu.cn',
                port: parseInt(process.env.SMTP_PORT) || 465,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER || 'Sean@insty.cc',
                    pass: process.env.SMTP_PASS || 'zcLJcyRvDKWpUb4V'
                }
            },
            api: {
                baseUrl: 'https://open.feishu.cn/open-apis',
                appId: process.env.FEISHU_APP_ID || 'cli_a80cb37dcd38100c',
                appSecret: process.env.FEISHU_APP_SECRET || 'Mwt5E3bmVTpSswOREPFJSdLo6VJnnr0F'
            },
            server: {
                port: process.env.PORT || 3000
            },
            limits: {
                frequency: { emails: 200, seconds: 100 },
                daily: { emails: 100 }
            }
        };
        console.log('✅ Vercel 环境配置加载成功');
    } else {
        // 本地开发环境使用配置文件
        config = require('./config.js');
        console.log('✅ 本地配置文件加载成功');
    }
} catch (error) {
    console.error('❌ 配置加载失败');
    console.error('💡 本地开发：请确保已创建 config.js 文件');
    console.error('💡 Vercel 部署：请在环境变量中设置 SMTP_USER, SMTP_PASS 等');
    
    // 使用默认配置
    config = {
        smtp: {
            host: 'smtp.feishu.cn',
            port: 465,
            secure: true,
            auth: {
                user: 'Sean@insty.cc',
                pass: 'zcLJcyRvDKWpUb4V'
            }
        },
        api: {
            baseUrl: 'https://open.feishu.cn/open-apis',
            appId: 'cli_a80cb37dcd38100c',
            appSecret: 'Mwt5E3bmVTpSswOREPFJSdLo6VJnnr0F'
        },
        server: {
            port: process.env.PORT || 3000
        },
        limits: {
            frequency: { emails: 200, seconds: 100 },
            daily: { emails: 100 }
        }
    };
}

const app = express();
const PORT = config.server.port || process.env.PORT || 3000;

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
        throw new Error(`获取飞书访问令牌失败: ${error.message}`);
    }
}

// 通过飞书API发送邮件
async function sendEmailViaFeishuAPI(emailData, sender) {
    try {
        const accessToken = await getFeishuAccessToken();
        
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
        
        if (response.data.code === 0) {
            return { success: true, messageId: response.data.data.message_id };
        } else {
            throw new Error(`发送失败: ${response.data.msg}`);
        }
    } catch (error) {
        throw new Error(`飞书API发送失败: ${error.message}`);
    }
}

// 通过SMTP发送邮件
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
        return { success: true, messageId: result.messageId };
    } catch (error) {
        throw new Error(`SMTP发送失败: ${error.message}`);
    }
}

// API路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 测试连接
app.post('/api/test-connection', async (req, res) => {
    try {
        const { provider } = req.body;
        
        if (provider === 'feishu') {
            // 测试飞书API连接
            const accessToken = await getFeishuAccessToken();
            res.json({
                success: true,
                message: '飞书API连接成功',
                accessToken: accessToken.substring(0, 10) + '...'
            });
        } else {
            // 测试SMTP连接
            const transporter = nodemailer.createTransport({
                host: config.smtp.host,
                port: config.smtp.port,
                secure: config.smtp.secure,
                auth: {
                    user: config.smtp.auth.user,
                    pass: config.smtp.auth.pass
                }
            });
            
            await transporter.verify();
            res.json({
                success: true,
                message: 'SMTP连接成功'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '连接测试失败',
            error: error.message
        });
    }
});

// 发送单封邮件
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, content, provider = 'feishu' } = req.body;
        
        // 检查发送限制
        checkSendLimits();
        
        // 获取可用发件人
        const sender = getNextAvailableSender();
        if (!sender) {
            return res.status(400).json({
                success: false,
                message: '没有可用的发件人，请检查配置或等待限制重置'
            });
        }
        
        const emailData = { to, subject, content };
        let result;
        
        if (provider === 'feishu') {
            result = await sendEmailViaFeishuAPI(emailData, sender);
        } else {
            result = await sendEmailViaSMTP(emailData, sender);
        }
        
        // 更新计数
        updateSendCount();
        updateSenderUsage(sender.id);
        
        res.json({
            success: true,
            message: '邮件发送成功',
            messageId: result.messageId,
            sender: sender.email
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '邮件发送失败',
            error: error.message
        });
    }
});

// 批量发送邮件
app.post('/api/send-bulk-emails', async (req, res) => {
    try {
        const { emails, subject, content, provider = 'feishu' } = req.body;
        
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的邮件列表'
            });
        }
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < emails.length; i++) {
            try {
                // 检查发送限制
                checkSendLimits();
                
                // 获取可用发件人
                const sender = getNextAvailableSender();
                if (!sender) {
                    errors.push({
                        index: i,
                        email: emails[i],
                        error: '没有可用的发件人'
                    });
                    continue;
                }
                
                // 替换变量
                let personalizedContent = content;
                let personalizedSubject = subject;
                
                if (emails[i].variables) {
                    Object.keys(emails[i].variables).forEach(key => {
                        const regex = new RegExp(`\\{${key}\\}`, 'g');
                        personalizedContent = personalizedContent.replace(regex, emails[i].variables[key]);
                        personalizedSubject = personalizedSubject.replace(regex, emails[i].variables[key]);
                    });
                }
                
                const emailData = {
                    to: emails[i].email,
                    subject: personalizedSubject,
                    content: personalizedContent
                };
                
                let result;
                if (provider === 'feishu') {
                    result = await sendEmailViaFeishuAPI(emailData, sender);
                } else {
                    result = await sendEmailViaSMTP(emailData, sender);
                }
                
                // 更新计数
                updateSendCount();
                updateSenderUsage(sender.id);
                
                results.push({
                    index: i,
                    email: emails[i].email,
                    success: true,
                    messageId: result.messageId,
                    sender: sender.email
                });
                
                // 添加延迟避免频率限制
                if (i < emails.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                errors.push({
                    index: i,
                    email: emails[i].email,
                    error: error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: `批量发送完成：成功 ${results.length} 封，失败 ${errors.length} 封`,
            results,
            errors
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '批量发送失败',
            error: error.message
        });
    }
});

// 获取发件人列表
app.get('/api/senders', (req, res) => {
    res.json({
        success: true,
        senders: senders.map(sender => ({
            id: sender.id,
            email: sender.email,
            provider: sender.provider,
            dailyUsed: sender.dailyUsed,
            dailyLimit: sender.dailyLimit,
            isConfigured: sender.isConfigured,
            isActive: sender.isActive,
            isAvailable: sender.dailyUsed < sender.dailyLimit
        }))
    });
});

// 添加发件人
app.post('/api/senders', (req, res) => {
    try {
        const { email, password, dailyLimit = 100, isActive = true } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '请提供邮箱和密码'
            });
        }
        
        const newSender = {
            id: senders.length + 1,
            email,
            password,
            provider: 'feishu',
            dailyLimit,
            dailyUsed: 0,
            isConfigured: true,
            isActive,
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

// 启动服务器（仅在非 Vercel 环境）
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
        console.log('📧 飞书邮箱API集成已启动');
        console.log(`📊 发送限制：${config.limits.frequency.emails}封/${config.limits.frequency.seconds}秒，每日${config.limits.daily.emails}封`);
        console.log(`👤 当前发件人：${senders.length}个`);
        console.log('🔒 安全提醒：请确保 config.js 文件不会被提交到版本控制系统');
    });
}

module.exports = app;
