# GitHub 部署指南

本指南将帮助您将此批量邮件发送工具部署到 GitHub。

## 1. 创建 GitHub 仓库

### 方法一：通过 GitHub 网站
1. 登录 GitHub 账户
2. 点击右上角的 "+" 按钮，选择 "New repository"
3. 填写仓库名称：`bulk-email-sender`
4. 选择 "Public" 或 "Private"
5. 不要初始化 README、.gitignore 或 LICENSE（我们已有这些文件）
6. 点击 "Create repository"

### 方法二：通过 GitHub CLI
```bash
gh repo create bulk-email-sender --public --description "批量邮件发送工具 - 支持飞书邮箱和Gmail"
```

## 2. 推送代码

在项目根目录执行以下命令：

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加远程仓库
git remote add origin https://github.com/yourusername/bulk-email-sender.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: 批量邮件发送工具"

# 推送到 GitHub
git push -u origin main
```

## 3. 配置 GitHub Pages（可选）

如果您想部署静态版本：

1. 进入仓库设置
2. 找到 "Pages" 选项
3. 选择 "Deploy from a branch"
4. 选择 `main` 分支和 `/` 根目录
5. 点击 "Save"

## 4. 设置 GitHub Actions（可选）

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 5. 仓库设置

### 添加描述和标签
- 在仓库页面点击 "About" 部分
- 添加描述：`批量邮件发送工具 - 支持飞书邮箱和Gmail，集成React Quill富文本编辑器`
- 添加标签：`email`, `bulk`, `feishu`, `api`, `smtp`, `react-quill`

### 设置分支保护（推荐）
1. 进入 "Settings" > "Branches"
2. 添加分支保护规则
3. 选择 `main` 分支
4. 启用 "Require pull request reviews"

## 6. 文档完善

### 更新 README.md
确保 README.md 包含：
- 项目描述
- 功能特性
- 安装说明
- 使用方法
- 配置说明
- 贡献指南

### 添加徽章
在 README.md 顶部添加：
```markdown
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black.svg)
```

## 7. 安全注意事项

### 敏感信息处理
- ✅ 确保 `config.js` 已添加到 `.gitignore`
- ✅ 使用环境变量管理敏感信息
- ✅ 检查是否有硬编码的密码或API密钥

### 访问控制
- 考虑使用私有仓库保护敏感代码
- 设置适当的访问权限
- 定期审查代码安全性

## 8. 维护和更新

### 定期更新
- 保持依赖包更新
- 修复安全漏洞
- 添加新功能

### 版本管理
- 使用语义化版本号
- 创建发布标签
- 维护更新日志

---

💡 **提示**: 部署完成后，记得在 README.md 中添加项目链接和演示地址。
