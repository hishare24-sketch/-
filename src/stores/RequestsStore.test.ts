import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRequestsStore, type RequestPayload } from './RequestsStore'
import { useFinanceStore } from './FinanceStore'

const req = (over: Partial<RequestPayload> = {}): RequestPayload => ({
  title: 'طلب اختبار',
  amount: 500,
  requestedBy: 'أحمد',
  status: 'pending',
  date: '2026-01-01',
  type: 'مصروف',
  projectId: 'p1',
  ...over,
})

// عدّ العمليات المُنشأة من الاعتماد فقط (عزلاً عن بذور المالية)
const createdFromApproval = () =>
  useFinanceStore().transactions.filter((t) => t.note === 'أُنشئت تلقائياً من اعتماد الطلب')

describe('RequestsStore.decide', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('اعتماد طلب مصروف (flow=out) يُنشئ عملية مصروف بالمبلغ الصحيح', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ type: 'مصروف', amount: 500 }))
    const id = rs.requests[0].id
    rs.decide(id, 'approved')

    expect(rs.requests[0].status).toBe('approved')
    const created = createdFromApproval()
    expect(created.length).toBe(1)
    expect(created[0].type).toBe('expense')
    expect(created[0].amount).toBe(500)
    expect(created[0].projectId).toBe('p1')
  })

  it('اعتماد طلب تحصيل (flow=in) يُنشئ عملية إيراد', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ type: 'تحصيل', amount: 800 }))
    rs.decide(rs.requests[0].id, 'approved')
    const created = createdFromApproval()
    expect(created[0].type).toBe('income')
    expect(created[0].amount).toBe(800)
  })

  it('اعتماد طلب إجازة (flow=none) لا يُنشئ أي عملية', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ type: 'إجازة', amount: 0 }))
    rs.decide(rs.requests[0].id, 'approved')
    expect(createdFromApproval().length).toBe(0)
  })

  it('اعتماد طلب بمبلغ صفري لا يُنشئ عملية', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ type: 'مصروف', amount: 0 }))
    rs.decide(rs.requests[0].id, 'approved')
    expect(createdFromApproval().length).toBe(0)
  })

  it('الرفض لا يُنشئ عملية ويسجّل سبب القرار', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ type: 'مصروف', amount: 500 }))
    rs.decide(rs.requests[0].id, 'rejected', 'الميزانية غير كافية')
    expect(rs.requests[0].status).toBe('rejected')
    expect(rs.requests[0].decisionNote).toBe('الميزانية غير كافية')
    expect(createdFromApproval().length).toBe(0)
  })

  it('setRequestStatus يغيّر الحالة دون أثر مالي', () => {
    const rs = useRequestsStore()
    rs.saveRequest(req({ amount: 500 }))
    const id = rs.requests[0].id
    rs.setRequestStatus(id, 'under_review')
    expect(rs.requests[0].status).toBe('under_review')
    expect(createdFromApproval().length).toBe(0)
  })
})
