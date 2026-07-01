import { describe, it, expect } from 'vitest'
import { analyzeTx, txErrors } from './txAnalysis'
import type { Project, Transaction } from '@/interfaces/models'
import { today } from './date'

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
  type: 'income',
  description: 'وصف كافٍ',
  amount: 100,
  category: 'عام',
  date: '2026-01-01',
  hasDoc: false,
  ...over,
})

// مدخل التحليل (شكل TxInput الداخلي)
const input = (over: Record<string, unknown> = {}) => ({
  type: 'income' as const,
  amount: 100,
  projectId: 'p1',
  date: '2026-01-01',
  description: 'وصف كافٍ',
  ...over,
})

const has = (arr: { title: string }[], title: string) => arr.some((w) => w.title === title)

describe('analyzeTx', () => {
  it('لا تحذيرات لعملية سليمة', () => {
    const out = analyzeTx(input(), { project: project(), transactions: [] })
    expect(out).toEqual([])
  })

  it('يرصد المبلغ السالب كخطأ', () => {
    const out = analyzeTx(input({ amount: -50 }), { project: project(), transactions: [] })
    const w = out.find((x) => x.title === 'مبلغ سالب')
    expect(w?.level).toBe('error')
  })

  it('يرصد المبلغ الصفري كتحذير', () => {
    const out = analyzeTx(input({ amount: 0 }), { project: project(), transactions: [] })
    expect(has(out, 'مبلغ صفري')).toBe(true)
  })

  it('يرصد التحويل لنفس المشروع كخطأ', () => {
    const out = analyzeTx(
      input({ type: 'transfer', toProject: 'p1' }),
      { project: project(), transactions: [] },
    )
    const w = out.find((x) => x.title === 'تحويل لنفس المشروع')
    expect(w?.level).toBe('error')
  })

  it('يرصد المصروف المتجاوز للرصيد', () => {
    const out = analyzeTx(
      input({ type: 'expense', amount: 5000 }),
      { project: project({ balance: 1000 }), transactions: [] },
    )
    expect(has(out, 'المصروف يتجاوز الرصيد')).toBe(true)
  })

  it('لا يحذّر عندما يكون المصروف ضمن الرصيد', () => {
    const out = analyzeTx(
      input({ type: 'expense', amount: 500 }),
      { project: project({ balance: 1000 }), transactions: [] },
    )
    expect(has(out, 'المصروف يتجاوز الرصيد')).toBe(false)
  })

  it('يرصد التاريخ المستقبلي كمعلومة', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    const out = analyzeTx(input({ date: future }), { project: project(), transactions: [] })
    const w = out.find((x) => x.title === 'تاريخ مستقبلي')
    expect(w?.level).toBe('info')
  })

  it('لا يحذّر من تاريخ اليوم', () => {
    const out = analyzeTx(input({ date: today() }), { project: project(), transactions: [] })
    expect(has(out, 'تاريخ مستقبلي')).toBe(false)
  })

  it('يرصد المبلغ غير المعتاد (> 5× المتوسط)', () => {
    const prev = [
      tx({ type: 'expense', amount: 100 }),
      tx({ type: 'expense', amount: 100 }),
      tx({ type: 'expense', amount: 100 }),
    ]
    const out = analyzeTx(
      input({ type: 'expense', amount: 2000 }),
      { project: project({ balance: 100000 }), transactions: prev },
    )
    expect(has(out, 'مبلغ غير معتاد')).toBe(true)
  })

  it('يرصد الوصف القصير', () => {
    const out = analyzeTx(input({ description: 'اب' }), { project: project(), transactions: [] })
    expect(has(out, 'وصف قصير')).toBe(true)
  })
})

describe('txErrors', () => {
  it('يُبقي الأخطاء الحاجبة فقط (+تجاوز الرصيد)', () => {
    const bad = tx({ type: 'expense', amount: 5000, description: 'وصف كافٍ' })
    const errs = txErrors(bad, { project: project({ balance: 100 }), transactions: [] })
    expect(errs.every((e) => e.level === 'error' || e.title === 'المصروف يتجاوز الرصيد')).toBe(true)
    expect(has(errs, 'المصروف يتجاوز الرصيد')).toBe(true)
  })

  it('يستبعد التحذيرات غير الحاجبة (كالتاريخ المستقبلي)', () => {
    const future = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
    const good = tx({ type: 'income', amount: 100, date: future })
    const errs = txErrors(good, { project: project(), transactions: [] })
    expect(has(errs, 'تاريخ مستقبلي')).toBe(false)
  })
})
