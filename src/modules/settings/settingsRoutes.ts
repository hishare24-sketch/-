import type { RouteRecordRaw } from 'vue-router'

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'settings-page',
    component: () => import('./pages/SettingsPage.vue'),
  },
]

export default settingsRoutes
