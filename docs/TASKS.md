# 开发任务与验收

## Phase 0 规格与骨架
- [x] T001 阅读 PRD/UI，建立 `MASTER_SPEC` / `UI_SPEC` / `DATABASE` / `API` / `AGENTS`
- [x] T002 建立 uni-app Vue3 TypeScript 工程
- [x] T003 建立页面路由、主题、底部导航、类型、Store、API/Mock Layer

## Phase 1 C 端 Mock Prototype
- [x] T101 C-01 首页：入口与主责健管师卡片可操作
- [x] T102 C-02 我的健康：评分、异常指标、趋势
- [x] T103 C-03 手动记录：保存体重并回到健康页
- [x] T104 C-04 体检报告：上传、Mock 解析成功、历史报告
- [x] T105 C-05 健康结果：基础结果与服务引导
- [x] T106 验收核心路径：首页 → 我的健康 → 体检报告 → Mock解析成功 → 健康结果 → 历史数据

## Phase 1 C 端完整 Mock 流程
- [x] T201 C-06～C-10 健管师浏览、详情、7天体验、正式方案、增值服务
- [x] T202 C-11～C-16 订单、1V1咨询、服务记录、历史趋势、健康数据、我的
- [x] T203 Mock 流程持久化：报告、手动记录、订单使用 uni-app Storage

> T201/T202 已完成前端可点击流程与 Mock Data 闭环。订单支付为 Mock Payment Success；T203 后报告、手动记录与订单会在当前设备预览环境保留。

## 后续（未开始）
- [x] T000 后端 PRD：角色、配对、通知、即时咨询与后端验收流程，详见 `docs/BACKEND_PRD.md`
- [x] T300 后台选型与内容可配置规划，详见 `docs/ADMIN_PLAN.md`
- [x] T301 健管师 Web 工作台 H-01～H-06 Mock 页面与角色菜单
- [x] T401 Admin Web A-01～A-06 Mock 页面与角色菜单
- [x] T402 Mock API：Admin 首页配置/服务方案同步 C 端 Repository
- [ ] T403 其余 CMS 内容、健管师分类、指标文案同步 C 端
- [x] T404 Mock AI Provider：生成基础健康结果与健管师端完整 Insight 摘要
- [ ] T405 核心健康资料采集闭环：健康档案分段填写、报告版本、解析候选、确认/修正与来源追溯

