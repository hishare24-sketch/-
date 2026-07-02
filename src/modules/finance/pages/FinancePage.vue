<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { exportXLSX } from '@/helpers/export'
import { useToast } from '@/composables/useToast'
import { txErrors } from '@/helpers/txAnalysis'
import { currentUserName } from '@/helpers/currentUser'
import type { Transaction, TxType } from '@/interfaces/models'
import { BaseButton } from '@/components/base'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import TxFormModal from '../modals/TxFormModal.vue'
import TxDetailsModal from '../modals/TxDetailsModal.vue'
import ReconcileModal from '../modals/ReconcileModal.vue'

const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const settingsStore = useSettingsStore()
const { activeProjectId, activeProject, projects } = storeToRefs(projectsStore)
const toast = useToast()

const txns = computed(() => financeStore.byProject(activeProjectId.value))

// الفلاتر
const tab = ref<'all' | TxType>('all')
const search = ref('')
const catFilter = ref('all')
const sort = ref<'newest' | 'oldest' | 'amount'>('newest')

const cats = computed(() => Array.from(new Set(txns.value.map((t) => t.category))))

const filtered = computed(() =>
  txns.value
    .filter((t) => (tab.value === 'all' ? true : t.type === tab.value))
    .filter((t) => (catFilter.value === 'all' ? true : t.category === catFilter.value))
    .filter((t) => (search.value.trim() === '' ? true : t.description.includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'newest'
        ? b.date.localeCompare(a.date)
        : sort.value === 'oldest'
          ? a.date.localeCompare(b.date)
          : b.amount - a.amount,
    ),
)

const income = computed(() => txns.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const expense = computed(() => txns.value.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const transfersIn = computed(() => txns.value.filter((t) => t.type === 'transfer' && t.transferDir === 'in').reduce((s, t) => s + t.amount, 0))
const transfersOut = computed(() => txns.value.filter((t) => t.type === 'transfer' && t.transferDir === 'out').reduce((s, t) => s + t.amount, 0))

const stats = computed(() => [
  { label: 'إجمالي الإيرادات', val: income.value, color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '📈' },
  { label: 'إجمالي المصروفات', val: expense.value, color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '📉' },
  { label: 'صافي الربح', val: income.value - expense.value, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '💰' },
  { label: 'صافي التحويلات', val: transfersIn.value - transfersOut.value, color: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '↔' },
])

// توزيع المصروفات حسب التصنيف
const CAT_PALETTE = ['#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#2563eb', '#059669']
const catView = ref<'donut' | 'bar'>('donut')
const expenseByCat = computed(() => {
  const map: Record<string, number> = {}
  txns.value.filter((t) => t.type === 'expense').forEach((t) => {
    map[t.category] = (map[t.category] ?? 0) + t.amount
  })
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map((e) => e[1]), 1)
  const donut = entries.map(([label, value], i) => ({ label, value, color: CAT_PALETTE[i % CAT_PALETTE.length] }))
  return { entries, max, donut }
})

function isFlagged(t: Transaction) {
  return txErrors(t, { project: activeProject.value, transactions: financeStore.transactions }).length > 0
}

const typeLabel = (t: TxType) => (t === 'income' ? 'إيراد' : t === 'expense' ? 'مصروف' : 'تحويل')

// المودالات
const showForm = ref(false)
const showReconcile = ref(false)
const editing = ref<Transaction | null>(null)
const viewing = ref<Transaction | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function openCreate() {
  editing.value = null
  showForm.value = true
}
function openEdit(t: Transaction) {
  editing.value = t
  showForm.value = true
}
function openView(t: Transaction) {
  viewing.value = t
}
function editFromView(t: Transaction) {
  viewing.value = null
  openEdit(t)
}
async function onDelete(t: Transaction) {
  const ok = await confirmRef.value?.open({ title: 'حذف العملية', message: `حذف "${t.description}"؟` })
  if (ok) {
    financeStore.deleteTransaction(t.id)
    toast.success('تم حذف العملية')
  }
}

function exportExcel() {
  exportXLSX(`عمليات_${activeProject.value?.name ?? ''}`, [
    {
      name: 'العمليات',
      rows: filtered.value.map((t) => ({
        الوصف: t.description,
        النوع: typeLabel(t.type),
        التصنيف: t.category,
        المبلغ: t.amount,
        التاريخ: t.date,
        'المصدر/الجهة': t.source ?? '—',
        بواسطة: t.createdBy ?? currentUserName(),
      })),
    },
  ])
    .then(() => toast.success('تم تصدير ملف العمليات'))
    .catch((e) => toast.error(e.message))
}

function clearFilters() {
  search.value = ''
  catFilter.value = 'all'
  sort.value = 'newest'
}
</script>

<template>
  <section class="finance">
    <header class="finance__header">
      <div>
        <h1>الإدارة المالية <HelpIcon section="finance" /></h1>
        <p>{{ activeProject?.name }}</p>
      </div>
      <div class="finance__controls">
        <select v-model="activeProjectId" class="select">
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
        </select>
        <BaseButton variant="outlined" @click="exportExcel">⬇ Excel</BaseButton>
        <BaseButton variant="outlined" @click="showReconcile = true">📥 مطابقة Excel</BaseButton>
        <BaseButton @click="openCreate">＋ عملية جديدة</BaseButton>
      </div>
    </header>


    <div class="finance__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat" :style="{ background: s.bg }">
        <span class="stat__icon">{{ s.icon }}</span>
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value" :style="{ color: s.color }">{{ fmt(s.val) }}</span>
        </div>
      </div>
    </div>

    <!-- توزيع المصروفات حسب التصنيف -->
    <ChartCard
      v-if="expenseByCat.entries.length && settingsStore.prefs.showCharts"
      v-model="catView"
      title="توزيع المصروفات حسب التصنيف"
      class="breakdown-card"
      :views="[
        { id: 'donut', icon: '🍩', label: 'دائري' },
        { id: 'bar', icon: '📊', label: 'أشرطة' },
      ]"
    >
      <DonutChart v-if="catView === 'donut'" :data="expenseByCat.donut" :size="150" center-label="مصروفات" />
      <div v-else class="breakdown">
        <div v-for="(d, i) in expenseByCat.donut" :key="d.label" class="breakdown__row">
          <span class="breakdown__label">{{ d.label }}</span>
          <div class="breakdown__track">
            <div class="breakdown__fill" :style="{ width: `${(d.value / expenseByCat.max) * 100}%`, background: CAT_PALETTE[i % CAT_PALETTE.length] }" />
          </div>
          <span class="breakdown__val">{{ fmtNum(d.value) }}</span>
        </div>
      </div>
    </ChartCard>

    <!-- جدول العمليات -->
    <div class="app-card table-card">
      <div class="tabs">
        <button
          v-for="t in (['all', 'income', 'expense', 'transfer'] as const)"
          :key="t"
          class="tabs__btn"
          :class="{ 'is-active': tab === t }"
          @click="tab = t"
        >
          {{ t === 'all' ? 'الكل' : t === 'income' ? 'إيرادات' : t === 'expense' ? 'مصروفات' : 'تحويلات' }}
        </button>
      </div>

      <div class="filters">
        <input v-model="search" type="text" placeholder="🔍 بحث في الوصف..." class="filters__search" />
        <select v-model="catFilter" class="select">
          <option value="all">كل التصنيفات</option>
          <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="sort" class="select">
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="amount">الأعلى مبلغاً</option>
        </select>
        <BaseButton
          v-if="search || catFilter !== 'all' || sort !== 'newest'"
          variant="ghost"
          @click="clearFilters"
        >
          مسح الفلترة
        </BaseButton>
      </div>

      <div v-if="settingsStore.prefs.listView === 'table'" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الوصف</th>
              <th>التصنيف</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="5" class="empty">لا توجد عمليات مطابقة.</td>
            </tr>
            <tr v-for="t in filtered" :key="t.id" :class="{ 'is-flagged': isFlagged(t) }" class="clickable" @click="openView(t)">
              <td>
                <div class="desc">
                  <span class="desc__badge" :class="`is-${t.type}`">
                    {{ t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔' }}
                  </span>
                  <div>
                    <span class="desc__text">{{ t.description }}</span>
                    <span v-if="isFlagged(t)" class="desc__flag">⚠️ تحتاج مراجعة</span>
                    <span v-if="t.source" class="desc__source">{{ t.source }}</span>
                  </div>
                </div>
              </td>
              <td><span class="chip">{{ t.category }}</span></td>
              <td class="muted">{{ t.date }}</td>
              <td>
                <span class="amount" :class="`is-${t.type}`">
                  {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-' }}{{ fmtNum(t.amount) }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="icon-btn" title="استعراض" @click.stop="openView(t)">👁</button>
                  <button class="icon-btn" title="تعديل" @click.stop="openEdit(t)">✎</button>
                  <button class="icon-btn icon-btn--danger" title="حذف" @click.stop="onDelete(t)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- عرض البطاقات (بديل الجدول حسب إعداد «عرض البيانات») -->
      <div v-else class="dcards">
        <p v-if="!filtered.length" class="dcards__empty">لا توجد عمليات مطابقة.</p>
        <div
          v-for="t in filtered"
          :key="t.id"
          class="dcard"
          :class="{ 'is-flagged': isFlagged(t) }"
          role="button"
          tabindex="0"
          @click="openView(t)"
          @keydown.enter="openView(t)"
        >
          <div class="dcard__row">
            <span class="desc">
              <span class="desc__badge" :class="`is-${t.type}`">
                {{ t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔' }}
              </span>
              <span class="desc__text">{{ t.description }}</span>
            </span>
            <span class="amount" :class="`is-${t.type}`">
              {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-' }}{{ fmtNum(t.amount) }}
            </span>
          </div>
          <div class="dcard__row dcard__meta">
            <span class="chip">{{ t.category }}</span>
            <span class="muted nowrap">{{ t.date }}</span>
          </div>
          <div v-if="t.source || isFlagged(t)" class="dcard__row dcard__meta">
            <span class="muted">{{ t.source || '' }}</span>
            <span v-if="isFlagged(t)" class="desc__flag">⚠️ تحتاج مراجعة</span>
          </div>
          <div class="dcard__actions">
            <button class="icon-btn" title="استعراض" @click.stop="openView(t)">👁</button>
            <button class="icon-btn" title="تعديل" @click.stop="openEdit(t)">✎</button>
            <button class="icon-btn icon-btn--danger" title="حذف" @click.stop="onDelete(t)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <TxFormModal v-if="showForm" :project-id="activeProjectId" :tx="editing" @close="showForm = false" />
    <ReconcileModal v-if="showReconcile" :project-id="activeProjectId" @close="showReconcile = false" />
    <TxDetailsModal v-if="viewing" :tx="viewing" @edit="editFromView" @close="viewing = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.finance {
  max-inline-size: 1100px;

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

  &__controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-block-end: 20px;
  }
}

.select {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
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
  align-items: center;
  gap: 12px;
  padding: 18px;
  border-radius: 16px;

  &__icon {
    font-size: 24px;
  }

  &__label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
  }

  &__value {
    font-size: 17px;
    font-weight: 700;
  }
}

.breakdown-card {
  margin-block-end: 20px;
}

.breakdown {
  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block-end: 10px;
  }

  &__label {
    inline-size: 90px;
    font-size: 13px;
    flex-shrink: 0;
  }

  &__track {
    flex: 1;
    block-size: 10px;
    background: var(--bg);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    block-size: 100%;
    background: #f87171;
    border-radius: 99px;
  }

  &__val {
    inline-size: 80px;
    text-align: end;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 16px;
  background: var(--bg);
  border-block-end: 1px solid var(--border);
  flex-wrap: wrap;

  &__btn {
    padding: 6px 16px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active {
      background: var(--surface);
      color: var(--text);
      box-shadow: var(--shadow);
    }
  }
}

.filters {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-block-end: 1px solid var(--border);
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 160px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: inherit;
    font-size: 13px;
  }
}

.table-wrap {
  overflow-x: auto;
}

// ── عرض البطاقات (بديل الجدول) ──
.dcards {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__empty {
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
    padding: 24px;
  }
}

.dcard {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease);

  &:hover { border-color: var(--primary); box-shadow: var(--shadow); }
  &.is-flagged { border-color: var(--error); background: var(--danger-bg); }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__meta { font-size: 13px; }

  &__actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
    border-block-start: 1px dashed var(--border);
    padding-block-start: 8px;
  }

  .desc { display: flex; align-items: center; gap: 8px; min-inline-size: 0; }
  .desc__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-inline-size: 560px;
}

th {
  text-align: start;
  padding: 12px 16px;
  background: var(--bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
}

td {
  padding: 12px 16px;
  border-block-start: 1px solid var(--border);
}

tbody tr.is-flagged {
  background: var(--danger-bg);
}

tbody tr.clickable {
  cursor: pointer;

  &:hover td { background: var(--primary-soft); }
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 30px !important;
}

.desc {
  display: flex;
  align-items: center;
  gap: 10px;

  &__badge {
    inline-size: 30px;
    block-size: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.is-income {
      background: var(--ok-bg);
      color: var(--ok-text);
    }

    &.is-expense {
      background: var(--danger-bg);
      color: var(--danger-text);
    }

    &.is-transfer {
      background: var(--info-bg);
      color: var(--info-text);
    }
  }

  &__text {
    display: block;
    font-weight: 500;
  }

  &__flag {
    font-size: 11px;
    color: var(--danger-text);
  }

  &__source {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
  }
}

.chip {
  background: var(--bg);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

.muted {
  color: var(--text-muted);
}

.amount {
  font-weight: 600;

  &.is-income {
    color: var(--ok-text);
  }

  &.is-expense {
    color: var(--danger-text);
  }

  &.is-transfer {
    color: var(--info-text);
  }
}

.row-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  inline-size: 30px;
  block-size: 30px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &--danger:hover {
    border-color: var(--error);
    color: var(--error);
  }
}
</style>
