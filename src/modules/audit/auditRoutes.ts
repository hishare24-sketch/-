import type { RouteRecordRaw } from 'vue-router'

export const auditRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'audit-page',
    component: () => import('./pages/AuditPage.vue'),
    meta: { requiredPermission: 'audit_view' },
  },
]

export default auditRoutes
