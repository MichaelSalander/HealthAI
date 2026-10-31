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
| C-12 | 諮詢入口 | 選擇立即文字諮詢、語音諮詢或預約；先檢查血檢資格 | ConsultationRequest；→ C-12A/C-06/體檢中心 |
| C-12A | 等待配對 | 顯示諮詢請求狀態、預估等待、取消請求 | ConsultationRequest/Notification；→ C-12B |
| C-12B | 諮詢房間/語音廳 | 客戶與健管師的文字訊息、語音狀態、健康摘要、結束諮詢 | Conversation/Message/VoiceSession/HealthProfile；→ C-14 |
| C-13 | 历史趋势 | 指标曲线、时间筛选 | Observation/Trend |
| C-14 | 健康数据/服务记录 | 报告、手录、咨询及方案时间线 | HealthReport/ServiceRecord |
| C-15 | 我的 | 资料、报告、订单、收藏、设置 | User/Order |

## 健管師手機端頁面
| 编号 | 页面/入口 | 主要内容与 CTA | 数据来源/跳转 |
|---|---|---|---|
| H-01 | 工作台 | 待處理請求、進行中房間、未讀通知、在線狀態 | ConsultationRequest/Notification；→ H-02/H-04 |
| H-02 | 我的客户 | 公司分配的客戶、最近諮詢、未讀狀態 | UserConsultantRelation/Conversation；→ H-03/H-04 |
| H-03 | 客戶健康摘要 | 基礎檔案、報告、指標、趨勢與完整 AI Insight | HealthProfile/HealthReport/AIInsight；→ H-04 |
| H-04 | 諮詢房間/語音廳 | 文字聊天、語音、快捷回覆、健康資料抽屜、結束諮詢 | Conversation/Message/VoiceSession；→ H-05 |
| H-05 | 服務紀錄 | 本次諮詢摘要、訊息/語音時長、後續跟進事項 | ServiceRecord/Conversation；→ H-01 |
| H-06 | 通知 | 新配對、新訊息、超時與 AI Insight 提醒 | Notification；點擊直達資源頁 |

## Admin 页面
| 编号 | 页面/入口 | 主要内容与 CTA | 数据来源/跳转 |
|---|---|---|---|
| A-01 | 諮詢監控 | 等待佇列、在線客戶、健管師狀態、逾時提醒 | ConsultationQueue/Presence；→ A-02 |
| A-02 | 派單管理 | 人工派單、自動派單、重新派單、查看派單歷史 | Assignment/ConsultantAvailability；→ H-01 |
| A-03 | 諮詢房間監控 | 查看房間狀態、最後活動時間、必要時介入/結束 | Conversation/Message metadata；→ A-01 |

## 第一阶段真实可操作路径
C-01 → C-02 → C-04 上傳報告 → Mock 解析成功 → C-05 健康結果 → C-12 諮詢入口 → C-12A 等待配對 → Admin A-02 派單 → 健管師 H-01 收到通知 → H-04 諮詢房間 → 客戶與健管師互發文字訊息 → Mock 語音連線 → 結束後 C-14/H-05 查看服務紀錄。

所有諮詢入口必須使用 API/Repository；頁面不能自行判斷派單、在線、血檢資格或房間狀態。
