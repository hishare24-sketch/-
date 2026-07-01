import { defineStore } from 'pinia'
import type { RequestItem, RequestStatus, TxType } from '@/interfaces/models'
import { INITIAL_REQUESTS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import { CURRENT_USER, REQUEST_TYPE_META } from '@/constants'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'

export type RequestPayload = Omit<RequestItem, 'id'> & { id?: string }

// متجر الطلبات والموافقات — الطلب المعتمد ذو المبلغ يصبح عملية مالية فعلية
export const useRequestsStore = defineStore('requests', {
  state: () => ({
    requests: [...INITIAL_REQUESTS] as RequestItem[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.requests.filter((r) => r.projectId === projectId),
    pendingByProject: (s) => (projectId: string) =>
      s.requests.filter((r) => r.projectId === projectId && r.status === 'pending'),
  },

  actions: {
    saveRequest(payload: RequestPayload) {
      if (payload.id) {
        const i = this.requests.findIndex((r) => r.id === payload.id)
        if (i !== -1) this.requests[i] = { ...this.requests[i], ...payload, id: payload.id }
      } else {
        this.requests.unshift({ ...payload, id: uid('r') })
      }
    },
    deleteRequest(id: string) {
      this.requests = this.requests.filter((r) => r.id !== id)
    },
    // تغيير حالة بلا قرار مالي (قيد المراجعة / إلغاء / إعادة فتح)
    setRequestStatus(id: string, status: RequestStatus) {
      const req = this.requests.find((r) => r.id === id)
      if (!req) return
      req.status = status
      useAuditStore().log('تغيير حالة', 'طلب', `${req.title} → ${status}`)
    },
    // قرار الطلب: الاعتماد بمبلغ > 0 يُنشئ عملية مالية فعلية
    decide(id: string, status: RequestStatus, note?: string) {
      const req = this.requests.find((r) => r.id === id)
      if (!req) return
      req.status = status
      req.decidedBy = CURRENT_USER
      if (note) req.decisionNote = note.trim()
      useAuditStore().log(status === 'approved' ? 'اعتماد' : 'رفض', 'طلب', req.title)

      // الاعتماد بمبلغ > 0 يُنشئ عملية مالية حسب اتجاه نوع الطلب (صادر/وارد)؛ الأنواع غير المالية لا تُنشئ عملية
      const flow = REQUEST_TYPE_META[req.type]?.flow ?? 'out'
      if (status === 'approved' && req.amount > 0 && flow !== 'none') {
        const txType: TxType = flow === 'in' ? 'income' : 'expense'
        useFinanceStore().saveTransaction({
          projectId: req.projectId,
          type: txType,
          description: `${req.title} (طلب معتمد)`,
          amount: req.amount,
          category: req.type,
          date: today(),
          hasDoc: !!req.attachments?.length,
          attachments: req.attachments?.length ? req.attachments : undefined,
          memberId: req.memberId,
          note: `أُنشئت تلقائياً من اعتماد الطلب`,
          createdBy: CURRENT_USER,
        })
      }
    },
  },
})
