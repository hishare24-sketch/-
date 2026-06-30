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
      if (payload.id) {
        const i = this.documents.findIndex((d) => d.id === payload.id)
        if (i !== -1) this.documents[i] = { ...this.documents[i], ...payload, id: payload.id }
      } else {
        this.documents.unshift({ ...payload, id: uid('d'), createdBy: CURRENT_USER })
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
  },
})
