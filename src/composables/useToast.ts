import { useToastStore } from '@/stores/ToastStore'

// وصول مريح لنظام التنبيهات: const toast = useToast(); toast.success('تم الحفظ')
export function useToast() {
  return useToastStore()
}
