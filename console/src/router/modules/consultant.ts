const Layout = () => import('@/layout/index.vue')
const consultantRole = ['consultant', 'admin']

const page = (path: string, name: string, title: string, view: string) => ({
  path,
  name,
  component: () => import(`@/views/consultant/${view}/index.vue`),
  meta: { title, roles: consultantRole }
})

export default {
  path: '/consultant',
  component: Layout,
  redirect: '/consultant/dashboard',
  meta: { title: '健管师工作台', rank: 3 },
  children: [
    page('/consultant/dashboard', 'ConsultantDashboard', '工作概览', 'dashboard'),
    page('/consultant/consultation', 'ConsultantConsultation', '客户咨询', 'consultation'),
    page('/consultant/notifications', 'ConsultantNotifications', '咨询通知', 'notifications'),
    page('/consultant/insights', 'ConsultantInsights', 'AI 健康洞察', 'insights'),
    page('/consultant/profile', 'ConsultantProfile', '我的资料', 'profile')
  ]
} satisfies RouteConfigsTable
