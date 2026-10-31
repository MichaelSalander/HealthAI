import type { AIHealthReport, Consultant, ConsultantAvailability, ConsultationBooking, HealthProfile, HealthReport, HealthTrend, Observation, Order, ReportExtraction, ServicePlan, User } from '../../types/domain'

export interface AuthProvider { login(): Promise<User>; wechatLogin(): Promise<User> }
export interface HealthReportUpload { fileName: string; kind: 'blood_test' | 'general'; mimeType: string; sizeBytes: number; fileBase64: string }
export interface HealthRepository { getProfile(): Promise<HealthProfile>; saveProfile(input: Omit<HealthProfile, 'id' | 'userId' | 'updatedAt'>): Promise<HealthProfile>; getObservations(): Promise<Observation[]>; hasBloodTest(): Promise<boolean>; getTrends(code: string): Promise<HealthTrend[]>; listReports(): Promise<HealthReport[]>; uploadReport(fileName: string, kind?: 'blood_test' | 'general', upload?: Omit<HealthReportUpload, 'fileName' | 'kind'>): Promise<HealthReport>; getReportExtraction(reportId: string): Promise<ReportExtraction>; confirmReport(reportId: string, candidates: ReportExtraction['candidates']): Promise<Observation[]>; addObservation(input: Omit<Observation, 'id' | 'measuredAt'>): Promise<Observation> }
export interface ConsultantRepository { list(): Promise<Consultant[]> }
export interface CommerceRepository { listPlans(): Promise<ServicePlan[]>; listOrders(): Promise<Order[]>; createMockOrder(plan: ServicePlan): Promise<Order> }
export interface HomeEntry { id: string; title: string; subtitle: string; route: string; enabled: boolean; sort: number }
export interface ContentSettings { resultDisclaimer: string; resultConsultationTitle: string; resultConsultationDescription: string }
export interface ContentRepository { listHomeEntries(): Promise<HomeEntry[]>; listContentSettings(): Promise<ContentSettings> }
export interface AIRepository { generateReport(observations: Observation[]): Promise<AIHealthReport> }
