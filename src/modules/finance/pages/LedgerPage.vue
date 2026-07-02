<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { BaseButton } from '@/components/base'
import ModalShell from '@/components/shared/ModalShell.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { exportXLSX } from '@/helpers/export'
import { useToast } from '@/composables/useToast'
import { txErrors } from '@/helpers/txAnalysis'
import { useFocusHighlight } from '@/composables/useFocusHighlight'
import { useLedgerRows, type LedgerRow } from '../composables/useLedger'

const router = useRouter()
const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const toast = useToast()
const settingsStore = useSettingsStore()
const { projects, members } = storeToRefs(projectsStore)
const { prefs } = storeToRefs(settingsStore)
const { rows, projName, memName } = useLedgerRows()
const { isFocused } = useFocusHighlight()

// التبويب: العمليات / تحليل التدفقات
const view = ref<'log' | 'flows'>('log')

// الفلاتر
const fType = ref('all')
const fProject = ref('all')
const fMember = ref('all')
const fPeriod = ref('all')
const search = ref('')

function inPeriod(date: string) {
  if (fPeriod.value === 'all') return true
  const diff = (new Date('2025-06-30').getTime() - new Date(date).getTime()) / 86400000
  if (fPeriod.value === 'month') return diff <= 31
  if (fPeriod.value === 'quarter') return diff <= 92
  if (fPeriod.value === 'half') return diff <= 183
  if (fPeriod.value === 'year') return diff <= 366
  return true
}

const filtered = computed(() =>
  rows.value
    .filter((r) => (fType.value === 'all' ? true : fType.value === 'in' ? r.dir === 'in' : fType.value === 'out' ? r.dir === 'out' : r.kind === fType.value))
    .filter((r) => (fProject.value === 'all' ? true : r.projectId === fProject.value))
    .filter((r) => (fMember.value === 'all' ? true : r.memberId === fMember.value))
    .filter((r) => inPeriod(r.date))
    .filter((r) => (search.value.trim() === '' ? true : (r.kind + r.nature + r.parties.join(' ') + r.num).includes(search.value.trim()))),
)

// الرصيد الجارٍ لكل صف (مُحتسب لكل مشروع زمنياً على المجموعة المفلترة)
const balBefore = computed(() => {
  const chrono = [...filtered.value].sort((a, b) => a.date.localeCompare(b.date))
  const before: Record<string, number> = {}
  const running: Record<string, number> = {}
  chrono.forEach((r) => {
    const cur = running[r.projectId] ?? 0
    before[r.id] = cur
    running[r.projectId] = cur + (r.dir === 'in' ? r.amount : -r.amount)
  })
  return before
})
const beforeOf = (r: LedgerRow) => balBefore.value[r.id] ?? 0
const afterOf = (r: LedgerRow) => beforeOf(r) + (r.dir === 'in' ? r.amount : -r.amount)

// كشف العمليات المعطوبة (للعمليات المالية فقط)
function rowIssues(r: LedgerRow) {
  const srcTx = financeStore.transactions.find((t) => t.id === r.id)
  if (!srcTx) return 0
  return txErrors(srcTx, { project: projectsStore.projectById(srcTx.projectId), transactions: financeStore.transactions }).length
}

const totalIn = computed(() => filtered.value.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0))
const totalOut = computed(() => filtered.value.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0))

const summary = computed(() => [
  { l: 'إجمالي الوارد', v: fmt(totalIn.value), c: 'var(--ok-text)', bg: 'var(--ok-bg)', i: '↓' },
  { l: 'إجمالي الصادر', v: fmt(totalOut.value), c: 'var(--danger-text)', bg: 'var(--danger-bg)', i: '↑' },
  { l: 'صافي التدفق', v: fmt(totalIn.value - totalOut.value), c: 'var(--info-text)', bg: 'var(--info-bg)', i: '⇄' },
  { l: 'عدد العمليات', v: fmtNum(filtered.value.length), c: 'var(--purple-text)', bg: 'var(--purple-bg)', i: '#' },
])

