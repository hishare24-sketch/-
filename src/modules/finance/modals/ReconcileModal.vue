<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { importXLSX } from '@/helpers/export'
import { fmtNum } from '@/helpers/format'
import { CURRENT_USER } from '@/constants'
import type { Transaction } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const { projects } = storeToRefs(projectsStore)

const targetProject = ref(props.projectId)
const busy = ref(false)
const error = ref('')

// صفوف الملف المستورد + أعمدته
type RawRow = Record<string, unknown>
const rawRows = ref<RawRow[]>([])
const columns = ref<string[]>([])

// ربط الأعمدة (تلقائي مع إمكانية التعديل)
const map = reactive({ date: '', amount: '', desc: '' })

const DATE_TOLERANCE_DAYS = 3

function autoDetect() {
  const find = (re: RegExp) => columns.value.find((c) => re.test(c)) ?? ''
  map.date = find(/تاريخ|date/i)
  map.amount = find(/مبلغ|قيمة|amount|value|مدين|دائن|debit|credit/i)
  map.desc = find(/وصف|بيان|تفاصيل|desc|note|memo/i)
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  try {
    const rows = await importXLSX(file)
    rawRows.value = rows
    columns.value = rows.length ? Object.keys(rows[0]) : []
    autoDetect()
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    busy.value = false
  }
}

// تطبيع القيم
function normDate(v: unknown): string {
  if (typeof v === 'number' && v > 30000 && v < 60000) {
    // رقم تسلسلي من Excel (أيام منذ 1899-12-30)
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const s = String(v ?? '').trim()
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10)
}
function normAmount(v: unknown): number {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? 0 : n
}

const daysBetween = (a: string, b: string) =>
  Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86400000)

// الصفوف المطبَّعة + حالة المطابقة مقابل عمليات المشروع
interface MatchedRow {
  i: number
  date: string
  amount: number
  desc: string
  status: 'matched' | 'multiple' | 'unmatched'
  match?: Transaction
  created?: boolean
}

const projectTxns = computed(() => financeStore.byProject(targetProject.value))

const results = computed<MatchedRow[]>(() => {
  if (!map.amount) return []
  return rawRows.value.map((r, i) => {
    const date = map.date ? normDate(r[map.date]) : ''
    const amount = normAmount(r[map.amount])
    const desc = map.desc ? String(r[map.desc] ?? '') : ''
    const absAmt = Math.abs(amount)
    const candidates = projectTxns.value.filter(
      (t) => Math.abs(t.amount) === absAmt && (!date || daysBetween(t.date, date) <= DATE_TOLERANCE_DAYS),
    )
    const status: MatchedRow['status'] =
      candidates.length === 1 ? 'matched' : candidates.length > 1 ? 'multiple' : 'unmatched'
    return { i, date, amount, desc, status, match: candidates[0] }
  })
})

const summary = computed(() => ({
  total: results.value.length,
  matched: results.value.filter((r) => r.status === 'matched').length,
  multiple: results.value.filter((r) => r.status === 'multiple').length,
  unmatched: results.value.filter((r) => r.status === 'unmatched').length,
}))

// حالة الإنشاء لكل صف (لتعطيل الزر بعد الإنشاء)
const createdRows = reactive<Record<number, boolean>>({})

function createTx(row: MatchedRow) {
  const isIncome = row.amount >= 0
  financeStore.saveTransaction({
    projectId: targetProject.value,
    type: isIncome ? 'income' : 'expense',
    description: row.desc || 'عملية من ملف مستورد',
    amount: Math.abs(row.amount),
    category: 'تسوية Excel',
    date: row.date || new Date().toISOString().slice(0, 10),
    hasDoc: false,
    source: 'استيراد Excel',
    createdBy: CURRENT_USER,
  })
  createdRows[row.i] = true
}

function createAllUnmatched() {
  results.value.filter((r) => r.status === 'unmatched' && !createdRows[r.i]).forEach(createTx)
}

const statusMeta = {
  matched: { label: 'مطابقة', cls: 'is-ok' },
  multiple: { label: 'تطابق متعدد', cls: 'is-warn' },
  unmatched: { label: 'غير مطابقة', cls: 'is-danger' },
} as const

function reset() {
  rawRows.value = []
  columns.value = []
  map.date = map.amount = map.desc = ''
}
</script>

