import { defineStore } from 'pinia'

// مؤشّر التحميل العام
export const useSharedStore = defineStore('shared', {
  state: () => ({
    isLoading: false,
  }),
  actions: {
    startLoading() {
      this.isLoading = true
    },
    stopLoading() {
      this.isLoading = false
    },
  },
})
