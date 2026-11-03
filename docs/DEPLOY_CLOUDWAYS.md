# HealthAI Cloudways 部署手册

本文件把本地可运行版本部署到 Cloudways 上的 Node.js 应用。正式环境应使用独立 PostgreSQL 数据库、对象存储和微信/支付 Provider；SQLite 可用于单机过渡验收，Mock Provider 仅适合第一阶段验收。

## 1. 构建

在项目根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build:h5
cd console && pnpm install --frozen-lockfile && pnpm run build
```

发布前也可以在项目根目录直接执行完整验收：

```bash
pnpm run verify:release
```

微信小程序正式构建时不要修改并提交 `src/manifest.json` 中的 AppID，使用本地环境变量注入：

```powershell
$env:WECHAT_MP_APPID = '真实小程序 AppID'
pnpm run build:mp-weixin:production
```

该命令只在构建期间临时写入 AppID，完成后会恢复原始 manifest；缺少 AppID 或仍使用 `touristappid` 时会直接失败。

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
# 多个前端来源用逗号分隔，例如 C 端与 Admin 各一个域名
HEALTHAI_CORS_ORIGIN=https://你的客户端域名,https://你的Admin域名
HEALTHAI_DB=postgres
HEALTHAI_DATABASE_URL=postgresql://数据库用户:数据库密码@数据库主机:5432/healthai
HEALTHAI_DB_SSL=true
# 使用 SQLite 单机过渡时才设置以下两项：
# HEALTHAI_DB=sqlite
# HEALTHAI_DB_FILE=/home/应用用户/healthai-data/healthai.sqlite
HEALTHAI_UPLOAD_DIR=/home/应用用户/healthai-data/uploads
HEALTHAI_OPERATOR_ACCOUNTS_JSON=[{"id":"admin-001","role":"admin","name":"管理员","username":"admin","passwordHash":"scrypt$..."},{"id":"c-101","role":"consultant","name":"陈晨","username":"c-101","passwordHash":"scrypt$..."}]
WECHAT_APP_ID=真实小程序AppID
WECHAT_APP_SECRET=真实小程序AppSecret
WECHAT_TEST_MODE=false
# 正式环境不要开启；未接入真实 Provider 时 /readyz 会保持 not_ready
HEALTHAI_ALLOW_MOCK_PROVIDERS=false
```

生产环境禁止使用 `touristappid`、`WECHAT_TEST_MODE=true`、`demo-login` 或未明确豁免的 Mock AI/OCR。`HEALTHAI_ALLOW_MOCK_PROVIDERS=true` 只允许本地／内部验收，不能用于正式用户环境；正式环境未接入真实 Provider 时 `/readyz` 会返回 `not_ready`。
Admin 与健管师工作台使用后端 `operator-login`，账号通过 `HEALTHAI_OPERATOR_ACCOUNTS_JSON` 注入；支持 `passwordHash`（scrypt），不要把账号密码写入前端环境变量或提交到代码库。本地旧配置的 `password` 仍可用，但正式环境应移除。

产生密码哈希：

```bash
pnpm run hash:operator
```

把命令输出的 `scrypt$...` 填入对应账号的 `passwordHash` 字段；该命令不会修改项目文件。

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
curl https://你的API域名/healthz
curl https://你的API域名/readyz
curl https://你的API域名/api/v1/status
```

三个请求都应该返回成功；其中 `/readyz` 必须返回 `status: ready`。部署后也可以用项目内置脚本验证：

```bash
HEALTHAI_VERIFY_BASE_URL=https://你的API域名 HEALTHAI_VERIFY_ORIGIN=https://你的客户端域名 pnpm run verify:production
```

脚本会验证健康探针、API 状态、未登录资料接口必须返回 401，以及可选的 CORS 来源。若同时设置 `HEALTHAI_VERIFY_USERNAME` 与 `HEALTHAI_VERIFY_PASSWORD`，还会验证 Admin 登录。

## 4. 反向代理

让 `https://你的API域名/api/` 反向代理到 `127.0.0.1:8787/api/`。客户端与 Admin 的 `VITE_API_BASE_URL` 分别设置为：

```env
VITE_API_BASE_URL=https://你的API域名/api/v1
```

重新构建前端后再发布，不能在浏览器端暴露 AppSecret、支付密钥或 LLM Key。

## 5. 数据库模式

后端支持两种持久化模式：

- `HEALTHAI_DB=sqlite`：本地开发或单机过渡环境，资料保存为 SQLite 文件。
- `HEALTHAI_DB=postgres`：正式环境，使用 `HEALTHAI_DATABASE_URL` 连接 PostgreSQL；启动时自动创建 `healthai_state` 表，并以串行写入保存状态快照。

正式环境若选择 PostgreSQL，启动时无法连接数据库会直接失败，不会悄悄退回 JSON 或 SQLite。数据库密码只能放在 Cloudways 环境变量，不能提交到 Git。

## 6. GitHub Pages（仅 H5 静态前端）

仓库已提供 `.github/workflows/deploy-pages.yml`。它会同时发布 C 端与 Admin，Admin 位于 `/HealthAI/admin/`。在 GitHub 仓库 Settings → Secrets and variables → Actions 新增：

```text
HEALTHAI_API_BASE_URL=https://你的API域名/api/v1
```

启用 Pages 的 GitHub Actions 来源后，推送 `master` 会自动构建并发布 H5。Workflow 会拒绝空 API URL，避免把 localhost 构建发布给真实用户。GitHub Pages 只托管前端，不能替代 API、数据库、上传文件与 WebSocket/语音服务。

## 7. 上线前检查

- 关闭测试微信登录与所有 demo 账号入口
- 使用独立 PostgreSQL/MySQL 替换 SQLite
- 文件迁移到对象存储并使用签名 URL
- 配置每日数据库和文件备份
- 配置 HTTPS、CORS 白名单、限流和日志监控
- 完成真实微信登录、支付、OCR、LLM、推送和语音 Provider 验收

没有 Cloudways 主机 SSH/API 凭证时，代理无法代替用户执行远程发布；本手册和 `server/ecosystem.config.cjs` 已准备好，取得主机信息后按此执行即可。
