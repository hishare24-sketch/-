import { defineStore } from 'pinia'
import type { User } from '@/interfaces/Auth'

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

// المصدر الوحيد لحالة المصادقة والصلاحيات (هيكل جاهز)
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    authUser: loadUser(),
    fcmToken: null,
  }),

  getters: {
    isAuthUser: (state) => !!state.authUser,
    getToken: (state) => state.authUser?.token,
    hasPermission: (state) => (permission: string) =>
      state.authUser?.permissions?.includes(permission) ?? false,
    hasPermissions: (state) => (permissions: string[]) =>
      permissions.every((p) => state.authUser?.permissions?.includes(p)),
    hasAtLeaseOnePermission: (state) => (permissions: string[]) =>
      permissions.some((p) => state.authUser?.permissions?.includes(p)),
  },

  actions: {
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
