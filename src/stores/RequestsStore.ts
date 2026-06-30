import { defineStore } from 'pinia'
import type { RequestItem, RequestStatus, TxType } from '@/interfaces/models'
import { INITIAL_REQUESTS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import { CURRENT_USER } from '@/constants'
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
    // قرار الطلب: الاعتماد بمبلغ > 0 يُنشئ عملية مالية فعلية
    decide(id: string, status: RequestStatus) {
      const req = this.requests.find((r) => r.id === id)
      if (!req) return
      req.status = status
      useAuditStore().log(status === 'approved' ? 'اعتماد' : 'رفض', 'طلب', req.title)

      if (status === 'approved' && req.amount > 0) {
        const txType: TxType = req.type === 'تحويل' ? 'transfer' : 'expense'
        useFinanceStore().saveTransaction({
          projectId: req.projectId,
          type: txType === 'transfer' ? 'expense' : txType,
          description: `${req.title} (طلب معتمد)`,
          amount: req.amount,
          category: req.type,
          date: today(),
          hasDoc: false,
          memberId: req.memberId,
          note: `أُنشئت تلقائياً من اعتماد الطلب`,
          createdBy: CURRENT_USER,
        })
      }
    },
  },
})
