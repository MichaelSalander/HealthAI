import fs from 'node:fs/promises'

function parseJson(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(text)
}

function normalizeCandidate(candidate, reportId, measuredAt, index) {
  const valueType = candidate?.valueType === 'qualitative' ? 'qualitative' : 'numeric'
  const status = ['正常', '偏高', '偏低'].includes(candidate?.status) ? candidate.status : '需确认'
  const confidence = Number(candidate?.confidence)
  return {
    id: `${reportId}-candidate-${index + 1}`,
    code: String(candidate?.code || `unmapped-${index + 1}`).slice(0, 80),
    name: String(candidate?.name || '未命名指标').slice(0, 120),
    value: String(candidate?.value ?? '').slice(0, 120),
    unit: String(candidate?.unit || '').slice(0, 40),
    reference: String(candidate?.reference || '').slice(0, 120),
    status,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    measuredAt: String(candidate?.measuredAt || measuredAt),
    category: String(candidate?.category || '其他').slice(0, 40),
    valueType,
    severity: ['轻度', '中度', '重度'].includes(candidate?.severity) ? candidate.severity : undefined,
    interpretation: String(candidate?.interpretation || '').slice(0, 300),
    recommendation: String(candidate?.recommendation || '').slice(0, 300),
    sourcePage: Number.isInteger(candidate?.sourcePage) ? candidate.sourcePage : undefined
  }
}

function createMockProvider() {
  return {
    name: 'mock-ocr-provider',
    async extract({ reportId, measuredAt }) {
      return {
        reportId,
        provider: 'mock-ocr-provider',
        status: 'needs_confirmation',
        candidates: [
          { id: `${reportId}-glucose`, code: 'fasting-glucose', name: '空腹血糖', value: '6.8', unit: 'mmol/L', reference: '< 6.1', status: '偏高', confidence: 0.96, measuredAt, category: '代谢', interpretation: '本次结果高于参考范围，单次结果不能直接下结论。', recommendation: '建议结合饮食、运动和复查结果持续观察。', sourcePage: 12 },
          { id: `${reportId}-ldl`, code: 'ldl-c', name: 'LDL-C（低密度脂蛋白）', value: '4.2', unit: 'mmol/L', reference: '< 3.4', status: '偏高', confidence: 0.93, measuredAt, category: '血脂', interpretation: '低密度脂蛋白高于本报告参考范围。', recommendation: '建议咨询专业人员并结合历史趋势管理饮食与运动。', sourcePage: 13 },
          { id: `${reportId}-alt`, code: 'alt', name: 'ALT（丙氨酸转氨酶）', value: '68', unit: 'U/L', reference: '< 40', status: '偏高', confidence: 0.91, measuredAt, category: '肝功能', interpretation: '肝功能相关指标异常，需要结合其他肝功能项目理解。', recommendation: '建议按专业人员建议复查，不将单项结果作为诊断。', sourcePage: 14 },
          { id: `${reportId}-thyroid`, code: 'thyroid-nodule', name: '甲状腺结节', value: '检出', unit: '', reference: '未见明显异常', status: '偏高', valueType: 'qualitative', confidence: 0.88, measuredAt, category: '超声检查', severity: '轻度', interpretation: '报告描述甲状腺结节，需要结合超声描述与既往结果。', recommendation: '建议携报告咨询专业人员，按建议随访。', sourcePage: 18 },
          { id: `${reportId}-vitamin-d`, code: 'vitamin-d', name: '25-羟基维生素D', value: '偏低', unit: '', reference: '参考范围内', status: '偏低', valueType: 'qualitative', confidence: 0.86, measuredAt, category: '营养', interpretation: '报告提示维生素D水平偏低。', recommendation: '建议结合饮食、日晒和专业人员建议进行管理。', sourcePage: 16 }
        ]
      }
    }
  }
}

