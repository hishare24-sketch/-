<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmt } from '@/helpers/format'
import type { RequestItem, RequestStatus } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import EntityDetailsModal from '@/components/shared/EntityDetailsModal.vue'
import RequestFormModal from '../modals/RequestFormModal.vue'

const requestsStore = useRequestsStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { requests } = storeToRefs(requestsStore)
const { activeProjectId } = storeToRefs(projectsStore)

const helpEntry = computed(() => settingsStore.help.requests)

const statusTab = ref<'all' | RequestStatus>('all')
const search = ref('')
const fProject = ref('all')
const fType = ref('all')
const projects = computed(() => projectsStore.projects)
const reqTypes = computed(() => ['all', ...new Set(requests.value.map((r) => r.type))])

const filtered = computed(() =>
  requests.value
    .filter((r) => (statusTab.value === 'all' ? true : r.status === statusTab.value))
    .filter((r) => (fProject.value === 'all' ? true : r.projectId === fProject.value))
    .filter((r) => (fType.value === 'all' ? true : r.type === fType.value))
    .filter((r) => (search.value.trim() === '' ? true : (r.title + r.requestedBy).includes(search.value.trim())))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const stats = computed(() => [
  { label: 'إجمالي الطلبات', value: String(requests.value.length), icon: '📥', color: '#0891b2', bg: '#ecfeff' },
  { label: 'معلقة', value: String(requests.value.filter((r) => r.status === 'pending').length), icon: '⏳', color: '#d97706', bg: '#fffbeb' },
  { label: 'معتمدة', value: String(requests.value.filter((r) => r.status === 'approved').length), icon: '✅', color: '#059669', bg: '#ecfdf5' },
  { label: 'مرفوضة', value: String(requests.value.filter((r) => r.status === 'rejected').length), icon: '⛔', color: '#dc2626', bg: '#fef2f2' },
])

function statusInfo(s: RequestStatus) {
  if (s === 'approved') return { l: 'معتمد', c: '#059669', bg: '#ecfdf5' }
  if (s === 'rejected') return { l: 'مرفوض', c: '#dc2626', bg: '#fef2f2' }
  return { l: 'معلّق', c: '#d97706', bg: '#fffbeb' }
}

const showForm = ref(false)
const viewing = ref<RequestItem | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

const viewRows = computed<[string, string][]>(() => {
  const r = viewing.value
  if (!r) return []
  return [
    ['النوع', r.type],
    ['المشروع', projectsStore.projectById(r.projectId)?.name ?? '—'],
    ['المبلغ', fmt(r.amount)],
    ['مقدّم الطلب', r.requestedBy],
    ['التاريخ', r.date],
    ['الحالة', statusInfo(r.status).l],
  ]
})

function decide(r: RequestItem, status: RequestStatus) {
  requestsStore.decide(r.id, status)
}
async function onDelete(r: RequestItem) {
  const ok = await confirmRef.value?.open({ title: 'حذف الطلب', message: `حذف "${r.title}"؟` })
  if (ok) requestsStore.deleteRequest(r.id)
}
</script>

<template>
  <section class="requests">
    <header class="requests__header">
      <div>
        <h1>الطلبات والموافقات</h1>
        <p>دورة الاعتماد: إنشاء ← مراجعة ← اعتماد/رفض</p>
      </div>
      <button class="app-btn" @click="showForm = true">＋ طلب جديد</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="requests__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in (['all', 'pending', 'approved', 'rejected'] as const)" :key="t" class="tabs__btn" :class="{ 'is-active': statusTab === t }" @click="statusTab = t">
        {{ t === 'all' ? 'الكل' : t === 'pending' ? 'معلقة' : t === 'approved' ? 'معتمدة' : 'مرفوضة' }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث..." class="filters__search" />
      <select v-model="fProject" class="filters__select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="fType" class="filters__select">
        <option v-for="t in reqTypes" :key="t" :value="t">{{ t === 'all' ? 'كل الأنواع' : t }}</option>
      </select>
    </div>

    <div class="list">
      <div v-if="!filtered.length" class="empty app-card">لا توجد طلبات.</div>
      <div v-for="r in filtered" :key="r.id" class="req app-card">
        <div class="req__main" @click="viewing = r">
          <div class="req__title-row">
            <span class="req__title">{{ r.title }}</span>
            <span class="req__type">{{ r.type }}</span>
            <span v-if="r.attachments?.length" class="req__clip" title="مرفقات">📎{{ r.attachments.length }}</span>
          </div>
          <span class="req__meta">
            {{ r.requestedBy }} · {{ projectsStore.projectById(r.projectId)?.name }} · {{ r.date }}
          </span>
        </div>
        <span class="req__amount">{{ fmt(r.amount) }}</span>
        <span class="req__status" :style="{ background: statusInfo(r.status).bg, color: statusInfo(r.status).c }">
          {{ statusInfo(r.status).l }}
        </span>
        <div class="req__actions">
          <template v-if="r.status === 'pending'">
            <button class="mini-btn mini-btn--ok" @click="decide(r, 'approved')">اعتماد</button>
            <button class="mini-btn mini-btn--no" @click="decide(r, 'rejected')">رفض</button>
          </template>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(r)">🗑️</button>
        </div>
      </div>
    </div>

    <RequestFormModal v-if="showForm" :project-id="activeProjectId" @close="showForm = false" />
    <EntityDetailsModal
      v-if="viewing"
      :title="viewing.title"
      :badge="{ label: statusInfo(viewing.status).l, color: statusInfo(viewing.status).c, bg: statusInfo(viewing.status).bg }"
      :rows="viewRows"
      :note="viewing.note"
      :attachments="viewing.attachments"
      @close="viewing = null"
    />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.requests {
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

.req {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  flex-wrap: wrap;

  &__main {
    flex: 1;
    min-inline-size: 180px;
    cursor: pointer;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__clip { font-size: 11px; color: var(--primary); }

  &__title { font-weight: 600; font-size: 14px; }

  &__type {
    font-size: 11px;
    background: var(--bg);
    color: var(--text-muted);
    padding: 2px 10px;
    border-radius: 20px;
  }

  &__meta {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__amount {
    font-weight: 700;
  }

  &__status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
  }

  &__actions {
    display: flex;
    align-items: center;
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
}

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
