import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import { dashboardRoutes } from '@/modules/dashboard/dashboardRoutes'
import { projectsRoutes } from '@/modules/projects/projectsRoutes'
import { financeRoutes } from '@/modules/finance/financeRoutes'
import { receivablesRoutes } from '@/modules/receivables/receivablesRoutes'
import { commitmentsRoutes } from '@/modules/commitments/commitmentsRoutes'
import { assetsRoutes } from '@/modules/assets/assetsRoutes'
import { trackingsRoutes } from '@/modules/trackings/trackingsRoutes'
import { requestsRoutes } from '@/modules/requests/requestsRoutes'
import { documentsRoutes } from '@/modules/documents/documentsRoutes'
import { templatesRoutes } from '@/modules/templates/templatesRoutes'
import { surveysRoutes } from '@/modules/surveys/surveysRoutes'
import { notificationsRoutes } from '@/modules/notifications/notificationsRoutes'
import { auditRoutes } from '@/modules/audit/auditRoutes'
import { tasksRoutes } from '@/modules/tasks/tasksRoutes'
import { settingsRoutes } from '@/modules/settings/settingsRoutes'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/modules/dashboard/DashboardModule.vue'),
    meta: { layout: 'default' },
    children: dashboardRoutes,
  },
  {
    path: '/projects',
    component: () => import('@/modules/projects/ProjectsModule.vue'),
    meta: { layout: 'default' },
    children: projectsRoutes,
  },
  {
    path: '/finance',
    component: () => import('@/modules/finance/FinanceModule.vue'),
    meta: { layout: 'default', requiredPermission: 'finance_view' },
    children: financeRoutes,
  },
  {
    path: '/receivables',
    component: () => import('@/modules/receivables/ReceivablesModule.vue'),
    meta: { layout: 'default', requiredPermission: 'finance_view' },
    children: receivablesRoutes,
  },
  {
    path: '/commitments',
    component: () => import('@/modules/commitments/CommitmentsModule.vue'),
    meta: { layout: 'default', requiredPermission: 'finance_view' },
    children: commitmentsRoutes,
  },
  {
    path: '/assets',
    component: () => import('@/modules/assets/AssetsModule.vue'),
    meta: { layout: 'default' },
    children: assetsRoutes,
  },
  {
    path: '/trackings',
    component: () => import('@/modules/trackings/TrackingsModule.vue'),
    meta: { layout: 'default' },
    children: trackingsRoutes,
  },
  {
    path: '/requests',
    component: () => import('@/modules/requests/RequestsModule.vue'),
    meta: { layout: 'default' },
    children: requestsRoutes,
  },
  {
    path: '/documents',
    component: () => import('@/modules/documents/DocumentsModule.vue'),
    meta: { layout: 'default' },
    children: documentsRoutes,
  },
  {
    path: '/templates',
    component: () => import('@/modules/templates/TemplatesModule.vue'),
    meta: { layout: 'default', requiredPermission: 'docs_manage' },
    children: templatesRoutes,
  },
  {
    path: '/surveys',
    component: () => import('@/modules/surveys/SurveysModule.vue'),
    meta: { layout: 'default' },
    children: surveysRoutes,
  },
  {
    path: '/notifications',
    component: () => import('@/modules/notifications/NotificationsModule.vue'),
    meta: { layout: 'default' },
    children: notificationsRoutes,
  },
  {
    path: '/audit',
    component: () => import('@/modules/audit/AuditModule.vue'),
    meta: { layout: 'default', requiredPermission: 'audit_view' },
    children: auditRoutes,
  },
  {
    path: '/tasks',
    component: () => import('@/modules/tasks/TasksModule.vue'),
    meta: { layout: 'default' },
    children: tasksRoutes,
  },
  {
    path: '/settings',
    component: () => import('@/modules/settings/SettingsModule.vue'),
    meta: { layout: 'default', requiredPermission: 'project_edit' },
    children: settingsRoutes,
  },
  {
    path: '/launcher',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/section/:key',
    name: 'section',
    component: () => import('@/pages/ComingSoonPage.vue'),
    meta: { layout: 'default' },
  },
  {
    path: '/login',
    name: 'login-page',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { layout: 'forms' },
  },
  {
    path: '/error',
    name: 'error-page',
    component: () => import('@/pages/ErrorPage.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/s/:shareId',
    name: 'public-survey',
    component: () => import('@/pages/PublicSurveyPage.vue'),
    meta: { layout: 'blank' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/ErrorPage.vue'),
    meta: { layout: 'blank' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// حُرّاس المسارات — الدخول إجباري مع تقييد حسب الصلاحيات
const REQUIRE_AUTH = true

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  const { isAuthUser } = auth

  // منع الوصول لأي شاشة داخلية بدون تسجيل دخول
  if (REQUIRE_AUTH && to.meta.layout === 'default' && !isAuthUser) {
    return next({ name: 'login-page', query: { redirect: to.fullPath } })
  }

  // المستخدم المُسجَّل لا يعود لصفحة الدخول
  if (isAuthUser && to.name === 'login-page') {
    return next({ name: 'dashboard-page' })
  }

  if (REQUIRE_AUTH && isAuthUser) {
    const requiredPermission = to.meta.requiredPermission as string | undefined
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      return next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })
    }

    const requireAtLeastOne = to.meta.requireAtLeastOnePermission as string[] | undefined
    if (requireAtLeastOne && !auth.hasAtLeaseOnePermission(requireAtLeastOne)) {
      return next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })
    }
  }

  return next()
})

export default router
