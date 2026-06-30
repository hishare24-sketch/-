import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { MEMBER_TXN_TYPES } from '@/constants'

export interface LedgerRow {
  id: string
  num: string
  kind: string
  nature: string
  projectId: string
  memberId?: string
  source?: string
  amount: number
  dir: 'in' | 'out'
  date: string
  status: string
  parties: string[]
}

// توحيد العمليات المالية + حركات الأعضاء في سجل واحد (منقول من legacy/App.tsx)
export function useLedgerRows() {
  const projectsStore = useProjectsStore()
  const financeStore = useFinanceStore()

  const projName = (id: string) => projectsStore.projectById(id)?.name ?? '—'
  const memName = (id?: string) => (id ? projectsStore.memberById(id)?.name ?? '—' : '—')

  const rows = computed<LedgerRow[]>(() => {
    const out: LedgerRow[] = []

    financeStore.transactions.forEach((t, i) => {
      out.push({
        id: t.id,
        num: 'TX-' + (1000 + i),
        kind: t.type === 'income' ? 'إيراد' : t.type === 'expense' ? 'مصروف' : 'تحويل',
        nature: t.category,
        projectId: t.projectId,
        memberId: t.memberId,
        source: t.source,
        amount: t.amount,
        dir: t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in') ? 'in' : 'out',
        date: t.date,
        status: 'منفّذة',
        parties: [
          projName(t.projectId),
          t.source,
          t.memberId ? memName(t.memberId) : null,
          t.toProject ? projName(t.toProject) : null,
        ].filter(Boolean) as string[],
      })
    })

    projectsStore.memberTxns.forEach((mt, i) => {
      const ti = MEMBER_TXN_TYPES.find((x) => x.id === mt.type)
      out.push({
        id: mt.id,
        num: 'MV-' + (2000 + i),
        kind: ti?.label ?? 'حركة عضو',
        nature: 'عُهد/تسوية',
        projectId: mt.projectId,
        memberId: mt.memberId,
        amount: mt.amount,
        dir: mt.direction === 'to_member' ? 'out' : 'in',
        date: mt.date,
        status: mt.status === 'accepted' ? 'مقبولة' : mt.status === 'rejected' ? 'مرفوضة' : 'معلّقة',
        parties: [projName(mt.projectId), memName(mt.memberId)].filter(Boolean) as string[],
      })
    })

    return out.sort((a, b) => b.date.localeCompare(a.date))
  })

  return { rows, projName, memName }
}
