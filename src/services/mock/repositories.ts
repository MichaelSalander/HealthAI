import { mockObservations, mockPlans, mockReports, mockUser } from './data'
import type { AIRepository, AuthProvider, CommerceRepository, ConsultantRepository, ContentRepository, EducationArticle, HealthRepository, HomeEntry, ContentSettings } from '../api/contracts'
import type { Consultant, HealthProfile, HealthReport, Observation, ReportExtraction, ServicePlan } from '../../types/domain'
import type { DemoSession } from '../../types/consultation'
import { consultationRepository } from '../api/consultation'

type StorageKey = 'healthai_profile' | 'healthai_reports' | 'healthai_observations' | 'healthai_orders'
const apiBase = (() => {
  const configured = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  return hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' ? '/api' : 'http://localhost:8787/api'
})()
const hasConfiguredApi = Boolean((import.meta as any).env?.VITE_API_BASE_URL)

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

async function apiRequest<T>(path: string, fallback: T, init?: RequestInit, session?: DemoSession): Promise<T> {
  try {
    const response = await fetch(`${apiBase}${path}`, { headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) }, ...init })
    if (!response.ok) return fallback
    const body = await response.json() as { data: T }
    return body.data ?? fallback
  } catch {
    return fallback
  }
}
async function apiRequestRequired<T>(path: string, init?: RequestInit, session?: DemoSession): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) }, ...init })
  const body = await response.json() as { data?: T; message?: string }
  if (!response.ok) throw new Error(body.message || '服务请求失败，请稍后重试')
  return body.data as T
}