const hasFilter = computed(() => fType.value !== 'all' || fProject.value !== 'all' || fMember.value !== 'all' || fPeriod.value !== 'all' || search.value !== '')
function clearFilters() {
  fType.value = 'all'
  fProject.value = 'all'
  fMember.value = 'all'
  fPeriod.value = 'all'
  search.value = ''
}

// ── تجميعات تحليل التدفقات ──
const inOutSegments = computed(() => [
  { label: 'وارد', value: Math.round(totalIn.value), color: '#22c55e' },
  { label: 'صادر', value: Math.round(totalOut.value), color: '#ef4444' },
])

const KIND_PALETTE = ['#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#059669']
const byKindSegments = computed(() => {
  const byKind: Record<string, number> = {}
  filtered.value.forEach((r) => { byKind[r.kind] = (byKind[r.kind] ?? 0) + 1 })
  return Object.entries(byKind).map(([label, value], i) => ({ label, value, color: KIND_PALETTE[i % KIND_PALETTE.length] }))
})

const byProject = computed(() =>
  projects.value
    .map((p) => {
      const rs = filtered.value.filter((r) => r.projectId === p.id)
      return {
        name: p.name,
        icon: p.icon,
        in: rs.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0),
        out: rs.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0),
      }
    })
    .filter((x) => x.in > 0 || x.out > 0),
)

const byMember = computed(() =>
  members.value
    .map((m) => {
      const rs = filtered.value.filter((r) => r.memberId === m.id)
      return {
        name: m.name,
        in: rs.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0),
        out: rs.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0),
      }
    })
    .filter((x) => x.in > 0 || x.out > 0),
)

// ── تفاصيل العملية ──
const detail = ref<LedgerRow | null>(null)
const detailRows = computed(() => {
  const r = detail.value
  if (!r) return []
  return [
    ['رقم العملية', r.num],
    ['النوع', r.kind],
    ['الطبيعة', r.nature],
    ['المشروع', projName(r.projectId)],
    ['العضو', r.memberId ? memName(r.memberId) : '—'],
    ['المصدر/الجهة', r.source ?? '—'],
    ['المبلغ', `${r.dir === 'in' ? '+' : '−'}${fmt(r.amount)}`],
    ['الرصيد قبل', fmt(beforeOf(r))],
    ['الرصيد بعد', fmt(afterOf(r))],
    ['التاريخ', r.date],
    ['الحالة', r.status],
    ['الأطراف', r.parties.join('، ')],
  ] as [string, string][]
})
const detailIsTx = computed(() => !!detail.value && financeStore.transactions.some((t) => t.id === detail.value!.id))
function viewInFinance() {
  if (detail.value) projectsStore.setActiveProject(detail.value.projectId)
  detail.value = null
  router.push({ name: 'finance-page' })
}

function exportExcel() {
  exportXLSX('السجل_المالي', [
    {
      name: 'السجل المالي',
      rows: filtered.value.map((r) => ({
        المرجع: r.num,
        النوع: r.kind,
        التصنيف: r.nature,
        المشروع: projName(r.projectId),
        الطرف: r.memberId ? memName(r.memberId) : r.source ?? '—',
        الاتجاه: r.dir === 'in' ? 'وارد' : 'صادر',
        المبلغ: r.amount,
        'الرصيد قبل': beforeOf(r),
        'الرصيد بعد': afterOf(r),
        التاريخ: r.date,
        الحالة: r.status,
      })),
    },
  ])
    .then(() => toast.success('تم تصدير السجل المالي'))
    .catch((e) => toast.error(e.message))
}
</script>

