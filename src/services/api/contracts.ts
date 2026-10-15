import type { AIHealthReport, Consultant, HealthProfile, HealthReport, HealthTrend, Observation, Order, ServicePlan, User } from '../../types/domain'

export interface AuthProvider { mockLogin(): Promise<User>; wechatLogin(): Promise<User> }
export interface HealthRepository { getProfile(): Promise<HealthProfile>; saveProfile(input: Omit<HealthProfile, 'id' | 'userId' | 'updatedAt'>): Promise<HealthProfile>; getObservations(): Promise<Observation[]>; getTrends(code: string): Promise<HealthTrend[]>; listReports(): Promise<HealthReport[]>; uploadReport(fileName: string): Promise<HealthReport>; addObservation(input: Omit<Observation, 'id' | 'measuredAt'>): Promise<Observation> }
export interface ConsultantRepository { list(): Promise<Consultant[]> }
export interface CommerceRepository { listPlans(): Promise<ServicePlan[]>; listOrders(): Promise<Order[]>; createMockOrder(plan: ServicePlan): Promise<Order> }
export interface HomeEntry { id: string; title: string; subtitle: string; route: string; enabled: boolean; sort: number }
export interface ContentRepository { listHomeEntries(): Promise<HomeEntry[]> }
export interface AIRepository { generateReport(observations: Observation[]): Promise<AIHealthReport> }
