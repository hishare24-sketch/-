import type { RouteRecordRaw } from 'vue-router'

export const templatesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'templates-page',
    component: () => import('./pages/TemplatesPage.vue'),
    meta: { requiredPermission: 'docs_manage' },
  },
  {
    path: ':id/edit',
    name: 'template-editor',
    component: () => import('./pages/TemplateEditorPage.vue'),
    meta: { requiredPermission: 'docs_manage' },
  },
]

export default templatesRoutes
