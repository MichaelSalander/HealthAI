# 本地咨询流程验收（2026-10-24）

## 启动

根目录及 console 依赖已安装后，在项目根目录运行 `pnpm run dev:local`。
启动 API（8787）、uni-app（5175）、Admin（8848）；API 默认使用 `server/healthai.sqlite` 持久化，启动前会从 `server/mock-db.json` 初始化一次；占用中的端口保留原进程，不自动终止其他软件。

同一局域网用手机验收时，先取得开发机局域网 IP（例如 `192.168.1.20`），在 PowerShell 执行：

```powershell
$env:HEALTHAI_LAN_HOST = '192.168.1.20'
pnpm run dev:local
```

然后手机访问 `http://192.168.1.20:5175`；API 与 Admin 会自动绑定 `0.0.0.0`，C 端自动调用 `http://192.168.1.20:8787/api/v1`。Windows 防火墙需允许 5175、8787、8848 入站；这只适合局域网测试，公网仍需 Cloudways + HTTPS。

微信小程序测试：使用 `pnpm run dev:mp-weixin` 生成微信开发者工具可打开的 `dist/dev/mp-weixin`；当前 `src/manifest.json` 配置为 `touristappid` 和 `urlCheck=false`，仅用于 UI／Mock 流程测试，不代表真实微信登录。

正式小程序构建使用 `WECHAT_MP_APPID=<真实 AppID> pnpm run build:mp-weixin:production`（PowerShell 使用 `$env:WECHAT_MP_APPID='真实 AppID'`），正式构建会强制开启 `urlCheck`。

- 验收入口：`http://localhost:5175/#/pages/demo/index`
- 客户咨询入口：`http://localhost:5175/#/pages/consultants/booking`
- 健管师手机端：`http://localhost:5175/#/pages/consultant/workbench`
- 派单后台：`http://localhost:8848/dispatch.html`
- 主后台菜单：咨询派单，路由 `/consultation-dispatch/index`。

## 手动验收

1. 验收入口选择有血检客户，创建明确标记 blood_test 的 Mock 报告并进入咨询入口。
2. 客户选择文字或语音咨询模式，提交 ConsultationRequest；客户进入等待配对页。
3. 客户请求进入平台队列；相同 requestId 重试返回同一请求。
4. 后台出现同一请求，可人工派单或点击自动派单。
5. 健管师工作台收到配对通知，5 秒轮询更新，可标记已读。
6. 健管师接受请求后建立 Conversation；客户与健管师都可以进入同一个咨询房间。
7. 客户发送文字消息，健管师看到消息并回复；双方离开后重新进入可以补齐未读消息。
8. 点击语音按钮创建 Mock VoiceSession，验证 calling、connected、ended、failed 状态；语音失败时文字仍可用。
9. 健管师结束咨询，生成 ServiceRecord；客户可在服务记录查看结果。
10. Admin 管理健管师状态、公司时段与名额；健管师手机端不出现排班编辑入口。
11. 无血检用户导向指定体检中心；手动录入一个血液指标不算拥有血检报告。

## 数据与权限

公开 demo-login 允许选择 customer、consultant、admin，仅供本地演示，不是生产认证。
新咨询接口验证角色及归属；Token 只保存在进程内，API 重启后刷新页面重新登录。
咨询请求、房间、消息、语音状态、通知与审计写入 server/mock-db.json 的 workflow 字段，保留既有健康资料。
旧健康资料/CMS 接口尚未全部迁移到生产权限体系。

## 验证

根目录：`pnpm run test:consultation`、`pnpm run typecheck`、`pnpm run build:h5`。
console：`pnpm run typecheck`、`pnpm run build`。
浏览器实测：客户提交 → 人工派单 → 健管师通知/接受 → 双方进入房间 → 文字消息同步 → Mock 语音状态 → 结束并生成记录；无血检导流。

## 下一批

真实 WebSocket、语音、系统推播、生产认证尚未接入；本地正式 API 与 SQLite 已接入，Cloudways 部署时可通过 `HEALTHAI_DB`／数据库 Repository 替换为 PostgreSQL 或 MySQL。
公司时段与名额由 Admin Mock 配置；健管师端不再添加或修改时段。
体检中心仍为示例，实际合作中心与联系方式待提供。
