<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { useTasks } from '@/modules/tasks/composables/useTasks'
import { useToast } from '@/composables/useToast'
import { fmt, fmtNum } from '@/helpers/format'
import { useDashboard, PERIODS } from '../composables/useDashboard'
import ChartCard from '@/components/charts/ChartCard.vue'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import HelpIcon from '@/components/shared/HelpIcon.vue'

const router = useRouter()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()
const requestsStore = useRequestsStore()
const financeStore = useFinanceStore()
const auditStore = useAuditStore()
const notificationsStore = useNotificationsStore()
const toast = useToast()
const { activeProjectId, activeProject, projects } = storeToRefs(projectsStore)
const { prefs } = storeToRefs(settingsStore)

// ── نظرة المنصة الأم: تجميعات عبر كل المشاريع ──
const { pendingReqs: allPendingReqs, pendingMTxns, dueRecv, dueComms, urgentTracks, totalCount } = useTasks()

// شارات تفصيل الإجراءات المطلوبة (تُعرض غير الصفرية فقط)
const actionChips = computed(() =>
  [
    { label: 'طلبات', n: allPendingReqs.value.length, route: 'requests-page' },
    { label: 'عهد أعضاء', n: pendingMTxns.value.length, route: 'projects-page' },
    { label: 'ذمم مستحقة', n: dueRecv.value.length, route: 'receivables-page' },
    { label: 'التزامات', n: dueComms.value.length, route: 'commitments-page' },
    { label: 'متابعات', n: urgentTracks.value.length, route: 'trackings-page' },
  ].filter((c) => c.n > 0),
)

// النشاط الأخير (سجل العمليات) — أحدث 6
const recentActivity = computed(() => auditStore.entries.slice(0, 6))

// الإشعارات — غير المقروءة أولاً ثم الأحدث، أعلى 5
const recentNotifs = computed(() =>
  [...notificationsStore.notifs].sort((a, b) => Number(a.read) - Number(b.read)).slice(0, 5),
)
const NOTIF_STYLE: Record<string, { icon: string; cls: string }> = {
  danger: { icon: '⛔', cls: 'is-danger' },
  warning: { icon: '⚠️', cls: 'is-warn' },
  info: { icon: 'ℹ️', cls: 'is-info' },
  success: { icon: '✅', cls: 'is-ok' },
}

// نظرة على كل المشاريع (الأرصدة المحسوبة) — المنصة الأم للمشترك
const projectOverview = computed(() =>
  projects.value.map((p) => ({ ...p, bal: financeStore.balanceOf(p.id) })),
)
const grandTotal = computed(() => projectOverview.value.reduce((s, p) => s + p.bal, 0))
const maxBal = computed(() => Math.max(...projectOverview.value.map((p) => Math.abs(p.bal)), 1))

function goNotif(section?: string) {
  if (section) router.push({ name: `${section}-page` }).catch(() => {})
}

const {
  period,
  stats,
  txns,
  net,
  urgentTrackings,
  pendingReqs,
  monthlyData,
  expenseByCategory,
  portfolio,
} = useDashboard(toRef(projectsStore, 'activeProjectId'), settingsStore.prefs.defaultPeriod)

const recentTxns = computed(() => txns.value.slice(0, 5))

// تحيّة حسب وقت اليوم (لمسة شخصية)
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'صباح الخير'
  if (h < 18) return 'مساء الخير'
  return 'مساء الخير'
})

// بيانات الرسم (تسلسل الإيرادات/المصروفات)
const chartView = ref<'bar' | 'line'>('bar')
const chartLabels = computed(() => monthlyData.value.map((d) => d.month))
const chartSeries = computed(() => [
  { name: 'إيرادات', color: '#3b82f6', values: monthlyData.value.map((d) => d.income) },
  { name: 'مصروفات', color: '#f87171', values: monthlyData.value.map((d) => d.expense) },
])
const totalExpense = computed(() => expenseByCategory.value.reduce((s, d) => s + d.value, 0))