let reports = readStorage('healthai_reports', [...mockReports])
let observations = readStorage('healthai_observations', [...mockObservations])
let orders = readStorage<import('../../types/domain').Order[]>('healthai_orders', [])
let profile = readStorage<HealthProfile>('healthai_profile', { id: 'hp-001', userId: 'u-001', gender: '女', birthYear: '1992', heightCm: '165', medicalHistory: '', allergies: '', medications: '', lifestyle: '久坐，偶尔运动', updatedAt: new Date().toISOString() })
const sessionUser = (session: DemoSession): typeof mockUser => ({ id: session.id, name: session.name, avatar: session.role === 'consultant' ? '👩🏻‍⚕️' : '👩🏻', healthScore: mockUser.healthScore })
export const authProvider: AuthProvider = { async login() { return sessionUser(await consultationRepository.customer()) }, async wechatLogin() { return sessionUser(await consultationRepository.loginWithWechat('customer')) } }
export const healthRepository: HealthRepository = {
  async getProfile() { const session = await consultationRepository.customer(); const remote = await apiRequestRequired<HealthProfile | null>('/health/profile', undefined, session); if (remote) profile = remote; return remote || profile },
  async saveProfile(input) { const session = await consultationRepository.customer(); const remote = await apiRequestRequired<HealthProfile>('/health/profile', { method: 'PUT', body: JSON.stringify(input) }, session); profile = remote; writeStorage('healthai_profile', profile); return profile },
  async getObservations() { const session = await consultationRepository.customer(); const remote = await apiRequestRequired<Observation[]>('/health/observations', undefined, session); observations = remote; writeStorage('healthai_observations', observations); return remote },
  async hasBloodTest() { return (await consultationRepository.eligibility()).hasBloodTest },
  async getTrends(code: string) {
    const session = await consultationRepository.customer()
    return apiRequestRequired<import('../../types/domain').HealthTrend[]>(`/health/trends?code=${encodeURIComponent(code)}`, undefined, session)
  },
  async listReports() { const session = await consultationRepository.customer(); const remote = await apiRequestRequired<HealthReport[]>('/health/reports', undefined, session); reports = remote; writeStorage('healthai_reports', reports); return remote },
  async uploadReport(fileName, kind = 'general', upload) { const report = await consultationRepository.uploadDemoReport(fileName, kind, upload); reports = [report, ...reports.filter(item => item.id !== report.id)]; writeStorage('healthai_reports', reports); return report },
  async getReportExtraction(reportId: string) { return consultationRepository.reportExtraction(reportId) },
  async confirmReport(reportId: string, candidates: ReportExtraction['candidates']) { const confirmed = await consultationRepository.confirmReport(reportId, candidates); observations = [...confirmed, ...observations.filter(item => item.sourceRef !== reportId)]; writeStorage('healthai_observations', observations); reports = reports.map(report => report.id === reportId ? { ...report, status: '解析成功' as const } : report); writeStorage('healthai_reports', reports); return confirmed },
  async addObservation(input) { const session = await consultationRepository.customer(); const observation = await apiRequestRequired<Observation>('/health/observations', { method: 'POST', body: JSON.stringify(input) }, session); observations = [observation, ...observations.filter(item => item.id !== observation.id)]; writeStorage('healthai_observations', observations); return observation }
}
export const consultantRepository: ConsultantRepository = { async list() { const remote = await consultationRepository.directory(); return remote.map(item => ({ id: item.id, name: item.name, level: item.level as Consultant['level'], categories: item.categories || ['健康管理'], rating: 5, clients: item.bookedCount, avatar: '👩🏻‍⚕️' })) } }
const fallbackHomeEntries: HomeEntry[] = [
  { id: 'upload', title: '上传体检报告', subtitle: 'AI 帮你初步分析', route: '/pages/report/index', enabled: true, sort: 1 },
  { id: 'manual', title: '手动录入数据', subtitle: '记录日常健康', route: '/pages/health/manual', enabled: true, sort: 2 },
  { id: 'profile', title: '完善健康档案', subtitle: '补充基础健康信息', route: '/pages/health/profile', enabled: true, sort: 3 },
  { id: 'report', title: '查看健康报告', subtitle: '历史数据管理', route: '/pages/report/index', enabled: true, sort: 4 },
  { id: 'consultant', title: '找健康管理师', subtitle: '专业解读与指导', route: '/pages/consultants/index', enabled: true, sort: 5 }
]
const fallbackContentSettings: ContentSettings = { resultDisclaimer: '以上为基础健康结果，仅供参考，不作为医疗诊断或治疗建议。', resultConsultationTitle: '建议你咨询健康管理师', resultConsultationDescription: '获取专业的分析解读和个性化建议。' }
const fallbackEducationArticles: EducationArticle[] = [
  { id: 'edu-001', title: '认识血糖与日常饮食', category: '血糖管理', summary: '了解日常饮食与血糖波动的关系。', body: '规律饮食、均衡搭配并结合个人健康状况，是日常血糖管理的基础。', status: 'published', publishedAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z', sort: 1 },
  { id: 'edu-002', title: '如何看懂体检报告中的血脂指标', category: '指标解读', summary: '用简单方式认识总胆固醇、LDL-C 等常见指标。', body: '指标应结合参考范围、既往趋势与专业人员建议综合理解。', status: 'published', publishedAt: '2026-10-02T00:00:00.000Z', updatedAt: '2026-10-02T00:00:00.000Z', sort: 2 }
]
async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  return hasConfiguredApi ? apiRequestRequired<T>(path) : apiRequest(path, fallback)
}
export const contentRepository: ContentRepository = { async listHomeEntries() { return fetchJson<HomeEntry[]>('/home-entries', fallbackHomeEntries) }, async listContentSettings() { return fetchJson<ContentSettings>('/content-settings', fallbackContentSettings) }, async listEducationArticles() { return fetchJson<EducationArticle[]>('/education/articles', fallbackEducationArticles) } }
export const aiRepository: AIRepository = { async generateReport() { const session = await consultationRepository.customer(); return apiRequestRequired<import('../../types/domain').AIHealthReport>('/health/ai-reports/generate', { method: 'POST', body: JSON.stringify({}) }, session) } }
export const commerceRepository: CommerceRepository = { async listPlans() { return fetchJson<ServicePlan[]>('/plans', mockPlans) }, async listOrders() { const remote = await consultationRepository.orders(); orders = remote; writeStorage('healthai_orders', orders); return remote }, async createMockOrder(plan: ServicePlan) { const order = await consultationRepository.createOrder(plan); const paid = await consultationRepository.mockPay(order.id); orders = [paid, ...orders.filter(item => item.id !== paid.id)]; writeStorage('healthai_orders', orders); return paid } }