<template>
  <section class="ledger">
    <header class="ledger__header">
      <div>
        <h1>السجل المالي <HelpIcon section="ledger" /></h1>
        <p>سجل موحّد لكل العمليات والتدفقات عبر المشاريع والأعضاء</p>
      </div>
      <BaseButton variant="outlined" @click="exportExcel">⬇ تصدير Excel</BaseButton>
    </header>

    <!-- مبدّل العرض -->
    <div class="switch">
      <button class="switch__btn" :class="{ 'is-active': view === 'log' }" @click="view = 'log'">📋 العمليات</button>
      <button class="switch__btn" :class="{ 'is-active': view === 'flows' }" @click="view = 'flows'">📊 تحليل التدفقات</button>
    </div>

    <!-- بطاقات الملخّص -->
    <div class="cards">
      <div v-for="s in summary" :key="s.l" class="card" :style="{ background: s.bg }">
        <span class="card__icon">{{ s.i }}</span>
        <strong :style="{ color: s.c }">{{ s.v }}</strong>
        <span class="card__label">{{ s.l }}</span>
      </div>
    </div>

    <!-- الفلاتر -->
    <div class="app-card filters">
      <input v-model="search" type="text" placeholder="🔍 بحث (رقم، نوع، طرف...)" class="filters__search" />
      <select v-model="fType" class="select">
        <option value="all">كل الأنواع</option>
        <option value="in">وارد</option>
        <option value="out">صادر</option>
        <option value="إيراد">إيراد</option>
        <option value="مصروف">مصروف</option>
        <option value="تحويل">تحويل</option>
      </select>
      <select v-model="fProject" class="select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="fMember" class="select">
        <option value="all">كل الأعضاء</option>
        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
      <select v-model="fPeriod" class="select">
        <option value="all">كل الفترات</option>
        <option value="month">آخر شهر</option>
        <option value="quarter">آخر ربع</option>
        <option value="half">آخر نصف سنة</option>
        <option value="year">آخر سنة</option>
      </select>
      <BaseButton v-if="hasFilter" variant="ghost" @click="clearFilters">مسح الفلترة</BaseButton>
    </div>

    <!-- عرض العمليات -->
    <div v-if="view === 'log' && prefs.listView === 'table'" class="app-card table-card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم</th>
              <th>النوع</th>
              <th>الطبيعة</th>
              <th>المشروع</th>
              <th>العضو/المصدر</th>
              <th>المبلغ</th>
              <th>قبل</th>
              <th>بعد</th>
              <th>التاريخ</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="10" class="empty">لا توجد عمليات مطابقة للفلترة.</td>
            </tr>
            <tr v-for="r in filtered" :key="r.id" class="row" :class="{ 'is-flagged': rowIssues(r), 'is-focused': isFocused(r.id) }" :data-focus="r.id" role="button" tabindex="0" @click="detail = r" @keydown.enter="detail = r" @keydown.space.prevent="detail = r">
              <td class="mono muted">{{ r.num }}</td>
              <td>
                <span class="kind" :class="r.dir === 'in' ? 'is-in' : 'is-out'">
                  {{ r.dir === 'in' ? '↓' : '↑' }} {{ r.kind }}
                </span>
                <span v-if="rowIssues(r)" class="warn" title="تحتاج مراجعة">⚠️</span>
              </td>
              <td class="muted">{{ r.nature }}</td>
              <td>{{ projName(r.projectId) }}</td>
              <td class="muted">{{ r.memberId ? memName(r.memberId) : r.source ?? '—' }}</td>
              <td>
                <span class="amount" :class="r.dir === 'in' ? 'is-in' : 'is-out'">
                  {{ r.dir === 'in' ? '+' : '−' }}{{ fmtNum(r.amount) }}
                </span>
              </td>
              <td class="muted nowrap">{{ fmtNum(beforeOf(r)) }}</td>
              <td class="nowrap semi">{{ fmtNum(afterOf(r)) }}</td>
              <td class="muted nowrap">{{ r.date }}</td>
              <td><span class="status" :class="`is-${r.status}`">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- عرض البطاقات (بديل الجدول حسب إعداد «عرض البيانات») -->
    <div v-else-if="view === 'log' && prefs.listView === 'cards'" class="dcards">
      <p v-if="!filtered.length" class="dcards__empty">لا توجد عمليات مطابقة للفلترة.</p>
      <button
        v-for="r in filtered"
        :key="r.id"
        class="dcard"
        :class="{ 'is-flagged': rowIssues(r), 'is-focused': isFocused(r.id) }"
        :data-focus="r.id"
        @click="detail = r"
      >
        <div class="dcard__row">
          <span class="kind" :class="r.dir === 'in' ? 'is-in' : 'is-out'">
            {{ r.dir === 'in' ? '↓' : '↑' }} {{ r.kind }}
            <span v-if="rowIssues(r)" class="warn" title="تحتاج مراجعة">⚠️</span>
          </span>
          <span class="amount" :class="r.dir === 'in' ? 'is-in' : 'is-out'">
            {{ r.dir === 'in' ? '+' : '−' }}{{ fmtNum(r.amount) }}
          </span>
        </div>
        <div class="dcard__row dcard__meta">
          <span>{{ projName(r.projectId) }}</span>
          <span class="muted nowrap">{{ r.date }}</span>
        </div>
        <div class="dcard__row dcard__meta">
          <span class="muted">{{ r.memberId ? memName(r.memberId) : r.source ?? '—' }}</span>
          <span class="status" :class="`is-${r.status}`">{{ r.status }}</span>
        </div>
        <div class="dcard__row dcard__bal muted">
          <span>قبل: {{ fmtNum(beforeOf(r)) }}</span>
          <span>بعد: {{ fmtNum(afterOf(r)) }}</span>
          <span class="mono">#{{ r.num }}</span>
        </div>
      </button>
    </div>

    <!-- عرض تحليل التدفقات -->
    <div v-else class="flows">
      <div class="app-card panel">
        <span class="panel__title">نسبة الوارد إلى الصادر</span>
        <DonutChart :data="inOutSegments" center-label="ر.س" :center-value="fmtNum(totalIn + totalOut)" />
      </div>

      <div class="app-card panel">
        <span class="panel__title">العمليات حسب النوع</span>
        <DonutChart v-if="byKindSegments.length" :data="byKindSegments" center-label="عملية" :center-value="fmtNum(filtered.length)" />
        <div v-else class="panel__empty">لا توجد بيانات</div>
      </div>

      <div class="app-card panel">
        <span class="panel__title">التدفقات حسب المشروع</span>
        <div v-if="!byProject.length" class="panel__empty">لا توجد بيانات</div>
        <div v-for="p in byProject" :key="p.name" class="pflow">
          <div class="pflow__head">
            <span>{{ p.icon }} {{ p.name }}</span>
            <span class="pflow__net" :class="{ 'is-neg': p.in - p.out < 0 }">صافي {{ fmtNum(p.in - p.out) }}</span>
          </div>
          <div class="pflow__bar">
            <span class="pflow__tag is-in">وارد</span>
            <div class="pflow__track"><div class="pflow__fill is-in" :style="{ width: `${Math.min(100, (p.in / Math.max(p.in, p.out, 1)) * 100)}%` }" /></div>
            <span class="pflow__val is-in">{{ fmtNum(p.in) }}</span>
          </div>
          <div class="pflow__bar">
            <span class="pflow__tag is-out">صادر</span>
            <div class="pflow__track"><div class="pflow__fill is-out" :style="{ width: `${Math.min(100, (p.out / Math.max(p.in, p.out, 1)) * 100)}%` }" /></div>
            <span class="pflow__val is-out">{{ fmtNum(p.out) }}</span>
          </div>
        </div>
      </div>

      <div class="app-card panel">
        <span class="panel__title">التدفقات حسب العضو</span>
        <div v-if="!byMember.length" class="panel__empty">لا توجد بيانات</div>
        <div v-for="m in byMember" :key="m.name" class="mflow">
          <span class="mflow__name">{{ m.name }}</span>
          <div class="mflow__vals">
            <span class="is-in">وارد {{ fmtNum(m.in) }}</span>
            <span class="is-out">صادر {{ fmtNum(m.out) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- تفاصيل العملية -->
    <ModalShell v-if="detail" :title="`تفاصيل العملية ${detail.num}`" @close="detail = null">
      <div class="dl">
        <div v-for="[k, v] in detailRows" :key="k" class="dl__row">
          <span class="dl__k">{{ k }}</span>
          <span class="dl__v">{{ v }}</span>
        </div>
      </div>
      <template #footer>
        <BaseButton v-if="detailIsTx" variant="outlined" @click="viewInFinance">↗ عرض العملية في الإدارة المالية</BaseButton>
        <BaseButton @click="detail = null">إغلاق</BaseButton>
      </template>
    </ModalShell>
  </section>
</template>

<style lang="scss" scoped>
.ledger {
  max-inline-size: 1200px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 18px;
    flex-wrap: wrap;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }
}

// مبدّل العرض
.switch {
  display: inline-flex;
  gap: 4px;
  margin-block-end: 18px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;

  &__btn {
    padding: 8px 18px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

// بطاقات الملخّص
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-block-end: 20px;
}

.card {
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;

  &__icon { font-size: 18px; }
  &__label { font-size: 12px; color: var(--text-muted); }

  strong { font-size: 18px; font-weight: 700; }
}

.select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 16px;
  margin-block-end: 16px;
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 150px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
  }
}

