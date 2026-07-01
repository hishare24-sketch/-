import { describe, it, expect } from 'vitest'
import { computeBalance, recvPaid, recvRemaining, assetMaintCost, commitmentDone } from './calc'
import type { Asset, Commitment, Project, Receivable, Transaction } from '@/interfaces/models'

// ── مصانع تركيبات مختصرة للاختبار ──
const project = (over: Partial<Project> = {}): Project => ({
  id: 'p1',
  name: 'مشروع',
  icon: '📦',
  balance: 1000,
  color: '#2563eb',
  ...over,
})

const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't' + Math.random(),
  projectId: 'p1',
  type: 'expense',
  description: '',
  amount: 100,
  category: 'عام',
  date: '2026-01-01',
  hasDoc: false,
  ...over,
})

describe('computeBalance', () => {
  it('يُرجع الرصيد الافتتاحي بلا عمليات', () => {
    expect(computeBalance(project({ balance: 500 }), [])).toBe(500)
  })

  it('يضيف الإيرادات ويطرح المصروفات', () => {
    const txns = [
      tx({ type: 'income', amount: 300 }),
      tx({ type: 'expense', amount: 200 }),
    ]
    expect(computeBalance(project({ balance: 1000 }), txns)).toBe(1100)
  })

  it('يتعامل مع التحويلات حسب الاتجاه', () => {
    const txns = [
      tx({ type: 'transfer', amount: 150, transferDir: 'in' }),
      tx({ type: 'transfer', amount: 50, transferDir: 'out' }),
    ]
    expect(computeBalance(project({ balance: 0 }), txns)).toBe(100)
  })

  it('يتجاهل عمليات مشروع آخر', () => {
    const txns = [tx({ projectId: 'p2', type: 'income', amount: 999 })]
    expect(computeBalance(project({ id: 'p1', balance: 100 }), txns)).toBe(100)
  })

  it('قد يصبح الرصيد سالباً عند تجاوز المصروف', () => {
    const txns = [tx({ type: 'expense', amount: 500 })]
    expect(computeBalance(project({ balance: 100 }), txns)).toBe(-400)
  })
})

describe('receivable helpers', () => {
  const recv = (payments: { amount: number }[], amount = 1000): Receivable =>
    ({
      id: 'r1',
      projectId: 'p1',
      kind: 'receivable',
      party: 'جهة',
      amount,
      payments: payments.map((p, i) => ({ id: 'pay' + i, amount: p.amount, date: '2026-01-01' })),
    }) as Receivable

  it('recvPaid يجمع الدفعات', () => {
    expect(recvPaid(recv([{ amount: 200 }, { amount: 300 }]))).toBe(500)
    expect(recvPaid(recv([]))).toBe(0)
  })

  it('recvRemaining يطرح المدفوع من الأصل', () => {
    expect(recvRemaining(recv([{ amount: 400 }], 1000))).toBe(600)
  })

  it('recvRemaining لا ينزل عن الصفر عند السداد الزائد', () => {
    expect(recvRemaining(recv([{ amount: 1500 }], 1000))).toBe(0)
  })
})

describe('assetMaintCost', () => {
  it('يجمع تكاليف الصيانة', () => {
    const asset = {
      maintenance: [
        { cost: 100 },
        { cost: 250 },
      ],
    } as Asset
    expect(assetMaintCost(asset)).toBe(350)
  })

  it('يُرجع صفراً بلا صيانة', () => {
    expect(assetMaintCost({ maintenance: [] } as unknown as Asset)).toBe(0)
  })
})

describe('commitmentDone', () => {
  const commit = (paidCount: number, totalCount?: number): Commitment =>
    ({ paidCount, totalCount }) as Commitment

  it('مكتمل عند بلوغ العدد الكلي', () => {
    expect(commitmentDone(commit(12, 12))).toBe(true)
    expect(commitmentDone(commit(13, 12))).toBe(true)
  })

  it('غير مكتمل قبل بلوغ العدد', () => {
    expect(commitmentDone(commit(5, 12))).toBe(false)
  })

  it('غير مكتمل عند غياب العدد الكلي (التزام مفتوح)', () => {
    expect(commitmentDone(commit(99, undefined))).toBe(false)
  })
})
