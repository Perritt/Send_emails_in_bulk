# 📧 批量邮件发送工具

一个功能强大的批量邮件发送工具，支持飞书邮箱和Gmail，集成React Quill富文本编辑器，提供专业的邮件编辑和发送体验。

## ✨ 主要功能

### 🎯 核心功能
- **批量邮件发送**：支持CSV文件导入，批量发送个性化邮件
- **变量替换**：支持 `{Creator Name}` 和 `{Social Media Link}` 变量
- **富文本编辑**：集成React Quill，提供专业的邮件编辑体验
- **多发件人支持**：支持多个发件人，自动切换和负载均衡

### 📮 邮件服务商
- **飞书邮箱**：完全支持，SMTP和API两种发送方式
- **Gmail**：即将支持，敬请期待

### 👤 发件人管理
- **多发件人**：支持添加和管理多个发件人
- **独立配置**：每个发件人支持单独配置
- **自动切换**：当一个发件人达到上限时自动切换到下一个
- **状态监控**：实时显示发件人状态和使用情况

### ✍️ 富文本编辑器
- **专业编辑**：基于React Quill的专业富文本编辑器
- **丰富格式**：支持字体、颜色、对齐、列表、引用等
- **多媒体支持**：支持图片、链接插入
- **变量插入**：一键插入邮件变量

## 🚀 快速开始

### 系统要求
- Node.js >= 14.0.0
- npm >= 6.0.0
- 支持的操作系统：macOS, Linux, Windows

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/yourusername/bulk-email-sender.git
cd bulk-email-sender
```

2. **安装依赖**
```bash
npm install
```

3. **配置邮箱**
```bash
# 复制配置文件
cp config.example.js config.js

# 编辑配置文件，填入您的邮箱信息
# 详见配置说明部分
```

4. **启动服务**
```bash
npm start
```

5. **访问应用**
打开浏览器访问：http://localhost:3000

## ⚙️ 配置说明

### 1. 复制配置文件
```bash
cp config.example.js config.js
```

### 2. 编辑配置文件
编辑 `config.js` 文件，填入您的实际配置：

```javascript
module.exports = {
    smtp: {
        host: 'smtp.feishu.cn',
        port: 465,
        secure: true,
        auth: {
            user: 'your-email@feishu.cn',  // 您的飞书邮箱
            pass: 'your-app-password'       // 您的应用密码
        }
    },
    api: {
        baseUrl: 'https://open.feishu.cn/open-apis',
        appId: 'your-app-id',              // 您的应用ID
        appSecret: 'your-app-secret'       // 您的应用密钥
    },
    server: {
        port: 3000
    },
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
```

### 3. 飞书邮箱配置

#### SMTP方式配置：
1. 登录飞书邮箱管理后台
2. 进入"设置" → "IMAP/SMTP服务"
3. 开启SMTP服务，获取应用密码
4. 在配置文件中填入邮箱地址和应用密码

#### API方式配置：
1. 访问[飞书开放平台](https://open.feishu.cn/)
2. 创建应用，获取App ID和App Secret
3. 在配置文件中填入应用信息

## 📖 使用指南

### 1. 上传联系人数据
- 准备CSV文件，包含以下列：
  - `Email`：收件人邮箱
  - `Creator Name`：创建者姓名
  - `Social Media Link`：社交媒体链接
- 点击"选择文件"上传CSV文件

### 2. 编辑邮件模板
- 在富文本编辑器中编写邮件内容
- 使用 `{Creator Name}` 和 `{Social Media Link}` 作为变量
- 点击工具栏按钮快速插入变量
- 使用丰富的格式化工具美化邮件

### 3. 配置发件人
- 点击"➕ 添加发件人"添加新的发件人
- 配置邮箱地址和应用密码
- 系统会自动管理发件人的使用情况

### 4. 发送邮件
- 选择发送方式（SMTP或API）
- 设置发送间隔
- 点击"🚀 开始发送"开始批量发送
- 在日志区域查看发送进度和结果

## 🔧 API 接口

### 发送邮件
```http
POST /api/send-email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "邮件主题",
  "content": "<p>邮件内容</p>",
  "method": "smtp"
}
```

### 批量发送
```http
POST /api/send-bulk-emails
Content-Type: application/json

{
  "emails": [
    {
      "to": "recipient1@example.com",
      "subject": "Hi {Creator Name}",
      "content": "<p>Hello {Creator Name}...</p>"
    }
  ],
  "interval": 2000,
  "method": "smtp"
}
```

### 测试连接
```http
GET /api/test-connection
```

### 获取发送限制
```http
GET /api/send-limits
```

### 发件人管理
```http
GET /api/senders          # 获取发件人列表
POST /api/senders         # 添加发件人
PUT /api/senders/:id      # 更新发件人
DELETE /api/senders/:id   # 删除发件人
```

## 🛠️ 开发

### 开发模式
```bash
npm run dev
```

### 项目结构
```
bulk-email-sender/
├── server.js              # 服务器主文件
├── config.example.js      # 配置文件示例
├── package.json           # 项目配置
├── index.html             # 前端页面
├── styles.css             # 样式文件
├── script.js              # 前端脚本
├── sample_data.csv        # 示例数据
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明
```

### 技术栈
- **后端**：Node.js + Express.js
- **前端**：HTML + CSS + JavaScript
- **富文本编辑器**：React Quill
- **邮件发送**：Nodemailer + Axios
- **文件解析**：Papa Parse

## �� 安全说明

### 重要提醒
- **配置文件安全**：确保 `config.js` 文件不会被提交到版本控制系统
- **敏感信息**：不要在代码中硬编码邮箱密码等敏感信息
- **定期更新**：定期更换应用密码，确保账户安全
- **访问控制**：建议在生产环境中添加访问控制

### 安全最佳实践
1. 使用环境变量存储敏感信息
2. 定期更换应用密码
3. 限制API访问频率
4. 监控异常登录行为
5. 使用HTTPS协议

## 🤝 贡献指南

### 如何贡献
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 遵循现有的代码风格
- 添加必要的注释
- 确保代码通过测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [React Quill](https://github.com/zenoamaro/react-quill) - 优秀的React富文本编辑器
- [Quill.js](https://quilljs.com/) - 强大的富文本编辑器
- [Nodemailer](https://nodemailer.com/) - Node.js邮件发送库
- [Express.js](https://expressjs.com/) - 快速、灵活的Node.js Web框架

## 📞 联系方式

- 项目主页：[https://github.com/yourusername/bulk-email-sender](https://github.com/yourusername/bulk-email-sender)
- 问题反馈：[https://github.com/yourusername/bulk-email-sender/issues](https://github.com/yourusername/bulk-email-sender/issues)

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