// النظرة الشاملة — بطاقات مصغّرة تربط بالأقسام
const pulse = computed(() => [
  {
    key: 'recv', label: 'مستحقات لك', icon: '📥', route: 'receivables-page',
    value: fmt(portfolio.value.dueToUs), sub: `${portfolio.value.dueToUsCount} ذمة مفتوحة`,
    color: 'var(--ok-text)', bg: 'var(--ok-bg)',
  },
  {
    key: 'pay', label: 'مطلوبات عليك', icon: '📤', route: 'receivables-page',
    value: fmt(portfolio.value.weOwe), sub: `${portfolio.value.weOweCount} ذمة مفتوحة`,
    color: 'var(--danger-text)', bg: 'var(--danger-bg)',
  },
  {
    key: 'commit', label: 'التزامات دورية', icon: '📌', route: 'commitments-page',
    value: fmt(portfolio.value.commitMonthly), sub: `${portfolio.value.commitDueSoon} مستحق قريباً`,
    color: 'var(--purple-text)', bg: 'var(--purple-bg)',
  },
  {
    key: 'assets', label: 'الأصول', icon: '🏷️', route: 'assets-page',
    value: fmtNum(portfolio.value.assetCount), sub: `${portfolio.value.assetActive} نشط`,
    color: 'var(--info-text)', bg: 'var(--info-bg)',
  },
])

function decide(id: string, status: 'approved' | 'rejected') {
  const req = requestsStore.requests.find((r) => r.id === id)
  requestsStore.decide(id, status)
  if (status === 'approved') toast.success(`تمت الموافقة على «${req?.title ?? 'الطلب'}»`)
  else toast.info(`تم رفض «${req?.title ?? 'الطلب'}»`)
}
</script>

