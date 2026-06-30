<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import type { DocItem } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import DocFormModal from '../modals/DocFormModal.vue'

const documentsStore = useDocumentsStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { documents } = storeToRefs(documentsStore)
const { activeProjectId } = storeToRefs(projectsStore)

const helpEntry = computed(() => settingsStore.help.documents)

const typeTab = ref('all')
const search = ref('')
const fProject = ref('all')
const projects = computed(() => projectsStore.projects)

const types = computed(() => ['all', ...new Set(documents.value.map((d) => d.type))])

const filtered = computed(() =>
  documents.value
    .filter((d) => (typeTab.value === 'all' ? true : d.type === typeTab.value))
    .filter((d) => (fProject.value === 'all' ? true : d.projectId === fProject.value))
    .filter((d) => (search.value.trim() === '' ? true : d.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const stats = computed(() => [
  { label: 'إجمالي المستندات', value: String(documents.value.length), icon: '📄', color: '#0891b2', bg: '#ecfeff' },
  { label: 'معالَجة', value: String(documents.value.filter((d) => d.aiRead).length), icon: '✅', color: '#059669', bg: '#ecfdf5' },
  { label: 'قيد المعالجة', value: String(documents.value.filter((d) => !d.aiRead).length), icon: '⏳', color: '#d97706', bg: '#fffbeb' },
])

const docIcon = (type: string) => {
  if (type.includes('فاتورة')) return '🧾'
  if (type.includes('عقد')) return '📜'
  if (type.includes('كشف')) return '🏦'
  if (type.includes('رسمية')) return '🏛️'
  return '📄'
}

const showForm = ref(false)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function process(d: DocItem) {
  documentsStore.markProcessed(d.id)
}
async function onDelete(d: DocItem) {
  const ok = await confirmRef.value?.open({ title: 'حذف المستند', message: `حذف "${d.name}"؟` })
  if (ok) documentsStore.deleteDoc(d.id)
}
</script>

<template>
  <section class="documents">
    <header class="documents__header">
      <div>
        <h1>المستندات</h1>
        <p>الفواتير والعقود والوثائق ومعالجتها</p>
      </div>
      <button class="app-btn" @click="showForm = true">＋ مستند جديد</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="documents__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in types" :key="t" class="tabs__btn" :class="{ 'is-active': typeTab === t }" @click="typeTab = t">
        {{ t === 'all' ? 'الكل' : t }}
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
      <div v-if="!filtered.length" class="empty app-card">لا توجد مستندات مطابقة.</div>
      <div v-for="d in filtered" :key="d.id" class="doc app-card">
        <div class="doc__top">
          <span class="doc__icon">{{ docIcon(d.type) }}</span>
          <span class="doc__badge" :class="{ 'is-read': d.aiRead }">
            {{ d.aiRead ? '✓ معالَج' : 'قيد المعالجة' }}
          </span>
        </div>
        <span class="doc__name">{{ d.name }}</span>
        <span class="doc__meta">{{ d.type }} · {{ projectsStore.projectById(d.projectId)?.name }}</span>
        <span class="doc__sub">{{ d.date }} · {{ d.size }}</span>
        <div class="doc__actions">
          <button v-if="!d.aiRead" class="app-btn app-btn--outlined proc-btn" @click="process(d)">⚡ معالجة</button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(d)">🗑️</button>
        </div>
      </div>
    </div>

    <DocFormModal v-if="showForm" :project-id="activeProjectId" @close="showForm = false" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.documents {
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.empty {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.doc {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 4px;
  }

  &__icon { font-size: 26px; }

  &__badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    background: #fffbeb;
    color: #d97706;

    &.is-read { background: #ecfdf5; color: #059669; }
  }

  &__name { font-weight: 700; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
  &__sub { font-size: 11px; color: var(--text-muted); }

  &__actions {
    display: flex;
    gap: 8px;
    margin-block-start: 8px;
  }
}

.proc-btn { flex: 1; padding: 7px; font-size: 13px; }

.icon-btn {
  inline-size: 34px;
  block-size: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;

  &--danger:hover { border-color: var(--error); color: var(--error); }
}
</style>
