# UI 规格

## 客户端页面
| 编号 | 页面/入口 | 主要内容与 CTA | 数据来源/跳转 |
|---|---|---|---|
| C-01 | 首页 | 上传报告、手动录入、查看健康、咨询主责 | User/Consultant/HealthProfile；→ C-02/C-03/C-04 |
| C-02 | 我的健康 | 评分、需关注指标、趋势 | Observation/Trend；→ C-05 |
| C-03 | 手动记录 | 体重等指标与备注、保存记录 | HealthRepository；保存后回 C-02 |
| C-04 | 体检报告 | 上传、解析状态、历史报告 | HealthReport；解析后 → C-05 |
| C-05 | 健康结果 | 基础评分、异常指标、解释、咨询引导 | Observation/AI基础摘要；→ 服务入口 |
| C-06 | 找健管师 | 九类筛选、搜索、推荐 | Consultant/Category；→ C-07 |
| C-07 | 健管师详情 | 介绍、等级、认证、评价、选择服务 | Consultant/Certification；→ C-08/C-09/C-10 |
| C-08 | 7天体验 | 初/高级/慢病体验 | ServicePlan；→ 订单确认 |
| C-09 | 正式方案 | 月/季/年与权益 | ServicePlan；→ 订单确认 |
| C-10 | 增值服务 | 咨询、报告解读、营养/运动等 | ServiceProduct；→ 订单确认 |
| C-11 | 我的服务/订单 | 服务周期、订单状态、权益 | Order/Entitlement |
| C-12 | 1V1咨询 | 已建立关系后的咨询 | Conversation/Message |
| C-13 | 历史趋势 | 指标曲线、时间筛选 | Observation/Trend |
| C-14 | 健康数据/服务记录 | 报告、手录、咨询及方案时间线 | HealthReport/ServiceRecord |
| C-15 | 我的 | 资料、报告、订单、收藏、设置 | User/Order |

## 第一阶段真实可操作路径
C-01 点击“我的健康”或“查看健康结果” → C-02；C-02 → C-05；C-01 点击“上传体检报告” → C-04；C-04 上传 → Mock 解析成功 → C-05；C-02 趋势 → C-05。底部导航先保留服务/我的入口，未实现页不扩展业务。
