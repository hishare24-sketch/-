import { defineStore } from 'pinia'
import type { Notif } from '@/interfaces/models'
import { INITIAL_NOTIFS } from '@/data/seed'

// متجر الإشعارات (الجرس في الشريط العلوي + صفحة الإشعارات)
export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifs: [...INITIAL_NOTIFS] as Notif[],
  }),

  getters: {
    unreadCount: (s) => s.notifs.filter((n) => !n.read).length,
  },

  actions: {
    markRead(id: string) {
      const n = this.notifs.find((x) => x.id === id)
      if (n) n.read = true
    },
    markAllRead() {
      this.notifs.forEach((n) => (n.read = true))
    },
  },
})
