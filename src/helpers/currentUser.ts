// اسم المستخدم الحالي للتوسيم (createdBy/decidedBy...) — المُسجَّل فعليّاً مع fallback للثابت
import { useAuthStore } from '@/stores/AuthStore'
import { CURRENT_USER } from '@/constants'

export function currentUserName(): string {
  return useAuthStore().currentUser?.name ?? CURRENT_USER
}
