import { mockConsultants, mockObservations, mockPlans, mockReports, mockTrends, mockUser } from './data'
import type { AIRepository, AuthProvider, CommerceRepository, ConsultantRepository, ContentRepository, HealthRepository, HomeEntry } from '../api/contracts'
import type { HealthProfile, HealthReport, Observation, ServicePlan } from '../../types/domain'

type StorageKey = 'healthai_profile' | 'healthai_reports' | 'healthai_observations' | 'healthai_orders'
const apiBase = (() => {
  const configured = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' ? '/api' : 'http://localhost:8787/api'
})()

function readStorage<T>(key: StorageKey, fallback: T): T {
  try {
    const value = uni.getStorageSync(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: StorageKey, value: T): void {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch {
    // 部分预览环境未提供 Storage 时，仍保留内存 Mock 流程。
  }
}

async function apiRequest<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${apiBase}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init })
    if (!response.ok) return fallback
    const body = await response.json() as { data: T }
    return body.data ?? fallback
  } catch {
    return fallback
  }
}

let reports = readStorage('healthai_reports', [...mockReports])
let observations = readStorage('healthai_observations', [...mockObservations])
let orders = readStorage<import('../../types/domain').Order[]>('healthai_orders', [])
let profile = readStorage<HealthProfile>('healthai_profile', { id: 'hp-001', userId: 'u-001', gender: '女', birthYear: '1992', heightCm: '165', medicalHistory: '', allergies: '', medications: '', lifestyle: '久坐，偶尔运动', updatedAt: new Date().toISOString() })
export const authProvider: AuthProvider = { async mockLogin() { return mockUser }, async wechatLogin() { return mockUser } }
export const healthRepository: HealthRepository = {
  async getProfile() { const remote = await apiRequest<HealthProfile | null>('/health/profile?user_id=u-001', null); return remote || profile },
  async saveProfile(input) { profile = { ...profile, ...input, updatedAt: new Date().toISOString() }; const remote = await apiRequest<HealthProfile>('/health/profile?user_id=u-001', profile, { method: 'PUT', body: JSON.stringify(input) }); profile = remote; writeStorage('healthai_profile', profile); return profile },
  async getObservations() { const remote = await apiRequest<Observation[] | null>('/health/observations?user_id=u-001', null); return remote || observations },
  async getTrends() { return mockTrends },
  async listReports() { const remote = await apiRequest<HealthReport[] | null>('/health/reports?user_id=u-001', null); return remote || reports },
  async uploadReport(fileName) { const fallback: HealthReport = { id: `r-${Date.now()}`, name: fileName, date: new Date().toISOString().slice(0, 10), status: '解析成功', source: '体检报告' }; const report = await apiRequest<HealthReport>('/health/reports?user_id=u-001', fallback, { method: 'POST', body: JSON.stringify({ fileName }) }); reports = [report, ...reports.filter(item => item.id !== report.id)]; writeStorage('healthai_reports', reports); return report },
  async addObservation(input) { const fallback: Observation = { ...input, id: `o-${Date.now()}`, measuredAt: new Date().toISOString().slice(0, 10) }; const observation = await apiRequest<Observation>('/health/observations?user_id=u-001', fallback, { method: 'POST', body: JSON.stringify(input) }); observations = [observation, ...observations.filter(item => item.id !== observation.id)]; writeStorage('healthai_observations', observations); return observation }
}
export const consultantRepository: ConsultantRepository = { async list() { return mockConsultants } }
const fallbackHomeEntries: HomeEntry[] = [
  { id: 'upload', title: '上传体检报告', subtitle: 'AI 帮你初步分析', route: '/pages/report/index', enabled: true, sort: 1 },
  { id: 'manual', title: '手动录入数据', subtitle: '记录日常健康', route: '/pages/health/manual', enabled: true, sort: 2 },
  { id: 'profile', title: '完善健康档案', subtitle: '补充基础健康信息', route: '/pages/health/profile', enabled: true, sort: 3 },
  { id: 'report', title: '查看健康报告', subtitle: '历史数据管理', route: '/pages/report/index', enabled: true, sort: 4 },
  { id: 'consultant', title: '找健康管理师', subtitle: '专业解读与指导', route: '/pages/consultants/index', enabled: true, sort: 5 }
]
async function fetchJson<T>(path: string, fallback: T): Promise<T> { return apiRequest(path, fallback) }
export const contentRepository: ContentRepository = { async listHomeEntries() { return fetchJson<HomeEntry[]>('/home-entries', fallbackHomeEntries) } }
export const aiRepository: AIRepository = { async generateReport(input) { const abnormal = input.filter(item => item.status !== '正常'); const report = { id: `ai-${Date.now()}`, generatedAt: new Date().toISOString(), summary: abnormal.length ? `检测到 ${abnormal.length} 项指标需要关注，整体健康状况良好，建议持续记录并咨询健康管理师。` : '当前指标整体稳定，建议继续保持规律作息与健康生活方式。', riskLevel: abnormal.length >= 4 ? '高风险' as const : abnormal.length ? '需关注' as const : '低风险' as const, focusAreas: abnormal.map(item => item.name), consultantInsight: '这是 Mock AI 生成的专业工作摘要，正式版本将由可替换的 LLM Provider 生成并进入健管师审核流程。', recommendations: ['保持规律运动与作息', '减少高糖高油饮食', '按计划复查异常指标'] }; await apiRequest('/health/ai-reports?user_id=u-001', report, { method: 'POST', body: JSON.stringify(report) }); return report } }
export const commerceRepository: CommerceRepository = { async listPlans() { return fetchJson<ServicePlan[]>('/plans', mockPlans) }, async listOrders() { return orders }, async createMockOrder(plan: ServicePlan) { const order = { id: `order-${Date.now()}`, planName: plan.name, priceFen: plan.priceFen, status: '服务中' as const, createdAt: new Date().toISOString().slice(0, 10) }; orders = [order, ...orders]; writeStorage('healthai_orders', orders); return order } }
