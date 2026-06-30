import { defineStore } from 'pinia'
import type { Transaction } from '@/interfaces/models'
import { INITIAL_TRANSACTIONS } from '@/data/seed'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { computeBalance } from '@/helpers/calc'
import { uid } from '@/helpers/id'

// نوع حمولة الحفظ (id اختياري عند الإنشاء)
export type TxPayload = Omit<Transaction, 'id'> & { id?: string }

// متجر الحركات المالية
export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [...INITIAL_TRANSACTIONS] as Transaction[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.transactions.filter((t) => t.projectId === projectId),

    balanceOf() {
      return (projectId: string): number => {
        const projectsStore = useProjectsStore()
        const project = projectsStore.projectById(projectId)
        if (!project) return 0
        return computeBalance(project, this.transactions)
      }
    },
  },

  actions: {
    // الحفظ: التحويل بين مشروعين يُنشئ قيدين مرتبطين (صادر + وارد)
    saveTransaction(payload: TxPayload) {
      if (payload.id) {
        const i = this.transactions.findIndex((t) => t.id === payload.id)
        if (i !== -1) this.transactions[i] = { ...this.transactions[i], ...payload, id: payload.id }
        return
      }

      if (payload.type === 'transfer' && payload.toProject) {
        const linkId = uid('lnk')
        this.transactions.unshift({
          ...payload,
          id: uid('t'),
          type: 'transfer',
          transferDir: 'out',
          linkId,
        })
        this.transactions.unshift({
          ...payload,
          id: uid('t'),
          projectId: payload.toProject,
          toProject: payload.projectId,
          type: 'transfer',
          transferDir: 'in',
          linkId,
        })
        return
      }

      this.transactions.unshift({ ...payload, id: uid('t') })
    },

    deleteTransaction(id: string) {
      const tx = this.transactions.find((t) => t.id === id)
      // حذف الطرف المرتبط في التحويلات أيضاً
      if (tx?.linkId) {
        this.transactions = this.transactions.filter((t) => t.linkId !== tx.linkId)
      } else {
        this.transactions = this.transactions.filter((t) => t.id !== id)
      }
    },

    // تصحيح المبلغ السالب (جعله موجباً)
    fixAmount(id: string) {
      const t = this.transactions.find((x) => x.id === id)
      if (t) t.amount = Math.abs(t.amount)
    },
  },
})
