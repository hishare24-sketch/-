import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useDashboard } from './useDashboard'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import type { Asset, Commitment, Project, Receivable, Transaction } from '@/interfaces/models'

// useDashboard يستخدم NOW ثابتاً = 2025-06-26 → التواريخ أدناه مبنية عليه
const tx = (over: Partial<Transaction>): Transaction => ({
  id: 't' + Math.random(),
  projectId: 'p1',
  type: 'income',
  description: '',
  amount: 0,
  category: 'عام',
  date: '2025-06-20',
  hasDoc: false,
  ...over,
})

function seed() {
  useProjectsStore().projects = [{ id: 'p1', name: 'م', icon: '📦', balance: 1000, color: '#000' } as Project]
  useFinanceStore().transactions = [
    tx({ type: 'income', amount: 1000, date: '2025-06-20' }), // ضمن الشهر
    tx({ type: 'expense', amount: 400, date: '2025-06-10', category: 'رواتب' }), // ضمن الشهر
    tx({ type: 'expense', amount: 100, date: '2025-06-15', category: 'رواتب' }), // ضمن الشهر
    tx({ type: 'expense', amount: 50, date: '2025-06-18', category: 'قرطاسية' }), // ضمن الشهر
    tx({ type: 'income', amount: 500, date: '2025-05-01' }), // الفترة السابقة
    tx({ type: 'income', amount: 9999, date: '2024-01-01' }), // خارج النطاق تماماً
  ]
}

describe('useDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    seed()
  })

  it('يجمع الإيرادات/المصروفات/الصافي ضمن الفترة فقط', () => {
    const d = useDashboard(ref('p1'), '1m')
    expect(d.income.value).toBe(1000)
    expect(d.expense.value).toBe(550) // 400+100+50
    expect(d.net.value).toBe(450)
  })

  it('يحسب نسبة التغيّر مقابل الفترة السابقة', () => {
    const d = useDashboard(ref('p1'), '1m')
    const incomeStat = d.stats.value.find((s) => s.key === 'income')!
    // الحالي 1000 مقابل السابق 500 → +100٪
    expect(incomeStat.delta).toBe(100)
  })

  it('يجمّع المصروفات حسب التصنيف مرتّبةً تنازليّاً', () => {
    const d = useDashboard(ref('p1'), '1m')
    const segs = d.expenseByCategory.value
    expect(segs.length).toBe(2)
    expect(segs[0].label).toBe('رواتب') // الأكبر (500)
    expect(segs[0].value).toBe(500)
    expect(segs[1].label).toBe('قرطاسية')
  })

  it('يعزل بيانات مشروع آخر', () => {
    useFinanceStore().transactions.push(tx({ projectId: 'p2', type: 'income', amount: 7777, date: '2025-06-20' }))
    const d = useDashboard(ref('p1'), '1m')
    expect(d.income.value).toBe(1000) // لم تتأثّر بـ p2
  })

  it('portfolio يلخّص الذمم والالتزامات والأصول', () => {
    useReceivablesStore().receivables = [
      { id: 'r1', projectId: 'p1', kind: 'receivable', party: 'ج', amount: 1000, status: 'open', date: '2025-06-01', payments: [] } as Receivable,
      { id: 'r2', projectId: 'p1', kind: 'payable', party: 'ج', amount: 500, status: 'partial', date: '2025-06-01', payments: [{ id: 'x', amount: 200, date: '2025-06-01' }] } as Receivable,
    ]
    useCommitmentsStore().commitments = [
      { id: 'c1', projectId: 'p1', kind: 'installment', direction: 'out', name: 'ق', amount: 300, freq: 'monthly', startDate: '2025-01-01', paidCount: 0, nextDue: '2025-07-10', active: true, payments: [] } as Commitment,
    ]
    useAssetsStore().assets = [
      { id: 'a1', projectId: 'p1', name: 'أ', category: 'device', purchaseDate: '2025-01-01', purchaseValue: 100, status: 'active', maintenance: [] } as Asset,
    ]

    const d = useDashboard(ref('p1'), '1m')
    const p = d.portfolio.value
    expect(p.dueToUs).toBe(1000)
    expect(p.dueToUsCount).toBe(1)
    expect(p.weOwe).toBe(300) // 500 - 200
    expect(p.weOweCount).toBe(1)
    expect(p.commitCount).toBe(1)
    expect(p.commitDueSoon).toBe(1)
    expect(p.commitMonthly).toBe(300)
    expect(p.assetCount).toBe(1)
    expect(p.assetActive).toBe(1)
  })
})