<template>
  <section class="dashboard">
    <!-- الترويسة: العنوان + اختيار المشروع + الفترة -->
    <header class="dashboard__header">
      <div>
        <h1>لوحة التحكم <HelpIcon section="dashboard" /></h1>
        <p>
          <span class="dashboard__greet">{{ greeting }} 👋</span>
          {{ activeProject?.name }} — يونيو 2025
        </p>
      </div>
      <div class="dashboard__controls">
        <select v-model="activeProjectId" class="select">
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
        </select>
        <select v-model="period" class="select">
          <option v-for="p in PERIODS" :key="p.v" :value="p.v">{{ p.l }}</option>
        </select>
      </div>
    </header>

    <!-- شريط الإجراءات المطلوبة عبر كل المشاريع -->
    <button
      v-if="totalCount"
      class="actions-strip app-card"
      type="button"
      @click="router.push({ name: 'tasks-page' })"
    >
      <span class="actions-strip__icon">✅</span>
      <div class="actions-strip__main">
        <span class="actions-strip__title">لديك {{ totalCount }} إجراءً ينتظر تصرّفك</span>
        <span class="actions-strip__chips">
          <span v-for="c in actionChips" :key="c.label" class="actions-strip__chip">
            {{ c.label }}: <b>{{ c.n }}</b>
          </span>
        </span>
      </div>
      <span class="actions-strip__cta">عرض الكل ←</span>
    </button>

    <!-- بطاقات الإحصائيات -->
    <div class="dashboard__stats">
      <button
        v-for="s in stats"
        :key="s.key"
        class="stat app-card"
        :class="`stat--${s.key}`"
        type="button"
        @click="s.route && router.push({ name: s.route })"
      >
        <div class="stat__body">
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
          <span
            v-if="s.delta != null"
            class="stat__delta"
            :class="(s.delta >= 0) === s.goodWhenUp ? 'is-good' : 'is-bad'"
          >
            <span class="stat__arrow">{{ s.delta >= 0 ? '▲' : '▼' }}</span>
            {{ Math.abs(s.delta) }}٪{{ Math.abs(s.delta) >= 999 ? '+' : '' }}
            <span class="stat__delta-note">عن الفترة السابقة</span>
          </span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </button>
    </div>

    <!-- الرسم البياني + التنبيهات العاجلة -->
    <div class="dashboard__row dashboard__row--chart">
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
        <div class="net-strip" :class="net >= 0 ? 'is-pos' : 'is-neg'">
          <span>صافي الفترة</span>
          <strong>{{ fmt(net) }}</strong>
        </div>
      </ChartCard>
      <div v-else class="charts-off app-card">الرسوم مخفية — فعّلها من الإعدادات.</div>

      <div class="panel urgent app-card">
        <div class="panel__head">
          <span class="panel__title">تنبيهات عاجلة</span>
          <button class="link-btn" @click="router.push({ name: 'trackings-page' })">عرض الكل</button>
        </div>
        <div v-if="!urgentTrackings.length" class="panel__empty">✅ لا توجد تنبيهات عاجلة</div>
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
          <span class="urgent__tag" :class="t.status === 'expired' ? 'is-expired' : 'is-expiring'">
            {{ t.status === 'expired' ? 'منتهي' : 'يقترب' }}
          </span>
        </div>
      </div>
    </div>

    <!-- توزيع المصروفات + النظرة الشاملة -->
    <div class="dashboard__row dashboard__row--pulse">
      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">توزيع المصروفات</span>
          <button class="link-btn" @click="router.push({ name: 'finance-page' })">التفاصيل</button>
        </div>
        <div v-if="!totalExpense" class="panel__empty">لا توجد مصروفات في هذه الفترة</div>
        <DonutChart
          v-else
          :data="expenseByCategory"
          :size="160"
          center-label="إجمالي المصروفات"
          :center-value="fmtNum(totalExpense)"
        />
      </div>

      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">نظرة شاملة</span>
        </div>
        <div class="pulse-grid">
          <button
            v-for="p in pulse"
            :key="p.key"
            class="pulse-card"
            type="button"
            @click="router.push({ name: p.route })"
          >
            <span class="pulse-card__icon" :style="{ background: p.bg, color: p.color }">{{ p.icon }}</span>
            <span class="pulse-card__label">{{ p.label }}</span>
            <span class="pulse-card__value">{{ p.value }}</span>
            <span class="pulse-card__sub">{{ p.sub }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- الطلبات المعلقة + آخر العمليات -->
    <div class="dashboard__row dashboard__row--split">
      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">طلبات تنتظر موافقتك</span>
          <button class="link-btn" @click="router.push({ name: 'requests-page' })">عرض الكل</button>
        </div>
        <div v-if="!pendingReqs.length" class="panel__empty">لا توجد طلبات تنتظر موافقتك</div>
        <div v-for="r in pendingReqs.slice(0, 4)" :key="r.id" class="req">
          <div class="req__top">
            <span class="req__title">{{ r.title }}</span>
            <span class="req__amount">{{ fmtNum(r.amount) }}</span>
          </div>
          <div class="req__meta">
            <span class="req__by">من: {{ r.requestedBy }}</span>
            <span class="req__type">{{ r.type }}</span>
          </div>
          <div class="req__actions">
            <button class="req__btn is-approve" @click="decide(r.id, 'approved')">✓ موافقة</button>
            <button class="req__btn is-reject" @click="decide(r.id, 'rejected')">✕ رفض</button>
          </div>
        </div>
      </div>

      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">آخر العمليات</span>
          <button class="link-btn" @click="router.push({ name: 'finance-page' })">عرض الكل</button>
        </div>
        <div v-if="!recentTxns.length" class="panel__empty">لا توجد عمليات في هذا المشروع</div>
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
    </div>

    <!-- النشاط الأخير + الإشعارات (عبر المنصة) -->
    <div class="dashboard__row dashboard__row--split">
      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">النشاط الأخير</span>
          <button class="link-btn" @click="router.push({ name: 'audit-page' })">عرض الكل</button>
        </div>
        <div v-if="!recentActivity.length" class="panel__empty">لا يوجد نشاط بعد</div>
        <div v-for="a in recentActivity" :key="a.id" class="act">
          <span class="act__dot" />
          <div class="act__info">
            <span class="act__line"><b>{{ a.action }}</b> · {{ a.entity }} — {{ a.detail }}</span>
            <span class="act__meta">{{ a.user }} · {{ a.ts }}</span>
          </div>
        </div>
      </div>

      <div class="panel app-card">
        <div class="panel__head">
          <span class="panel__title">الإشعارات</span>
          <button class="link-btn" @click="router.push({ name: 'notifications-page' })">عرض الكل</button>
        </div>
        <div v-if="!recentNotifs.length" class="panel__empty">لا توجد إشعارات</div>
        <button
          v-for="n in recentNotifs"
          :key="n.id"
          class="notif"
          :class="[(NOTIF_STYLE[n.type] || NOTIF_STYLE.info).cls, { 'is-unread': !n.read }]"
          type="button"
          @click="goNotif(n.section)"
        >
          <span class="notif__icon">{{ (NOTIF_STYLE[n.type] || NOTIF_STYLE.info).icon }}</span>
          <div class="notif__info">
            <span class="notif__title">{{ n.title }}</span>
            <span class="notif__body">{{ n.body }}</span>
          </div>
          <span class="notif__time">{{ n.time }}</span>
        </button>
      </div>
    </div>

    <!-- نظرة على كل المشاريع — المنصة الأم للمشترك -->
    <div class="panel app-card projects-ov">
      <div class="panel__head">
        <span class="panel__title">نظرة على كل المشاريع</span>
        <span class="projects-ov__total">الإجمالي: <b>{{ fmt(grandTotal) }}</b></span>
      </div>
      <div class="projects-ov__grid">
        <button
          v-for="p in projectOverview"
          :key="p.id"
          class="pov"
          :class="{ 'is-active': p.id === activeProjectId }"
          type="button"
          @click="activeProjectId = p.id"
        >
          <div class="pov__top">
            <span class="pov__icon" :style="{ background: p.color + '22', color: p.color }">{{ p.icon }}</span>
            <div class="pov__id">
              <span class="pov__name">{{ p.name }}</span>
              <span class="pov__type">{{ p.type }}</span>
            </div>
          </div>
          <span class="pov__bal" :class="{ 'is-neg': p.bal < 0 }">{{ fmt(p.bal) }}</span>
          <div class="pov__bar">
            <span
              class="pov__bar-fill"
              :class="{ 'is-neg': p.bal < 0 }"
              :style="{ inlineSize: Math.max(4, (Math.abs(p.bal) / maxBal) * 100) + '%', background: p.bal < 0 ? undefined : p.color }"
            />
          </div>
        </button>
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

  &__greet {
    color: var(--primary);
    font-weight: 600;
    margin-inline-end: 6px;
  }

  &__controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(184px, 1fr));
    gap: 16px;
    margin-block-end: 20px;
  }

  &__row {
    display: grid;
    gap: 20px;
    margin-block-end: 20px;

    &--chart {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }

    &--pulse {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    }

    &--split {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 860px) {
      grid-template-columns: 1fr !important;
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

.link-btn {
  background: none;
  border: none;
  color: var(--info-text);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;

  &:hover { text-decoration: underline; }
}

/* ── بطاقات الإحصائيات ── */
.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 20px;
  text-align: start;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;

  &::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: 3px;
    background: var(--primary);
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary);

    &::before { opacity: 1; }
  }

  &__body { min-inline-size: 0; }

  &__label {
    font-size: 13px;
    color: var(--text-muted);
    display: block;
    margin-block-end: 6px;
  }

  &__value {
    font-size: 19px;
    font-weight: 700;
    display: block;
  }

  &__delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-block-start: 8px;
    font-size: 11.5px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;

    &.is-good { color: var(--ok-text); background: var(--ok-bg); }
    &.is-bad { color: var(--danger-text); background: var(--danger-bg); }
  }

  &__arrow { font-size: 9px; }

  &__delta-note {
    font-weight: 400;
    color: var(--text-muted);
    font-size: 10.5px;
  }

  &__icon {
    inline-size: 46px;
    block-size: 46px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    flex-shrink: 0;
  }
}

