import { defineStore } from 'pinia'
import type { Asset, MaintenanceEntry } from '@/interfaces/models'
import { INITIAL_ASSETS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { fmt } from '@/helpers/format'
import { CURRENT_USER } from '@/constants'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'

export type AssetPayload = Omit<Asset, 'id'>

// متجر الأصول الملموسة — الصيانة بتكلفة تُسجَّل كمصروف فعلي
export const useAssetsStore = defineStore('assets', {
  state: () => ({
    assets: [...INITIAL_ASSETS] as Asset[],
  }),

  getters: {
    byProject: (s) => (projectId: string) => s.assets.filter((a) => a.projectId === projectId),
  },

  actions: {
    addAsset(payload: AssetPayload) {
      this.assets.unshift({ ...payload, id: uid('as') })
      useAuditStore().log('إنشاء', 'أصل', `${payload.name} — ${fmt(payload.purchaseValue)}`)
    },
    deleteAsset(id: string) {
      this.assets = this.assets.filter((a) => a.id !== id)
    },
    // إضافة صيانة → قد تقلب الحالة + تُسجّل مصروفاً إن كان لها تكلفة
    addMaintenance(assetId: string, m: Omit<MaintenanceEntry, 'id'>) {
      const a = this.assets.find((x) => x.id === assetId)
      if (!a) return
      a.maintenance.push({ ...m, id: uid('mn') })
      if (m.type === 'عطل') a.status = 'maintenance'

      if (m.cost > 0) {
        useFinanceStore().saveTransaction({
          projectId: a.projectId,
          type: 'expense',
          description: `${m.type} - ${a.name}${m.note ? ` (${m.note})` : ''}`,
          amount: m.cost,
          category: 'صيانة',
          date: m.date,
          hasDoc: false,
          note: 'صيانة أصل',
          createdBy: CURRENT_USER,
        })
      }
      useAuditStore().log('تسجيل', 'صيانة أصل', `${a.name} — ${m.type} ${fmt(m.cost)}`)
    },
  },
})
