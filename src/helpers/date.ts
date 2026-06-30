import type { CommitmentFreq, TrackingStatus } from '@/interfaces/models'

// مساعدات التاريخ
export const today = () => new Date().toISOString().slice(0, 10)
export const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
export const daysBetween = (iso: string) =>
  Math.round((new Date(iso).getTime() - Date.now()) / 86400000)
export const statusFromDays = (d: number): TrackingStatus =>
  d < 0 ? 'expired' : d <= 30 ? 'expiring' : 'active'

// تقديم تاريخ الاستحقاق حسب التكرار
export const advanceDate = (iso: string, freq: CommitmentFreq): string => {
  const d = new Date(iso)
  if (freq === 'weekly') d.setDate(d.getDate() + 7)
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}