/* ── شريط الصافي أسفل الرسم ── */
.net-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-start: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;

  span { color: var(--text-muted); }
  strong { font-size: 15px; font-weight: 700; }

  &.is-pos { background: var(--ok-bg); strong { color: var(--ok-text); } }
  &.is-neg { background: var(--danger-bg); strong { color: var(--danger-text); } }
}

/* ── الألواح العامة ── */
.panel {
  padding: 20px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 14px;
  }

  &__title { font-weight: 600; font-size: 15px; }

  &__empty {
    padding: 24px 12px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }
}

/* ── التنبيهات العاجلة ── */
.urgent__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-block-end: 8px;

  &.is-expired { background: var(--danger-bg); }
  &.is-expiring { background: var(--warn-bg); }
}

.urgent {
  &__icon { font-size: 18px; }

  &__info { display: flex; flex-direction: column; min-inline-size: 0; flex: 1; }

  &__name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__days { font-size: 11px; color: var(--text-muted); }

  &__tag {
    font-size: 10.5px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 20px;
    flex-shrink: 0;

    &.is-expired { background: var(--danger-text); color: #fff; }
    &.is-expiring { background: var(--warn-text); color: #fff; }
  }
}

/* ── نظرة شاملة ── */
.pulse-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pulse-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  text-align: start;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
    box-shadow: var(--shadow);
  }

  &__icon {
    inline-size: 38px;
    block-size: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-block-end: 4px;
  }

  &__label { font-size: 12px; color: var(--text-muted); }
  &__value { font-size: 16px; font-weight: 700; }
  &__sub { font-size: 11px; color: var(--text-muted); }
}

/* ── الطلبات المعلقة ── */
.req {
  padding: 12px 14px;
  background: var(--warn-bg);
  border-radius: 10px;
  margin-block-end: 10px;

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-block-end: 4px;
  }

  &__title { font-size: 13px; font-weight: 600; }
  &__amount { font-size: 14px; font-weight: 700; flex-shrink: 0; }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-block-end: 10px;
  }

  &__by { font-size: 11px; color: var(--text-muted); }

  &__type {
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--surface-2);
    padding: 1px 8px;
    border-radius: 20px;
  }

  &__actions { display: flex; gap: 8px; }

  &__btn {
    flex: 1;
    padding: 7px;
    border-radius: 8px;
    border: none;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover { opacity: 0.9; }

    &.is-approve { background: var(--success); color: #fff; }
    &.is-reject { background: var(--danger-bg); color: var(--danger-text); }
  }
}

