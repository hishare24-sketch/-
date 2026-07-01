import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrackingsStore, type TrackingPayload } from './TrackingsStore'
import { useFinanceStore } from './FinanceStore'
import { statusFromDays, daysBetween } from '@/helpers/date'

const tracking = (over: Partial<TrackingPayload> = {}): TrackingPayload => ({
  name: 'رخصة اختبار',
  type: 'ترخيص',
  icon: '📄',
  status: 'expired',
  daysLeft: -5,
  expiryDate: '2025-01-01',
  projectId: 'p1',
  ...over,
})

const renewFees = () =>
  useFinanceStore().transactions.filter((t) => t.category === 'رسوم وتجديدات')

describe('TrackingsStore.renewTracking', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('التجديد يحدّث تاريخ الانتهاء ويعيد حساب الحالة وعدّاد التجديد', () => {
    const ts = useTrackingsStore()
    ts.saveTracking(tracking({ status: 'expired', daysLeft: -5 }))
    const t = ts.trackings[0]
    const future = new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10)

    ts.renewTracking(t.id, future)

    expect(t.expiryDate).toBe(future)
    expect(t.status).toBe(statusFromDays(daysBetween(future)))
    expect(t.status).toBe('active')
    expect(t.renewedCount).toBe(1)
    expect(t.cancelled).toBe(false)
    expect(renewFees().length).toBe(0) // بلا رسوم
  })

  it('التجديد مع feeAsExpense يسجّل رسوماً كمصروف', () => {
    const ts = useTrackingsStore()
    ts.saveTracking(tracking())
    const t = ts.trackings[0]
    const future = new Date(Date.now() + 100 * 86400000).toISOString().slice(0, 10)

    ts.renewTracking(t.id, future, { feeAsExpense: 350 })

    const fees = renewFees()
    expect(fees.length).toBe(1)
    expect(fees[0].type).toBe('expense')
    expect(fees[0].amount).toBe(350)
    expect(fees[0].projectId).toBe('p1')
  })

  it('التجديد بلا تاريخ لا يفعل شيئاً', () => {
    const ts = useTrackingsStore()
    ts.saveTracking(tracking({ expiryDate: '2025-01-01' }))
    const t = ts.trackings[0]
    ts.renewTracking(t.id, '')
    expect(t.expiryDate).toBe('2025-01-01')
    expect(t.renewedCount).toBeUndefined()
  })

  it('cancelTracking يعلّم المتابعة ملغاة', () => {
    const ts = useTrackingsStore()
    ts.saveTracking(tracking())
    const t = ts.trackings[0]
    ts.cancelTracking(t.id)
    expect(t.cancelled).toBe(true)
  })
})
