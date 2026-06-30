import type { RouteRecordRaw } from 'vue-router'

export const documentsRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'documents-page',
    component: () => import('./pages/DocumentsPage.vue'),
    meta: { requiredPermission: 'docs_manage' },
  },
]

export default documentsRoutes
