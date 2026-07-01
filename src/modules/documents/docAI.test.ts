import { describe, it, expect } from 'vitest'
import { aiExtract, suggestedActions, recommendedKinds, ALL_DOC_ACTIONS } from './docAI'
import type { DocItem } from '@/interfaces/models'

const doc = (over: Partial<DocItem> = {}): DocItem => ({
  id: 'd1',
  name: 'مستند',
  type: 'فاتورة',
  date: '2026-01-01',
  size: '1MB',
  status: 'new',
  projectId: 'p1',
  aiRead: false,
  ...over,
})

describe('aiExtract', () => {
  it('الفاتورة: ثقة عالية + مبلغ + ضمان بعد سنة', () => {
    const r = aiExtract(doc({ type: 'فاتورة', date: '2026-01-01' }))
    expect(r.confidence).toBe(96)
    expect(typeof r.data.amount).toBe('number')
    expect(r.data.warrantyEnd).toBe('2027-01-01')
  })

  it('العقد: ثقة + تاريخ انتهاء بعد سنة', () => {
    const r = aiExtract(doc({ type: 'عقد', date: '2026-03-10' }))
    expect(r.confidence).toBe(92)
    expect(r.data.expiryDate).toBe('2027-03-10')
  })

  it('الوثيقة الرسمية: تاريخ انتهاء', () => {
    const r = aiExtract(doc({ type: 'وثيقة رسمية', date: '2026-05-01' }))
    expect(r.data.expiryDate).toBe('2027-05-01')
  })

  it('نوع غير معروف: ثقة أدنى (80)', () => {
    const r = aiExtract(doc({ type: 'شيء آخر' }))
    expect(r.confidence).toBe(80)
  })

  it('القيم مستقرّة لنفس المعرّف (شبه-عشوائية ثابتة)', () => {
    const a = aiExtract(doc({ id: 'same', type: 'فاتورة' }))
    const b = aiExtract(doc({ id: 'same', type: 'فاتورة' }))
    expect(a.data.amount).toBe(b.data.amount)
  })

  it('معرّفات مختلفة تُنتج مبالغ (غالباً) مختلفة', () => {
    const a = aiExtract(doc({ id: 'aaa', type: 'فاتورة' }))
    const b = aiExtract(doc({ id: 'zzz', type: 'فاتورة' }))
    expect(a.data.amount).not.toBe(b.data.amount)
  })
})

describe('suggestedActions', () => {
  it('الفاتورة تقترح tx/tracking/asset', () => {
    const kinds = suggestedActions('فاتورة').map((a) => a.kind)
    expect(kinds).toEqual(expect.arrayContaining(['tx', 'tracking', 'asset']))
  })

  it('العقد يقترح tracking/commitment/receivable', () => {
    const kinds = suggestedActions('عقد').map((a) => a.kind)
    expect(kinds).toEqual(expect.arrayContaining(['tracking', 'commitment', 'receivable']))
  })

  it('النوع العام يقترح tx و tracking', () => {
    const kinds = suggestedActions('غير معروف').map((a) => a.kind)
    expect(kinds).toEqual(expect.arrayContaining(['tx', 'tracking']))
  })
})

describe('recommendedKinds', () => {
  it('مجموعة فرعية من كل الإجراءات المتاحة', () => {
    const all = new Set(ALL_DOC_ACTIONS.map((a) => a.kind))
    for (const k of recommendedKinds('فاتورة')) {
      expect(all.has(k)).toBe(true)
    }
  })
})
