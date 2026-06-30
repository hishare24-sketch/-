import { defineStore } from 'pinia'
import type { Tracking } from '@/interfaces/models'
import { INITIAL_TRACKINGS } from '@/data/seed'

// متجر المتابعات والضمانات (يُثرى بالـ CRUD في المرحلة 6)
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
})
