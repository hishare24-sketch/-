import { defineStore } from 'pinia'
import { uid } from '@/helpers/id'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export interface Toast {
  id: string
  type: ToastType
  message: string
  timeout: number
}

// متجر التنبيهات المنبثقة (Toasts) — بديل حديث لـ alert()
export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as Toast[],
  }),

  actions: {
    push(message: string, type: ToastType = 'info', timeout = 3500) {
      const id = uid('t')
      this.toasts.push({ id, type, message, timeout })
      if (timeout > 0) setTimeout(() => this.dismiss(id), timeout)
      return id
    },
    dismiss(id: string) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    success(message: string, timeout?: number) {
      return this.push(message, 'success', timeout)
    },
    error(message: string, timeout?: number) {
      return this.push(message, 'error', timeout ?? 5000)
    },
    info(message: string, timeout?: number) {
      return this.push(message, 'info', timeout)
    },
    warning(message: string, timeout?: number) {
      return this.push(message, 'warning', timeout)
    },
  },
})
