import type { TxType } from './models'

// تعبئة مسبقة للنماذج (تُستخدم عند إنشاء عنصر من مستند/إجراء ذكي)
export interface FormPreset {
  projectId?: string
  amount?: number
  name?: string // اسم المتابعة/الأصل/الالتزام
  party?: string // طرف الذمة/الالتزام
  source?: string // مصدر العملية
  description?: string // وصف العملية
  category?: string
  type?: TxType
  trackingType?: string
  expiryDate?: string
  warrantyEnd?: string
  supplier?: string
  note?: string
}
