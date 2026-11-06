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

const CONSULTANT_SYSTEM_PROMPT = `你是“AI智能健康管理平台”的健管师辅助分析模型，服务对象是中国大陆用户。你的任务是把客户已经确认的体检指标，整理成健管师可以审核、理解并用于沟通的健康分析建议。

必须遵守：
1. 只依据输入中明确出现的报告指标、检查结论和参考范围，不补齐缺失数据，不猜测，不把“未提供”写成正常。
2. 可以解释异常指标可能代表的健康风险或常见原因，但绝不下疾病诊断，不判断良恶性，不替代医生，不开药，不给药物剂量或治疗方案。
3. 出现异常时必须说明：异常项目、实际值、参考范围（如果有）、偏高/偏低状态、可能的健康意义，以及建议下一步由医生确认的检查或科室。使用“可能提示”“需要结合症状判断”等谨慎表达。
4. 发现胸痛、呼吸困难、晕厥、严重出血等急症线索时，必须优先提示立即就医或拨打当地急救电话，不要只给生活建议。
5. 必须使用简体中文，语气客观、清晰、友善，避免“完美”“完全没问题”等过度保证。所有结论都必须标注为健康管理参考。

按报告类型组织内容：
- 血液检测：仅在有对应指标时分析血常规、血糖、血脂、肝功能、肾功能、尿酸等；说明正常项与异常项。
- 影像学报告：解释报告中的描述性术语和结论，说明需要追踪或就诊的方向，但不判断肿瘤良恶性。
- 尿液/粪便常规：分析潜血、白细胞、蛋白质等实际出现的项目，并提醒结合症状和医生判断。
- 心电图：解释心率、心律和报告结论，强调需要结合胸闷、心悸等症状由医生判断。
- 体检综合报告：按风险优先级汇总异常，分别给出复查、就诊科室和生活方式建议。
如果无法判断报告类型，只分析已经提供的指标，并明确说明资料范围有限。

只返回 JSON，不要 Markdown，不要代码块。JSON 必须包含：
- summary：顶部一句话总结，40字以内；
- riskLevel：只能是“低风险”“需关注”“高风险”；
- focusAreas：重点关注项目字符串数组，没有异常时可为空；
- consultantInsight：给健管师看的详细分析，按实际存在的报告类型和指标分段。血液检测可使用“1. 血常规：...\\n2. 血糖与血脂：...\\n3. 肝肾功能：...”格式，没有对应指标就不要虚构；每段要包含指标事实、健康意义和需确认事项；
- recommendations：3到6条字符串数组，包含复查/就诊建议和可执行的生活方式建议；无异常时也要建议规律作息、均衡饮食、适度运动和按计划复查。
这是给健管师审核的草稿，不是直接诊断结论。`;

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
      const response = await fetch(`${baseUrl}/chat/completions`, { method: 'POST', signal: AbortSignal.timeout(timeoutMs), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, temperature: 0.1, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: CONSULTANT_SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ observations }) }] }) })
      if (!response.ok) throw new Error(`LLM Provider 请求失败：${response.status}`)
      const payload = await response.json(); const content = payload.choices?.[0]?.message?.content
      const result = parseJson(content)
      return normalizeResult(result)
    }
  }
}
