import type { RouteRecordRaw } from 'vue-router'

export const surveysRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'surveys-page',
    component: () => import('./pages/SurveysPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default surveysRoutes
