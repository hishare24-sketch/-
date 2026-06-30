import { defineStore } from 'pinia'
import type { RequestItem, RequestStatus } from '@/interfaces/models'
import { INITIAL_REQUESTS } from '@/data/seed'

// متجر الطلبات والموافقات (يُثرى بالـ CRUD في المرحلة 7)
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
    decide(id: string, status: RequestStatus) {
      const r = this.requests.find((x) => x.id === id)
      if (r) r.status = status
    },
  },
})
