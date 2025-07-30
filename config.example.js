/**
 * 飞书邮箱配置示例
 * 
 * 使用说明：
 * 1. 复制此文件为 config.js
 * 2. 填入您的实际配置信息
 * 3. 确保 config.js 已添加到 .gitignore 中
 */

module.exports = {
    // SMTP 配置
    smtp: {
        host: 'smtp.feishu.cn',
        port: 465,
        secure: true,
        auth: {
            user: 'your-email@feishu.cn',  // 替换为您的飞书邮箱
            pass: 'your-app-password'       // 替换为您的应用密码
        }
    },
    
    // 飞书开放平台 API 配置
    api: {
        baseUrl: 'https://open.feishu.cn/open-apis',
        appId: 'your-app-id',              // 替换为您的应用ID
        appSecret: 'your-app-secret'       // 替换为您的应用密钥
    },
    
    // 服务器配置
    server: {
        port: 3000
    },
    
    // 发送限制配置
    limits: {
        frequency: {
            emails: 200,    // 频率限制：200封邮件
            seconds: 100    // 时间窗口：100秒
        },
        daily: {
            emails: 100     // 每日限制：100封邮件
        }
    }
};

/**
 * 配置说明：
 * 
 * 1. SMTP 配置：
 *    - host: 飞书SMTP服务器地址
 *    - port: SMTP端口（465为SSL，587为TLS）
 *    - secure: 是否使用SSL/TLS
 *    - auth: 邮箱认证信息
 * 
 * 2. API 配置：
 *    - baseUrl: 飞书开放平台API地址
 *    - appId: 应用ID（从飞书开放平台获取）
 *    - appSecret: 应用密钥（从飞书开放平台获取）
 * 
 * 3. 发送限制：
 *    - frequency: 频率限制，防止发送过快
 *    - daily: 每日限制，防止超出配额
 * 
 * 安全提醒：
 * - 请确保 config.js 文件不会被提交到版本控制系统
 * - 不要在代码中硬编码敏感信息
 * - 定期更换应用密码
 */
