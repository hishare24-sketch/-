import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommitmentsStore, type CommitmentPayload } from './CommitmentsStore'
import { useFinanceStore } from './FinanceStore'
import { advanceDate } from '@/helpers/date'

const commit = (over: Partial<CommitmentPayload> = {}): CommitmentPayload => ({
  projectId: 'p1',
  kind: 'installment',
  direction: 'out',
  name: 'قسط اختبار',
  amount: 1000,
  freq: 'monthly',
  startDate: '2026-01-01',
  totalCount: 12,
  paidCount: 0,
  nextDue: '2026-02-01',
  active: true,
  payments: [],
  ...over,
})

const paidTxns = () =>
  useFinanceStore().transactions.filter((t) => t.category === 'أقساط' || t.category === 'اشتراكات' || t.category === 'التزامات')

describe('CommitmentsStore.payCommitment', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('دفع التزام صادر (out) يُنشئ مصروفاً ويزيد العدّاد ويقدّم الاستحقاق', () => {
    const cs = useCommitmentsStore()
    cs.addCommitment(commit({ direction: 'out', amount: 1000, nextDue: '2026-02-01', freq: 'monthly' }))
    const c = cs.commitments[0]
    const before = paidTxns().length

    cs.payCommitment(c.id)

    expect(c.paidCount).toBe(1)
    expect(c.payments.length).toBe(1)
    expect(c.nextDue).toBe(advanceDate('2026-02-01', 'monthly'))
    const txns = paidTxns()
    expect(txns.length).toBe(before + 1)
    expect(txns[0].type).toBe('expense')
    expect(txns[0].amount).toBe(1000)
  })

  it('دفع التزام وارد (in) يُنشئ إيراداً', () => {
    const cs = useCommitmentsStore()
    cs.addCommitment(commit({ direction: 'in', amount: 700, kind: 'subscription' }))
    cs.payCommitment(cs.commitments[0].id)
    expect(paidTxns()[0].type).toBe('income')
    expect(paidTxns()[0].amount).toBe(700)
  })

  it('مبلغ الدفعة المخصّص (opts.amount) يُستخدم بدل مبلغ الالتزام', () => {
    const cs = useCommitmentsStore()
    cs.addCommitment(commit({ amount: 1000 }))
    cs.payCommitment(cs.commitments[0].id, { amount: 250 })
    expect(cs.commitments[0].payments[0].amount).toBe(250)
    expect(paidTxns()[0].amount).toBe(250)
  })

  it('بلوغ العدد الكلي يوقف الالتزام (active=false) ولا يقدّم الاستحقاق', () => {
    const cs = useCommitmentsStore()
    cs.addCommitment(commit({ totalCount: 1, paidCount: 0, nextDue: '2026-02-01' }))
    const c = cs.commitments[0]
    cs.payCommitment(c.id)
    expect(c.paidCount).toBe(1)
    expect(c.active).toBe(false)
    expect(c.nextDue).toBe('2026-02-01') // لم يتقدّم لأنه انتهى
  })

  it('cancelCommitment يوقفه ويعلّمه ملغى', () => {
    const cs = useCommitmentsStore()
    cs.addCommitment(commit())
    const c = cs.commitments[0]
    cs.cancelCommitment(c.id)
    expect(c.cancelled).toBe(true)
    expect(c.active).toBe(false)
  })
})
