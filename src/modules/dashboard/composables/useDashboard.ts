import { computed, ref, type Ref } from 'vue'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import { recvRemaining } from '@/helpers/calc'
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

// لوحة ألوان تحليل التصنيفات (دائرة المصروفات)
const CAT_COLORS = ['#3b82f6', '#f87171', '#fbbf24', '#a78bfa', '#34d399', '#f472b6', '#94a3b8']

export interface StatCard {
  key: string
  label: string
  value: string
  icon: string
  color: string
  bg: string
  route?: string
  /** نسبة التغيّر عن الفترة السابقة (٪) — null لبطاقات بلا مقارنة */
  delta?: number | null
  /** هل الارتفاع إيجابي لهذه البطاقة؟ (يحدّد لون شارة التغيّر) */
  goodWhenUp?: boolean
}

// منطق لوحة التحكم: الإحصائيات والسلسلة الشهرية والنظرة الشاملة لمشروع وفترة
export function useDashboard(projectId: Ref<string>, defaultPeriod = '1m') {
  const financeStore = useFinanceStore()
  const trackingsStore = useTrackingsStore()
  const requestsStore = useRequestsStore()
  const receivablesStore = useReceivablesStore()
  const commitmentsStore = useCommitmentsStore()
  const assetsStore = useAssetsStore()

  const period = ref(defaultPeriod)

  const NOW = new Date('2025-06-26T23:59')
  const periodDays = computed(() => PERIODS.find((p) => p.v === period.value)?.days ?? 31)
  const periodLabel = computed(() => PERIODS.find((p) => p.v === period.value)?.l ?? '')

  const daysAgo = (date: string) => (NOW.getTime() - new Date(date).getTime()) / 86400000
  const inPeriod = (date: string) => {
    const diff = daysAgo(date)
    return diff >= 0 && diff <= periodDays.value
  }
  // الفترة السابقة المكافئة (للمقارنة)
  const inPrevPeriod = (date: string) => {
    const diff = daysAgo(date)
    return diff > periodDays.value && diff <= periodDays.value * 2
  }

  const allTxns = computed(() => financeStore.byProject(projectId.value))
  const txns = computed(() => allTxns.value.filter((t) => inPeriod(t.date)))
  const prevTxns = computed(() => allTxns.value.filter((t) => inPrevPeriod(t.date)))

  const sumBy = (list: typeof allTxns.value, type: string) =>
    list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0)

  const income = computed(() => sumBy(txns.value, 'income'))
  const expense = computed(() => sumBy(txns.value, 'expense'))
  const net = computed(() => income.value - expense.value)
  const balance = computed(() => financeStore.balanceOf(projectId.value))

  const prevIncome = computed(() => sumBy(prevTxns.value, 'income'))
  const prevExpense = computed(() => sumBy(prevTxns.value, 'expense'))
  const prevNet = computed(() => prevIncome.value - prevExpense.value)

  // نسبة التغيّر (٪) بين قيمتين — null إذا تعذّرت المقارنة، بحدّ أقصى ±999٪
  const pctDelta = (cur: number, prev: number): number | null => {
    if (!prev) return cur ? 100 : null
    const pct = Math.round(((cur - prev) / Math.abs(prev)) * 100)
    return Math.max(-999, Math.min(999, pct))
  }

  const urgentTrackings = computed(() => trackingsStore.urgentByProject(projectId.value))
  const pendingReqs = computed(() => requestsStore.pendingByProject(projectId.value))

  const stats = computed<StatCard[]>(() => [
    {
      key: 'balance', label: 'الرصيد الكلي', value: fmt(balance.value),
      icon: '💰', color: 'var(--info-text)', bg: 'var(--info-bg)', route: 'finance-page',
      delta: null,
    },
    {
      key: 'income', label: `إيرادات ${periodLabel.value}`, value: fmt(income.value),
      icon: '📈', color: 'var(--ok-text)', bg: 'var(--ok-bg)', route: 'finance-page',
      delta: pctDelta(income.value, prevIncome.value), goodWhenUp: true,
    },
    {
      key: 'expense', label: `مصروفات ${periodLabel.value}`, value: fmt(expense.value),
      icon: '📉', color: 'var(--danger-text)', bg: 'var(--danger-bg)', route: 'finance-page',
      delta: pctDelta(expense.value, prevExpense.value), goodWhenUp: false,
    },
    {
      key: 'net', label: `صافي ${periodLabel.value}`, value: fmt(net.value),
      icon: '📊', color: 'var(--purple-text)', bg: 'var(--purple-bg)', route: 'finance-page',
      delta: pctDelta(net.value, prevNet.value), goodWhenUp: true,
    },
    {
      key: 'requests', label: 'طلبات معلقة', value: String(pendingReqs.value.length),
      icon: '⏳', color: 'var(--warn-text)', bg: 'var(--warn-bg)', route: 'requests-page',
      delta: null,
    },
    {
      key: 'trackings', label: 'تنبيهات متابعات', value: String(urgentTrackings.value.length),
      icon: '⚠️', color: 'var(--warn-text)', bg: 'var(--warn-bg)', route: 'trackings-page',
      delta: null,
    },
  ])

  // السلسلة الشهرية للرسم البياني
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

  // تحليل المصروفات حسب التصنيف (لدائرة النِسَب) — أعلى 6 تصنيفات ثم «أخرى»
  const expenseByCategory = computed(() => {
    const map = new Map<string, number>()
    for (const t of txns.value) {
      if (t.type !== 'expense') continue
      const cat = t.category?.trim() || 'غير مصنّف'
      map.set(cat, (map.get(cat) ?? 0) + t.amount)
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 6)
    const rest = sorted.slice(6).reduce((s, [, v]) => s + v, 0)
    const segs = top.map(([label, value], i) => ({ label, value, color: CAT_COLORS[i] }))
    if (rest > 0) segs.push({ label: 'أخرى', value: rest, color: CAT_COLORS[6] })
    return segs
  })

  // النظرة الشاملة: الذمم والالتزامات والأصول للمشروع
  const portfolio = computed(() => {
    const recv = receivablesStore.byProject(projectId.value)
    const openRecv = recv.filter((r) => r.status === 'open' || r.status === 'partial')
    const dueToUs = openRecv
      .filter((r) => r.kind === 'receivable')
      .reduce((s, r) => s + recvRemaining(r), 0)
    const weOwe = openRecv
      .filter((r) => r.kind === 'payable')
      .reduce((s, r) => s + recvRemaining(r), 0)

    const commitments = commitmentsStore
      .byProject(projectId.value)
      .filter((c) => c.active && !c.cancelled)
    const dueSoon = commitments.filter((c) => {
      const d = daysAgo(c.nextDue)
      return d >= -30 && d <= 0 // مستحق خلال 30 يوماً قادمة
    })
    const commitMonthly = commitments.reduce((s, c) => s + c.amount, 0)

    const assets = assetsStore.byProject(projectId.value)
    const activeAssets = assets.filter((a) => a.status === 'active')

    return {
      dueToUs,
      dueToUsCount: openRecv.filter((r) => r.kind === 'receivable').length,
      weOwe,
      weOweCount: openRecv.filter((r) => r.kind === 'payable').length,
      commitCount: commitments.length,
      commitDueSoon: dueSoon.length,
      commitMonthly,
      assetCount: assets.length,
      assetActive: activeAssets.length,
    }
  })

  return {
    period,
    periodLabel,
    stats,
    txns,
    income,
    expense,
    net,
    balance,
    urgentTrackings,
    pendingReqs,
    monthlyData,
    expenseByCategory,
    portfolio,
  }
}
