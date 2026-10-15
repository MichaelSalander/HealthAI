import type { AIHealthReport, Observation } from '../../types/domain'

export interface AIProvider { generateHealthReport(observations: Observation[]): Promise<AIHealthReport> }

export const mockAIProvider: AIProvider = {
  async generateHealthReport(observations) {
    const abnormal = observations.filter(item => item.status !== '正常')
    return { id: `ai-${Date.now()}`, generatedAt: new Date().toISOString(), summary: abnormal.length ? `检测到 ${abnormal.length} 项指标需要关注，整体健康状况良好。` : '当前指标整体稳定。', riskLevel: abnormal.length ? '需关注' : '低风险', focusAreas: abnormal.map(item => item.name), consultantInsight: '正式版本由 LLM Provider 生成，并须经健管师审核后使用。', recommendations: ['保持规律运动与作息', '减少高糖高油饮食', '按计划复查异常指标'] }
  }
}
