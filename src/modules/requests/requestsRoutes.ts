import type { RouteRecordRaw } from 'vue-router'

export const requestsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'requests-page',
    component: () => import('./pages/RequestsPage.vue'),
    meta: { requiredPermission: 'requests_approve' },
  },
]

export default requestsRoutes
