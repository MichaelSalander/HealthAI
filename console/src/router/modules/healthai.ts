const Layout = () => import('@/layout/index.vue')
const adminRole = ['admin']

const page = (path: string, name: string, title: string, view: string) => ({
  path,
  name,
  component: () => import(`@/views/healthai/${view}/index.vue`),
  meta: { title, roles: adminRole }
})

export default {
  path: '/healthai',
  component: Layout,
  redirect: '/healthai/overview',
  meta: { title: '健康管理平台', rank: 1 },
  children: [
    page('/healthai/overview', 'HealthAiOverview', '运营总览', 'overview'),
    page('/healthai/users', 'HealthAiUsers', '会员管理', 'users'),
    page('/healthai/clients', 'HealthAiClients', '客户健康档案', 'clients'),
    page('/healthai/consultants', 'HealthAiConsultants', '健管师管理', 'consultants'),
    page('/healthai/consultations', 'HealthAiConsultations', '咨询监控', 'consultations'),
    page('/healthai/orders', 'HealthAiOrders', '订单与服务', 'orders'),
    page('/healthai/services', 'HealthAiServices', '服务方案', 'services'),
    page('/healthai/centers', 'HealthAiCenters', '体检中心', 'centers'),
    page('/healthai/education', 'HealthAiEducation', '卫教内容', 'education'),
    page('/healthai/content', 'HealthAiContent', '客户端内容配置', 'content'),
    page('/healthai/system', 'HealthAiSystem', '权限与系统设置', 'system')
  ]
} satisfies RouteConfigsTable
