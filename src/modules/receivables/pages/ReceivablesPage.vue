<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { recvPaid, recvRemaining } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { today } from '@/helpers/date'
import { useProjectsStore } from '@/stores/ProjectsStore'
import type { Receivable, ReceivableKind, ReceivableStatus } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ReceivableFormModal from '../modals/ReceivableFormModal.vue'
import PayReceivableModal from '../modals/PayReceivableModal.vue'
import ReceivableDetailsModal from '../modals/ReceivableDetailsModal.vue'

const receivablesStore = useReceivablesStore()
const settingsStore = useSettingsStore()
const projectsStore = useProjectsStore()
const { receivables } = storeToRefs(receivablesStore)
const { activeProjectId } = storeToRefs(projectsStore)

const helpEntry = computed(() => settingsStore.help.receivables)

const kindTab = ref<'all' | ReceivableKind>('all')
const search = ref('')
const fProject = ref('all')
const fStatus = ref('all')
const sort = ref<'due' | 'amount' | 'newest'>('due')

const projects = computed(() => projectsStore.projects)
const hasFilter = computed(() => fProject.value !== 'all' || fStatus.value !== 'all' || sort.value !== 'due' || search.value !== '')
function clearFilters() {
  fProject.value = 'all'
  fStatus.value = 'all'
  sort.value = 'due'
  search.value = ''
}

