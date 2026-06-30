<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { recvRemaining } from '@/helpers/calc'
import type { Receivable } from '@/interfaces/models'
import { useTasks } from '../composables/useTasks'
import PayReceivableModal from '@/modules/receivables/modals/PayReceivableModal.vue'

const requestsStore = useRequestsStore()
const commitmentsStore = useCommitmentsStore()
const projectsStore = useProjectsStore()

const { pendingReqs, pendingMTxns, dueRecv, dueComms, urgentTracks, totalCount } = useTasks()

type Filter = 'all' | 'requests' | 'memberTxns' | 'receivables' | 'commitments' | 'trackings'
const filter = ref<Filter>('all')
const show = (k: Filter) => filter.value === 'all' || filter.value === k

const filterTabs = computed<[Filter, string, number][]>(() => [
  ['all', 'الكل', totalCount.value],
  ['requests', 'طلبات', pendingReqs.value.length],
  ['memberTxns', 'عهد', pendingMTxns.value.length],
  ['receivables', 'ذمم', dueRecv.value.length],
  ['commitments', 'التزامات', dueComms.value.length],
  ['trackings', 'متابعات', urgentTracks.value.length],
])

const projName = (id: string) => projectsStore.projectById(id)?.name ?? '—'
const memberName = (id?: string) => (id ? projectsStore.memberById(id)?.name ?? '' : '')

const payingRecv = ref<Receivable | null>(null)
</script>

<template>
  <section class="tasks">
    <header class="tasks__header">
      <h1>الإجراءات المطلوبة</h1>
      <p>{{ totalCount > 0 ? `${totalCount} بند ينتظر تصرّفك عبر كل المشاريع` : 'كل شيء منجز' }}</p>
    </header>

    <div class="filters">
      <button
        v-for="[v, l, n] in filterTabs"
        :key="v"
        class="chip"
        :class="{ 'is-active': filter === v }"
        @click="filter = v"
      >
        {{ l }}<span v-if="n > 0" class="chip__count">{{ n }}</span>
      </button>
    </div>

    <div v-if="totalCount === 0" class="done app-card">
      <span class="done__icon">✅</span>
      <span class="done__title">لا توجد إجراءات مطلوبة</span>
      <span class="done__sub">أنت على اطّلاع بكل شيء. سيظهر هنا كل ما يحتاج قراراً أو تنفيذاً.</span>
    </div>

    <div v-else class="sections">
      <!-- طلبات معلقة -->
      <div v-if="show('requests') && pendingReqs.length" class="section">
        <div class="section__head">⏳ <strong>طلبات بانتظار القرار</strong><span class="badge">{{ pendingReqs.length }}</span></div>
        <div v-for="r in pendingReqs" :key="r.id" class="row app-card">
          <div class="row__info">
            <span class="row__title">{{ r.title }}</span>
            <span class="row__meta">{{ r.requestedBy }} · {{ projName(r.projectId) }} · {{ fmt(r.amount) }}</span>
          </div>
          <div class="row__actions">
            <button class="mini-btn mini-btn--ok" @click="requestsStore.decide(r.id, 'approved')">اعتماد</button>
            <button class="mini-btn mini-btn--no" @click="requestsStore.decide(r.id, 'rejected')">رفض</button>
          </div>
        </div>
      </div>

      <!-- حركات عهد معلقة -->
      <div v-if="show('memberTxns') && pendingMTxns.length" class="section">
        <div class="section__head">💸 <strong>حركات عهد بانتظار القرار</strong><span class="badge">{{ pendingMTxns.length }}</span></div>
        <div v-for="m in pendingMTxns" :key="m.id" class="row app-card">
          <div class="row__info">
            <span class="row__title">{{ memberName(m.memberId) }} — {{ fmtNum(m.amount) }} ر.س</span>
            <span class="row__meta">{{ projName(m.projectId) }} · {{ m.note }}</span>
          </div>
          <div class="row__actions">
            <button class="mini-btn mini-btn--ok" @click="projectsStore.decideMemberTxn(m.id, 'accepted')">قبول</button>
            <button class="mini-btn mini-btn--no" @click="projectsStore.decideMemberTxn(m.id, 'rejected')">رفض</button>
          </div>
        </div>
      </div>

      <!-- ذمم مستحقة -->
      <div v-if="show('receivables') && dueRecv.length" class="section">
        <div class="section__head">🧾 <strong>ذمم مستحقة قريباً</strong><span class="badge">{{ dueRecv.length }}</span></div>
        <div v-for="r in dueRecv" :key="r.id" class="row app-card">
          <div class="row__info">
            <span class="row__title">{{ r.party }} — متبقّي {{ fmtNum(recvRemaining(r)) }} ر.س</span>
            <span class="row__meta">{{ projName(r.projectId) }} · استحقاق {{ r.dueDate }}</span>
          </div>
          <div class="row__actions">
            <button class="mini-btn mini-btn--primary" @click="payingRecv = r">
              {{ r.kind === 'receivable' ? 'تحصيل' : 'سداد' }}
            </button>
          </div>
        </div>
      </div>

      <!-- التزامات مستحقة -->
      <div v-if="show('commitments') && dueComms.length" class="section">
        <div class="section__head">📌 <strong>التزامات مستحقة قريباً</strong><span class="badge">{{ dueComms.length }}</span></div>
        <div v-for="c in dueComms" :key="c.id" class="row app-card">
          <div class="row__info">
            <span class="row__title">{{ c.name }} — {{ fmt(c.amount) }}</span>
            <span class="row__meta">{{ projName(c.projectId) }} · استحقاق {{ c.nextDue }}</span>
          </div>
          <div class="row__actions">
            <button class="mini-btn mini-btn--primary" @click="commitmentsStore.payCommitment(c.id)">
              {{ c.direction === 'out' ? 'دفع' : 'استلام' }}
            </button>
          </div>
        </div>
      </div>

      <!-- متابعات عاجلة -->
      <div v-if="show('trackings') && urgentTracks.length" class="section">
        <div class="section__head">🔔 <strong>متابعات عاجلة</strong><span class="badge">{{ urgentTracks.length }}</span></div>
        <div v-for="t in urgentTracks" :key="t.id" class="row app-card">
          <div class="row__info">
            <span class="row__title">{{ t.icon }} {{ t.name }}</span>
            <span class="row__meta">{{ projName(t.projectId) }} · {{ t.daysLeft < 0 ? `منتهٍ منذ ${Math.abs(t.daysLeft)} يوم` : `يتبقّى ${t.daysLeft} يوم` }}</span>
          </div>
        </div>
      </div>
    </div>

    <PayReceivableModal v-if="payingRecv" :receivable="payingRecv" @close="payingRecv = null" />
  </section>
