import type { RouteRecordRaw } from 'vue-router'

export const commitmentsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'commitments-page',
    component: () => import('./pages/CommitmentsPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default commitmentsRoutes