const filtered = computed(() =>
  receivables.value
    .filter((r) => (kindTab.value === 'all' ? true : r.kind === kindTab.value))
    .filter((r) => (fProject.value === 'all' ? true : r.projectId === fProject.value))
    .filter((r) => (fStatus.value === 'all' ? true : r.status === fStatus.value))
    .filter((r) => (search.value.trim() === '' ? true : (r.party + (r.note ?? '')).includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'amount'
        ? recvRemaining(b) - recvRemaining(a)
        : sort.value === 'newest'
          ? b.date.localeCompare(a.date)
          : (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
    ),
)

const totalRecv = computed(() => receivables.value.filter((r) => r.kind === 'receivable').reduce((s, r) => s + recvRemaining(r), 0))
const totalPay = computed(() => receivables.value.filter((r) => r.kind === 'payable').reduce((s, r) => s + recvRemaining(r), 0))
const overdue = computed(() => receivables.value.filter((r) => r.status !== 'settled' && r.dueDate && r.dueDate < today()).length)

const stats = computed(() => [
  { label: 'ذمم مدينة (لنا)', value: fmtNum(totalRecv.value), icon: '📥', color: '#059669', bg: '#ecfdf5' },
  { label: 'ذمم دائنة (علينا)', value: fmtNum(totalPay.value), icon: '📤', color: '#dc2626', bg: '#fef2f2' },
  { label: 'صافي الذمم', value: fmtNum(totalRecv.value - totalPay.value), icon: '⇄', color: '#0891b2', bg: '#ecfeff' },
  { label: 'متأخرة السداد', value: String(overdue.value), icon: '⏰', color: '#d97706', bg: '#fffbeb' },
])

function statusInfo(s: ReceivableStatus) {
  if (s === 'settled') return { l: 'مسددة', c: '#15803d', bg: '#ecfdf5' }
  if (s === 'partial') return { l: 'جزئية', c: '#a16207', bg: '#fffbeb' }
  return { l: 'مفتوحة', c: '#1d4ed8', bg: '#dbeafe' }
}

// المودالات
const showForm = ref(false)
const paying = ref<Receivable | null>(null)
const viewing = ref<Receivable | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function payFromView(r: Receivable) {
  viewing.value = null
  paying.value = r
}

async function onDelete(r: Receivable) {
  const ok = await confirmRef.value?.open({ title: 'حذف الذمة', message: `حذف ذمة "${r.party}"؟` })
  if (ok) receivablesStore.deleteReceivable(r.id)
}
</script>

<template>
  <section class="receivables">
    <header class="receivables__header">
      <div>
        <h1>الذمم</h1>
        <p>المبالغ المستحقة لك أو عليك</p>
      </div>
      <button class="app-btn" @click="showForm = true">＋ ذمة جديدة</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="receivables__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in (['all', 'receivable', 'payable'] as const)" :key="t" class="tabs__btn" :class="{ 'is-active': kindTab === t }" @click="kindTab = t">
        {{ t === 'all' ? 'الكل' : t === 'receivable' ? '📥 مدينة (لنا)' : '📤 دائنة (علينا)' }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث في الذمم..." class="filters__search" />
      <select v-model="fProject" class="filters__select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="fStatus" class="filters__select">
        <option value="all">كل الحالات</option>
        <option value="open">مفتوحة</option>
        <option value="partial">جزئية</option>
        <option value="settled">مسددة</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="due">الأقرب استحقاقاً</option>
        <option value="amount">الأعلى متبقّياً</option>
        <option value="newest">الأحدث</option>
      </select>
      <button v-if="hasFilter" class="app-btn app-btn--ghost" @click="clearFilters">مسح</button>
    </div>

    <div class="list">
      <div v-if="!filtered.length" class="empty app-card">لا توجد ذمم مطابقة.</div>
      <div v-for="r in filtered" :key="r.id" class="rec app-card">
        <span class="rec__kind" :class="r.kind">{{ r.kind === 'receivable' ? '📥' : '📤' }}</span>
        <div class="rec__main" @click="viewing = r">
          <span class="rec__party">
            {{ r.party }}
            <span v-if="r.attachments?.length" class="rec__clip" title="مرفقات">📎{{ r.attachments.length }}</span>
          </span>
          <span class="rec__meta">
            {{ projectsStore.projectById(r.projectId)?.name }}
            <template v-if="r.dueDate"> · استحقاق {{ r.dueDate }}</template>
          </span>
        </div>
        <div class="rec__amounts">
          <span class="rec__total">{{ fmt(r.amount) }}</span>
          <span class="rec__remaining">المتبقّي: {{ fmtNum(recvRemaining(r)) }}</span>
          <span v-if="recvPaid(r)" class="rec__paid">مدفوع: {{ fmtNum(recvPaid(r)) }}</span>
        </div>
        <span class="rec__status" :style="{ background: statusInfo(r.status).bg, color: statusInfo(r.status).c }">
          {{ statusInfo(r.status).l }}
        </span>
        <div class="rec__actions">
          <button v-if="r.status !== 'settled'" class="app-btn app-btn--outlined pay-btn" @click="paying = r">
            {{ r.kind === 'receivable' ? 'تحصيل' : 'سداد' }}
          </button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(r)">🗑️</button>
        </div>
      </div>
    </div>

    <ReceivableFormModal v-if="showForm" :project-id="activeProjectId" @close="showForm = false" />
    <PayReceivableModal v-if="paying" :receivable="paying" @close="paying = null" />
    <ReceivableDetailsModal v-if="viewing" :receivable="viewing" @pay="payFromView" @close="viewing = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.receivables {
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
  margin-block-end: 14px;
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

.rec {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  flex-wrap: wrap;

  &__kind {
    inline-size: 42px;
    block-size: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.receivable { background: #ecfdf5; }
    &.payable { background: #fef2f2; }
  }

  &__main {
    flex: 1;
    min-inline-size: 140px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }

  &__party { font-weight: 600; font-size: 14px; }

  &__clip {
    font-size: 11px;
    color: var(--primary);
    margin-inline-start: 6px;
  }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__amounts {
    display: flex;
    flex-direction: column;
    text-align: end;
  }

  &__total { font-weight: 700; }
  &__remaining { font-size: 12px; color: var(--primary); }
  &__paid { font-size: 11px; color: var(--text-muted); }

  &__status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}

.pay-btn { padding: 7px 16px; font-size: 13px; }

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
