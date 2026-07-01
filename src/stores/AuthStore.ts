import { defineStore } from 'pinia'
import type { User, LoginPayload } from '@/interfaces/Auth'
import type { MemberRole } from '@/interfaces/models'
import { DEMO_USERS, ROLE_PERMS, ROLES } from '@/constants'

interface AuthState {
  authUser: User | null
  fcmToken: string | null
}

const STORAGE_KEY = 'mazeen_auth_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

// بناء كائن مستخدم كامل من حساب تجريبي (وضع بلا backend)
function buildUser(demo: { email: string; name: string; role: MemberRole }): User {
  return {
    id: Math.abs(hashCode(demo.email)),
    uuid: demo.email,
    name: demo.name,
    email: demo.email,
    image_path: '',
    token: `demo-${demo.role}-token`,
    created_at: new Date().toISOString(),
    permissions: ROLE_PERMS[demo.role] ?? [],
    roles: [{ id: demo.role, name: ROLES.find((r) => r.id === demo.role)?.label ?? demo.role }],
    apps: [],
    role: demo.role,
  }
}

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

// المصدر الوحيد لحالة المصادقة والصلاحيات
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    authUser: loadUser(),
    fcmToken: null,
  }),

  getters: {
    isAuthUser: (state) => !!state.authUser,
    getToken: (state) => state.authUser?.token,
    currentUser: (state) => state.authUser,
    currentRole: (state) => state.authUser?.role ?? null,
    roleLabel: (state) =>
      state.authUser ? ROLES.find((r) => r.id === state.authUser!.role)?.label ?? '' : '',
    hasPermission: (state) => (permission: string) =>
      state.authUser?.permissions?.includes(permission) ?? false,
    hasPermissions: (state) => (permissions: string[]) =>
      permissions.every((p) => state.authUser?.permissions?.includes(p)),
    hasAtLeaseOnePermission: (state) => (permissions: string[]) =>
      permissions.some((p) => state.authUser?.permissions?.includes(p)),
  },

  actions: {
    // تسجيل دخول محاكى: يطابق حساباً تجريبياً ويشتق الصلاحيات من دوره
    login(payload: LoginPayload): { ok: boolean; error?: string } {
      const email = payload.email.trim().toLowerCase()
      const demo = DEMO_USERS.find((u) => u.email.toLowerCase() === email)
      if (!demo || demo.password !== payload.password) {
        return { ok: false, error: 'بيانات الدخول غير صحيحة' }
      }
      this.setAuthUser(buildUser(demo))
      return { ok: true }
    },
    logout() {
      this.clearAuthUser()
    },
    setAuthUser(user: User) {
      this.authUser = user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    },
    clearAuthUser() {
      this.authUser = null
      this.fcmToken = null
      localStorage.removeItem(STORAGE_KEY)
    },
    setUserPermissions(permissions: string[]) {
      if (this.authUser) {
        this.authUser.permissions = permissions
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.authUser))
      }
    },
  },
})