## 2026-10 新增需求
- [x] 橘白品牌主题与客户端入口
- [x] 免费咨询与预约时段页面
- [x] 缺少血液检查时导流指定体检中心
- [x] 公司介绍与卫教入口
- [x] 健管师状态、时段与通知后台原型
- [x] 待咨询人工派单与自动派单后台原型
- [ ] 生产级 API、云端数据库与文件存储
- [ ] 真实语音 Provider
- [ ] 健管师第 6 项与公司介绍第 2 项需求（待补定义）
- [x] T405a C 端健康档案基础资料采集：Repository 持久化、档案入口与表单保存
- [ ] T406 Mock API：Profile/Consent/Report Extraction/Observation Confirm/AI Report Contract
- [x] T406a 本地持久化 API：Profile、Reports、Observations、AI Reports；资料写入 `server/mock-db.json`
- [x] T406b API v1 基础入口：健康检查、Mock Login、健康资料 API 与外部 Provider `.env.example`
- [x] T406c 本地正式 API 持久化层：SQLite Repository，前端继续统一使用 `/api/v1`
- [x] T406d 微信小程序体验登录入口：`wx.login` code2Session、后端密钥隔离、测试角色映射
- [x] T406e 健康资料 API 认证归属：Profile/Reports/Observations/AI Reports 改为从 Bearer Session 取得用户，不再信任前端 `user_id`
- [x] T406f 客户健康 Repository API-only：健康档案、报告、指标写入不再静默回退本地 Mock；API 失败会明确报错
- [x] T406g 报告真实文件上传：H5/小程序选取文件、后端按用户目录持久化原文件与报告元数据，解析 Provider 仍保留 Mock
- [x] T406h 健管师通知页接入后端：登录后读取个人通知、轮询新通知、已读状态写回 API
- [x] T406i 报告解析确认闭环：Mock Extraction Candidates、客户确认/修正、来源关联 Observation 与血检资格联动
- [ ] T407 健管师工作台：待确认资料、解析异常、资料时间线与 AI Insight 审核状态
- [x] T407a 健管师客户列表接入后端：按已分配关系返回客户、报告数量、指标数量与最近活动
- [x] T407b 健管师客户健康资料入口：移动端与 API 均按分配关系读取档案、报告、确认指标与 AI 摘要
- [x] T406j AI 结果由后端生成：仅基于已确认 Observation，保存来源版本并供客户/健管师读取
- [x] T423 客户订单持久化：方案下单、SQLite 保存、Mock Payment Success 与订单查询均走 API
- [x] T406k API Bearer Token 改为服务器签名并带过期时间，服务重启后仍可验证；篡改 Token 返回 401
- [x] T424 Cloudways 部署物料：PM2 配置、生产环境变量模板、H5/Admin 构建与部署手册
- [x] T425 生产安全闸门：签名 Token、生产禁止 demo-login、Session Secret 必填、CORS 可配置；已完成生产启动与 401/403 冒烟验证
- [x] T406l 微信生产角色安全：生产环境忽略客户端 role，未绑定微信身份默认客户，并强制关闭体验登录模式
- [x] T426 H5 生产产物本地静态预览验证：`dist/index.html` 可由独立静态服务返回 200
- [x] T427 OCR/LLM Provider 抽象：默认 Mock，预留 OpenAI-compatible LLM Adapter；报告解析与 AI 生成均通过 Provider，不再把供应商逻辑写死在路由
- [x] T428 本地三端联调：C 端 H5 `5175`、API `8787`、Admin `8848` 均可启动并返回 200/健康状态
- [x] T429 健管师排班权限收口：仅 Admin 可调整时段、容量与满额状态；健管师不能自行排班，只能由平台分配咨询
- [x] T430 Admin 后端登录：管理后台改用 `operator-login` 获取签名 Session，生产环境不再依赖纯前端假登录
- [x] T431 正式构建配置模板：C 端生产环境明确 API 域名与微信登录模式，避免发布后误用 localhost/demo-login
- [x] T432 Admin 配置权限收口：首页内容与服务方案 PUT 仅允许 Admin，并由后台 API 请求携带签名 Session
- [x] T433 健康结果内容配置持久化：结果免责声明与咨询引导由 Admin API 保存，C 端通过 Content Repository 读取
- [x] T434 AI 结果按 Observation 版本缓存：资料未变化时复用既有结果，避免重复调用真实 LLM 与产生不必要成本
- [x] T435 报告原文件授权读取：客户／已配对健管师／Admin 可按权限读取，API 不泄露服务器内部路径
- [x] T436 生产 CORS 安全闸门：正式环境必须配置明确的客户端来源，禁止默认 `*`
- [x] T437 Admin 健管师仪表板改为实时 API：移除静态客户数字与假消息，显示派单、在线状态与通知数据
- [x] T438 局域网设备验收模式：`HEALTHAI_LAN_HOST` 让 H5／API／Admin 使用局域网地址与 `0.0.0.0` 绑定
- [x] T439 GitHub Pages H5 工作流：复用现有部署流程，生产 API URL 缺失时构建失败，配置 Secret 后自动发布静态客户端
- [x] T440 生产多来源 CORS：客户端与 Admin 域名可用逗号分隔白名单，并按请求 Origin 返回
- [x] T441 GitHub Pages 同步发布 Admin：Admin 构建产物发布到 `/HealthAI/admin/`
- [x] T442 生产部署探针与验收脚本：`/healthz`、`/api/v1/status` 与可选 Admin 登录验证
- [x] T443 HTTP 集成验收：客户健康资料、报告确认、AI 结果、Admin 派单、健管师接单与咨询消息全链路
- [x] T444 健康趋势 API：按登录用户与指标代码读取后端观察值，正式 API 失败不再静默显示 Mock 趋势
- [x] T445 客户 Session 恢复：服务器签名 Token 通过 uni-app Storage 恢复，App 重启后仍由后端验证有效期
- [x] T446 过期 Session 自愈：客户 API 返回 401 时清除本地 Token，下一次进入流程可重新登录
- [x] T447 Admin 派单页真实化：待咨询队列、可接单健管师、人工派单与自动派单均改走后端 API
- [x] T003a C 端页面统一依赖 `services/api/repositories` 入口，页面不再直接导入 Mock Repository
- [x] T003b App 启动身份与健康 API 统一使用后端 Session，微信登录成功后复用客户 Session
- [x] T003c 清理前端 Mock 登录命名：App Store 统一调用 `AuthProvider.login()`，页面只依赖 API Repository 入口
- [x] T407c 客户端与健管师端读取同一份后端 AI 结果，健管师移动端可从已分配客户进入健康资料页
- [x] T408 第一批咨询闭环：血液检查状态判断、健管师可用时段、建立待派单预约与健管师通知 Mock API
- [x] T409 本地咨询派单：容量、幂等、角色隔离、人工/自动派单、接受/完成/取消、通知已读与审计
- [x] T410 健管师 uni-app 工作台：预约、通知轮询、接单状态
- [x] T411 Admin 同步派单：咨询队列、客户在线/闲置、免费资格配置；独立演示入口
- [x] T412 本地启动脚本、核心业务测试与跨端浏览器验收，见 LOCAL_CONSULTATION_ACCEPTANCE.md
- [x] T413 健管师手机工作台重做：橘白移动端视觉、固定底部导航、客户/AI洞察/通知/我的入口
- [x] T414 移除健管师自行排班入口，改为平台统一安排状态说明
- [x] T415 健管师端通知页视觉收口：标准图标、未读状态、底部导航与统一字号间距
- [x] T416 重新定义咨询业务：咨询请求、公司派单、咨询房间、文字与语音通道，已同步 MASTER/UI/DATABASE/API/BACKEND_PRD
- [x] T417 重构 Mock 咨询数据模型：ConsultationRequest、Conversation、Message、VoiceSession、ServiceRecord
- [x] T418 重做 C-12 客户咨询入口、等待配对页与咨询房间
- [x] T419 重做 H-01/H-02/H-03/H-04 健管师工作台、客户资料与语音厅
- [x] T420 Admin A-01/A-02 派单监控与房间状态深链接
- [x] T421 Mock 文字消息同步、未读、已读、断线补发与 Mock Voice Provider
- [x] T422 双端咨询房间验收：客户发消息、健管师回复、语音状态、结束与服务记录
- [ ] T501 真实微信、支付、IM、OCR、LLM Provider

## 验收命令
`npm run typecheck`、`npm run build:h5`；运行后手动点击核心路径并确认无页面跳转错误。

## 当前验证结果
`pnpm run typecheck`、H5/Admin production build、`pnpm test:consultation`（8/8）、`pnpm test:api`（HTTP 全链路）与 production API 启动冒烟已通过。GitHub Actions 已推送部署流程，但正式发布仍需要设置 `HEALTHAI_API_BASE_URL` Secret 并提供 Cloudways API 服务。
