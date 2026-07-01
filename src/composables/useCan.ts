import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/AuthStore'

/**
 * تقييد الواجهة حسب صلاحيات المستخدم الحالي.
 * الاستخدام: const { can, canAny, currentUser } = useCan()
 *   v-if="can('finance_edit')"  ·  v-if="canAny(['a','b'])"
 */
export function useCan() {
  const auth = useAuthStore()
  const { currentUser, currentRole, roleLabel } = storeToRefs(auth)

  const can = (permission: string): boolean => auth.hasPermission(permission)
  const canAny = (permissions: string[]): boolean => auth.hasAtLeaseOnePermission(permissions)
  const canAll = (permissions: string[]): boolean => auth.hasPermissions(permissions)

  return { can, canAny, canAll, currentUser, currentRole, roleLabel }
}
