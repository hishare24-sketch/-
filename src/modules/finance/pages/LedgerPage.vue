<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { exportXLSX } from '@/helpers/export'
import { useLedgerRows } from '../composables/useLedger'

const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { projects, members } = storeToRefs(projectsStore)
const { rows, projName, memName } = useLedgerRows()

const helpEntry = computed(() => settingsStore.help.ledger)

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

const totalIn = computed(() => filtered.value.filter((r) => r.dir === 'in').reduce((s, r) => s + r.amount, 0))
const totalOut = computed(() => filtered.value.filter((r) => r.dir === 'out').reduce((s, r) => s + r.amount, 0))

const hasFilter = computed(() => fType.value !== 'all' || fProject.value !== 'all' || fMember.value !== 'all' || fPeriod.value !== 'all' || search.value !== '')
function clearFilters() {
  fType.value = 'all'
  fProject.value = 'all'
  fMember.value = 'all'
  fPeriod.value = 'all'
  search.value = ''
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
        التاريخ: r.date,
        الحالة: r.status,
      })),
    },
  ]).catch((e) => alert(e.message))
}
</script>

<template>
  <section class="ledger">
    <header class="ledger__header">
      <div>
        <h1>السجل المالي</h1>
        <p>سجل موحّد لكل العمليات والتدفقات عبر المشاريع والأعضاء</p>
      </div>
      <button class="app-btn app-btn--outlined" @click="exportExcel">⬇ تصدير Excel</button>
    </header>

    <div v-if="helpEntry.show" class="help-note app-card">
      <strong>{{ helpEntry.title }}</strong><span>{{ helpEntry.body }}</span>
    </div>

    <div class="ledger__totals">
      <div class="total total--in">
        <span>إجمالي الوارد</span><strong>{{ fmt(totalIn) }}</strong>
      </div>
      <div class="total total--out">
        <span>إجمالي الصادر</span><strong>{{ fmt(totalOut) }}</strong>
      </div>
      <div class="total total--net">
        <span>الصافي</span><strong>{{ fmt(totalIn - totalOut) }}</strong>
      </div>
    </div>

    <div class="app-card">
      <div class="filters">
        <input v-model="search" type="text" placeholder="🔍 بحث..." class="filters__search" />
        <select v-model="fType" class="select">
          <option value="all">كل الأنواع</option>
          <option value="in">وارد</option>
          <option value="out">صادر</option>
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
          <option value="half">آخر 6 أشهر</option>
          <option value="year">آخر سنة</option>
        </select>
        <button v-if="hasFilter" class="app-btn app-btn--ghost" @click="clearFilters">مسح</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>المرجع</th>
              <th>النوع</th>
              <th>المشروع / الطرف</th>
              <th>التاريخ</th>
              <th>الحالة</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filtered.length">
              <td colspan="6" class="empty">لا توجد سجلات مطابقة.</td>
            </tr>
            <tr v-for="r in filtered" :key="r.id">
              <td class="muted mono">{{ r.num }}</td>
              <td><span class="chip">{{ r.kind }}</span></td>
              <td>
                <span class="parties">{{ r.parties.join(' · ') }}</span>
                <span class="nature">{{ r.nature }}</span>
              </td>
              <td class="muted">{{ r.date }}</td>
              <td><span class="status" :class="`is-${r.status}`">{{ r.status }}</span></td>
              <td>
                <span class="amount" :class="r.dir === 'in' ? 'is-in' : 'is-out'">
                  {{ r.dir === 'in' ? '+' : '-' }}{{ fmtNum(r.amount) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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

  &__totals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-block-end: 20px;
  }
}

.total {
  padding: 18px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    font-size: 12px;
    color: var(--text-muted);
  }

  strong {
    font-size: 18px;
  }

  &--in {
    background: #ecfdf5;
    strong { color: #15803d; }
  }

  &--out {
    background: #fef2f2;
    strong { color: #b91c1c; }
  }

  &--net {
    background: #ecfeff;
    strong { color: #0891b2; }
  }
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

.filters {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-block-end: 1px solid var(--border);
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 140px;
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

table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-inline-size: 680px;
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

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 30px !important;
}

.muted {
  color: var(--text-muted);
}

.mono {
  font-size: 12px;
}

.chip {
  background: var(--bg);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.parties {
  display: block;
  font-weight: 500;
}

.nature {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
}

.status {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;

  &.is-منفّذة,
  &.is-مقبولة {
    background: #ecfdf5;
    color: #059669;
  }

  &.is-معلّقة {
    background: #fffbeb;
    color: #d97706;
  }

  &.is-مرفوضة {
    background: #fef2f2;
    color: #dc2626;
  }
}

.amount {
  font-weight: 600;

  &.is-in {
    color: #15803d;
  }

  &.is-out {
    color: #b91c1c;
  }
}
</style>
