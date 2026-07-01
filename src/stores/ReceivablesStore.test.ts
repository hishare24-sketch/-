import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReceivablesStore, type ReceivablePayload } from './ReceivablesStore'
import { useFinanceStore } from './FinanceStore'
import type { Attachment } from '@/interfaces/models'

const recv = (over: Partial<ReceivablePayload> = {}): ReceivablePayload => ({
  projectId: 'p1',
  kind: 'receivable',
  party: 'شركة النور',
  amount: 1000,
  status: 'open',
  date: '2026-01-01',
  payments: [],
  ...over,
})

const att: Attachment = { id: 'a1', name: 'إيصال.pdf', kind: 'file', size: '20KB' }

// آخر عملية ذمم أُنشئت (unshift → [0])
const lastRecvTx = () => useFinanceStore().transactions.find((t) => t.category === 'ذمم')!

describe('ReceivablesStore.payReceivable', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('تسجيل دفعة يخزّن المصدر والمرفق على الدفعة', () => {
    const rs = useReceivablesStore()
    rs.addReceivable(recv({ amount: 1000 }))
    const r = rs.receivables[0]
    rs.payReceivable(r.id, 400, { note: 'دفعة أولى', source: 'تحويل بنكي', attachments: [att] })

    const pay = r.payments[0]
    expect(pay.amount).toBe(400)
    expect(pay.source).toBe('تحويل بنكي')
    expect(pay.note).toBe('دفعة أولى')
    expect(pay.attachments).toHaveLength(1)
  })

  it('المصدر والمرفق ينعكسان على العملية المالية المُنشأة', () => {
    const rs = useReceivablesStore()
    rs.addReceivable(recv())
    rs.payReceivable(rs.receivables[0].id, 500, { source: 'شيك', attachments: [att] })

    const tx = lastRecvTx()
    expect(tx.type).toBe('income') // receivable → إيراد
    expect(tx.source).toBe('شيك')
    expect(tx.hasDoc).toBe(true)
    expect(tx.attachments).toHaveLength(1)
  })

  it('بلا مرفق: hasDoc=false والمصدر يعود لاسم الطرف', () => {
    const rs = useReceivablesStore()
    rs.addReceivable(recv({ party: 'مؤسسة س' }))
    rs.payReceivable(rs.receivables[0].id, 100)
    const tx = lastRecvTx()
    expect(tx.hasDoc).toBe(false)
    expect(tx.source).toBe('مؤسسة س')
  })

  it('الدفعة تحدّث الحالة (جزئي ثم مسدّد)', () => {
    const rs = useReceivablesStore()
    rs.addReceivable(recv({ amount: 1000 }))
    const r = rs.receivables[0]
    rs.payReceivable(r.id, 400, { source: 'نقدي' })
    expect(r.status).toBe('partial')
    rs.payReceivable(r.id, 600, { source: 'نقدي' })
    expect(r.status).toBe('settled')
  })

  it('سداد (payable) يُنشئ مصروفاً', () => {
    const rs = useReceivablesStore()
    rs.addReceivable(recv({ kind: 'payable', amount: 300 }))
    rs.payReceivable(rs.receivables[0].id, 300, { source: 'صندوق' })
    expect(lastRecvTx().type).toBe('expense')
  })
})
