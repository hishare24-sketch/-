import type { RouteRecordRaw } from 'vue-router'

export const assetsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'assets-page',
    component: () => import('./pages/AssetsPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default assetsRoutes
