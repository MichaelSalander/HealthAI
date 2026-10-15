# API Contract 草案

统一前缀 `/api/v1`，JSON UTF-8；金额字段以 `*_fen` 命名。第一阶段由同名 Mock Repository 实现。

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

## Provider 约束
WechatAuthProvider、PaymentProvider、OcrProvider、AiProvider、ImProvider 均通过 interface 注入；Mock provider 不得改变正式返回结构。
- `OcrProvider` 只负责从报告版本提取 candidate，不得直接写入 confirmed Observation。
- `AiProvider` 必须接收明确的 profile/observation 版本，并返回可追溯的 source version。
- 正式 API 必须支持幂等键、异步 job 状态、失败重试与权限校验；Mock API 可用内存状态模拟。
