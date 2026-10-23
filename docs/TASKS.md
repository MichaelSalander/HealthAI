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
- [ ] 真实 API、数据库与文件存储
- [ ] 真实语音 Provider
- [ ] 健管师第 6 项与公司介绍第 2 项需求（待补定义）
- [x] T405a C 端健康档案基础资料采集：Repository 持久化、档案入口与表单保存
- [ ] T406 Mock API：Profile/Consent/Report Extraction/Observation Confirm/AI Report Contract
- [x] T406a 本地持久化 API：Profile、Reports、Observations、AI Reports；资料写入 `server/mock-db.json`
- [ ] T407 健管师工作台：待确认资料、解析异常、资料时间线与 AI Insight 审核状态
- [ ] T501 真实微信、支付、IM、OCR、LLM Provider

## 验收命令
`npm run typecheck`、`npm run build:h5`；运行后手动点击核心路径并确认无页面跳转错误。

## 当前验证结果
`pnpm run typecheck` 与 H5 production build 已通过。当前可用 `pnpm run preview:h5` 提供 `dist/` 进行 UI 预览。
