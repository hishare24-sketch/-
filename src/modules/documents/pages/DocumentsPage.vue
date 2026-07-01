<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import type { DocItem } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import type { DocActionKind } from '../docAI'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import DocFormModal from '../modals/DocFormModal.vue'
import DocDetailsModal from '../modals/DocDetailsModal.vue'
import DocTemplateModal from '../modals/DocTemplateModal.vue'
import TxFormModal from '@/modules/finance/modals/TxFormModal.vue'
import TrackingFormModal from '@/modules/trackings/modals/TrackingFormModal.vue'
import AssetFormModal from '@/modules/assets/modals/AssetFormModal.vue'
import CommitmentFormModal from '@/modules/commitments/modals/CommitmentFormModal.vue'
import ReceivableFormModal from '@/modules/receivables/modals/ReceivableFormModal.vue'

const documentsStore = useDocumentsStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { documents } = storeToRefs(documentsStore)
const { activeProjectId } = storeToRefs(projectsStore)


const typeTab = ref('all')
const search = ref('')
const fProject = ref('all')
const fStatus = ref('all')
const sort = ref<'newest' | 'oldest' | 'name'>('newest')
const projects = computed(() => projectsStore.projects)

const types = computed(() => ['all', ...new Set(documents.value.map((d) => d.type))])