function createOpenAiProvider() {
  const apiKey = process.env.OCR_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('已启用 OpenAI OCR，但未设置 OCR_API_KEY 或 OPENAI_API_KEY')
  const baseUrl = (process.env.OCR_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.OCR_MODEL || 'gpt-6.1-terra'
  const timeoutMs = Math.min(Math.max(Number(process.env.OCR_TIMEOUT_MS || 120000), 10000), 300000)
  return {
    name: 'openai-responses-ocr',
    async extract({ reportId, measuredAt, storagePath }) {
      if (!storagePath) throw new Error('报告原文件不存在，无法执行 OpenAI OCR')
      const fileBuffer = await fs.readFile(storagePath)
      const form = new FormData()
      form.append('purpose', 'user_data')
      form.append('file', new Blob([fileBuffer], { type: 'application/pdf' }), 'health-report.pdf')
      let uploadedId
      try {
        const uploadResponse = await fetch(`${baseUrl}/files`, { method: 'POST', signal: AbortSignal.timeout(timeoutMs), headers: { Authorization: `Bearer ${apiKey}` }, body: form })
        if (!uploadResponse.ok) throw new Error(`OpenAI 文件上傳失敗：${uploadResponse.status}`)
        const uploaded = await uploadResponse.json(); uploadedId = uploaded.id
        const response = await fetch(`${baseUrl}/responses`, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          input: [{ role: 'user', content: [
            { type: 'input_file', file_id: uploaded.id, detail: process.env.OCR_PDF_DETAIL || process.env.OCR_DETAIL || 'auto' },
            { type: 'input_text', text: '请读取这份中国大陆体检报告，只提取明确出现的健康检测指标或检查结果。不要猜测、不要补齐缺失值、不要做医疗诊断。所有候选资料必须保留原报告页码，并返回 JSON。若参考范围或状态不清楚，请将 status 设为“需确认”，confidence 设为较低值。' }
          ] }],
          text: { format: { type: 'json_schema', name: 'health_report_extraction', strict: true, schema: {
            type: 'object', additionalProperties: false, required: ['candidates'], properties: {
              candidates: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['code', 'name', 'value', 'unit', 'reference', 'status', 'confidence', 'measuredAt', 'category', 'valueType', 'severity', 'interpretation', 'recommendation', 'sourcePage'], properties: {
                code: { type: 'string' }, name: { type: 'string' }, value: { type: 'string' }, unit: { type: 'string' }, reference: { type: 'string' }, status: { type: 'string', enum: ['正常', '偏高', '偏低', '需确认'] }, confidence: { type: 'number', minimum: 0, maximum: 1 }, measuredAt: { type: 'string' }, category: { type: 'string' }, valueType: { type: 'string', enum: ['numeric', 'qualitative'] }, severity: { type: ['string', 'null'], enum: ['轻度', '中度', '重度', null] }, interpretation: { type: 'string' }, recommendation: { type: 'string' }, sourcePage: { type: 'integer', minimum: 1 }
              } } }
            }
          } } }
        })
        })
        if (!response.ok) throw new Error(`OpenAI OCR 请求失败：${response.status}`)
        const payload = await response.json()
        const parsed = parseJson(payload.output_text || payload.output?.flatMap(item => item.content || []).map(item => item.text || '').join(''))
        return { reportId, provider: 'openai-responses-ocr', model, status: 'needs_confirmation', candidates: Array.isArray(parsed.candidates) ? parsed.candidates.map((item, index) => normalizeCandidate(item, reportId, measuredAt, index)) : [] }
      } finally {
        if (uploadedId) await fetch(`${baseUrl}/files/${uploadedId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${apiKey}` } }).catch(() => {})
      }
    }
  }
}

export function createOcrProvider({ name = process.env.OCR_PROVIDER || 'mock' } = {}) {
  if (name === 'mock') return createMockProvider()
  if (['openai', 'openai-responses'].includes(name)) return createOpenAiProvider()
  throw new Error(`暂不支持 OCR Provider: ${name}`)
}
