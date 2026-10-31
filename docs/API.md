# API Contract 草案

## 内容配置

- `GET /api/v1/content-settings` → 客户端可展示文案配置
- `PUT /api/v1/content-settings` → Admin 保存健康结果与咨询引导文案（需 Admin Session）
- `GET /api/v1/health/reports/:id/file` → 按客户本人、已配对健管师或 Admin 权限读取报告原文件；不会返回内部存储路径

## 即时咨询房间 API（目标 Contract）

以下接口前缀 `/api/v1`；目录和演示登录公开，其他新咨询接口使用 `Authorization: Bearer <demo token>`。演示角色登录仅用于本地，不可用于公网生产环境。

| 方法 | 路径 | 用途/角色 |
|---|---|---|
| POST | /auth/demo-login | `{role, id?}` → `{token, id, role, name}` |
| GET | /consultation-directory | 初级健管师、状态、免费资格与可用服务类型 |
| PUT | /consultation-directory/:id | Admin 配置健管师状态、时段、名额与免费资格；健管师端只读 |
| GET | /consultations/eligibility | 客户血检报告判定与体检中心路由 |
| POST | /consultation-requests | 客户提交 `{serviceType, mode, consultantPreference?, requestId}`；幂等、资格校验 |
| GET | /consultation-requests | 按角色与归属查询请求状态 |
| GET | /consultations/queue | Admin：等待请求、在线状态、闲置时间与超时风险 |
| POST | /consultation-requests/:id/assign | Admin 人工派单 `{consultantId}` |
| POST | /consultation-requests/auto-assign | Admin 自动派初级健管师，返回 assignedCount |
| POST | /consultation-requests/:id/accept | 指定健管师接受并创建 Conversation |
| POST | /consultation-requests/:id/cancel | 客户本人或 Admin 取消请求 |
| GET | /conversations | 当前角色可访问的咨询房间 |
| GET | /conversations/:id | 房间状态、参与者与客户健康摘要 |
| GET | /conversations/:id/messages?cursor= | 分页获取文字与系统消息 |
| POST | /conversations/:id/messages | `{clientMessageId, type, content}`；幂等发送 |
| POST | /conversations/:id/read | 更新当前参与者已读游标 |
| POST | /conversations/:id/join | 进入房间并更新在线状态 |
| POST | /conversations/:id/leave | 离开房间但不结束咨询 |
| POST | /conversations/:id/complete | 健管师结束咨询并产生 ServiceRecord |
| POST | /voice-sessions | 创建语音会话，返回 Mock/正式 Provider 连接信息 |
| POST | /voice-sessions/:id/accept | 接受语音邀请 |
| POST | /voice-sessions/:id/end | 结束语音会话并记录时长 |
| POST | /consultations/presence | 客户或健管师心跳 `{status, conversationId?, action?}` |
| GET | /consultation-notifications | 当前角色/账户通知 |
| POST | /consultation-notifications/:id/read | 本人通知标记已读 |

咨询请求状态：requested → queued → assigned → waiting_consultant → in_progress → completed；有效请求可取消、过期或重新派单。
房间内消息状态：sending → sent → delivered → read；语音状态：idle → calling → connected → ended/failed。
`POST /health/reports` 接受显式 `kind: blood_test | general`，目前仍为 Mock 解析。
错误采用 HTTP 400/401/403/404/409/422，前端显示后端错误，不伪造操作成功。

统一前缀 `/api/v1`，JSON UTF-8；金额字段以 `*_fen` 命名。第一阶段由同名 Mock Repository 实现。

## API 版本與金鑰原則

- HealthAI 自有 API 統一使用 `/api/v1` 前綴；第一階段本地 Mock API 同時保留舊 `/api` 入口相容。
- 客戶端、健管師手機端與 Admin 都只應呼叫 HealthAI 自有 API，不直接呼叫外部服務。
- 外部 API Key 只放在後端 `server/.env`，不得放入 uni-app、Admin 前端或 Git。
- 第一階段不需要提供任何真實 API Key；使用 Mock Provider 即可開發與測試。

## 本地後端啟動與資料持久化

- `pnpm run dev:api` 啟動 HealthAI API，預設監聽 `127.0.0.1:8787`。
- 預設 `HEALTHAI_DB=sqlite`，資料寫入 `server/healthai.sqlite`；第一次啟動會以 `server/mock-db.json` 作為種子資料。
- 若需暫時使用舊 JSON 存儲，可設定 `HEALTHAI_DB=json` 與 `HEALTHAI_DATA_FILE`；前端不需要改 API URL。
- 生產環境需將 Repository 替換為 PostgreSQL/MySQL，並把 `HOST` 設為 `0.0.0.0`，不能把 SQLite 檔案直接當作多人高併發資料庫。

## 第一批本地 API

- `GET /api/v1/status` → API health status
- `POST /api/v1/auth/wechat-login` → 小程序端传入 `wx.login()` 的一次性 `code`；AppSecret 只在后端调用微信 `code2Session`，不会返回前端。
- `POST /api/v1/auth/operator-login` → Admin/运营人员账号登录，Body `{ role, username, password }`；账号由 `HEALTHAI_OPERATOR_ACCOUNTS_JSON` 注入，返回服务器签名 Session。

### 微信体验登录

```json
{ "code": "wx.login() 返回的一次性 code", "role": "customer" }
```

