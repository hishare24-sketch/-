import { defineStore } from 'pinia'
import type { DocItem } from '@/interfaces/models'
import { INITIAL_DOCUMENTS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { CURRENT_USER } from '@/constants'

export type DocPayload = Omit<DocItem, 'id'> & { id?: string }

// متجر المستندات
export const useDocumentsStore = defineStore('documents', {
  state: () => ({
    documents: [...INITIAL_DOCUMENTS] as DocItem[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.documents.filter((d) => d.projectId === projectId),
  },

  actions: {
    saveDoc(payload: DocPayload) {
      const existing = payload.id ? this.documents.findIndex((d) => d.id === payload.id) : -1
      if (existing !== -1) {
        this.documents[existing] = { ...this.documents[existing], ...payload, id: payload.id! }
      } else {
        this.documents.unshift({ ...payload, id: payload.id ?? uid('d'), createdBy: CURRENT_USER })
      }
    },
    deleteDoc(id: string) {
      this.documents = this.documents.filter((d) => d.id !== id)
    },
    // محاكاة معالجة المستند بالذكاء الاصطناعي
    markProcessed(id: string) {
      const d = this.documents.find((x) => x.id === id)
      if (d) {
        d.aiRead = true
        d.status = 'processed'
      }
    },
    // تسجيل تنفيذ إجراء من المستند (يمنع تكراره)
    markActionDone(id: string, kind: string) {
      const d = this.documents.find((x) => x.id === id)
      if (!d) return
      if (!d.performedActions) d.performedActions = []
      if (!d.performedActions.includes(kind)) d.performedActions.push(kind)
    },
  },
})