const filtered = computed(() =>
  documents.value
    .filter((d) => (typeTab.value === 'all' ? true : d.type === typeTab.value))
    .filter((d) => (fProject.value === 'all' ? true : d.projectId === fProject.value))
    .filter((d) => (fStatus.value === 'all' ? true : fStatus.value === 'processed' ? d.aiRead : !d.aiRead))
    .filter((d) => (search.value.trim() === '' ? true : d.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'name' ? a.name.localeCompare(b.name) : sort.value === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
    ),
)

const stats = computed(() => [
  { label: 'إجمالي المستندات', value: String(documents.value.length), icon: '📄', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  { label: 'معالَجة', value: String(documents.value.filter((d) => d.aiRead).length), icon: '✅', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  { label: 'قيد المعالجة', value: String(documents.value.filter((d) => !d.aiRead).length), icon: '⏳', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
])

const docIcon = (type: string) => {
  if (type.includes('فاتورة')) return '🧾'
  if (type.includes('عقد')) return '📜'
  if (type.includes('كشف')) return '🏦'
  if (type.includes('رسمية')) return '🏛️'
  return '📄'
}

// أيقونات الإجراءات المنفّذة لعرضها على وجه الكرت
const ACTION_ICON: Record<string, string> = { tx: '💸', tracking: '🛡️', receivable: '⇄', commitment: '🔁', asset: '📦' }
const doneChips = (d: DocItem) => (d.performedActions ?? []).map((k) => ACTION_ICON[k] ?? '⚡')

const showForm = ref(false)
const showTemplates = ref(false)
const viewing = ref<DocItem | null>(null)
const viewAutoAnalyze = ref(false) // يُفعَّل فقط عند فتح مستند جديد بخيار التحليل التلقائي
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

// فتح مركز الإجراءات من الكرت (بلا تحليل تلقائي)
function openDoc(d: DocItem) {
  viewAutoAnalyze.value = false
  viewing.value = d
}

// نموذج الإجراء المُنشأ من المستند (مع تعبئة مسبقة)
const action = ref<{ kind: DocActionKind; preset: FormPreset } | null>(null)
const actionDocId = ref<string | null>(null)
function onDocAction(payload: { kind: DocActionKind; preset: FormPreset }) {
  actionDocId.value = viewing.value?.id ?? null
  viewing.value = null
  action.value = payload
}
// عند حفظ الإجراء فعلياً → علّم المستند بأن هذا الإجراء نُفّذ (يمنع تكراره)
function onActionSaved() {
  if (actionDocId.value && action.value) {
    documentsStore.markActionDone(actionDocId.value, action.value.kind)
  }
}
function closeAction() {
  action.value = null
  actionDocId.value = null
}

// بعد إنشاء أي مستند → افتح مركز الإجراءات مباشرة (والتحليل تلقائياً إن طُلب)
function onDocCreated(docId: string, autoAnalyze: boolean) {
  showForm.value = false
  const doc = documentsStore.documents.find((d) => d.id === docId)
  if (doc) {
    viewAutoAnalyze.value = autoAnalyze
    viewing.value = doc
  }
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
        <h1>المستندات <HelpIcon section="documents" /></h1>
        <p>الفواتير والعقود والوثائق ومعالجتها</p>
      </div>
      <div class="documents__actions">
        <button class="app-btn app-btn--outlined" @click="showTemplates = true">🧾 توليد مستند</button>
        <button class="app-btn" @click="showForm = true">＋ مستند جديد</button>
      </div>
    </header>


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
      <select v-model="fStatus" class="filters__select">
        <option value="all">كل الحالات</option>
        <option value="processed">معالَج</option>
        <option value="pending">قيد المعالجة</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="newest">الأحدث</option>
        <option value="oldest">الأقدم</option>
        <option value="name">الاسم</option>
      </select>
    </div>

    <div class="grid">
      <div v-if="!filtered.length" class="empty app-card">لا توجد مستندات مطابقة.</div>
      <div v-for="d in filtered" :key="d.id" class="doc app-card" @click="openDoc(d)">
        <div class="doc__top">
          <span class="doc__icon">{{ docIcon(d.type) }}</span>
          <span class="doc__badge" :class="{ 'is-read': d.aiRead }">
            {{ d.aiRead ? '✓ معالَج' : 'قيد المعالجة' }}
          </span>
        </div>
        <span class="doc__name">
          {{ d.name }}
          <span v-if="d.attachments?.length" class="doc__clip" title="مرفقات">📎{{ d.attachments.length }}</span>
        </span>
        <span class="doc__meta">{{ docIcon(d.type) }} {{ d.type }} · {{ projectsStore.projectById(d.projectId)?.name }}</span>
        <div class="doc__foot">
          <span class="doc__by">{{ d.date }} · {{ d.size }}<template v-if="d.createdBy"> · {{ d.createdBy }}</template></span>
        </div>
        <!-- الإجراءات المُنفّذة من هذا المستند -->
        <div v-if="doneChips(d).length" class="doc__done" :title="`${doneChips(d).length} إجراء منفّذ`">
          <span class="doc__done-label">⚡ نُفّذ:</span>
          <span v-for="(ic, i) in doneChips(d)" :key="i" class="doc__done-chip">{{ ic }}</span>
        </div>
        <div class="doc__actions" @click.stop>
          <button class="app-btn app-btn--outlined proc-btn" @click="openDoc(d)">
            ⚡ الإجراءات
          </button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(d)">🗑️</button>
        </div>
      </div>
    </div>

    <DocFormModal v-if="showForm" :project-id="activeProjectId" @created="onDocCreated" @close="showForm = false" />
    <DocTemplateModal v-if="showTemplates" @close="showTemplates = false" />
    <DocDetailsModal v-if="viewing" :doc="viewing" :auto-analyze="viewAutoAnalyze" @action="onDocAction" @close="viewing = null" />

    <!-- نماذج الإجراءات المُنشأة من المستند (تعبئة مسبقة) -->
    <TxFormModal v-if="action?.kind === 'tx'" :project-id="action.preset.projectId ?? activeProjectId" :tx="null" :preset="action.preset" @saved="onActionSaved" @close="closeAction" />
    <TrackingFormModal v-if="action?.kind === 'tracking'" :project-id="action.preset.projectId ?? activeProjectId" :tracking="null" :preset="action.preset" @saved="onActionSaved" @close="closeAction" />
    <AssetFormModal v-if="action?.kind === 'asset'" :project-id="action.preset.projectId ?? activeProjectId" :preset="action.preset" @saved="onActionSaved" @close="closeAction" />
    <CommitmentFormModal v-if="action?.kind === 'commitment'" :project-id="action.preset.projectId ?? activeProjectId" :preset="action.preset" @saved="onActionSaved" @close="closeAction" />
    <ReceivableFormModal v-if="action?.kind === 'receivable'" :project-id="action.preset.projectId ?? activeProjectId" :preset="action.preset" @saved="onActionSaved" @close="closeAction" />

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

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
  cursor: pointer;
  transition: transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);

  &:hover { transform: translateY(-2px); box-shadow: var(--elev-2); border-color: var(--primary); }

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
    background: var(--warn-bg);
    color: var(--warn-text);

    &.is-read { background: var(--ok-bg); color: var(--ok-text); }
  }

  &__name {
    font-weight: 700;
    font-size: 14px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__clip { font-size: 11px; color: var(--primary); margin-inline-start: 4px; }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-block-start: 2px;
  }

  &__by { font-size: 11px; color: var(--text-muted); }

  &__done {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-block-start: 8px;
    padding: 6px 10px;
    background: var(--ok-bg);
    border-radius: 8px;
    flex-wrap: wrap;
  }

  &__done-label { font-size: 11px; font-weight: 700; color: var(--ok-text); }
  &__done-chip { font-size: 13px; }

  &__actions {
    display: flex;
    gap: 8px;
    margin-block-start: 10px;
    padding-block-start: 10px;
    border-block-start: 1px solid var(--border);
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