<template>
  <ModalShell title="مطابقة / تسوية Excel واردة" wide @close="emit('close')">
    <!-- الخطوة الأولى: الرفع -->
    <div v-if="!rawRows.length" class="upload">
      <div class="upload__box">
        <span class="upload__icon">📥</span>
        <p class="upload__hint">ارفع ملف Excel (كشف حساب / قائمة عمليات) لمطابقته مع عمليات المشروع.</p>
        <label class="app-btn">
          <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onFile" />
          {{ busy ? 'جارٍ القراءة…' : 'اختيار ملف' }}
        </label>
      </div>
      <div v-if="error" class="err">{{ error }}</div>
    </div>

    <!-- الخطوة الثانية: الربط والنتائج -->
    <div v-else class="recon">
      <div class="recon__bar">
        <div class="field">
          <label>المشروع الهدف</label>
          <select v-model="targetProject">
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
          </select>
        </div>
        <button class="app-btn app-btn--ghost" @click="reset">↺ ملف آخر</button>
      </div>

      <!-- ربط الأعمدة -->
      <div class="maprow">
        <div class="field">
          <label>عمود التاريخ</label>
          <select v-model="map.date"><option value="">—</option><option v-for="c in columns" :key="c" :value="c">{{ c }}</option></select>
        </div>
        <div class="field">
          <label>عمود المبلغ *</label>
          <select v-model="map.amount"><option value="">—</option><option v-for="c in columns" :key="c" :value="c">{{ c }}</option></select>
        </div>
        <div class="field">
          <label>عمود الوصف</label>
          <select v-model="map.desc"><option value="">—</option><option v-for="c in columns" :key="c" :value="c">{{ c }}</option></select>
        </div>
      </div>

      <!-- ملخّص -->
      <div v-if="map.amount" class="sumbar">
        <span class="pill pill--total">الكل: {{ summary.total }}</span>
        <span class="pill pill--ok">مطابقة: {{ summary.matched }}</span>
        <span class="pill pill--warn">متعدد: {{ summary.multiple }}</span>
        <span class="pill pill--danger">غير مطابقة: {{ summary.unmatched }}</span>
        <button v-if="summary.unmatched" class="app-btn app-btn--sm" @click="createAllUnmatched">＋ إنشاء كل الناقصة ({{ summary.unmatched }})</button>
      </div>
      <p v-else class="hint-line">اختر عمود المبلغ لبدء المطابقة.</p>

      <!-- جدول النتائج -->
      <div v-if="map.amount" class="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>التاريخ</th><th>المبلغ</th><th>الوصف</th><th>الحالة</th><th>العملية المطابِقة</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="r in results" :key="r.i" :class="{ 'row-created': createdRows[r.i] }">
              <td class="muted">{{ r.i + 1 }}</td>
              <td class="nowrap">{{ r.date || '—' }}</td>
              <td class="nowrap" :class="r.amount >= 0 ? 'amt-in' : 'amt-out'">{{ fmtNum(r.amount) }}</td>
              <td class="desc">{{ r.desc || '—' }}</td>
              <td>
                <span v-if="createdRows[r.i]" class="badge is-ok">أُنشئت ✓</span>
                <span v-else class="badge" :class="statusMeta[r.status].cls">{{ statusMeta[r.status].label }}</span>
              </td>
              <td class="muted desc">{{ r.match ? `${r.match.description} · ${r.match.date}` : '—' }}</td>
              <td>
                <button
                  v-if="r.status === 'unmatched' && !createdRows[r.i]"
                  class="mini"
                  @click="createTx(r)"
                >
                  ＋ إنشاء
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.upload {
  padding: 10px 0;

  &__box {
    border: 2px dashed var(--border);
    border-radius: 14px;
    padding: 34px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: var(--bg);
  }

  &__icon { font-size: 36px; }
  &__hint { font-size: 13px; color: var(--text-muted); line-height: 1.7; max-inline-size: 380px; }
}

.err {
  margin-block-start: 12px;
  padding: 10px 14px;
  background: var(--danger-bg);
  color: var(--danger-text);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.recon__bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-block-end: 14px;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label { font-size: 12.5px; font-weight: 500; color: var(--text-muted); }

  select {
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.maprow {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  margin-block-end: 14px;

  @media (max-width: 560px) { grid-template-columns: 1fr; }
}

.sumbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-block-end: 12px;
}

.pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 99px;

  &--total { background: var(--bg); color: var(--text-muted); }
  &--ok { background: var(--ok-bg); color: var(--ok-text); }
  &--warn { background: var(--warn-bg); color: var(--warn-text); }
  &--danger { background: var(--danger-bg); color: var(--danger-text); }
}

.hint-line { font-size: 13px; color: var(--text-muted); padding: 8px 0; }

.app-btn--sm { padding: 6px 12px; font-size: 12px; margin-inline-start: auto; }

.table-wrap { overflow-x: auto; max-block-size: 44vh; overflow-y: auto; }

table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  min-inline-size: 640px;
}

th {
  text-align: start;
  padding: 9px 10px;
  background: var(--bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 11.5px;
  position: sticky;
  inset-block-start: 0;
}

td {
  padding: 9px 10px;
  border-block-start: 1px solid var(--border);
}

.row-created { background: var(--ok-bg); }
.muted { color: var(--text-muted); }
.nowrap { white-space: nowrap; }
.desc { max-inline-size: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.amt-in { color: var(--ok-text); font-weight: 600; }
.amt-out { color: var(--danger-text); font-weight: 600; }

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 99px;
  white-space: nowrap;

  &.is-ok { background: var(--ok-bg); color: var(--ok-text); }
  &.is-warn { background: var(--warn-bg); color: var(--warn-text); }
  &.is-danger { background: var(--danger-bg); color: var(--danger-text); }
}

.mini {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--primary);
  border-radius: 8px;
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
</style>
