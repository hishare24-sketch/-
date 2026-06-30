import { defineStore } from 'pinia'
import type { Receivable, ReceivableStatus } from '@/interfaces/models'
import { INITIAL_RECEIVABLES } from '@/data/seed'
import { recvPaid } from '@/helpers/calc'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import { fmt } from '@/helpers/format'
import { CURRENT_USER } from '@/constants'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'

export type ReceivablePayload = Omit<Receivable, 'id'>

// متجر الذمم (مدينة/دائنة) — التحصيل/السداد يُنشئ عملية مالية فعلية
export const useReceivablesStore = defineStore('receivables', {
  state: () => ({
    receivables: [...INITIAL_RECEIVABLES] as Receivable[],
  }),

  getters: {
    byProject: (s) => (projectId: string) => s.receivables.filter((r) => r.projectId === projectId),
  },

  actions: {
    addReceivable(payload: ReceivablePayload) {
      this.receivables.unshift({ ...payload, id: uid('rc') })
      useAuditStore().log('إنشاء', 'ذمة', `${payload.party} — ${fmt(payload.amount)}`)
    },
    deleteReceivable(id: string) {
      this.receivables = this.receivables.filter((r) => r.id !== id)
    },
    // تسجيل دفعة (تحصيل/سداد) → ينشئ عملية مالية ويحدّث الحالة
    payReceivable(id: string, amount: number, note = '') {
      const r = this.receivables.find((x) => x.id === id)
      if (!r) return
      r.payments.push({ id: uid('pm'), amount, date: today(), note: note || undefined, createdBy: CURRENT_USER })
      const paid = recvPaid(r)
      const newStatus: ReceivableStatus = paid >= r.amount ? 'settled' : paid > 0 ? 'partial' : 'open'
      r.status = newStatus

      const isRecv = r.kind === 'receivable'
      useFinanceStore().saveTransaction({
        projectId: r.projectId,
        type: isRecv ? 'income' : 'expense',
        description: `${isRecv ? 'تحصيل ذمة من' : 'سداد ذمة إلى'} ${r.party}`,
        amount,
        category: 'ذمم',
        date: today(),
        hasDoc: false,
        source: r.party,
        memberId: r.memberId,
        note: note || `${isRecv ? 'تحصيل' : 'سداد'} ذمة`,
        createdBy: CURRENT_USER,
      })
      useAuditStore().log(isRecv ? 'تحصيل' : 'سداد', 'ذمة', `${r.party} — ${fmt(amount)}`)
    },
  },
})
