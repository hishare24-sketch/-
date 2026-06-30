import type { RouteRecordRaw } from 'vue-router'

export const financeRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'finance-page',
    component: () => import('./pages/FinancePage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
  {
    path: 'ledger',
    name: 'ledger-page',
    component: () => import('./pages/LedgerPage.vue'),
    meta: { requiredPermission: 'finance_view' },
  },
]

export default financeRoutes
