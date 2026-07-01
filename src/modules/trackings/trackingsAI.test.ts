import { describe, it, expect } from 'vitest'
import { analyzeTracking } from './trackingsAI'
import type { Tracking } from '@/interfaces/models'

const tracking = (over: Partial<Tracking> = {}): Tracking => ({
  id: 'tr1',
  name: 'رخصة',
  type: 'ترخيص',
  icon: '📄',
  status: 'active',
  daysLeft: 100,
  expiryDate: '2026-01-01',
  projectId: 'p1',
  ...over,
})

describe('analyzeTracking', () => {
  it('يصنّف الخطر عالياً للمنتهي', () => {
    const r = analyzeTracking(tracking({ status: 'expired', daysLeft: -10 }))
    expect(r.risk).toBe('high')
    expect(r.headline).toContain('⚠️')
  })

  it('يصنّف الخطر متوسطاً للموشك على الانتهاء', () => {
    expect(analyzeTracking(tracking({ status: 'expiring', daysLeft: 10 })).risk).toBe('medium')
  })

  it('يصنّف الخطر منخفضاً للساري', () => {
    expect(analyzeTracking(tracking({ status: 'active', daysLeft: 100 })).risk).toBe('low')
  })

  it('يحسب تاريخ تجديد مقترح من تاريخ الانتهاء للساري (+دورة النوع)', () => {
    // ترخيص = 12 شهراً من تاريخ الانتهاء
    const r = analyzeTracking(tracking({ type: 'ترخيص', status: 'active', daysLeft: 100, expiryDate: '2026-01-01' }))
    expect(r.suggestedRenewalDate).toBe('2027-01-01')
  })

  it('يقترح دائماً إجراءي «تجديد» و«ربط بمستند»', () => {
    const kinds = analyzeTracking(tracking()).suggestedActions.map((a) => a.kind)
    expect(kinds).toContain('renew')
    expect(kinds).toContain('link')
  })

  it('يقترح تسجيل الرسوم كمصروف عند وجود تكلفة', () => {
    const kinds = analyzeTracking(tracking({ cost: 500 })).suggestedActions.map((a) => a.kind)
    expect(kinds).toContain('expense')
  })

  it('لا يقترح مصروفاً بلا تكلفة', () => {
    const kinds = analyzeTracking(tracking({ cost: 0 })).suggestedActions.map((a) => a.kind)
    expect(kinds).not.toContain('expense')
  })

  it('يقترح التحويل لالتزام دوري للأنواع المتكرّرة ذات التكلفة', () => {
    const kinds = analyzeTracking(tracking({ type: 'اشتراك', cost: 99 })).suggestedActions.map((a) => a.kind)
    expect(kinds).toContain('commitment')
  })

  it('لا يقترح التزاماً دوريّاً لنوع غير متكرّر (ترخيص)', () => {
    const kinds = analyzeTracking(tracking({ type: 'ترخيص', cost: 99 })).suggestedActions.map((a) => a.kind)
    expect(kinds).not.toContain('commitment')
  })

  it('ينبّه لغياب المرفقات', () => {
    const r = analyzeTracking(tracking({ attachments: [] }))
    expect(r.points.some((p) => p.includes('مرفقات'))).toBe(true)
  })
})
