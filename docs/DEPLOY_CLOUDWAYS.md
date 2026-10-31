# HealthAI Cloudways 部署手册

本文件把本地可运行版本部署到 Cloudways 上的 Node.js 应用。正式环境必须使用独立数据库、对象存储和微信/支付 Provider；当前 SQLite 与 Mock Provider 仅适合第一阶段验收。

## 1. 构建

在项目根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build:h5
cd console && pnpm install --frozen-lockfile && pnpm run build
```

将根目录 `dist/`（C 端 H5）和 `console/dist/`（Admin Web）分别发布到静态站点或 Nginx。API 不依赖前端开发服务器。

C 端正式构建前复制 `.env.production.example` 为 `.env.production`，把 `VITE_API_BASE_URL` 换成正式 API 域名，并保持 `VITE_AUTH_MODE=wechat`；否则构建产物会继续使用本地演示登录逻辑。

## 2. 生产环境变量

不要把真实密钥提交到 Git。Cloudways 环境变量至少需要：

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=8787
HEALTHAI_SESSION_SECRET=长度至少32位的随机值
HEALTHAI_SESSION_TTL_SECONDS=86400
HEALTHAI_CORS_ORIGIN=https://你的客户端域名
HEALTHAI_DB=sqlite
HEALTHAI_DB_FILE=/home/应用用户/healthai-data/healthai.sqlite
HEALTHAI_UPLOAD_DIR=/home/应用用户/healthai-data/uploads
HEALTHAI_OPERATOR_ACCOUNTS_JSON=[{"id":"admin-001","role":"admin","name":"管理员","username":"admin","password":"请替换为强密码"},{"id":"c-101","role":"consultant","name":"陈晨","username":"c-101","password":"请替换为强密码"}]
WECHAT_APP_ID=真实小程序AppID
WECHAT_APP_SECRET=真实小程序AppSecret
WECHAT_TEST_MODE=false
```

生产环境禁止使用 `touristappid`、`WECHAT_TEST_MODE=true` 或 `demo-login`。
Admin 与健管师工作台使用后端 `operator-login`，账号通过 `HEALTHAI_OPERATOR_ACCOUNTS_JSON` 注入；不要把账号密码写入前端环境变量或提交到代码库。

## 3. 启动 API

在项目根目录执行：

```bash
mkdir -p /home/应用用户/healthai-data/uploads
pm2 start server/ecosystem.config.cjs
pm2 save
pm2 startup
```

确认：

```bash
curl https://你的API域名/api/v1/status
```

应该返回 `status: ok`。

## 4. 反向代理

让 `https://你的API域名/api/` 反向代理到 `127.0.0.1:8787/api/`。客户端与 Admin 的 `VITE_API_BASE_URL` 分别设置为：

```env
VITE_API_BASE_URL=https://你的API域名/api/v1
```

重新构建前端后再发布，不能在浏览器端暴露 AppSecret、支付密钥或 LLM Key。

## 6. GitHub Pages（仅 H5 静态前端）

仓库已提供 `.github/workflows/deploy-pages.yml`。在 GitHub 仓库 Settings → Secrets and variables → Actions 新增：

```text
HEALTHAI_API_BASE_URL=https://你的API域名/api/v1
```

启用 Pages 的 GitHub Actions 来源后，推送 `master` 会自动构建并发布 H5。Workflow 会拒绝空 API URL，避免把 localhost 构建发布给真实用户。GitHub Pages 只托管前端，不能替代 API、数据库、上传文件与 WebSocket/语音服务。

## 5. 上线前检查

- 关闭测试微信登录与所有 demo 账号入口
- 使用独立 PostgreSQL/MySQL 替换 SQLite
- 文件迁移到对象存储并使用签名 URL
- 配置每日数据库和文件备份
- 配置 HTTPS、CORS 白名单、限流和日志监控
- 完成真实微信登录、支付、OCR、LLM、推送和语音 Provider 验收

没有 Cloudways 主机 SSH/API 凭证时，代理无法代替用户执行远程发布；本手册和 `server/ecosystem.config.cjs` 已准备好，取得主机信息后按此执行即可。
