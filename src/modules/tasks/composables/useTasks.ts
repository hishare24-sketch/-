import { computed } from 'vue'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { commitmentDone } from '@/helpers/calc'

const within7 = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

// تجميع كل البنود التي تنتظر تصرّفاً عبر المشاريع (منقول من legacy/App.tsx)
export function useTasks() {
  const requestsStore = useRequestsStore()
  const receivablesStore = useReceivablesStore()
  const commitmentsStore = useCommitmentsStore()
  const trackingsStore = useTrackingsStore()
  const projectsStore = useProjectsStore()

  const pendingReqs = computed(() => requestsStore.requests.filter((r) => r.status === 'pending'))
  const pendingMTxns = computed(() => projectsStore.memberTxns.filter((m) => m.status === 'pending'))
  const dueRecv = computed(() =>
    receivablesStore.receivables.filter((r) => r.status !== 'settled' && r.dueDate && r.dueDate <= within7()),
  )
  const dueComms = computed(() =>
    commitmentsStore.commitments.filter((c) => c.active && !commitmentDone(c) && c.nextDue <= within7()),
  )
  const urgentTracks = computed(() =>
    trackingsStore.trackings.filter((t) => t.status === 'expiring' || t.status === 'expired'),
  )

  const totalCount = computed(
    () =>
      pendingReqs.value.length +
      pendingMTxns.value.length +
      dueRecv.value.length +
      dueComms.value.length +
      urgentTracks.value.length,
  )

  return { pendingReqs, pendingMTxns, dueRecv, dueComms, urgentTracks, totalCount }
}
