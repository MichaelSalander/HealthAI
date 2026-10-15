# AI 智能健康管理平台开发规则

## 目录与分层
- `src/pages` 只负责页面编排与交互；`src/components` 放可复用 UI；`src/services/api` 放接口契约；`src/services/mock` 放 Mock 实作；`src/stores` 放跨页状态；`src/types` 放领域类型。
- 所有未来需要后端的数据必须经过 Repository/API Layer，页面不得直接依赖 Mock Data。

## 编码规则
- Vue 3 `<script setup>`、TypeScript strict、简体中文 UI。
- 金额以整数分存储，展示时转换为元；不得在 UI 内写死业务价格或规则。
- 业务实体使用 PascalCase，变量/函数使用 camelCase，页面目录使用 lower-case。
- 公共组件优先抽离；禁止用一个超大单文件承载多个页面。

## UI 规则
- 以交付包 UI 图为主参考：白底、青绿色品牌色、圆角卡片、消费级健康 App。
- 客户端不展示完整 AI 专业洞察，只显示基础结果、指标、异常、趋势与服务引导。
- 不把客户端设计成医院 HIS，不添加 PRD 未定义的产品功能。

## 禁止事项
- 第一阶段禁止接入真实支付、IM、OCR、LLM 与微信生产登录。
- 禁止删除或覆盖用户既有文件，禁止绕过 API Layer 读取数据。
- 不自行解决 PRD/UI 冲突：记录到 `docs/OPEN_QUESTIONS.md`。

## 验收
- 每个 Task 完成后运行 `npm run typecheck` 与 `npm run build:h5`。
- 手动验证关键跳转与 Mock 数据变化，并更新 `docs/TASKS.md`。
