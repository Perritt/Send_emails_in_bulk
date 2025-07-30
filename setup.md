# 安装和配置指南

## 方案一：安装Node.js（推荐）

### 1. 安装Node.js

#### macOS用户：
```bash
# 使用Homebrew安装
brew install node

# 或下载官方安装包
# 访问 https://nodejs.org/ 下载LTS版本
```

#### Windows用户：
1. 访问 https://nodejs.org/
2. 下载并安装LTS版本

#### Linux用户：
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo yum install -y nodejs
```

### 2. 验证安装
```bash
node --version
npm --version
```

### 3. 安装项目依赖
```bash
npm install
```

### 4. 配置飞书邮箱
1. 复制 `config.example.js` 为 `config.js`
2. 填入您的飞书邮箱配置
3. 启动服务器：`npm start`

## 方案二：使用Python服务器（临时方案）

如果暂时无法安装Node.js，可以使用Python启动简单的HTTP服务器：

```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

然后访问 `http://localhost:8080`

注意：Python服务器版本只支持前端功能，无法进行真实的邮件发送。

## 飞书邮箱配置步骤

### 1. 开启SMTP服务
1. 登录飞书邮箱
2. 进入设置 -> 账户安全
3. 开启"第三方客户端访问"
4. 生成应用密码

### 2. 获取API凭证（可选）
1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建应用
3. 获取 App ID 和 App Secret

### 3. 配置文件设置
创建 `config.js` 文件：

```javascript
module.exports = {
    smtp: {
        host: 'smtp.feishu.cn',
        port: 587,
        secure: false,
        auth: {
            user: 'your-email@feishu.cn',
            pass: 'your-app-password'
        }
    },
    api: {
        baseUrl: 'https://open.feishu.cn/open-apis',
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
    }
};
```

## 常见问题

### Q: 无法安装Node.js
A: 可以暂时使用Python服务器运行前端功能

### Q: 飞书邮箱配置失败
A: 检查以下几点：
- 确认邮箱地址正确
- 确认应用密码正确
- 确认SMTP服务已开启

### Q: 发送邮件失败
A: 检查以下几点：
- 网络连接正常
- 邮箱配置正确
- 发送间隔设置合理

## 技术支持

如果遇到问题，请检查：
1. Node.js版本是否为14.0+
2. 网络连接是否正常
3. 飞书邮箱配置是否正确
4. 防火墙是否阻止了连接 