import type { Consultant, HealthReport, HealthTrend, Observation, ServicePlan, User } from '../../types/domain'
// 仅保留类型兼容的空数据；正式页面必须从 API / Repository 获取用户数据。
export const mockUser: User = { id: '', name: '', avatar: '👤', healthScore: 0 }
export const mockObservations: Observation[] = []
export const mockReports: HealthReport[] = []
export const mockTrends: HealthTrend[] = []
export const mockConsultants: Consultant[] = []
export const mockPlans: ServicePlan[] = [{ id: 'p-001', name: '初级健康管理 7天体验', level: '初级', cycle: '7天', priceFen: 19900, description: '基础健康评估、1次1V1咨询、体验专属健康管理师' }, { id: 'p-002', name: '初级健康管理', level: '初级', cycle: '月', priceFen: 198000, description: '健康档案、每日打卡、每月1次1V1、月度健康报告' }, { id: 'p-003', name: '高级健康管理', level: '高级', cycle: '月', priceFen: 298000, description: '每日数据追踪、每周1次1V1、个性化方案' }, { id: 'p-004', name: '慢病健康管理 7天体验', level: '慢病', cycle: '7天', priceFen: 69900, description: '慢病一对一体验与必要时转介' }]
