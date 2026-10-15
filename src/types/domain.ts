export type ConsultantLevel = '初级' | '高级' | '慢病'
export type MetricStatus = '正常' | '偏高' | '偏低'
export interface User { id: string; name: string; avatar: string; healthScore: number }
export interface HealthProfile { id: string; userId: string; gender: string; birthYear: string; heightCm: string; medicalHistory: string; allergies: string; medications: string; lifestyle: string; updatedAt: string }
export interface Observation { id: string; code: string; name: string; value: string; unit: string; reference: string; status: MetricStatus; measuredAt: string }
export interface HealthReport { id: string; name: string; date: string; status: '待解析' | '解析成功'; source: string }
export interface HealthTrend { label: string; value: number }
export interface Consultant { id: string; name: string; level: ConsultantLevel; categories: string[]; rating: number; clients: number; avatar: string }
export interface ServicePlan { id: string; name: string; level: ConsultantLevel; cycle: '月' | '季' | '年' | '7天'; priceFen: number; description: string }
export interface Order { id: string; planName: string; priceFen: number; status: '服务中' | '已完成' | '已取消'; createdAt: string }
export interface AIHealthReport { id: string; generatedAt: string; summary: string; riskLevel: '低风险' | '需关注' | '高风险'; focusAreas: string[]; consultantInsight: string; recommendations: string[] }
