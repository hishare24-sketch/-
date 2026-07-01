import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { runHealthCheck } from './useHealthCheck'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import type { Asset, Project, Transaction } from '@/interfaces/models'

// تفريغ كل المتاجر → قاعدة نظيفة (كل الفحوص يجب أن تكون ok)
function resetAll() {
  const ps = useProjectsStore()
  ps.projects = []
  ps.members = []
  ps.memberTxns = []
  useFinanceStore().transactions = []
  useReceivablesStore().receivables = []
  useCommitmentsStore().commitments = []
  useAssetsStore().assets = []
  useTrackingsStore().trackings = []
  useRequestsStore().requests = []
  useDocumentsStore().documents = []
}

const project = (id = 'p1'): Project => ({ id, name: 'م', icon: '📦', balance: 0, color: '#000' })
const byKey = (issues: ReturnType<typeof runHealthCheck>, key: string) => issues.find((i) => i.key === key)!

describe('runHealthCheck', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetAll()
  })

  it('يُنتج 12 فحصاً دائماً', () => {
    expect(runHealthCheck().length).toBe(12)
  })

  it('قاعدة فارغة → كل الفحوص ok', () => {
    const issues = runHealthCheck()
    expect(issues.every((i) => i.level === 'ok')).toBe(true)
  })

  it('يرصد السجلات اليتيمة (مشروع محذوف) كخطأ', () => {
    // عملية تشير لمشروع غير موجود (لا مشاريع أصلاً)
    useFinanceStore().transactions = [
      { id: 't1', projectId: 'ghost', type: 'income', amount: 100, description: 'x', category: 'ع', date: '2026-01-01', hasDoc: false } as Transaction,
    ]
    expect(byKey(runHealthCheck(), 'orphans').level).toBe('error')
  })

  it('يرصد المبالغ السالبة', () => {
    useProjectsStore().projects = [project('p1')]
    useFinanceStore().transactions = [
      { id: 't1', projectId: 'p1', type: 'expense', amount: -50, description: 'x', category: 'ع', date: '2026-01-01', hasDoc: false } as Transaction,
    ]
    expect(byKey(runHealthCheck(), 'negatives').level).toBe('warning')
  })

  it('يرصد التحويلات غير المتوازنة (طرف يتيم)', () => {
    useProjectsStore().projects = [project('p1')]
    useFinanceStore().transactions = [
      // تحويل بلا linkId → يتيم
      { id: 't1', projectId: 'p1', type: 'transfer', amount: 100, description: 'x', category: 'ع', date: '2026-01-01', hasDoc: false, transferDir: 'out' } as Transaction,
    ]
    expect(byKey(runHealthCheck(), 'transfers').level).toBe('warning')
  })

  it('يرصد الأصل المُباع دون قيمة بيع', () => {
    useProjectsStore().projects = [project('p1')]
    useAssetsStore().assets = [
      { id: 'a1', projectId: 'p1', name: 'أصل', category: 'device', purchaseDate: '2026-01-01', purchaseValue: 100, status: 'sold', maintenance: [] } as Asset,
    ]
    expect(byKey(runHealthCheck(), 'assets-state').level).toBe('warning')
  })

  it('يحدّ أهداف التنقّل إلى 12 عنصراً كحدّ أقصى', () => {
    useProjectsStore().projects = [project('p1')]
    // 20 عملية سالبة → يجب ألا تتجاوز الأهداف 12
    useFinanceStore().transactions = Array.from({ length: 20 }, (_, i) => ({
      id: 't' + i, projectId: 'p1', type: 'expense', amount: -1, description: 'x', category: 'ع', date: '2026-01-01', hasDoc: false,
    })) as Transaction[]
    const neg = byKey(runHealthCheck(), 'negatives')
    expect(neg.targets!.length).toBeLessThanOrEqual(12)
  })
})
