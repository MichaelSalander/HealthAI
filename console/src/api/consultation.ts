import type { ConsultationConsultant, ConsultationNotice, ConsultationPresence, ConsultationRequest, ConsultationRequestV2, DemoSession } from '../../../src/types/consultation'
import type { AIHealthReport, HealthProfile, HealthReport, Observation } from '../../../src/types/domain'
import { getToken } from '@/utils/auth'
export type ConsultantClient = { id: string; name: string; profile: Record<string, string>; observationCount: number; reportCount: number; lastActivityAt: string | null; status: string }
export type ConsultantClientHealth = { profile: HealthProfile | null; reports: HealthReport[]; observations: Observation[]; aiReport: AIHealthReport | null }
export type ConsultantInsight = { id: string; userId: string; userName: string; title: string; body: string; summary: string; riskLevel: string; status: 'pending' | 'approved' | 'rejected'; reviewedAt: string | null; reviewedBy: string | null; generatedAt: string }
const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api/v1').replace(/\/$/, '')
let session: DemoSession | undefined
async function request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || '请求失败')
  return payload.data as T
}
export const consultationAdminApi = {
  async login() { const token = getToken(); if (!token?.accessToken) throw new Error('请先登录管理后台'); session = { token: token.accessToken, id: 'admin-001', role: 'admin', name: token.nickname || '管理员' } },
  directory: () => request<ConsultationConsultant[]>('/consultation-directory'),
  queue: () => request<{ bookings: ConsultationRequest[]; presence: ConsultationPresence[] }>('/consultations/queue'),
  requestQueue: () => request<{ requests: ConsultationRequestV2[]; presence: ConsultationPresence[] }>('/consultation-requests/queue'),
  clients: () => request<ConsultantClient[]>('/consultant/clients'),
  notices: () => request<ConsultationNotice[]>('/consultation-notifications'),
  assign: (id: string, consultantId: string) => request(`/consultations/bookings/${id}/assign`, 'POST', { consultantId }),
  autoAssign: () => request<{ assignedCount: number }>('/consultations/auto-assign', 'POST', {}),
  assignRequest: (id: string, consultantId: string) => request<ConsultationRequestV2>(`/consultation-requests/${id}/assign`, 'POST', { consultantId }),
  autoAssignRequests: () => request<{ assignedCount: number }>('/consultation-requests/auto-assign', 'POST', {}),
  save: (c: ConsultationConsultant) => request(`/consultation-directory/${c.id}`, 'PUT', c),
  read: (id: string) => request(`/consultation-notifications/${id}/read`, 'POST', {}),
  clientHealth: (userId: string) => request<ConsultantClientHealth>(`/consultant/clients/${encodeURIComponent(userId)}/health`),
  insights: () => request<ConsultantInsight[]>('/consultant/insights'),
  reviewInsight: (id: string, status: 'approved' | 'rejected') => request(`/consultant/insights/${encodeURIComponent(id)}/review`, 'POST', { status })
}
let consultantSession: DemoSession | undefined
async function consultantRequest<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(consultantSession ? { Authorization: `Bearer ${consultantSession.token}` } : {}) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || '请求失败')
  return payload.data as T
}
export const consultationConsultantApi = {
  async login(id = 'c-101') { const token = getToken(); if (!token?.accessToken) throw new Error('请先登录管理后台'); consultantSession = { token: token.accessToken, id, role: token.roles?.includes('consultant') ? 'consultant' : 'admin', name: token.nickname || id } },
  notices: () => consultantRequest<ConsultationNotice[]>('/consultation-notifications'),
  read: (id: string) => consultantRequest(`/consultation-notifications/${id}/read`, 'POST', {}),
  clients: () => consultantRequest<ConsultantClient[]>('/consultant/clients')
}
