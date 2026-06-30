<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useSurveysStore } from '@/stores/SurveysStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { SURVEY_TEMPLATES } from '@/constants/surveyTemplates'
import type { Survey } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import SurveyBuilderModal from '../modals/SurveyBuilderModal.vue'
import SurveyResultsModal from '../modals/SurveyResultsModal.vue'
import RespondentsModal from '../modals/RespondentsModal.vue'
import FillSurveyModal from '../modals/FillSurveyModal.vue'

const surveysStore = useSurveysStore()
const projectsStore = useProjectsStore()
const { surveys } = storeToRefs(surveysStore)

const stats = computed(() => [
  { label: 'إجمالي الاستبيانات', value: String(surveys.value.length), icon: '📋', color: '#0891b2', bg: '#ecfeff' },
  { label: 'نشطة', value: String(surveys.value.filter((s) => s.status === 'active').length), icon: '🟢', color: '#059669', bg: '#ecfdf5' },
  { label: 'إجمالي الردود', value: String(surveys.value.reduce((s, sv) => s + sv.responses.length, 0)), icon: '💬', color: '#7e22ce', bg: '#faf5ff' },
])

// الفلاتر والفرز
const search = ref('')
const fStatus = ref('all')
const sort = ref<'newest' | 'responses'>('newest')

const visibleSurveys = computed(() =>
  surveys.value
    .filter((s) => (fStatus.value === 'all' ? true : s.status === fStatus.value))
    .filter((s) => (search.value.trim() === '' ? true : s.title.includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'responses' ? b.responses.length - a.responses.length : b.createdAt.localeCompare(a.createdAt),
    ),
)
const hasFilter = computed(() => fStatus.value !== 'all' || sort.value !== 'newest' || search.value !== '')
function clearFilters() {
  fStatus.value = 'all'
  sort.value = 'newest'
  search.value = ''
}

const tplIcon = (type: string) => SURVEY_TEMPLATES.find((t) => t.id === type)?.icon ?? '📋'

function statusInfo(s: Survey['status']) {
  if (s === 'active') return { l: 'نشط', c: '#059669', bg: '#ecfdf5' }
  if (s === 'closed') return { l: 'مغلق', c: '#dc2626', bg: '#fef2f2' }
  return { l: 'مسودة', c: '#d97706', bg: '#fffbeb' }
}

const showBuilder = ref(false)
const editing = ref<Survey | null>(null)
const viewing = ref<Survey | null>(null)
const managing = ref<Survey | null>(null)
const filling = ref<Survey | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function openCreate() {
  editing.value = null
  showBuilder.value = true
}
function openEdit(s: Survey) {
  editing.value = s
  showBuilder.value = true
}

function toggleStatus(s: Survey) {
  surveysStore.setStatus(s.id, s.status === 'active' ? 'closed' : 'active')
}
async function onDelete(s: Survey) {
  const ok = await confirmRef.value?.open({ title: 'حذف الاستبيان', message: `حذف "${s.title}"؟` })
  if (ok) surveysStore.deleteSurvey(s.id)
}
</script>

<template>
  <section class="surveys">
    <header class="surveys__header">
      <div>
        <h1>الاستبيانات <HelpIcon section="surveys" /></h1>
        <p>إنشاء الاستبيانات وجمع الردود وتحليلها</p>
      </div>
      <button class="app-btn" @click="openCreate">＋ استبيان جديد</button>
    </header>

    <div class="surveys__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث في الاستبيانات..." class="filters__search" />
      <select v-model="fStatus" class="filters__select">
        <option value="all">كل الحالات</option>
        <option value="active">نشط</option>
        <option value="closed">مغلق</option>
        <option value="draft">مسودة</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="newest">الأحدث</option>
        <option value="responses">الأكثر ردوداً</option>
      </select>
      <button v-if="hasFilter" class="app-btn app-btn--ghost" @click="clearFilters">مسح</button>
    </div>

    <div class="grid">
      <div v-if="!visibleSurveys.length" class="empty app-card">لا توجد استبيانات مطابقة.</div>
      <div v-for="s in visibleSurveys" :key="s.id" class="survey app-card">
        <div class="survey__top">
          <span class="survey__icon">{{ tplIcon(s.surveyType) }}</span>
          <span class="survey__status" :style="{ background: statusInfo(s.status).bg, color: statusInfo(s.status).c }">
            {{ statusInfo(s.status).l }}
          </span>
        </div>
        <span class="survey__title">{{ s.title }}</span>
        <span class="survey__meta">
          {{ s.questions.length }} سؤال · {{ s.responses.length }} رد
          <template v-if="s.respondents?.length"> · {{ s.respondents.length }} مستبين</template>
          <template v-if="s.projectId"> · {{ projectsStore.projectById(s.projectId)?.name }}</template>
        </span>
        <div class="survey__actions">
          <button class="app-btn app-btn--outlined view-btn" @click="viewing = s">📊 النتائج</button>
          <button class="icon-btn" title="المستبينون" @click="managing = s">👥</button>
          <button class="icon-btn" title="تعبئة" :disabled="s.status !== 'active'" @click="filling = s">✍️</button>
          <button class="icon-btn" title="تعديل" @click="openEdit(s)">✎</button>
          <button class="icon-btn" :title="s.status === 'active' ? 'إغلاق' : 'تفعيل'" @click="toggleStatus(s)">
            {{ s.status === 'active' ? '🔒' : '🔓' }}
          </button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(s)">🗑️</button>
        </div>
      </div>
    </div>

    <SurveyBuilderModal v-if="showBuilder" :survey="editing" @close="showBuilder = false" />
    <SurveyResultsModal v-if="viewing" :survey="viewing" @close="viewing = null" />
    <RespondentsModal v-if="managing" :survey="managing" @close="managing = null" />
    <FillSurveyModal v-if="filling" :survey="filling" @close="filling = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.surveys {
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

.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px;

  &__label { display: block; font-size: 12px; color: var(--text-muted); margin-block-end: 6px; }
  &__value { font-size: 17px; font-weight: 700; }
  &__icon { inline-size: 42px; block-size: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; }
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

.survey {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__icon { font-size: 26px; }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }

  &__title { font-weight: 700; font-size: 15px; margin-block-start: 4px; }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__actions {
    display: flex;
    gap: 8px;
    margin-block-start: 10px;
  }
}

.view-btn { flex: 1; padding: 7px; font-size: 13px; }

.icon-btn {
  inline-size: 34px;
  block-size: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 14px;

  &:hover { border-color: var(--primary); }
  &--danger:hover { border-color: var(--error); color: var(--error); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}
</style>
