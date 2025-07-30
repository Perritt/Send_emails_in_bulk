# 🚀 Vercel 部署指南

## 📋 问题分析

您遇到的 `vercel.json` 文件无效错误已经修复。问题是由于：
1. 文件内容为空
2. 配置格式不正确

## ✅ 解决方案

### 1. 已修复的文件

#### `vercel.json` - 简化的 Vercel 配置文件
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

#### `server.js` - 已优化支持 Vercel 部署
- ✅ 支持环境变量配置
- ✅ 自动检测 Vercel 环境
- ✅ 移除本地服务器启动（Vercel 环境）
- ✅ 改进错误处理

### 2. 配置说明

#### `vercel.json` 配置详解：
- **`version`**: Vercel 配置版本
- **`builds`**: 指定使用 `@vercel/node` 构建 `server.js`
- **`routes`**: 将所有请求路由到 `server.js`

#### `server.js` 环境检测：
```javascript
// 优先使用环境变量（Vercel 部署）
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    // 使用环境变量配置
} else {
    // 本地开发环境使用配置文件
    config = require('./config.js');
}
```

## 🔧 部署步骤

### 1. 提交更改
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### 2. 重新部署
Vercel 会自动检测到新的配置并重新部署。

### 3. 环境变量配置（可选）
如果需要自定义配置，在 Vercel 项目设置中添加：
- `SMTP_HOST=smtp.feishu.cn`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=Sean@insty.cc`
- `SMTP_PASS=your-app-password`
- `FEISHU_APP_ID=cli_a80cb37dcd38100c`
- `FEISHU_APP_SECRET=Mwt5E3bmVTpSswOREPFJSdLo6VJnnr0F`

## ⚠️ 重要注意事项

### 1. 默认配置
项目已包含默认的飞书邮箱配置，无需额外设置即可部署。

### 2. 功能限制
Vercel 部署后的一些限制：
- **无状态环境**: 无法持久化存储数据
- **函数超时**: 最长 30 秒执行时间
- **冷启动**: 首次访问可能有延迟

### 3. 推荐使用场景
- ✅ **演示和测试**: 快速部署演示版本
- ✅ **小规模使用**: 少量邮件发送
- ❌ **大规模生产**: 建议使用传统服务器

## 🔍 故障排除

### 常见问题

#### 1. 构建失败
- ✅ 检查 `package.json` 依赖
- ✅ 确保所有文件已提交
- ✅ 查看 Vercel 构建日志

#### 2. 运行时错误
- ✅ 检查环境变量配置
- ✅ 查看 Vercel 函数日志
- ✅ 确保 API 密钥有效

#### 3. 邮件发送失败
- ✅ 检查 SMTP 配置
- ✅ 验证邮箱凭据
- ✅ 查看网络连接

## 📊 部署状态检查

### ✅ 成功部署的标志
- [ ] 构建成功完成
- [ ] 网站可以正常访问
- [ ] API 接口响应正常
- [ ] 邮件发送功能正常

### ❌ 需要修复的问题
- [ ] 构建失败
- [ ] 运行时错误
- [ ] 功能异常
- [ ] 配置问题

## 🎯 下一步

1. **提交更改**到 GitHub
2. **重新部署**到 Vercel
3. **测试功能**是否正常
4. **配置环境变量**（如果需要）
5. **监控部署状态**

---

💡 **提示**: 如果部署后仍有问题，请检查 Vercel 的构建日志和函数日志以获取详细错误信息。

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Node.js 部署指南](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables) 