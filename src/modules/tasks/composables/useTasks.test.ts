import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTasks } from './useTasks'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import type { Commitment, MemberTxn, Receivable, RequestItem, Tracking } from '@/interfaces/models'

// تفريغ كل المتاجر لعزل الحسابات عن البذور
function resetAll() {
  useRequestsStore().requests = []
  useReceivablesStore().receivables = []
  useCommitmentsStore().commitments = []
  useTrackingsStore().trackings = []
  const ps = useProjectsStore()
  ps.memberTxns = []
}

const soon = () => new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
const later = () => new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)

describe('useTasks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetAll()
  })

  it('لا مهام عند التفريغ الكامل', () => {
    const t = useTasks()
    expect(t.totalCount.value).toBe(0)
  })

  it('يعدّ الطلبات المعلّقة فقط', () => {
    const rs = useRequestsStore()
    rs.requests = [
      { status: 'pending' } as RequestItem,
      { status: 'approved' } as RequestItem,
      { status: 'pending' } as RequestItem,
    ]
    expect(useTasks().pendingReqs.value.length).toBe(2)
  })

  it('يعدّ حركات العهدة المعلّقة', () => {
    useProjectsStore().memberTxns = [
      { status: 'pending' } as MemberTxn,
      { status: 'accepted' } as MemberTxn,
    ]
    expect(useTasks().pendingMTxns.value.length).toBe(1)
  })

  it('يعدّ الذمم المستحقة خلال 7 أيام (غير المسدّدة)', () => {
    useReceivablesStore().receivables = [
      { status: 'open', dueDate: soon() } as Receivable, // ضمن النطاق
      { status: 'open', dueDate: later() } as Receivable, // بعيد
      { status: 'settled', dueDate: soon() } as Receivable, // مسدّدة → تُستبعد
    ]
    expect(useTasks().dueRecv.value.length).toBe(1)
  })

  it('يعدّ الالتزامات النشطة المستحقة قريباً', () => {
    useCommitmentsStore().commitments = [
      { active: true, nextDue: soon(), totalCount: 12, paidCount: 0 } as Commitment,
      { active: false, nextDue: soon(), totalCount: 12, paidCount: 0 } as Commitment, // غير نشط
      { active: true, nextDue: soon(), totalCount: 3, paidCount: 3 } as Commitment, // مكتمل → يُستبعد
    ]
    expect(useTasks().dueComms.value.length).toBe(1)
  })

  it('يعدّ المتابعات العاجلة (موشكة/منتهية)', () => {
    useTrackingsStore().trackings = [
      { status: 'expiring' } as Tracking,
      { status: 'expired' } as Tracking,
      { status: 'active' } as Tracking,
    ]
    expect(useTasks().urgentTracks.value.length).toBe(2)
  })

  it('totalCount يجمع كل الفئات', () => {
    useRequestsStore().requests = [{ status: 'pending' } as RequestItem]
    useTrackingsStore().trackings = [{ status: 'expired' } as Tracking]
    useProjectsStore().memberTxns = [{ status: 'pending' } as MemberTxn]
    expect(useTasks().totalCount.value).toBe(3)
  })
})
