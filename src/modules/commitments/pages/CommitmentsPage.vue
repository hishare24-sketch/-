<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { commitmentDone } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { COMMITMENT_KINDS, FREQ_LABEL, FREQ_DAYS } from '@/constants'
import type { Commitment, CommitmentKind } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ToggleActivationSwitch from '@/components/shared/ToggleActivationSwitch.vue'
import CommitmentFormModal from '../modals/CommitmentFormModal.vue'
import CommitmentDetailsModal from '../modals/CommitmentDetailsModal.vue'

const commitmentsStore = useCommitmentsStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { commitments } = storeToRefs(commitmentsStore)
const { activeProjectId } = storeToRefs(projectsStore)

const helpEntry = computed(() => settingsStore.help.commitments)

const kindTab = ref<'all' | CommitmentKind>('all')
const search = ref('')
const fProject = ref('all')
const fStatus = ref('all')
const sort = ref<'due' | 'amount'>('due')
const projects = computed(() => projectsStore.projects)

const filtered = computed(() =>
  commitments.value
    .filter((c) => (kindTab.value === 'all' ? true : c.kind === kindTab.value))
    .filter((c) => (fProject.value === 'all' ? true : c.projectId === fProject.value))
    .filter((c) =>
      fStatus.value === 'all'
        ? true
        : fStatus.value === 'active'
          ? c.active && !commitmentDone(c)
          : fStatus.value === 'done'
            ? commitmentDone(c)
            : !c.active,
    )
    .filter((c) => (search.value.trim() === '' ? true : (c.name + (c.party ?? '')).includes(search.value.trim())))
    .slice()
    .sort((a, b) => (sort.value === 'amount' ? b.amount - a.amount : a.nextDue.localeCompare(b.nextDue))),
)

// الأثر الشهري التقديري (توحيد كل التزام نشط إلى أساس شهري)
const monthlyImpact = computed(() => {
  let out = 0
  let inc = 0
  commitments.value.filter((c) => c.active).forEach((c) => {
    const perMonth = c.amount * (30 / FREQ_DAYS[c.freq])
    if (c.direction === 'out') out += perMonth
    else inc += perMonth
  })
  return { out: Math.round(out), inc: Math.round(inc) }
})

const stats = computed(() => [
  { label: 'التزامات نشطة', value: String(commitments.value.filter((c) => c.active).length), icon: '📌', color: '#0891b2', bg: '#ecfeff' },
  { label: 'أثر شهري صادر', value: fmtNum(monthlyImpact.value.out), icon: '📤', color: '#dc2626', bg: '#fef2f2' },
  { label: 'أثر شهري وارد', value: fmtNum(monthlyImpact.value.inc), icon: '📥', color: '#059669', bg: '#ecfdf5' },
  { label: 'صافي شهري', value: fmtNum(monthlyImpact.value.inc - monthlyImpact.value.out), icon: '📊', color: '#7e22ce', bg: '#faf5ff' },
])

const kindLabel = (k: CommitmentKind) => COMMITMENT_KINDS.find((x) => x.id === k)?.label ?? k

// المودالات
const showForm = ref(false)
const viewing = ref<Commitment | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function payFromView(c: Commitment) {
  viewing.value = null
  commitmentsStore.payCommitment(c.id)
}

async function onDelete(c: Commitment) {
  const ok = await confirmRef.value?.open({ title: 'حذف الالتزام', message: `حذف "${c.name}"؟` })
  if (ok) commitmentsStore.deleteCommitment(c.id)
}
function onToggle(c: Commitment) {
  commitmentsStore.toggleCommitment(c.id)
}
function onPay(c: Commitment) {
  commitmentsStore.payCommitment(c.id)
}
</script>

