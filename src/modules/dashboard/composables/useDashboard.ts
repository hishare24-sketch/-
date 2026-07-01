import { computed, ref, type Ref } from 'vue'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { fmt } from '@/helpers/format'

export interface PeriodOption {
  v: string
  l: string
  days: number
}

export const PERIODS: PeriodOption[] = [
  { v: '1d', l: 'آخر يوم', days: 1 },
  { v: '1w', l: 'آخر أسبوع', days: 7 },
  { v: '1m', l: 'آخر شهر', days: 31 },
  { v: '6m', l: 'آخر 6 أشهر', days: 183 },
  { v: '9m', l: 'آخر 9 أشهر', days: 274 },
  { v: '12m', l: 'آخر 12 شهر', days: 366 },
  { v: '18m', l: 'آخر 18 شهر', days: 548 },
  { v: '24m', l: 'آخر 24 شهر', days: 731 },
]

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

// منطق لوحة التحكم: الإحصائيات والسلسلة الشهرية لمشروع وفترة (منقول من legacy/App.tsx)
export function useDashboard(projectId: Ref<string>, defaultPeriod = '1m') {
  const financeStore = useFinanceStore()
  const trackingsStore = useTrackingsStore()
  const requestsStore = useRequestsStore()

  const period = ref(defaultPeriod)

  const NOW = new Date('2025-06-26T23:59')
  const periodDays = computed(() => PERIODS.find((p) => p.v === period.value)?.days ?? 31)
  const periodLabel = computed(() => PERIODS.find((p) => p.v === period.value)?.l ?? '')

  const inPeriod = (date: string) => {
    const diff = (NOW.getTime() - new Date(date).getTime()) / 86400000
    return diff >= 0 && diff <= periodDays.value
  }

  const allTxns = computed(() => financeStore.byProject(projectId.value))
  const txns = computed(() => allTxns.value.filter((t) => inPeriod(t.date)))
  const income = computed(() =>
    txns.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
  )
  const expense = computed(() =>
    txns.value.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  )
  const urgentTrackings = computed(() => trackingsStore.urgentByProject(projectId.value))
  const pendingReqs = computed(() => requestsStore.pendingByProject(projectId.value))

  const stats = computed(() => [
    { label: 'الرصيد الكلي', value: fmt(financeStore.balanceOf(projectId.value)), icon: '💰', color: 'var(--info-text)', bg: 'var(--info-bg)' },
    { label: `إيرادات ${periodLabel.value}`, value: fmt(income.value), icon: '📈', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
    { label: `مصروفات ${periodLabel.value}`, value: fmt(expense.value), icon: '📉', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
    { label: `صافي ${periodLabel.value}`, value: fmt(income.value - expense.value), icon: '📊', color: 'var(--purple-text)', bg: 'var(--purple-bg)' },
    { label: 'طلبات معلقة', value: String(pendingReqs.value.length), icon: '⏳', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
    { label: 'تنبيهات متابعات', value: String(urgentTrackings.value.length), icon: '⚠️', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
  ])

  const monthlyData = computed(() => {
    const monthCount = Math.max(1, Math.min(12, Math.round(periodDays.value / 30)))
    const arr: { month: string; income: number; expense: number }[] = []
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1)
      const key = d.toISOString().slice(0, 7)
      const mt = allTxns.value.filter((t) => t.date.slice(0, 7) === key)
      arr.push({
        month: MONTH_NAMES[d.getMonth()],
        income: mt.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mt.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return arr
  })

  return {
    period,
    periodLabel,
    stats,
    txns,
    urgentTrackings,
    pendingReqs,
    monthlyData,
  }
}