.table-card { padding: 0; overflow: hidden; }
.table-wrap { overflow-x: auto; }

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
  inline-size: 100%;
  text-align: start;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: inherit;
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

  &__bal {
    font-size: 12px;
    gap: 12px;
    justify-content: flex-start;
    border-block-start: 1px dashed var(--border);
    padding-block-start: 8px;
  }
}

table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  min-inline-size: 860px;
}

th {
  text-align: start;
  padding: 10px 12px;
  background: var(--bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  border-block-end: 1px solid var(--border);
}

td {
  padding: 10px 12px;
  border-block-start: 1px solid var(--border);
}

.row {
  cursor: pointer;

  &:hover { background: var(--primary-soft); }
  &.is-flagged { background: var(--danger-bg); &:hover { background: var(--danger-bg); } }
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 32px !important;
}

.muted { color: var(--text-muted); }
.semi { font-weight: 500; }
.nowrap { white-space: nowrap; }
.mono { font-family: monospace; font-size: 11px; }

.kind {
  font-weight: 600;
  white-space: nowrap;

  &.is-in { color: var(--ok-text); }
  &.is-out { color: var(--danger-text); }
}

.warn { margin-inline-start: 5px; }

.amount {
  font-weight: 600;
  white-space: nowrap;

  &.is-in { color: var(--ok-text); }
  &.is-out { color: var(--danger-text); }
}

.status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;

  &.is-منفّذة,
  &.is-مقبولة { background: var(--ok-bg); color: var(--ok-text); }
  &.is-معلّقة { background: var(--warn-bg); color: var(--warn-text); }
  &.is-مرفوضة { background: var(--danger-bg); color: var(--danger-text); }
}

