import { defineStore } from 'pinia'
import type { Tracking } from '@/interfaces/models'
import { INITIAL_TRACKINGS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { useAuditStore } from '@/stores/AuditStore'

export type TrackingPayload = Omit<Tracking, 'id'> & { id?: string }

// متجر المتابعات والضمانات
export const useTrackingsStore = defineStore('trackings', {
  state: () => ({
    trackings: [...INITIAL_TRACKINGS] as Tracking[],
  }),

  getters: {
    byProject: (s) => (projectId: string) =>
      s.trackings.filter((t) => t.projectId === projectId),
    urgentByProject: (s) => (projectId: string) =>
      s.trackings.filter(
        (t) => t.projectId === projectId && (t.status === 'expiring' || t.status === 'expired'),
      ),
  },

  actions: {
    saveTracking(payload: TrackingPayload) {
      if (payload.id) {
        const i = this.trackings.findIndex((t) => t.id === payload.id)
        if (i !== -1) this.trackings[i] = { ...this.trackings[i], ...payload, id: payload.id }
      } else {
        this.trackings.unshift({ ...payload, id: uid('tr') })
        useAuditStore().log('إنشاء', 'متابعة', payload.name)
      }
    },
    deleteTracking(id: string) {
      this.trackings = this.trackings.filter((t) => t.id !== id)
    },
  },
})
