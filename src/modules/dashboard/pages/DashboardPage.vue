<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { fmtNum } from '@/helpers/format'
import { useDashboard, PERIODS } from '../composables/useDashboard'
import ChartCard from '@/components/charts/ChartCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import HelpIcon from '@/components/shared/HelpIcon.vue'

const router = useRouter()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const { activeProjectId, activeProject, projects } = storeToRefs(projectsStore)
const { prefs } = storeToRefs(settingsStore)

const { period, stats, txns, urgentTrackings, monthlyData } = useDashboard(
  toRef(projectsStore, 'activeProjectId'),
  settingsStore.prefs.defaultPeriod,
)

const recentTxns = computed(() => txns.value.slice(0, 5))

// بيانات الرسم (تسلسل الإيرادات/المصروفات)
const chartView = ref<'bar' | 'line'>('bar')
const chartLabels = computed(() => monthlyData.value.map((d) => d.month))
const chartSeries = computed(() => [
  { name: 'إيرادات', color: '#3b82f6', values: monthlyData.value.map((d) => d.income) },
  { name: 'مصروفات', color: '#f87171', values: monthlyData.value.map((d) => d.expense) },
])
</script>

<template>
  <section class="dashboard">
    <!-- الترويسة: العنوان + اختيار المشروع + الفترة -->
    <header class="dashboard__header">
      <div>
        <h1>لوحة التحكم <HelpIcon section="dashboard" /></h1>
        <p>{{ activeProject?.name }} — يونيو 2025</p>
      </div>
      <div class="dashboard__controls">
        <select v-model="activeProjectId" class="select">
          <option v-for="p in projects" :key="p.id" :value="p.id">
            {{ p.icon }} {{ p.name }}
          </option>
        </select>
        <select v-model="period" class="select">
          <option v-for="p in PERIODS" :key="p.v" :value="p.v">{{ p.l }}</option>
        </select>
      </div>
    </header>

    <!-- بطاقات الإحصائيات -->
    <div class="dashboard__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div class="stat__body">
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <!-- الرسم البياني + التنبيهات العاجلة -->
    <div class="dashboard__row">
      <ChartCard
        v-if="prefs.showCharts"
        v-model="chartView"
        title="الإيرادات والمصروفات"
        :views="[
          { id: 'bar', icon: '📊', label: 'أعمدة' },
          { id: 'line', icon: '📈', label: 'خطّي' },
        ]"
      >
        <BarChart v-if="chartView === 'bar'" :labels="chartLabels" :series="chartSeries" />
        <LineChart v-else :labels="chartLabels" :series="chartSeries" />
      </ChartCard>
      <div v-else class="charts-off app-card">الرسوم مخفية — فعّلها من الإعدادات.</div>

      <div class="urgent app-card">
        <div class="urgent__head">
          <span class="urgent__title">تنبيهات عاجلة</span>
          <button class="link-btn" @click="router.push({ name: 'trackings-page' })">عرض الكل</button>
        </div>
        <div v-if="!urgentTrackings.length" class="urgent__empty">✅ لا توجد تنبيهات عاجلة</div>
        <div
          v-for="t in urgentTrackings.slice(0, 4)"
          :key="t.id"
          class="urgent__item"
          :class="t.status === 'expired' ? 'is-expired' : 'is-expiring'"
        >
          <span class="urgent__icon">{{ t.icon }}</span>
          <div class="urgent__info">
            <span class="urgent__name">{{ t.name }}</span>
            <span class="urgent__days">
              {{ t.status === 'expired' ? `منتهي منذ ${Math.abs(t.daysLeft)} أيام` : `يتبقى ${t.daysLeft} يوم` }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- آخر العمليات -->
    <div class="recent app-card">
      <div class="recent__head">
        <span class="recent__title">آخر العمليات</span>
      </div>
      <div v-if="!recentTxns.length" class="recent__empty">لا توجد عمليات في هذا المشروع</div>
      <div v-for="t in recentTxns" :key="t.id" class="recent__item">
        <span class="recent__badge" :class="`is-${t.type}`">
          {{ t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔' }}
        </span>
        <div class="recent__info">
          <span class="recent__desc">{{ t.description }}</span>
          <span class="recent__date">{{ t.date }}</span>
        </div>
        <span class="recent__amount" :class="`is-${t.type}`">
          {{ t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-' }}{{ fmtNum(t.amount) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.dashboard {
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

  &__row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 20px;
    margin-block-end: 20px;

    @media (max-width: 860px) {
      grid-template-columns: 1fr;
    }
  }
}

.charts-off {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.select {
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
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
    font-size: 19px;
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

.urgent {
  padding: 20px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 14px;
  }

  &__title {
    font-weight: 600;
    font-size: 15px;
  }

  &__empty {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    margin-block-end: 8px;

    &.is-expired {
      background: var(--danger-bg);
    }

    &.is-expiring {
      background: var(--warn-bg);
    }
  }

  &__icon {
    font-size: 18px;
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-inline-size: 0;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__days {
    font-size: 11px;
    color: var(--text-muted);
  }
}

.recent {
  padding: 20px;

  &__head {
    margin-block-end: 14px;
  }

  &__title {
    font-weight: 600;
    font-size: 15px;
  }

  &__empty {
    padding: 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-block: 8px;
  }

  &__badge {
    inline-size: 34px;
    block-size: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
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

  &__info {
    flex: 1;
    min-inline-size: 0;
    display: flex;
    flex-direction: column;
  }

  &__desc {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__amount {
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;

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
}
</style>
