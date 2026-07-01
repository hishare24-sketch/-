import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAssetsStore, type AssetPayload } from './AssetsStore'
import { useFinanceStore } from './FinanceStore'
import { useTrackingsStore } from './TrackingsStore'

const asset = (over: Partial<AssetPayload> = {}): AssetPayload => ({
  projectId: 'p1',
  name: 'سيارة اختبار',
  category: 'vehicle',
  purchaseDate: '2026-01-01',
  purchaseValue: 50000,
  status: 'active',
  maintenance: [],
  ...over,
})

const maintTxns = () =>
  useFinanceStore().transactions.filter((t) => t.category === 'صيانة')

describe('AssetsStore.addMaintenance', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('صيانة بتكلفة تُسجَّل مصروفاً في المالية', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const before = maintTxns().length

    as.addMaintenance(a.id, { date: '2026-02-01', type: 'صيانة', cost: 800, note: 'زيت' })

    expect(a.maintenance.length).toBe(1)
    const txns = maintTxns()
    expect(txns.length).toBe(before + 1)
    expect(txns[0].type).toBe('expense')
    expect(txns[0].amount).toBe(800)
  })

  it('صيانة بلا تكلفة (cost=0) لا تُنشئ عملية', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const before = maintTxns().length
    as.addMaintenance(a.id, { date: '2026-02-01', type: 'فحص', cost: 0, note: '' })
    expect(a.maintenance.length).toBe(1)
    expect(maintTxns().length).toBe(before) // لا زيادة
  })

  it('نوع «عطل» يحوّل حالة الأصل إلى maintenance', () => {
    const as = useAssetsStore()
    as.addAsset(asset({ status: 'active' }))
    const a = as.assets[0]
    as.addMaintenance(a.id, { date: '2026-02-01', type: 'عطل', cost: 0, note: '' })
    expect(a.status).toBe('maintenance')
  })

  it('قراءة العداد في الصيانة تحدّث عداد الأصل', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    as.addMaintenance(a.id, { date: '2026-02-01', type: 'صيانة', cost: 100, note: '', meter: 45000 })
    expect(a.usageMeter).toBe(45000)
  })

  it('يُرجع null لأصل غير موجود', () => {
    const as = useAssetsStore()
    expect(as.addMaintenance('لا-يوجد', { date: '2026-02-01', type: 'صيانة', cost: 100, note: '' })).toBeNull()
  })
})

describe('AssetsStore warranties', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('addWarranty يضيف ضماناً فرعياً ويُرجع معرّفه', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const wid = as.addWarranty(a.id, { name: 'ضمان المحرك', context: 'component', endDate: '2027-01-01' })
    expect(wid).toBeTruthy()
    expect(a.warranties?.length).toBe(1)
    expect(a.warranties?.[0].name).toBe('ضمان المحرك')
  })

  it('linkSubWarranty يُنشئ متابعة ويربطها بالضمان', () => {
    const as = useAssetsStore()
    const ts = useTrackingsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const wid = as.addWarranty(a.id, { name: 'ضمان الإطارات', context: 'component', endDate: '2027-06-01' })!
    const beforeTrackings = ts.trackings.length

    const ok = as.linkSubWarranty(a.id, wid)

    expect(ok).toBe(true)
    expect(ts.trackings.length).toBe(beforeTrackings + 1)
    const w = a.warranties!.find((x) => x.id === wid)!
    expect(w.trackingId).toBeTruthy()
    // المتابعة المُنشأة تشير لنفس المعرّف
    expect(ts.trackings.some((t) => t.id === w.trackingId)).toBe(true)
  })

  it('linkSubWarranty لا يُكرّر الربط إن كان مربوطاً', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const wid = as.addWarranty(a.id, { name: 'ض', context: 'component', endDate: '2027-06-01' })!
    as.linkSubWarranty(a.id, wid)
    expect(as.linkSubWarranty(a.id, wid)).toBe(false)
  })

  it('removeWarranty يحذف الضمان ومتابعته المرتبطة', () => {
    const as = useAssetsStore()
    const ts = useTrackingsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    const wid = as.addWarranty(a.id, { name: 'ض', context: 'component', endDate: '2027-06-01' })!
    as.linkSubWarranty(a.id, wid)
    const trackingId = a.warranties!.find((x) => x.id === wid)!.trackingId!

    as.removeWarranty(a.id, wid)

    expect(a.warranties!.some((x) => x.id === wid)).toBe(false)
    expect(ts.trackings.some((t) => t.id === trackingId)).toBe(false)
  })
})

describe('AssetsStore.sellAsset', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('بيع الأصل بمبلغ يُسجّل إيراداً ويضع الحالة sold', () => {
    const as = useAssetsStore()
    as.addAsset(asset())
    const a = as.assets[0]
    as.sellAsset(a.id, 30000, '2026-06-01')
    expect(a.status).toBe('sold')
    expect(a.saleValue).toBe(30000)
    const income = useFinanceStore().transactions.filter((t) => t.category === 'بيع أصول')
    expect(income[0].type).toBe('income')
    expect(income[0].amount).toBe(30000)
  })
})
