import { defineStore } from 'pinia'
import type { Transaction } from '@/interfaces/models'
import { INITIAL_TRANSACTIONS } from '@/data/seed'
import { useProjectsStore } from '@/stores/ProjectsStore'

// متجر الحركات المالية (يُثرى بالـ CRUD في المرحلة 4)
export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [...INITIAL_TRANSACTIONS] as Transaction[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.transactions.filter((t) => t.projectId === projectId),

    // الرصيد المحسوب = الرصيد الافتتاحي + الإيرادات − المصروفات ± التحويلات
    balanceOf() {
      return (projectId: string): number => {
        const projectsStore = useProjectsStore()
        const project = projectsStore.projectById(projectId)
        if (!project) return 0
        let bal = project.balance
        for (const t of this.transactions) {
          if (t.projectId !== projectId) continue
          if (t.type === 'income') bal += t.amount
          else if (t.type === 'expense') bal -= t.amount
          else if (t.type === 'transfer') bal += t.transferDir === 'in' ? t.amount : -t.amount
        }
        return bal
      }
    },
  },
})
