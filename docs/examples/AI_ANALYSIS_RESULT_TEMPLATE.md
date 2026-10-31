# AI 健康分析结果模板

> 模板用于后端 API、Mock 数据和健管师工作台。AI 输出必须经过规则校验；客户端只显示 `clientSummary`、指标、异常、趋势与基础解释。

## 1. JSON 模板

```json
{
  "reportId": "report-001",
  "userId": "u-001",
  "analysisVersion": "health-analysis-v1",
  "status": "completed",
  "generatedAt": "2026-10-20T10:30:00+08:00",
  "source": {
    "type": "lab_report",
    "institutionName": "华东健康管理中心（虚构）",
    "collectedAt": "2026-10-20T08:15:00+08:00",
    "fasting": true
  },
  "clientResult": {
    "overallStatus": "attention",
    "title": "本次健康结果",
    "summary": "检测到 4 项指标轻度偏离参考范围，建议结合历史趋势持续观察。",
    "disclaimer": "本结果用于健康管理参考，不构成医疗诊断或治疗建议。",
    "priorityObservations": [
      {
        "observationId": "obs-glu-001",
        "name": "空腹血糖",
        "value": 6.12,
        "unit": "mmol/L",
        "status": "high",
        "explanation": "本次结果略高于本实验室参考范围，建议结合后续复查和历史趋势观察。"
      }
    ],
    "actions": [
      { "type": "trend", "label": "查看历史趋势", "route": "/pages/health/trend" },
      { "type": "consult", "label": "咨询健康管理师", "route": "/pages/consultants/index" }
    ]
  },
  "consultantInsight": {
    "summary": "血糖和血脂相关指标轻度异常，尿酸接近参考范围上限；需结合既往史与生活方式资料评估。",
    "riskLevel": "low_to_moderate",
    "keyFindings": [
      {
        "priority": "P1",
        "topic": "糖代谢",
        "evidence": ["GLU=6.12 mmol/L", "HbA1c=5.9%"],
        "interpretation": "需要核实空腹状态并关注后续趋势，不直接下诊断。",
        "nextAction": "补充生活方式资料并安排随访",
        "medicalEscalation": "持续异常或出现相关症状时建议医学专业人员评估"
      }
    ],
    "missingInformation": [
      "身高、体重、腰围和 BMI",
      "既往血糖和血脂结果",
      "既往史、用药和保健品",
      "近 2 周饮食、运动和睡眠"
    ],
    "followUp": {
      "recommended": true,
      "suggestedDays": 14,
      "ownerRole": "consultant",
      "status": "pending"
    }
  },
  "safety": {
    "isDiagnosis": false,
    "requiresHumanReview": true,
    "redFlagDetected": false,
    "promptVersion": "health-analysis-v1",
    "model": "mock-health-model"
  }
}
```

## 2. 后端生成规则

1. 先保存原始报告和结构化指标，再调用 AI。
2. AI 只负责生成结构化洞察，不直接修改用户原始数据。
3. 所有异常必须能回溯到具体指标、数值、单位和参考范围。
4. 客户端与健管师端使用不同字段权限，不能把 `consultantInsight` 原样返回给客户。
5. `requiresHumanReview` 默认必须为 `true`。
6. AI 失败时保留报告数据，并返回可重试状态，不覆盖原报告。
7. 任何疑似急症、危急值或红旗症状都必须停止自动化建议，转人工/医疗专业人员处理。

## 3. API 返回建议

```text
GET /api/v1/health/reports/{reportId}/result
```

- 客户端：只返回 `clientResult`
- 健管师端：返回 `clientResult + consultantInsight + safety`
- 管理后台：额外返回模型版本、耗时、Token、错误码和审计记录
