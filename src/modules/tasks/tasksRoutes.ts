import type { RouteRecordRaw } from 'vue-router'

export const tasksRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'tasks-page',
    component: () => import('./pages/TasksPage.vue'),
  },
]

export default tasksRoutes
