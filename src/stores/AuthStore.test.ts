import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './AuthStore'
import { ROLE_PERMS } from '@/constants'

// تخزين محلي وهمي لبيئة الاختبار
beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v
    },
    removeItem: (k: string) => {
      delete store[k]
    },
  })
  setActivePinia(createPinia())
})

describe('AuthStore.login', () => {
  it('تسجيل دخول صحيح يضبط المستخدم ويشتق صلاحيات الدور', () => {
    const auth = useAuthStore()
    const res = auth.login({ email: 'owner@mazeen.app', password: '123456' })

    expect(res.ok).toBe(true)
    expect(auth.isAuthUser).toBe(true)
    expect(auth.currentRole).toBe('owner')
    expect(auth.authUser?.permissions).toEqual(ROLE_PERMS.owner)
    expect(auth.hasPermission('finance_edit')).toBe(true)
  })

  it('المشاهد يملك عرض المالية فقط دون تعديلها', () => {
    const auth = useAuthStore()
    auth.login({ email: 'viewer@mazeen.app', password: '123456' })

    expect(auth.currentRole).toBe('viewer')
    expect(auth.hasPermission('finance_view')).toBe(true)
    expect(auth.hasPermission('finance_edit')).toBe(false)
    expect(auth.hasPermission('audit_view')).toBe(false)
  })

  it('كلمة مرور خاطئة تُرفض بلا تسجيل دخول', () => {
    const auth = useAuthStore()
    const res = auth.login({ email: 'owner@mazeen.app', password: 'wrong' })

    expect(res.ok).toBe(false)
    expect(res.error).toBeTruthy()
    expect(auth.isAuthUser).toBe(false)
  })

  it('بريد غير معروف يُرفض', () => {
    const auth = useAuthStore()
    const res = auth.login({ email: 'nobody@x.com', password: '123456' })
    expect(res.ok).toBe(false)
    expect(auth.isAuthUser).toBe(false)
  })

  it('البريد غير حسّاس لحالة الأحرف والمسافات', () => {
    const auth = useAuthStore()
    const res = auth.login({ email: '  Manager@Mazeen.App  ', password: '123456' })
    expect(res.ok).toBe(true)
    expect(auth.currentRole).toBe('manager')
  })

  it('logout يمسح المستخدم', () => {
    const auth = useAuthStore()
    auth.login({ email: 'owner@mazeen.app', password: '123456' })
    expect(auth.isAuthUser).toBe(true)
    auth.logout()
    expect(auth.isAuthUser).toBe(false)
    expect(auth.currentRole).toBe(null)
  })

  it('helpers الصلاحيات hasPermissions / hasAtLeaseOnePermission', () => {
    const auth = useAuthStore()
    auth.login({ email: 'member@mazeen.app', password: '123456' })
    expect(auth.hasPermissions(['finance_view', 'docs_manage'])).toBe(true)
    expect(auth.hasPermissions(['finance_view', 'audit_view'])).toBe(false)
    expect(auth.hasAtLeaseOnePermission(['audit_view', 'finance_view'])).toBe(true)
    expect(auth.hasAtLeaseOnePermission(['audit_view', 'members_manage'])).toBe(false)
  })
})
