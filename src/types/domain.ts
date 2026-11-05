export type ConsultantLevel = '初级' | '高级' | '慢病'
export type MetricStatus = '正常' | '偏高' | '偏低'
export interface User { id: string; name: string; avatar: string; healthScore: number }
export interface HealthProfile { id: string; userId: string; gender: string; birthYear: string; heightCm: string; medicalHistory: string; allergies: string; medications: string; lifestyle: string; updatedAt: string }
export interface ConsentRecord { id: string; userId: string; consentType: 'health_data' | 'privacy' | 'service'; version: string; status: 'granted' | 'revoked'; consentedAt: string; revokedAt?: string }
export type ObservationValueType = 'numeric' | 'qualitative'
export interface Observation { id: string; code: string; name: string; value: string; unit: string; reference: string; status: MetricStatus; measuredAt: string; sourceType?: 'manual' | 'report' | 'import'; sourceRef?: string; confidence?: number; confirmedAt?: string; valueType?: ObservationValueType; category?: string; severity?: '轻度' | '中度' | '重度'; interpretation?: string; recommendation?: string; sourcePage?: number }
export interface HealthReport { id: string; name: string; date: string; status: '待解析' | '待确认' | '解析成功' | '解析失败'; source: string; kind?: 'blood_test' | 'general'; mimeType?: string; sizeBytes?: number; fileAvailable?: boolean; storagePath?: string; parseMode?: 'mock' | 'provider'; uploadedBy?: string }
export interface ReportExtractionCandidate { id: string; code: string; name: string; value: string; unit: string; reference: string; status: MetricStatus; confidence: number; measuredAt: string; valueType?: ObservationValueType; category?: string; severity?: '轻度' | '中度' | '重度'; interpretation?: string; recommendation?: string; sourcePage?: number }
export interface ReportExtraction { id: string; reportId: string; provider: string; status: 'needs_confirmation' | 'confirmed' | 'failed'; candidates: ReportExtractionCandidate[]; createdAt: string; confirmedAt?: string; errorMessage?: string }
export interface HealthTrend { label: string; value: number }
export interface HealthProfileCompleteness { score: number; completedFields: number; totalFields: number; missingFields: string[] }
export interface HealthDataSources { reports: HealthReport[]; manualEntries: Observation[]; lastUpdatedAt: string | null }
export interface HealthResultSummary { score: number; summary: string; attention: Observation[]; generatedAt: string | null }
export interface HealthCheckCenter { id: string; name: string; address: string; distanceKm?: number; phone?: string; items: string[]; enabled: boolean; sort: number }
export interface Consultant { id: string; name: string; level: ConsultantLevel; categories: string[]; rating: number; clients: number; avatar: string }
export type ConsultantAvailabilityStatus = 'online' | 'available' | 'full' | 'offline'
export interface ConsultantAvailability { consultantId: string; status: ConsultantAvailabilityStatus; dailyLimit: number; bookedCount: number; freeConsultEnabled: boolean; slots: string[] }
export type ConsultationBookingStatus = 'pending_assignment' | 'assigned' | 'accepted' | 'completed' | 'cancelled'
export interface ConsultationBooking { id: string; userId: string; consultantId: string; type: 'free' | 'voice'; slot: string; status: ConsultationBookingStatus; createdAt: string }
export interface ServicePlan { id: string; name: string; level: ConsultantLevel; cycle: '月' | '季' | '年' | '7天'; priceFen: number; description: string }
export interface Order { id: string; planId?: string; planName: string; priceFen: number; status: '待付款' | '服务中' | '已完成' | '已取消'; paymentStatus?: 'unpaid' | 'success' | 'failed'; createdAt: string; paidAt?: string }
export interface AIHealthReport { id: string; generatedAt: string; sourceObservationVersion?: string; summary: string; riskLevel: '低风险' | '需关注' | '高风险'; focusAreas: string[]; consultantInsight: string; recommendations: string[] }
