import { defineStore } from 'pinia'
import type { Tracking } from '@/interfaces/models'
import { INITIAL_TRACKINGS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { daysBetween, statusFromDays, today } from '@/helpers/date'
import { CURRENT_USER } from '@/constants'
import { useAuditStore } from '@/stores/AuditStore'
import { useFinanceStore } from '@/stores/FinanceStore'

export type TrackingPayload = Omit<Tracking, 'id'> & { id?: string }

// متجر المتابعات والضمانات
export const useTrackingsStore = defineStore('trackings', {
  state: () => ({
    trackings: [...INITIAL_TRACKINGS] as Tracking[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.trackings.filter((t) => t.projectId === projectId),
    urgentByProject: (s) => (projectId: string) =>
      s.trackings.filter(
        (t) => t.projectId === projectId && (t.status === 'expiring' || t.status === 'expired'),
      ),
  },

  actions: {
    saveTracking(payload: TrackingPayload) {
      if (payload.id) {
        const i = this.trackings.findIndex((t) => t.id === payload.id)
        if (i !== -1) this.trackings[i] = { ...this.trackings[i], ...payload, id: payload.id }
      } else {
        this.trackings.unshift({ ...payload, id: uid('tr') })
        useAuditStore().log('إنشاء', 'متابعة', payload.name)
      }
    },
    // إدراج متابعة كاملة (بمعرّف معروف) — يُستخدم لربط ضمان أصل ثم الإشارة إليه
    addTracking(t: Tracking) {
      this.trackings.unshift(t)
      useAuditStore().log('إنشاء', 'متابعة', t.name)
    },
    // تجديد المتابعة: تاريخ انتهاء جديد → إعادة حساب الحالة + عدّاد التجديد
    // opts.feeAsExpense: تسجيل رسوم التجديد كمصروف فعلي في المالية (دمج مع قسم المالية)
    renewTracking(id: string, newExpiry: string, opts?: { feeAsExpense?: number }) {
      const t = this.trackings.find((x) => x.id === id)
      if (!t || !newExpiry) return
      const d = daysBetween(newExpiry)
      t.expiryDate = newExpiry
      t.daysLeft = d
      t.status = statusFromDays(d)
      t.cancelled = false
      t.renewedCount = (t.renewedCount ?? 0) + 1
      useAuditStore().log('تجديد', 'متابعة', `${t.name} → ${newExpiry}`)

      const fee = opts?.feeAsExpense ?? 0
      if (fee > 0) {
        useFinanceStore().saveTransaction({
          projectId: t.projectId,
          type: 'expense',
          description: `تجديد ${t.type}: ${t.name}`,
          amount: fee,
          category: 'رسوم وتجديدات',
          date: today(),
          hasDoc: false,
          memberId: t.memberId,
          note: 'رسوم تجديد متابعة',
          createdBy: CURRENT_USER,
        })
      }
    },
    // إلغاء المتابعة (لم تعد سارية)
    cancelTracking(id: string) {
      const t = this.trackings.find((x) => x.id === id)
      if (!t) return
      t.cancelled = true
      useAuditStore().log('إلغاء', 'متابعة', t.name)
    },
    deleteTracking(id: string) {
      this.trackings = this.trackings.filter((t) => t.id !== id)
    },
  },
})
