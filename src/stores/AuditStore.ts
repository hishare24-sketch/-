import { defineStore } from 'pinia'
import type { AuditEntry } from '@/interfaces/models'
import { INITIAL_AUDIT } from '@/data/seed'
import { uid } from '@/helpers/id'
import { nowStamp } from '@/helpers/date'
import { CURRENT_USER } from '@/constants'

// سجل التدقيق — يسجّل الأحداث المهمة عبر التطبيق
export const useAuditStore = defineStore('audit', {
  state: () => ({
    entries: [...INITIAL_AUDIT] as AuditEntry[],
  }),

  actions: {
    log(action: string, entity: string, detail: string, user: string = CURRENT_USER) {
      this.entries.unshift({ id: uid('a'), action, entity, detail, user, ts: nowStamp() })
    },
  },
})
