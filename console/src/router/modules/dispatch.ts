export default {
  path: '/consultation-dispatch', component: () => import('@/layout/index.vue'),
  meta: { title: '咨询派单', rank: 2 },
  children: [{ path: '/consultation-dispatch/index', name: 'ConsultationDispatch', component: () => import('@/views/dispatch/index.vue'), meta: { title: '咨询派单', roles: ['admin'] } }]
} satisfies RouteConfigsTable
