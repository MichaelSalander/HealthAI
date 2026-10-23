# 数据库设计草案

正式系统建议 PostgreSQL；金额字段全部 BIGINT 分，时间统一 UTC 存储并由前端按中国大陆时区展示。

| Entity | 关键字段 | 关系/约束 |
|---|---|---|
| User | id, wechatOpenId, name, phone, status | 1:1 HealthProfile；微信标识只存服务端 |
| ConsentRecord | id, userId, consentType, version, status, consentedAt, revokedAt | 健康资料/隐私/服务授权；写入审计 |
| HealthProfile | id, userId, score, summary, completeness, version | userId unique；仅保存汇总，不替代明细 |
| HealthProfileField | id, profileId, fieldCode, valueJson, sourceType, status, recordedAt | 基础资料、既往史、过敏、用药、生活方式等可配置字段 |
| HealthReport | id, profileId, reportDate, source, status, currentVersionId | 多对一 Profile；原始报告逻辑不可覆盖 |
| HealthReportVersion | id, reportId, fileUrl, fileHash, uploadedAt, parserVersion | 每次上传/重新解析形成版本 |
| ReportExtractionJob | id, reportVersionId, provider, status, errorCode, startedAt, finishedAt | OCR/规则/LLM 均异步；不直接写正式 Observation |
| Biomarker | id, code, name, unit, referenceRange | code unique，可后台配置 |
| Observation | id, profileId, biomarkerId, rawValue, normalizedValue, unit, sourceType, sourceRef, confidence, status, measuredAt, confirmedAt | `raw/candidate/confirmed/superseded`；确认前不得进入最终结果 |
| ObservationRevision | id, observationId, beforeJson, afterJson, action, actorId, createdAt | 修正与确认的不可变历史 |
| AIHealthReport | id, profileId, sourceObservationVersion, status, summary, riskLevel, payload, generatedAt | C 端基础结果版本化；只基于 confirmed 数据 |
| Consultant | id, name, levelId, serviceStatus, load | 公司建号 |
| ConsultantCategory | id, name, sort, enabled | 可增删改停用 |
| ConsultantLevel | id, name, sort | 初级/高级/慢病 |
| Certification | id, consultantId, name, feeFen, issuedAt, status, proofUrl | 多对一 Consultant |
| UserConsultantRelation | id, userId, consultantId, relationType, authorizedScope, status | 主责/自选；唯一有效关系 |
| PrimaryAssignment | id, userId, consultantId, reason, assignedAt, endedAt | 用户同一时点最多一条有效 |
| ServiceProduct | id, name, type, consultantId, priceOverrideFen, enabled | 可特殊定价 |
| ServicePlan | id, productId, levelId, cycle, priceFen, entitlement | 标准方案版本化 |
| Order | id, userId, consultantId, totalFen, status, commissionSnapshot | 下单固化分润快照 |
| Payment | id, orderId, channel, amountFen, status, paidAt | 平台收款 |
| Conversation | id, userId, consultantId, relationId | 需授权关系 |
| Message | id, conversationId, senderId, type, content, sentAt | 不做物理删除 |
| AIInsight | id, profileId, consultantId, sourceVersion, summary, payload, reviewStatus, createdAt | 健管师端完整洞察；需记录审核状态 |
| CommissionRule | id, scopeType, scopeId, ruleJson, effectiveFrom, effectiveTo | 默认/健管师/商品 |
| CommissionLedger | id, consultantId, orderId, type, amountFen, direction, reason, createdBy | 审计不可删除 |
| Settlement | id, consultantId, period, grossFen, adjustmentFen, payableFen, status, paidAt | 月度结算 |
| AuditLog | id, actorId, action, resourceType, resourceId, beforeJson, afterJson, ip, createdAt | 健康资料、授权、解析确认、订单与后台配置均需记录 |
| ConsultantAvailability | id, consultantId, status, dailyLimit, freeConsultEnabled, updatedAt | 健管师当前接单状态与免费咨询资格 |
| ConsultantSchedule | id, consultantId, slotDate, startAt, endAt, capacity, bookedCount, status | 可预约时段与容量控制 |
| ConsultationBooking | id, userId, consultantId, type, scheduledAt, status, source | 免费/语音/复诊咨询预约与状态 |
| ConsultationQueue | id, bookingId, priority, assignmentMode, assignedAt, timeoutAt | 待分配、人工派单与自动派单 |
| VoiceSession | id, bookingId, provider, status, startedAt, endedAt, durationSec | 语音服务 Provider 记录 |
| Notification | id, recipientId, type, title, body, resourceType, resourceId, readAt | 客户与健管师通知中心 |
| HealthCheckCenter | id, name, address, phone, mapUrl, enabled | 后台维护指定体检中心 |
| HealthCheckPackage | id, centerId, name, items, priceFen, enabled | 体检中心检查套餐 |
| EducationArticle | id, title, category, body, status, publishedAt, updatedAt | 卫教内容与发布状态 |

### 采集与版本规则
- 原始报告文件、文件 hash、上传时间与报告日期必须保留；重新上传不得覆盖旧版本。
- 解析结果只作为 candidate；用户确认/修改后才产生 confirmed Observation。
- 同一指标可以有多笔 Observation，以 measuredAt 区分；最新结果不得抹除历史趋势。
- 删除请求按合规策略执行逻辑删除/脱敏，并保留必要的审计记录，不做物理级级联删除。
- 所有敏感写操作写入 AuditLog；退款通过负向流水冲正，不删除历史。