</template>

<style lang="scss" scoped>
.tasks {
  max-inline-size: 900px;

  &__header {
    margin-block-end: 20px;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }
}

.filters {
  display: flex;
  gap: 6px;
  margin-block-end: 20px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 99px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;

  &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }

  &__count {
    font-size: 10.5px;
    background: var(--bg);
    border-radius: 99px;
    padding: 0 6px;
    font-weight: 700;
  }

  &.is-active .chip__count { background: var(--primary); color: #fff; }
}

.done {
  text-align: center;
  padding: 48px 20px;

  &__icon { font-size: 40px; display: block; margin-block-end: 12px; }
  &__title { display: block; font-size: 16px; font-weight: 700; margin-block-end: 4px; }
  &__sub { font-size: 13px; color: var(--text-muted); }
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-end: 10px;
    font-size: 14px;
  }
}

.badge {
  font-size: 11px;
  background: var(--primary);
  color: #fff;
  border-radius: 99px;
  padding: 1px 8px;
  font-weight: 600;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  margin-block-end: 8px;
  flex-wrap: wrap;

  &__info {
    flex: 1;
    min-inline-size: 160px;
    display: flex;
    flex-direction: column;
  }

  &__title { font-weight: 600; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__actions {
    display: flex;
    gap: 6px;
  }
}

.mini-btn {
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;

  &--ok { background: #ecfdf5; color: #059669; }
  &--no { background: #fef2f2; color: #dc2626; }
  &--primary { background: var(--primary-soft); color: var(--primary); }
}
</style>
