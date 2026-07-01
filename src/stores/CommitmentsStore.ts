import { defineStore } from 'pinia'
import type { Commitment } from '@/interfaces/models'
import { INITIAL_COMMITMENTS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { today, advanceDate } from '@/helpers/date'
import { fmt } from '@/helpers/format'
import { CURRENT_USER, COMMITMENT_KINDS, FREQ_LABEL } from '@/constants'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'

export type CommitmentPayload = Omit<Commitment, 'id'>

// متجر الالتزامات الدورية — تسجيل الدفعة ينشئ عملية مالية ويقدّم الاستحقاق
export const useCommitmentsStore = defineStore('commitments', {
  state: () => ({
    commitments: [...INITIAL_COMMITMENTS] as Commitment[],
  }),

  getters: {
    byProject: (s) => (projectId: string) => s.commitments.filter((c) => c.projectId === projectId),
  },

  actions: {
    addCommitment(payload: CommitmentPayload) {
      this.commitments.unshift({ ...payload, id: uid('cm') })
      useAuditStore().log('إنشاء', 'التزام دوري', `${payload.name} — ${fmt(payload.amount)} ${FREQ_LABEL[payload.freq]}`)
    },
    // تعديل بيانات الالتزام (يحافظ على الدفعات والتقدّم)
    updateCommitment(id: string, patch: Partial<Commitment>) {
      const i = this.commitments.findIndex((c) => c.id === id)
      if (i === -1) return
      this.commitments[i] = { ...this.commitments[i], ...patch, id }
      useAuditStore().log('تعديل', 'التزام دوري', this.commitments[i].name)
    },
    deleteCommitment(id: string) {
      this.commitments = this.commitments.filter((c) => c.id !== id)
    },
    toggleCommitment(id: string) {
      const c = this.commitments.find((x) => x.id === id)
      if (c) c.active = !c.active
    },
    // إلغاء الالتزام (يوقفه ويعلّمه ملغى)
    cancelCommitment(id: string) {
      const c = this.commitments.find((x) => x.id === id)
      if (!c) return
      c.cancelled = true
      c.active = false
      useAuditStore().log('إلغاء', 'التزام دوري', c.name)
    },
    // تسجيل دفعة (مع تفاصيل اختيارية) → عملية مالية فعلية + تقديم تاريخ الاستحقاق
    payCommitment(id: string, opts?: { amount?: number; date?: string; note?: string }) {
      const c = this.commitments.find((x) => x.id === id)
      if (!c) return
      const isOut = c.direction === 'out'
      const amount = opts?.amount ?? c.amount
      const date = opts?.date ?? today()
      const dueLabel = `دفعة ${c.paidCount + 1}${c.totalCount ? `/${c.totalCount}` : ''}`
      c.payments.push({ id: uid('cp'), amount, date, dueLabel, createdBy: CURRENT_USER })
      c.paidCount += 1
      const reachedEnd = c.totalCount != null && c.paidCount >= c.totalCount
      if (reachedEnd) c.active = false
      else c.nextDue = advanceDate(c.nextDue, c.freq)

      const kindLabel = COMMITMENT_KINDS.find((k) => k.id === c.kind)?.label
      useFinanceStore().saveTransaction({
        projectId: c.projectId,
        type: isOut ? 'expense' : 'income',
        description: `${c.name} (${kindLabel} - ${dueLabel})`,
        amount,
        category: c.kind === 'subscription' ? 'اشتراكات' : c.kind === 'installment' ? 'أقساط' : 'التزامات',
        date,
        hasDoc: false,
        source: c.party,
        memberId: c.memberId,
        note: opts?.note?.trim() || `دفعة ${FREQ_LABEL[c.freq]}`,
        createdBy: CURRENT_USER,
      })
      useAuditStore().log(isOut ? 'دفع' : 'استلام', 'التزام دوري', `${c.name} — ${fmt(amount)}`)
    },
  },
})
