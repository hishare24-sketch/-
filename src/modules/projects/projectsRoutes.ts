import type { RouteRecordRaw } from 'vue-router'

export const projectsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'projects-page',
    component: () => import('./pages/ProjectsPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
  {
    path: ':id',
    name: 'project-detail',
    component: () => import('./pages/ProjectDetailPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default projectsRoutes