// تحليل التدفقات
.flows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.panel {
  padding: 18px;

  &__title { display: block; font-weight: 600; font-size: 15px; margin-block-end: 14px; }
  &__empty { color: var(--text-muted); font-size: 13px; padding: 12px; text-align: center; }
}

.pflow {
  margin-block-end: 12px;

  &:last-child { margin-block-end: 0; }

  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-block-end: 5px;
  }

  &__net { font-weight: 600; color: var(--ok-text); &.is-neg { color: var(--danger-text); } }

  &__bar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-block-end: 3px;
  }

  &__tag {
    inline-size: 36px;
    font-size: 10px;
    &.is-in { color: var(--ok-text); }
    &.is-out { color: var(--danger-text); }
  }

  &__track {
    flex: 1;
    block-size: 12px;
    background: var(--bg);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    block-size: 100%;
    &.is-in { background: #22c55e; }
    &.is-out { background: #f87171; }
  }

  &__val {
    inline-size: 66px;
    text-align: end;
    font-size: 11px;
    &.is-in { color: var(--ok-text); }
    &.is-out { color: var(--danger-text); }
  }
}

.mflow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border-radius: 10px;
  margin-block-end: 8px;

  &:last-child { margin-block-end: 0; }

  &__name { font-size: 13px; font-weight: 500; }

  &__vals {
    display: flex;
    gap: 14px;
    font-size: 12px;

    .is-in { color: var(--ok-text); }
    .is-out { color: var(--danger-text); }
  }
}

// قائمة تفاصيل العملية
.dl {
  display: flex;
  flex-direction: column;

  &__row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 0;
    border-block-end: 1px solid var(--border);
    font-size: 13px;

    &:last-child { border-block-end: none; }
  }

  &__k { color: var(--text-muted); }
  &__v { font-weight: 600; text-align: end; }
}
</style>
