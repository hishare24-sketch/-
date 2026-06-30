import type { RouteRecordRaw } from 'vue-router'

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'dashboard-page',
    component: () => import('./pages/DashboardPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default dashboardRoutes