<template>
  <section class="commitments">
    <header class="commitments__header">
      <div>
        <h1>الالتزامات الدورية</h1>
        <p>الأقساط والالتزامات المتكررة والاشتراكات</p>
      </div>
      <button class="app-btn" @click="showForm = true">＋ التزام جديد</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="commitments__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tabs__btn" :class="{ 'is-active': kindTab === 'all' }" @click="kindTab = 'all'">الكل</button>
      <button v-for="k in COMMITMENT_KINDS" :key="k.id" class="tabs__btn" :class="{ 'is-active': kindTab === k.id }" @click="kindTab = k.id">
        {{ k.icon }} {{ k.label }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث..." class="filters__search" />
      <select v-model="fProject" class="filters__select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="fStatus" class="filters__select">
        <option value="all">كل الحالات</option>
        <option value="active">نشط</option>
        <option value="paused">موقوف</option>
        <option value="done">مكتمل</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="due">الأقرب استحقاقاً</option>
        <option value="amount">الأعلى مبلغاً</option>
      </select>
    </div>

    <div class="list">
      <div v-if="!filtered.length" class="empty app-card">لا توجد التزامات.</div>
      <div v-for="c in filtered" :key="c.id" class="cm app-card" :class="{ 'is-inactive': !c.active }">
        <div class="cm__main" @click="viewing = c">
          <span class="cm__name">
            {{ c.name }}
            <span v-if="c.attachments?.length" class="cm__clip" title="مرفقات">📎{{ c.attachments.length }}</span>
          </span>
          <span class="cm__meta">
            {{ kindLabel(c.kind) }} · {{ FREQ_LABEL[c.freq] }}
            <template v-if="c.party"> · {{ c.party }}</template>
          </span>
          <span class="cm__progress" v-if="c.totalCount">
            مدفوع {{ c.paidCount }} من {{ c.totalCount }}
          </span>
          <span class="cm__progress" v-else>مدفوع {{ c.paidCount }} دفعة</span>
        </div>

        <div class="cm__amount">
          <span class="cm__value" :class="c.direction">{{ c.direction === 'out' ? '−' : '+' }}{{ fmt(c.amount) }}</span>
          <span class="cm__due">الاستحقاق: {{ c.nextDue }}</span>
        </div>

        <div class="cm__toggle">
          <ToggleActivationSwitch :model-value="c.active" @update:model-value="onToggle(c)" />
        </div>

        <div class="cm__actions">
          <button
            v-if="c.active && !commitmentDone(c)"
            class="app-btn app-btn--outlined pay-btn"
            @click="onPay(c)"
          >
            {{ c.direction === 'out' ? 'دفع' : 'استلام' }} دفعة
          </button>
          <span v-else-if="commitmentDone(c)" class="cm__done">✓ مكتمل</span>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(c)">🗑️</button>
        </div>
      </div>
    </div>

    <CommitmentFormModal v-if="showForm" :project-id="activeProjectId" @close="showForm = false" />
    <CommitmentDetailsModal v-if="viewing" :commitment="viewing" @pay="payFromView" @close="viewing = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.commitments {
  max-inline-size: 1000px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 20px;
    flex-wrap: wrap;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-block-end: 20px;
  }
}

.help-note {
  padding: 14px 18px;
  margin-block-end: 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
  background: var(--primary-soft);
  border-color: transparent;
  strong { color: var(--primary); margin-inline-end: 8px; }
}

.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px;

  &__label { display: block; font-size: 12px; color: var(--text-muted); margin-block-end: 6px; }
  &__value { font-size: 17px; font-weight: 700; }
  &__icon { inline-size: 42px; block-size: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; }
}

.tabs {
  display: inline-flex;
  gap: 4px;
  margin-block-end: 16px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;
  flex-wrap: wrap;

  &__btn {
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.filters {
  display: flex;
  gap: 8px;
  margin-block-end: 16px;
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 160px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }

  &__select {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.cm {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  flex-wrap: wrap;

  &.is-inactive { opacity: 0.6; }

  &__main {
    flex: 1;
    min-inline-size: 160px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    cursor: pointer;
  }

  &__name { font-weight: 600; font-size: 14px; }

  &__clip { font-size: 11px; color: var(--primary); margin-inline-start: 6px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
  &__progress { font-size: 11px; color: var(--primary); }

  &__amount {
    display: flex;
    flex-direction: column;
    text-align: end;
  }

  &__value {
    font-weight: 700;
    &.out { color: #b91c1c; }
    &.in { color: #15803d; }
  }

  &__due { font-size: 11px; color: var(--text-muted); }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__done {
    font-size: 13px;
    color: #059669;
    font-weight: 600;
  }
}

.pay-btn { padding: 7px 14px; font-size: 13px; }

.icon-btn {
  inline-size: 32px;
  block-size: 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;

  &--danger:hover { border-color: var(--error); color: var(--error); }
}
</style>
