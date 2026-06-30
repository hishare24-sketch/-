import type { RouteRecordRaw } from 'vue-router'

export const receivablesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'receivables-page',
    component: () => import('./pages/ReceivablesPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default receivablesRoutes
