import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFinanceStore } from './FinanceStore'
import type { TxPayload } from './FinanceStore'

const base: TxPayload = {
  projectId: 'p1',
  type: 'expense',
  description: 'اختبار',
  amount: 100,
  category: 'عام',
  date: '2026-01-01',
  hasDoc: false,
}

describe('FinanceStore.saveTransaction', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('إنشاء عملية بسيطة يضيف قيداً واحداً بمعرّف جديد', () => {
    const s = useFinanceStore()
    const before = s.transactions.length
    s.saveTransaction({ ...base, type: 'income', amount: 500 })
    expect(s.transactions.length).toBe(before + 1)
    expect(s.transactions[0].id).toBeTruthy()
    expect(s.transactions[0].amount).toBe(500)
  })

  it('التحويل بين مشروعين يُنشئ قيدين مرتبطين (صادر + وارد)', () => {
    const s = useFinanceStore()
    const before = s.transactions.length
    s.saveTransaction({ ...base, type: 'transfer', projectId: 'p1', toProject: 'p2', amount: 300 })
    expect(s.transactions.length).toBe(before + 2)

    const out = s.transactions.find((t) => t.transferDir === 'out')!
    const inc = s.transactions.find((t) => t.transferDir === 'in')!
    expect(out.projectId).toBe('p1')
    expect(inc.projectId).toBe('p2')
    // نفس رابط التحويل يجمع الطرفين
    expect(out.linkId).toBeTruthy()
    expect(out.linkId).toBe(inc.linkId)
  })

  it('التعديل (بمعرّف موجود) يحدّث القيد دون إضافة جديد', () => {
    const s = useFinanceStore()
    s.saveTransaction({ ...base, amount: 100 })
    const id = s.transactions[0].id
    const count = s.transactions.length
    s.saveTransaction({ ...base, id, amount: 999, description: 'محدّث' })
    expect(s.transactions.length).toBe(count)
    const t = s.transactions.find((x) => x.id === id)!
    expect(t.amount).toBe(999)
    expect(t.description).toBe('محدّث')
  })

  it('حذف طرف من تحويل يحذف الطرف المرتبط أيضاً', () => {
    const s = useFinanceStore()
    const before = s.transactions.length
    s.saveTransaction({ ...base, type: 'transfer', projectId: 'p1', toProject: 'p2', amount: 300 })
    const out = s.transactions.find((t) => t.transferDir === 'out')!
    s.deleteTransaction(out.id)
    expect(s.transactions.length).toBe(before)
    expect(s.transactions.some((t) => t.linkId === out.linkId)).toBe(false)
  })

  it('fixAmount يجعل المبلغ السالب موجباً', () => {
    const s = useFinanceStore()
    s.saveTransaction({ ...base, amount: -250 })
    const id = s.transactions[0].id
    s.fixAmount(id)
    expect(s.transactions.find((t) => t.id === id)!.amount).toBe(250)
  })
})
