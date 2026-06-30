import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/AuthStore'
import { dashboardRoutes } from '@/modules/dashboard/dashboardRoutes'
import { projectsRoutes } from '@/modules/projects/projectsRoutes'
import { financeRoutes } from '@/modules/finance/financeRoutes'

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
    meta: { layout: 'default' },
    children: financeRoutes,
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

// حُرّاس المسارات — جاهزون لكن الدخول غير إجباري حالياً (REQUIRE_AUTH=false)
const REQUIRE_AUTH = false

router.beforeEach((to, _from, next) => {
  const { isAuthUser, hasPermission, hasAtLeaseOnePermission } = useAuthStore()

  if (REQUIRE_AUTH && to.meta.layout === 'default' && !isAuthUser) {
    return next({ name: 'login-page', query: { redirect: to.fullPath } })
  }

  const requiredPermission = to.meta.requiredPermission as string | undefined
  if (REQUIRE_AUTH && isAuthUser && requiredPermission && !hasPermission(requiredPermission)) {
    return next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })
  }

  const requireAtLeastOne = to.meta.requireAtLeastOnePermission as string[] | undefined
  if (
    REQUIRE_AUTH &&
    isAuthUser &&
    requireAtLeastOne &&
    !hasAtLeaseOnePermission(requireAtLeastOne)
  ) {
    return next({ name: 'error-page', query: { message: 'errors.you_are_not_authorized' } })
  }

  return next()
})

export default router
