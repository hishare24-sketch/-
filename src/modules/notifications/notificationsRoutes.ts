import type { RouteRecordRaw } from 'vue-router'

export const notificationsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'notifications-page',
    component: () => import('./pages/NotificationsPage.vue'),
  },
]

export default notificationsRoutes
