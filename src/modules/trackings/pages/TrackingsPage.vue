<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import type { Tracking, TrackingStatus } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import TrackingFormModal from '../modals/TrackingFormModal.vue'

const trackingsStore = useTrackingsStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { trackings } = storeToRefs(trackingsStore)
const { activeProjectId } = storeToRefs(projectsStore)

const helpEntry = computed(() => settingsStore.help.trackings)

const statusTab = ref<'all' | TrackingStatus>('all')
const search = ref('')
const fProject = ref('all')
const projects = computed(() => projectsStore.projects)

const filtered = computed(() =>
  trackings.value
    .filter((t) => (statusTab.value === 'all' ? true : t.status === statusTab.value))
    .filter((t) => (fProject.value === 'all' ? true : t.projectId === fProject.value))
    .filter((t) => (search.value.trim() === '' ? true : t.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) => a.daysLeft - b.daysLeft),
)

const stats = computed(() => [
  { label: 'إجمالي المتابعات', value: String(trackings.value.length), icon: '🔔', color: '#0891b2', bg: '#ecfeff' },
  { label: 'نشطة', value: String(trackings.value.filter((t) => t.status === 'active').length), icon: '✅', color: '#059669', bg: '#ecfdf5' },
  { label: 'توشك على الانتهاء', value: String(trackings.value.filter((t) => t.status === 'expiring').length), icon: '⏳', color: '#d97706', bg: '#fffbeb' },
  { label: 'منتهية', value: String(trackings.value.filter((t) => t.status === 'expired').length), icon: '⛔', color: '#dc2626', bg: '#fef2f2' },
])

function statusInfo(s: TrackingStatus) {
  if (s === 'active') return { l: 'نشط', c: '#059669', bg: '#ecfdf5' }
  if (s === 'expiring') return { l: 'يوشك على الانتهاء', c: '#a16207', bg: '#fffbeb' }
  return { l: 'منتهي', c: '#dc2626', bg: '#fef2f2' }
}

const showForm = ref(false)
const editing = ref<Tracking | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function openCreate() {
  editing.value = null
  showForm.value = true
}
function openEdit(t: Tracking) {
  editing.value = t
  showForm.value = true
}
async function onDelete(t: Tracking) {
  const ok = await confirmRef.value?.open({ title: 'حذف المتابعة', message: `حذف "${t.name}"؟` })
  if (ok) trackingsStore.deleteTracking(t.id)
}
</script>

<template>
  <section class="trackings">
    <header class="trackings__header">
      <div>
        <h1>المتابعات والضمانات</h1>
        <p>الضمانات والعقود والتراخيص ومواعيد انتهائها</p>
      </div>
      <button class="app-btn" @click="openCreate">＋ متابعة جديدة</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="trackings__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in (['all', 'active', 'expiring', 'expired'] as const)" :key="t" class="tabs__btn" :class="{ 'is-active': statusTab === t }" @click="statusTab = t">
        {{ t === 'all' ? 'الكل' : t === 'active' ? 'نشطة' : t === 'expiring' ? 'توشك' : 'منتهية' }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث..." class="filters__search" />
      <select v-model="fProject" class="filters__select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <div class="grid">
      <div v-if="!filtered.length" class="empty app-card">لا توجد متابعات مطابقة.</div>
      <div v-for="t in filtered" :key="t.id" class="track app-card">
        <div class="track__top">
          <span class="track__icon">{{ t.icon }}</span>
          <span class="track__status" :style="{ background: statusInfo(t.status).bg, color: statusInfo(t.status).c }">
            {{ statusInfo(t.status).l }}
          </span>
        </div>
        <span class="track__name">{{ t.name }}</span>
        <span class="track__meta">{{ t.type }} · {{ projectsStore.projectById(t.projectId)?.name }}</span>
        <div class="track__expiry">
          <span>تاريخ الانتهاء: {{ t.expiryDate }}</span>
          <span :style="{ color: statusInfo(t.status).c }">
            {{ t.daysLeft < 0 ? `منتهٍ منذ ${Math.abs(t.daysLeft)} يوم` : `يتبقّى ${t.daysLeft} يوم` }}
          </span>
        </div>
        <div class="track__actions">
          <button class="icon-btn" title="تعديل" @click="openEdit(t)">✎</button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(t)">🗑️</button>
        </div>
      </div>
    </div>

    <TrackingFormModal v-if="showForm" :project-id="activeProjectId" :tracking="editing" @close="showForm = false" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.trackings {
  max-inline-size: 1100px;

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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.empty {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.track {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 4px;
  }

  &__icon { font-size: 26px; }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }

  &__name { font-weight: 700; font-size: 15px; }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__expiry {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: var(--text-muted);
    margin-block-start: 6px;
    padding-block-start: 10px;
    border-block-start: 1px solid var(--border);
  }

  &__actions {
    display: flex;
    gap: 6px;
    margin-block-start: 8px;
  }
}

.icon-btn {
  inline-size: 30px;
  block-size: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;

  &:hover { border-color: var(--primary); color: var(--primary); }
  &--danger:hover { border-color: var(--error); color: var(--error); }
}
</style>
