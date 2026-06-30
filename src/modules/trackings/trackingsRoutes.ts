import type { RouteRecordRaw } from 'vue-router'

export const trackingsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'trackings-page',
    component: () => import('./pages/TrackingsPage.vue'),
    meta: { requiredPermission: 'tracking_manage' },
  },
]

export default trackingsRoutes