/* ── آخر العمليات ── */
.recent__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-block: 9px;
  border-block-end: 1px solid var(--border);

  &:last-child { border-block-end: none; }
}

.recent {
  &__badge {
    inline-size: 34px;
    block-size: 34px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;

    &.is-income { background: var(--ok-bg); color: var(--ok-text); }
    &.is-expense { background: var(--danger-bg); color: var(--danger-text); }
    &.is-transfer { background: var(--info-bg); color: var(--info-text); }
  }

  &__info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; }

  &__desc {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date { font-size: 11px; color: var(--text-muted); }

  &__amount {
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;

    &.is-income { color: var(--ok-text); }
    &.is-expense { color: var(--danger-text); }
    &.is-transfer { color: var(--info-text); }
  }
}

/* ── شريط الإجراءات المطلوبة ── */
.actions-strip {
  inline-size: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin-block-end: 20px;
  text-align: start;
  cursor: pointer;
  border-inline-start: 4px solid var(--warn-text);
  background: linear-gradient(90deg, var(--warn-bg), var(--surface) 70%);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }

  &__icon { font-size: 24px; flex-shrink: 0; }

  &__main { flex: 1; min-inline-size: 0; }

  &__title { display: block; font-weight: 700; font-size: 14.5px; margin-block-end: 6px; }

  &__chips { display: flex; flex-wrap: wrap; gap: 6px; }

  &__chip {
    font-size: 11.5px;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 2px 10px;
    border-radius: 20px;

    b { color: var(--warn-text); }
  }

  &__cta {
    flex-shrink: 0;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--primary);
  }
}

/* ── النشاط الأخير ── */
.act {
  display: flex;
  gap: 10px;
  padding-block: 9px;
  border-block-end: 1px solid var(--border);

  &:last-child { border-block-end: none; }

  &__dot {
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background: var(--primary);
    margin-block-start: 6px;
    flex-shrink: 0;
  }

  &__info { min-inline-size: 0; display: flex; flex-direction: column; gap: 2px; }

  &__line {
    font-size: 12.5px;
    line-height: 1.6;
    b { color: var(--text); }
  }

  &__meta { font-size: 11px; color: var(--text-muted); }
}

/* ── الإشعارات ── */
.notif {
  inline-size: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: start;
  cursor: pointer;
  margin-block-end: 6px;
  transition: background 0.15s ease;

  &:hover { background: var(--surface-2); }
  &.is-unread { background: var(--info-bg); }

  &__icon { font-size: 16px; flex-shrink: 0; margin-block-start: 1px; }

  &__info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; gap: 2px; }

  &__title {
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__body {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__time { font-size: 10.5px; color: var(--text-muted); flex-shrink: 0; }

  &.is-danger .notif__title { color: var(--danger-text); }
  &.is-warn .notif__title { color: var(--warn-text); }
  &.is-ok .notif__title { color: var(--ok-text); }
}

/* ── نظرة على كل المشاريع ── */
.projects-ov {
  &__total {
    font-size: 12.5px;
    color: var(--text-muted);
    b { color: var(--text); font-weight: 700; }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}

.pov {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  cursor: pointer;
  text-align: start;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
  &.is-active { border-color: var(--primary); background: var(--primary-soft); }

  &__top { display: flex; align-items: center; gap: 10px; }

  &__icon {
    inline-size: 36px;
    block-size: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
  }

  &__id { min-inline-size: 0; display: flex; flex-direction: column; }

  &__name {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type { font-size: 11px; color: var(--text-muted); }

  &__bal {
    font-size: 15px;
    font-weight: 700;
    &.is-neg { color: var(--danger-text); }
  }

  &__bar {
    inline-size: 100%;
    block-size: 6px;
    border-radius: 4px;
    background: var(--surface-2);
    overflow: hidden;
  }

  &__bar-fill {
    display: block;
    block-size: 100%;
    border-radius: 4px;
    background: var(--primary);
    transition: inline-size 0.4s ease;
    &.is-neg { background: var(--danger-text); }
  }
}

@media (max-width: 560px) {
  .pulse-grid { grid-template-columns: 1fr 1fr; }
}
</style>
