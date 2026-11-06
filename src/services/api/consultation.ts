import { uniApi as uni } from '../platform/uni'
import type { ConsultationConsultant, ConsultationNotice, ConsultationPresence, ConsultationRequest, ConsultationRequestV2, ConsultationRoom, ConsultationMessage, VoiceSession, ServiceRecord, ConsultationMode, DemoRole, DemoSession, HealthTimelineEvent } from '../../types/consultation'
import type { AIHealthReport, ConsentRecord, HealthCheckCenter, HealthProfile, HealthReport, Observation, Order, ReportExtraction, ServicePlan } from '../../types/domain'

const configuredBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
const browserHost = typeof window !== 'undefined' ? window.location.hostname : ''
const base = ((browserHost === 'localhost' || browserHost === '127.0.0.1') ? 'http://127.0.0.1:8787/api/v1' : (configuredBase || '/api/v1')).replace(/\/$/, '')
const env = (import.meta as any).env || {}
const isDemoMode = Boolean(env.DEV || env.VITE_DEMO_MODE === 'true' || env.VITE_AUTH_MODE === 'demo')
let customerSession: DemoSession | undefined
const customerSessionKey = 'healthai_customer_session'
let consultantSession: DemoSession | undefined
const consultantSessionKey = 'healthai_consultant_session'
function readCustomerSession(): DemoSession | undefined {
  try {
    const value = uni.getStorageSync(customerSessionKey)
    return value ? JSON.parse(String(value)) as DemoSession : undefined
  } catch { return undefined }
}
function persistCustomerSession(session: DemoSession): DemoSession {
  customerSession = session
  try { uni.setStorageSync(customerSessionKey, JSON.stringify(session)) } catch { /* 某些预览环境没有 Storage */ }
  return session
}
function clearCustomerSession(): void {
  customerSession = undefined
  try { uni.setStorageSync(customerSessionKey, '') } catch { /* 某些预览环境没有 Storage */ }
}
function readConsultantSession(): DemoSession | undefined {
  try { const value = uni.getStorageSync(consultantSessionKey); return value ? JSON.parse(String(value)) as DemoSession : undefined } catch { return undefined }
}
function persistConsultantSession(session: DemoSession): DemoSession {
  consultantSession = session
  try { uni.setStorageSync(consultantSessionKey, JSON.stringify(session)) } catch { /* 某些预览环境没有 Storage */ }
  return session
}
function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: unknown, session?: DemoSession): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({ url: `${base}${path}`, method, data: data as Record<string, unknown>, timeout: 10000,
      header: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
      success: response => {
        const payload = response.data as { data: T; message?: string }
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(payload.data)
        else {
          if (response.statusCode === 401 && session?.role === 'customer') clearCustomerSession()
          reject(new Error(payload.message || '操作失败，请重试'))
        }
      }, fail: () => reject(new Error('无法连接本地服务，请确认 API 已启动')) })
  })
}
export const consultationRepository = {
  login(role: DemoRole, id?: string) {
    if ((import.meta as any).env?.VITE_AUTH_MODE === 'wechat' && role === 'customer') return this.loginWithWechat(role)
    if (role === 'consultant') {
      const saved = consultantSession || readConsultantSession()
      if (saved) { consultantSession = saved; return Promise.resolve(saved) }
      if (!isDemoMode) return Promise.reject(new Error('请先登录健管师账号'))
    }
    if (role === 'customer' && !isDemoMode && env.VITE_AUTH_MODE !== 'wechat') return Promise.reject(new Error('请先完成微信登录'))
    return request<DemoSession>('/auth/demo-login', 'POST', { role, id }).then(session => role === 'customer' ? persistCustomerSession(session) : session)
  },
  operatorLogin(username: string, password: string) {
    return request<DemoSession>('/auth/operator-login', 'POST', { role: 'consultant', username, password }).then(persistConsultantSession)
  },
  customerPasswordLogin(username: string, password: string) {
    return request<DemoSession>('/auth/customer-login', 'POST', { username, password }).then(persistCustomerSession)
  },
  customerRegister(email: string, password: string, name?: string) {
    return request<DemoSession>('/auth/customer-register', 'POST', { email, password, name }).then(persistCustomerSession)
  },
  loginWithWechat(role: DemoRole = 'customer') {
    return new Promise<DemoSession>((resolve, reject) => {
      const login = (uni as typeof uni & { login?: (options: { provider: string; success: (result: { code?: string }) => void; fail: (error: unknown) => void }) => void }).login
      if (!login) return reject(new Error('当前运行环境不支持微信登录，请使用微信小程序预览'))
      login({ provider: 'weixin', success: result => result.code ? this.wechatLogin(result.code, role).then(session => { if (role === 'customer') persistCustomerSession(session); resolve(session) }).catch(reject) : reject(new Error('微信未返回登录 code')), fail: () => reject(new Error('微信登录失败，请重试')) })
    })
  },
  wechatLogin(code: string, role: DemoRole = 'customer') { return request<DemoSession>('/auth/wechat-login', 'POST', { code, role }) },
  async customer(): Promise<DemoSession> { return customerSession ||= readCustomerSession() || await this.login('customer') },
  async useCustomer(id: string) { return persistCustomerSession(await this.login('customer', id)) },
  logoutCustomer() { clearCustomerSession() },
  directory() { return request<ConsultationConsultant[]>('/consultation-directory') },
  healthCenters() { return request<HealthCheckCenter[]>('/health-centers') },
  async eligibility() { return request<{ hasBloodTest: boolean; healthCenterRoute: string }>('/consultations/eligibility', 'GET', undefined, await this.customer()) },
  async consents() { return request<ConsentRecord[]>('/health/consents', 'GET', undefined, await this.customer()) },
  async saveConsent(consentType: ConsentRecord['consentType'], version: string, status: ConsentRecord['status'] = 'granted') { return request<ConsentRecord>('/health/consents', 'POST', { consentType, version, status }, await this.customer()) },
  async book(consultantId: string, slotId: string, requestId: string) { return request<ConsultationRequest>('/consultations/bookings', 'POST', { consultantId, slotId, requestId }, await this.customer()) },
  async bookings(session?: DemoSession) { return request<ConsultationRequest[]>('/consultations/bookings', 'GET', undefined, session || await this.customer()) },
  saveAvailability(consultant: ConsultationConsultant, session: DemoSession) { return request<ConsultationConsultant>(`/consultation-directory/${consultant.id}`, 'PUT', consultant, session) },
  queue(session: DemoSession) { return request<{ bookings: ConsultationRequest[]; presence: ConsultationPresence[] }>('/consultations/queue', 'GET', undefined, session) },
  assign(id: string, consultantId: string, session: DemoSession) { return request<ConsultationRequest>(`/consultations/bookings/${id}/assign`, 'POST', { consultantId }, session) },
  autoAssign(session: DemoSession) { return request<{ assignedCount: number }>('/consultations/auto-assign', 'POST', {}, session) },
  async transition(id: string, action: 'accept' | 'complete' | 'cancel', session?: DemoSession) { return request<ConsultationRequest>(`/consultations/bookings/${id}/${action}`, 'POST', {}, session || await this.customer()) },
  async notices(session?: DemoSession) { return request<ConsultationNotice[]>('/consultation-notifications', 'GET', undefined, session || await this.customer()) },
  async clientHealth(userId: string, session: DemoSession) { return request<{ profile: HealthProfile | null; reports: HealthReport[]; observations: Observation[]; timeline: HealthTimelineEvent[]; aiReport: AIHealthReport | null }>(`/consultant/clients/${encodeURIComponent(userId)}/health`, 'GET', undefined, session) },
  async orders(session?: DemoSession) { return request<Order[]>('/orders', 'GET', undefined, session || await this.customer()) },
  async createOrder(plan: ServicePlan, session?: DemoSession) { return request<Order>('/orders', 'POST', { planId: plan.id }, session || await this.customer()) },
  async mockPay(orderId: string, session?: DemoSession) { return request<Order>(`/orders/${orderId}/mock-pay`, 'POST', {}, session || await this.customer()) },
  async readNotice(id: string, session?: DemoSession) { return request<ConsultationNotice>(`/consultation-notifications/${id}/read`, 'POST', {}, session || await this.customer()) },
  async heartbeat(action = false) { return request('/consultations/presence', 'POST', { action }, await this.customer()) },
  async uploadDemoReport(fileName: string, kind: 'blood_test' | 'general', upload?: { mimeType: string; sizeBytes: number; fileBase64: string }) { const session = await this.customer(); return request<HealthReport>('/health/reports', 'POST', { fileName, kind, ...upload }, session) },
  async reportExtraction(reportId: string) { return request<ReportExtraction>(`/health/reports/${reportId}/extractions`, 'GET', undefined, await this.customer()) },
  async retryReportExtraction(reportId: string) { return request<ReportExtraction>(`/health/reports/${reportId}/retry-extraction`, 'POST', {}, await this.customer()) },
  async confirmReport(reportId: string, candidates: ReportExtraction['candidates']) { return request<Observation[]>(`/health/reports/${reportId}/confirm`, 'POST', { candidates }, await this.customer()) },
  async addDemoBloodReport() { return this.uploadDemoReport('血液检测演示报告.pdf', 'blood_test') },
  async createRequest(mode: ConsultationMode, requestId = `consult-${Date.now()}`) { return request<ConsultationRequestV2>('/consultation-requests', 'POST', { mode, serviceType: 'free_consult', requestId }, await this.customer()) },
  async consultationRequests(session?: DemoSession) { return request<ConsultationRequestV2[]>('/consultation-requests', 'GET', undefined, session || await this.customer()) },
  async acceptRequest(id: string, session: DemoSession) { return request<{ request: ConsultationRequestV2; room: ConsultationRoom }>(`/consultation-requests/${id}/accept`, 'POST', {}, session) },
  async rooms(session?: DemoSession) { return request<ConsultationRoom[]>('/conversations', 'GET', undefined, session || await this.customer()) },
  async room(id: string, session?: DemoSession) { return request<ConsultationRoom>(`/conversations/${id}`, 'GET', undefined, session || await this.customer()) },
  async messages(id: string, session?: DemoSession) { return request<{ items: ConsultationMessage[]; nextCursor: string | null }>(`/conversations/${id}/messages`, 'GET', undefined, session || await this.customer()) },
  async sendMessage(id: string, content: string, session?: DemoSession) { return request<ConsultationMessage>(`/conversations/${id}/messages`, 'POST', { type: 'text', content, clientMessageId: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}` }, session || await this.customer()) },
  async joinRoom(id: string, session?: DemoSession) { return request(`/conversations/${id}/join`, 'POST', {}, session || await this.customer()) },
  async readRoom(id: string, messageId: string, session?: DemoSession) { return request(`/conversations/${id}/read`, 'POST', { messageId }, session || await this.customer()) },
  async completeRoom(id: string, summary: string, session: DemoSession) { return request<ServiceRecord>(`/conversations/${id}/complete`, 'POST', { summary }, session) },
  async startVoice(conversationId: string, session?: DemoSession) { return request<VoiceSession>('/voice-sessions', 'POST', { conversationId }, session || await this.customer()) },
  async voiceSessions(conversationId: string, session?: DemoSession) { return request<VoiceSession | null>(`/voice-sessions?conversationId=${encodeURIComponent(conversationId)}`, 'GET', undefined, session || await this.customer()) },
  async voiceAction(id: string, action: 'accept' | 'end' | 'fail', session?: DemoSession) { return request<VoiceSession>(`/voice-sessions/${id}/${action}`, 'POST', {}, session || await this.customer()) },
}
