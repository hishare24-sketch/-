<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmt, fmtNum } from '@/helpers/format'
import type { Project } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ProjectFormModal from '../modals/ProjectFormModal.vue'
import { BaseButton } from '@/components/base'

const router = useRouter()
const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const settingsStore = useSettingsStore()
const { projects } = storeToRefs(projectsStore)


// الفلاتر والفرز
const search = ref('')
const fType = ref('all')
const sort = ref<'name' | 'balanceHigh' | 'balanceLow'>('name')

const projectTypes = computed(() => ['all', ...new Set(projects.value.map((p) => p.type).filter(Boolean) as string[])])

const visibleProjects = computed(() =>
  projects.value
    .filter((p) => (fType.value === 'all' ? true : p.type === fType.value))
    .filter((p) => (search.value.trim() === '' ? true : p.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'name'
        ? a.name.localeCompare(b.name)
        : sort.value === 'balanceHigh'
          ? financeStore.balanceOf(b.id) - financeStore.balanceOf(a.id)
          : financeStore.balanceOf(a.id) - financeStore.balanceOf(b.id),
    ),
)
const hasFilter = computed(() => fType.value !== 'all' || sort.value !== 'name' || search.value !== '')
function clearFilters() {
  fType.value = 'all'
  sort.value = 'name'
  search.value = ''
}

const stats = computed(() => {
  const totalBalance = projects.value.reduce((s, p) => s + financeStore.balanceOf(p.id), 0)
  const income = financeStore.transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = financeStore.transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return [
    { label: 'عدد المشاريع', value: String(projects.value.length), icon: '🏢', color: 'var(--info-text)', bg: 'var(--info-bg)' },
    { label: 'إجمالي الأرصدة', value: fmt(totalBalance), icon: '💰', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
    { label: 'إجمالي الإيرادات', value: fmtNum(income), icon: '📈', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
    { label: 'إجمالي المصروفات', value: fmtNum(expense), icon: '📉', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
  ]
})

function projectStats(p: Project) {
  const txns = financeStore.byProject(p.id)
  return {
    balance: financeStore.balanceOf(p.id),
    members: projectsStore.membersByProject(p.id).length,
    income: txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }
}

// المودالات
const showForm = ref(false)
const editing = ref<Project | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function openCreate() {
  editing.value = null
  showForm.value = true
}
function openEdit(p: Project) {
  editing.value = p
  showForm.value = true
}
function openProject(p: Project) {
  projectsStore.setActiveProject(p.id)
  router.push({ name: 'project-detail', params: { id: p.id } })
}
async function onDelete(p: Project) {
  const ok = await confirmRef.value?.open({
    title: 'حذف المشروع',
    message: `هل أنت متأكد من حذف "${p.name}"؟ سيُحذف معه أعضاؤه. لا يمكن التراجع.`,
  })
  if (ok) projectsStore.removeProject(p.id)
}
</script>

<template>
  <section class="projects">
    <header class="projects__header">
      <div>
        <h1>المشاريع <HelpIcon section="projects" /></h1>
        <p>الوحدة التنظيمية الأساسية — كل عملية ومستند يرتبط بمشروع</p>
      </div>
      <BaseButton @click="openCreate">＋ مشروع جديد</BaseButton>
    </header>


    <div class="projects__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث عن مشروع..." class="filters__search" />
      <select v-model="fType" class="filters__select">
        <option v-for="t in projectTypes" :key="t" :value="t">{{ t === 'all' ? 'كل الأنواع' : t }}</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="name">الاسم (أ-ي)</option>
        <option value="balanceHigh">الأعلى رصيداً</option>
        <option value="balanceLow">الأقل رصيداً</option>
      </select>
      <BaseButton v-if="hasFilter" variant="ghost" @click="clearFilters">مسح</BaseButton>
    </div>

    <div class="projects__grid">
      <div v-if="!visibleProjects.length" class="empty app-card">لا توجد مشاريع مطابقة.</div>
      <div v-for="p in visibleProjects" :key="p.id" class="project-card app-card">
        <div class="project-card__top">
          <span class="project-card__avatar" :style="{ background: p.color + '20' }">{{ p.icon }}</span>
          <div class="project-card__title">
            <span class="project-card__name">{{ p.name }}</span>
            <span class="project-card__type">{{ p.type ?? 'مشروع نشط' }}</span>
          </div>
          <button class="icon-btn" title="تعديل" @click="openEdit(p)">✎</button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(p)">🗑️</button>
        </div>

        <div class="project-card__balance">
          <span class="project-card__balance-label">الرصيد الحالي</span>
          <span class="project-card__balance-value">{{ fmt(projectStats(p).balance) }}</span>
        </div>

        <div class="project-card__mini">
          <div class="mini mini--income">
            <span>إيرادات</span>
            <strong>{{ fmtNum(projectStats(p).income) }}</strong>
          </div>
          <div class="mini mini--expense">
            <span>مصروفات</span>
            <strong>{{ fmtNum(projectStats(p).expense) }}</strong>
          </div>
        </div>

        <div class="project-card__footer">
          <span class="project-card__members">👥 {{ projectStats(p).members }} عضو</span>
          <BaseButton variant="outlined" class="project-card__open" @click="openProject(p)">
            عرض المشروع
          </BaseButton>
        </div>
      </div>

      <button class="project-add" @click="openCreate">
        <span class="project-add__plus">＋</span>
        <span>إضافة مشروع جديد</span>
      </button>
    </div>

    <ProjectFormModal v-if="showForm" v-model:show="showForm" :project="editing" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.projects {
  max-inline-size: 1000px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 20px;
    flex-wrap: wrap;

    h1 {
      font-size: 22px;
      font-weight: 700;
    }

    p {
      color: var(--text-muted);
      font-size: 14px;
      margin-block-start: 4px;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-block-end: 22px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 18px;
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

.empty {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.help-note {
  padding: 14px 18px;
  margin-block-end: 20px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
  background: var(--primary-soft);
  border-color: transparent;

  strong {
    color: var(--primary);
    margin-inline-end: 8px;
  }
}

.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;

  &__label {
    font-size: 13px;
    color: var(--text-muted);
    display: block;
    margin-block-end: 6px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
  }

  &__icon {
    inline-size: 44px;
    block-size: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
}

.project-card {
  padding: 20px;

  &__top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block-end: 16px;
  }

  &__avatar {
    inline-size: 48px;
    block-size: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-weight: 700;
    font-size: 15px;
  }

  &__type {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__balance {
    background: var(--bg);
    border-radius: 10px;
    padding: 10px 14px;
    margin-block-end: 14px;
    display: flex;
    flex-direction: column;
  }

  &__balance-label {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__balance-value {
    font-size: 20px;
    font-weight: 700;
  }

  &__mini {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-block-end: 14px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__members {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__open {
    padding: 8px 14px;
    font-size: 13px;
  }
}

.mini {
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 10px;
  }

  strong {
    font-size: 13px;
  }

  &--income {
    background: var(--ok-bg);
    color: var(--ok-text);
  }

  &--expense {
    background: var(--danger-bg);
    color: var(--danger-text);
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
  flex-shrink: 0;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &--danger:hover {
    border-color: var(--error);
    color: var(--error);
  }
}

.project-add {
  border: 2px dashed var(--border);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-block-size: 200px;
  color: var(--text-muted);
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &__plus {
    font-size: 32px;
  }
}
</style>
