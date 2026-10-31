function parseJson(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(text)
}

function boundedText(value, maxLength = 2000) {
  return String(value || '').trim().slice(0, maxLength)
}

function normalizeResult(result) {
  const riskLevel = ['低风险', '需关注', '高风险'].includes(result?.riskLevel) ? result.riskLevel : '需关注'
  return {
    summary: boundedText(result?.summary),
    riskLevel,
    focusAreas: Array.isArray(result?.focusAreas) ? result.focusAreas.map(item => boundedText(item, 120)).filter(Boolean).slice(0, 20) : [],
    consultantInsight: boundedText(result?.consultantInsight),
    recommendations: Array.isArray(result?.recommendations) ? result.recommendations.map(item => boundedText(item, 300)).filter(Boolean).slice(0, 20) : []
  }
}

function mockReport(observations) {
  const abnormal = observations.filter(item => item.status !== '正常')
  return {
    summary: abnormal.length ? `检测到 ${abnormal.length} 项指标需要关注，整体健康状况良好，建议持续记录并咨询健康管理师。` : '当前指标整体稳定，建议继续保持规律作息与健康生活方式。',
    riskLevel: abnormal.length >= 4 ? '高风险' : abnormal.length ? '需关注' : '低风险',
    focusAreas: abnormal.map(item => item.name),
    consultantInsight: '这是由 Mock AI Provider 生成的工作摘要，正式版本可替换为 LLM Provider 并进入健管师审核流程。',
    recommendations: ['保持规律运动与作息', '减少高糖高油饮食', '按计划复查异常指标']
  }
}

export function createAiProvider({ name = process.env.LLM_PROVIDER || 'mock' } = {}) {
  if (name === 'mock') return { name: 'mock-ai-provider', async generate({ observations }) { return mockReport(observations) } }
  if (name !== 'openai-compatible') throw new Error(`暂不支持 LLM Provider: ${name}`)
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('已启用 LLM Provider，但未设置 LLM_API_KEY')
  const baseUrl = (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'
  return {
    name: 'openai-compatible',
    async generate({ observations }) {
      const timeoutMs = Math.min(Math.max(Number(process.env.LLM_TIMEOUT_MS || 30000), 3000), 120000)
      const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', signal: AbortSignal.timeout(timeoutMs), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: '你是健康管理辅助分析模型。只返回 JSON，不做诊断或开药。JSON 必须包含 summary、riskLevel（低风险/需关注/高风险）、focusAreas（字符串数组）、consultantInsight、recommendations（字符串数组）。' }, { role: 'user', content: JSON.stringify({ observations }) }] }) })
      if (!response.ok) throw new Error(`LLM Provider 请求失败：${response.status}`)
      const payload = await response.json(); const content = payload.choices?.[0]?.message?.content
      const result = parseJson(content)
      return normalizeResult(result)
    }
  }
}