开发环境可设置 `WECHAT_TEST_MODE=true`，将体验身份映射到 `WECHAT_TEST_CUSTOMER_ID` 或 `WECHAT_TEST_CONSULTANT_ID`；这只用于本地／体验版验收，生产环境必须关闭。生产环境忽略客户端提交的 `role`，新微信身份默认只能成为客户；健管师身份必须由后台绑定后才可使用。
- `POST /api/v1/auth/mock-login` → mock access token and customer identity
- `GET /api/v1/health/profile` → health profile；用户身份从 Bearer Session 取得
- `PUT /api/v1/health/profile` → update health profile
- `GET /api/v1/health/observations` / `POST /api/v1/health/observations` → confirmed/manual observations
- `GET /api/v1/health/reports` / `POST /api/v1/health/reports` → report metadata and base64 file upload
- `GET /api/v1/health/reports/:id/extractions` → mock OCR candidates
- `POST /api/v1/health/reports/:id/retry-extraction` → retry a failed blood-test extraction; returns candidates or the latest failure state
- `POST /api/v1/health/reports/:id/confirm` → confirm/correct candidates and create observations
- `GET /api/v1/health/ai-reports` → latest saved AI report
- `POST /api/v1/health/ai-reports/generate` → generate from confirmed observations on the server
- `GET /api/v1/orders` / `POST /api/v1/orders` → customer orders
- `POST /api/v1/orders/:id/mock-pay` → mock payment success and service activation

## Auth
- `POST /auth/wechat-login` → `{ code }` → `{ token, user }`
- `GET /me` → `User`

## Health
- `GET /health/profile` → `HealthProfile`
- `PUT /health/profile` → `HealthProfile`（保存基础资料、既往史、过敏/用药、家族史、生活方式；需健康资料授权）
- `GET /health/profile/completeness` → `{ score, missingFields[] }`
- `POST /health/consents` → `ConsentRecord`
- `GET /health/consents` → `ConsentRecord[]`
- `GET /health/observations?code=&from=&to=` → `Observation[]`
- `POST /health/observations` → `Observation`
- `POST /health/observations/:id/confirm` → `Observation`（确认 candidate）
- `POST /health/observations/:id/correct` → `Observation`（保留 ObservationRevision）
- `GET /health/trends?code=&range=` → `HealthTrend[]`
- `POST /health/reports` multipart → `{ report, extraction_job }`（上传原始文件并异步解析）
- `GET /health/reports` → `HealthReport[]`
- `GET /health/reports/:id` → `HealthReportDetail`（含当前版本与原文件信息）
- `GET /health/reports/:id/extractions` → `{ job, candidates[] }`
- `POST /health/reports/:id/retry-extraction` → `ReportExtractionJob`
- `POST /health/reports/:id/confirm` → `{ observations[] }`（批量确认/修正候选字段）
- `GET /health/data-sources` → `{ reports[], manualEntries[], lastUpdatedAt }`
- `GET /health/results/latest` → `{ score, summary, attention: Observation[] }`
- `POST /health/ai-reports/generate` → `AIHealthReport`（仅 confirmed 数据；Provider 可替换）
- `GET /health/ai-reports/latest` → `AIHealthReport`

## Consultants / Commerce
- `GET /consultants?category=&level=&keyword=` → `Consultant[]`
- `GET /consultants/:id` → `ConsultantDetail`
- `GET /service-plans?consultant_id=` → `ServicePlan[]`
- `POST /orders` → `Order`（服务关系与授权在订单成功后建立）
- `POST /payments/mock-success` → `Payment`
- `GET /orders` → `Order[]`

## Consultation / Messaging / Content
- `GET /consultant/clients` → 已分配客户列表与资料数量
- `GET /consultant/clients/:userId/health` → 已授权客户健康档案、报告、确认指标、资料时间线与 AI 摘要
- `GET /consultant/insights` → 已分配客户的 AI 洞察与审核状态
- `POST /consultant/insights/:id/review` → `{status: approved|rejected}`，写入审核记录
- `GET /consultants/:id/availability` → `{ status, service_types[], slots[] }`（客户只读）
- `PUT /consultants/:id/availability` → `ConsultantAvailability`（仅 Admin）
- `POST /consultation-requests` → `ConsultationRequest`
- `GET /consultation-requests` → `ConsultationRequest[]`
- `GET /consultations/queue` → `ConsultationQueue[]`
- `POST /consultation-requests/:id/assign` → `ConsultationRequest`
- `POST /consultation-requests/auto-assign` → `{ assigned_count }`
- `GET /conversations` → `Conversation[]`
- `GET /conversations/:id/messages` → `{ items, nextCursor }`
- `POST /conversations/:id/messages` → `Message`
- `POST /conversations/:id/read` → `ConversationParticipant`
- `POST /conversations/:id/join` / `leave` → `ConversationParticipant`
- `POST /conversations/:id/complete` → `ServiceRecord`
- `POST /voice-sessions` / `:id/accept` / `:id/end` → `VoiceSession`
- `GET /notifications` → `Notification[]`
- `POST /notifications/:id/read` → `Notification`
- `GET /health-check-centers` → `HealthCheckCenter[]`
- `GET /education/articles` → `EducationArticle[]`
- `PUT /education/articles` (admin) → `EducationArticle[]`，保存草稿/发布状态；客户端只读取已发布内容
- `GET /content-settings` → 结果文案与已启用的指标基础解释
- `PUT /content-settings` (admin) → 保存结果文案与指标解释配置

## Provider 约束
WechatAuthProvider、PaymentProvider、OcrProvider、AiProvider、ImProvider 均通过 interface 注入；Mock provider 不得改变正式返回结构。
- `OcrProvider` 只负责从报告版本提取 candidate，不得直接写入 confirmed Observation。
- `AiProvider` 必须接收明确的 profile/observation 版本，并返回可追溯的 source version。
- 正式 API 必须支持幂等键、异步 job 状态、失败重试与权限校验；Mock API 可用内存状态模拟。
