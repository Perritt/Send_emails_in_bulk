// 飞书邮箱配置文件
// 基于用户提供的实际配置信息

module.exports = {
    // 飞书邮箱SMTP配置
    smtp: {
        host: 'smtp.feishu.cn',
        port: 465,  // 使用SSL端口
        secure: true, // 启用SSL
        auth: {
            user: 'Sean@insty.cc',
            pass: 'zcLJcyRvDKWpUb4V'  // IMAP/SMTP密码
        }
    },
    
    // 飞书开放平台API配置
    api: {
        baseUrl: 'https://open.feishu.cn/open-apis',
        appId: 'cli_a80cb37dcd38100c',
        appSecret: 'Mwt5E3bmVTpSswOREPFJSdLo6VJnnr0F'
    },
    
    // 服务器配置
    server: {
        port: 3000
    },
    
    // 发送限制配置（基于飞书邮箱限制）
    limits: {
        frequency: {
            emails: 200,
            seconds: 100
        },
        daily: {
            emails: 100
        }
    }
};
