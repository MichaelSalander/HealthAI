import type { Consultant, HealthReport, HealthTrend, Observation, ServicePlan, User } from '../../types/domain'
export const mockUser: User = { id: 'u-001', name: '张小美', avatar: '👩🏻', healthScore: 85 }
export const mockObservations: Observation[] = [
  { id: 'o-001', code: 'ldl-c', name: 'LDL-C（低密度脂蛋白）', value: '4.2', unit: 'mmol/L', reference: '< 3.4', status: '偏高', measuredAt: '2024-10-10' },
  { id: 'o-002', code: 'alt', name: 'ALT（丙氨酸转氨酶）', value: '68', unit: 'U/L', reference: '< 40', status: '偏高', measuredAt: '2024-10-10' },
  { id: 'o-003', code: 'fasting-glucose', name: '空腹血糖', value: '6.8', unit: 'mmol/L', reference: '< 6.1', status: '偏高', measuredAt: '2024-10-10' },
  { id: 'o-004', code: 'blood-pressure', name: '血压', value: '120/78', unit: 'mmHg', reference: '< 140/90', status: '正常', measuredAt: '2024-12-10' },
  { id: 'o-005', code: 'weight', name: '体重', value: '62.5', unit: 'kg', reference: '目标 55.0', status: '正常', measuredAt: '2024-12-10' }
]
export const mockReports: HealthReport[] = [{ id: 'r-001', name: '2024年度体检报告.pdf', date: '2024-10-10', status: '解析成功', source: '体检报告' }, { id: 'r-002', name: '2023年度体检报告.pdf', date: '2023-09-12', status: '解析成功', source: '体检报告' }]
export const mockTrends: HealthTrend[] = [{ label: '9月', value: 67 }, { label: '10月', value: 64 }, { label: '11月', value: 65 }, { label: '12月', value: 62.5 }]
export const mockConsultants: Consultant[] = [{ id: 'c-001', name: '李晓雯', level: '高级', categories: ['体重管理', '运动营养'], rating: 4.9, clients: 523, avatar: '👩🏻‍⚕️' }, { id: 'c-002', name: '王雅婷', level: '高级', categories: ['慢病管理', '营养调理'], rating: 4.8, clients: 316, avatar: '👩🏻' }]
export const mockPlans: ServicePlan[] = [{ id: 'p-001', name: '初级健康管理 7天体验', level: '初级', cycle: '7天', priceFen: 19900, description: '基础健康评估、1次1V1咨询、体验专属健康管理师' }, { id: 'p-002', name: '初级健康管理', level: '初级', cycle: '月', priceFen: 198000, description: '健康档案、每日打卡、每月1次1V1、月度健康报告' }, { id: 'p-003', name: '高级健康管理', level: '高级', cycle: '月', priceFen: 298000, description: '每日数据追踪、每周1次1V1、个性化方案' }, { id: 'p-004', name: '慢病健康管理 7天体验', level: '慢病', cycle: '7天', priceFen: 69900, description: '慢病一对一体验与必要时转介' }]
