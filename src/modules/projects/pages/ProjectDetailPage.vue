<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { txErrors } from '@/helpers/txAnalysis'
import { ROLES, CURRENT_USER, PERMISSIONS } from '@/constants'
import type { Member, Transaction } from '@/interfaces/models'
import TxDetailsModal from '@/modules/finance/modals/TxDetailsModal.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import MemberFormModal from '../modals/MemberFormModal.vue'
import MemberTxnFormModal from '../modals/MemberTxnFormModal.vue'
import MemberDetailsModal from '../modals/MemberDetailsModal.vue'
import TxFormModal from '@/modules/finance/modals/TxFormModal.vue'
import TrackingFormModal from '@/modules/trackings/modals/TrackingFormModal.vue'
import RequestFormModal from '@/modules/requests/modals/RequestFormModal.vue'
import DocFormModal from '@/modules/documents/modals/DocFormModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const documentsStore = useDocumentsStore()
const trackingsStore = useTrackingsStore()
const requestsStore = useRequestsStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectsStore.projectById(projectId.value))

type Tab = 'overview' | 'members' | 'cashflow'
const tab = ref<Tab>('overview')

const txns = computed(() => financeStore.byProject(projectId.value))
const income = computed(() => txns.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const expense = computed(() => txns.value.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const balance = computed(() => financeStore.balanceOf(projectId.value))
const projMembers = computed(() => projectsStore.membersByProject(projectId.value))
const transfersIn = computed(() => txns.value.filter((t) => t.type === 'transfer' && t.transferDir === 'in').reduce((s, t) => s + t.amount, 0))
const transfersOut = computed(() => txns.value.filter((t) => t.type === 'transfer' && t.transferDir === 'out').reduce((s, t) => s + t.amount, 0))

// عمليات التدفق مرتبة + كشف العمليات المعطوبة
const sortedTxns = computed(() => [...txns.value].sort((a, b) => b.date.localeCompare(a.date)))
const isFlagged = (t: Transaction) => txErrors(t, { project: project.value, transactions: financeStore.transactions }).length > 0
const isIn = (t: Transaction) => t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in')
const CURRENT = CURRENT_USER
const viewingTx = ref<Transaction | null>(null)

const roleOf = (m: Member) => ROLES.find((r) => r.id === m.role)!
const permLabel = (id: string) => PERMISSIONS.find((p) => p.id === id)?.label ?? id

// كشف عدم تطابق رصيد العهدة (المخزّن مقابل مجموع الحركات المقبولة)
function memberIssue(m: Member): string | null {
  const computed = projectsStore.computedMemberBalance(m.id)
  const stored = m.balance ?? 0
  if (Math.abs(computed - stored) > 1) {
    return `الرصيد المخزّن (${fmtNum(stored)}) لا يطابق مجموع الحركات المقبولة (${fmtNum(computed)}). الفرق: ${fmtNum(Math.abs(computed - stored))}. الحل: سجّل حركة تسوية تعيد الرصيد لمطابقة الواقع.`
  }
  return null
}
const expandedIssue = ref<string | null>(null)

// موارد المشروع
const projDocs = computed(() => documentsStore.byProject(projectId.value))
const projTrackings = computed(() => trackingsStore.byProject(projectId.value))
const projReqs = computed(() => requestsStore.byProject(projectId.value))
const pendingReqs = computed(() => projReqs.value.filter((r) => r.status === 'pending'))
const urgentTrackings = computed(() => projTrackings.value.filter((t) => t.status !== 'active'))

const resources = computed(() => [
  { label: '📄 المستندات', count: projDocs.value.length, route: 'documents-page' },
  { label: '🛡️ المتابعات والضمانات', count: projTrackings.value.length, route: 'trackings-page' },
  { label: '📥 الطلبات', count: projReqs.value.length, route: 'requests-page' },
  { label: '⏳ طلبات معلقة', count: pendingReqs.value.length, route: 'requests-page' },
])

function goSection(name: string) {
  projectsStore.setActiveProject(projectId.value)
  router.push({ name })
}

// إجراءات سريعة (إنشاء عنصر مرتبط بالمشروع)
type QuickAction = 'tx' | 'doc' | 'tracking' | 'request'
const quick = ref<QuickAction | null>(null)

// التدفقات الشهرية
const monthly = computed(() => {
  const byMonth: Record<string, { income: number; expense: number }> = {}
  txns.value.forEach((t) => {
    const m = t.date.slice(0, 7)
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 }
    if (t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in')) byMonth[m].income += t.amount
    else byMonth[m].expense += t.amount
  })
  const months = Object.keys(byMonth).sort()
  const max = Math.max(...months.map((m) => Math.max(byMonth[m].income, byMonth[m].expense)), 1)
  return { rows: months.map((m) => ({ month: m, ...byMonth[m] })), max }
})

// بيانات رسم التدفقات
const flowView = ref<'bars' | 'line'>('bars')
const flowLabels = computed(() => monthly.value.rows.map((r) => r.month.slice(5)))
const flowSeries = computed(() => [
  { name: 'وارد', color: '#3b82f6', values: monthly.value.rows.map((r) => r.income) },
  { name: 'صادر', color: '#f87171', values: monthly.value.rows.map((r) => r.expense) },
])

// المودالات
const showMemberForm = ref(false)
const editingMember = ref<Member | null>(null)
const viewingMember = ref<Member | null>(null)
const showTxnForm = ref(false)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function addMember() {
  editingMember.value = null
  showMemberForm.value = true
}
function editMember(m: Member) {
  editingMember.value = m
  showMemberForm.value = true
}
async function removeMember(m: Member) {
  const ok = await confirmRef.value?.open({ title: 'حذف العضو', message: `حذف "${m.name}" من المشروع؟` })
  if (ok) projectsStore.removeMember(m.id)
}

const pendingTxns = computed(() =>
  projectsStore.memberTxns.filter((t) => t.projectId === projectId.value && t.status === 'pending'),
)

// بحث + فلتر الأعضاء بالدور
const memberSearch = ref('')
const roleFilter = ref<'all' | Member['role']>('all')
const filteredMembers = computed(() =>
  projMembers.value.filter((m) => {
    if (roleFilter.value !== 'all' && m.role !== roleFilter.value) return false
    const q = memberSearch.value.trim().toLowerCase()
    if (q && !m.name.toLowerCase().includes(q) && !(m.email ?? '').toLowerCase().includes(q)) return false
    return true
  }),
)

// ملخّص الأعضاء
const memberSummary = computed(() => {
  const ms = projMembers.value
  return {
    total: ms.length,
    custody: ms.reduce((s, m) => s + (m.balance ?? 0), 0),
    invited: ms.filter((m) => m.status === 'invited').length,
    issues: ms.filter((m) => memberIssue(m)).length,
  }
})
</script>

<template>
  <section v-if="project" class="detail">
    <button class="back" @click="router.push({ name: 'projects-page' })">‹ رجوع للمشاريع</button>

    <header class="detail__header">
      <span class="detail__avatar" :style="{ background: project.color + '20' }">{{ project.icon }}</span>
      <div class="detail__title">
        <h1>{{ project.name }}</h1>
        <span>{{ project.type }}{{ project.description ? ` — ${project.description}` : '' }}</span>
      </div>
      <div class="detail__balance">
        <span class="detail__balance-label">الرصيد الحالي</span>
        <span class="detail__balance-value" :class="{ 'is-neg': balance < 0 }">{{ fmt(balance) }}</span>
      </div>
    </header>

    <!-- شريط الأعضاء -->
    <div v-if="projMembers.length" class="avatars">
      <span class="avatars__label">الأعضاء:</span>
      <span
        v-for="m in projMembers.slice(0, 10)"
        :key="m.id"
        class="avatars__item"
        :title="m.name"
        :style="{ background: roleOf(m).color + '20', color: roleOf(m).color }"
        @click="viewingMember = m"
      >
        {{ m.name.charAt(0) }}
      </span>
      <span v-if="projMembers.length > 10" class="avatars__more">+{{ projMembers.length - 10 }}</span>
    </div>

    <!-- التبويبات -->
    <div class="tabs">
      <button
        v-for="t in (['overview', 'members', 'cashflow'] as Tab[])"
        :key="t"
        class="tabs__btn"
        :class="{ 'is-active': tab === t }"
        @click="tab = t"
      >
        {{ t === 'overview' ? 'نظرة عامة' : t === 'members' ? 'الأعضاء والصلاحيات' : 'التدفقات النقدية' }}
      </button>
    </div>

    <!-- نظرة عامة -->
    <div v-if="tab === 'overview'" class="ov">
      <!-- إجراء سريع -->
      <div class="quick app-card">
        <span class="quick__label">إجراء سريع:</span>
        <button class="quick__btn quick__btn--ok" @click="quick = 'tx'">💰 عملية مالية</button>
        <button class="quick__btn quick__btn--info" @click="quick = 'doc'">📄 مستند</button>
        <button class="quick__btn quick__btn--warn" @click="quick = 'tracking'">🛡️ متابعة</button>
        <button class="quick__btn quick__btn--purple" @click="quick = 'request'">📝 طلب</button>
      </div>

      <!-- بطاقات الإحصائيات -->
      <div class="ov-stats">
        <div class="ov-card" style="background: #ecfdf5">
          <span class="ov-card__icon">📈</span>
          <strong style="color: #15803d">{{ fmt(income) }}</strong>
          <span class="ov-card__label">إجمالي الإيرادات</span>
        </div>
        <div class="ov-card" style="background: #fef2f2">
          <span class="ov-card__icon">📉</span>
          <strong style="color: #b91c1c">{{ fmt(expense) }}</strong>
          <span class="ov-card__label">إجمالي المصروفات</span>
        </div>
        <div class="ov-card" style="background: #eff6ff">
          <span class="ov-card__icon">💰</span>
          <strong style="color: #1d4ed8">{{ fmt(income - expense) }}</strong>
          <span class="ov-card__label">صافي الربح</span>
        </div>
        <div class="ov-card" style="background: #faf5ff">
          <span class="ov-card__icon">👥</span>
          <strong style="color: #7c3aed">{{ projMembers.length }}</strong>
          <span class="ov-card__label">عدد الأعضاء</span>
        </div>
      </div>

      <!-- الموارد + الإشعارات الإجرائية -->
      <div class="ov-grid">
        <div class="app-card panel">
          <span class="panel__title">الموارد والمستندات</span>
          <button v-for="r in resources" :key="r.label" class="res-row" @click="goSection(r.route)">
            <span>{{ r.label }}</span>
            <span class="res-row__n">{{ r.count }} <span class="res-row__chev">‹</span></span>
          </button>
        </div>

        <div class="app-card panel">
          <span class="panel__title">الإشعارات الإجرائية</span>
          <div v-if="!pendingReqs.length && !urgentTrackings.length" class="panel__empty">لا توجد إجراءات مطلوبة ✅</div>
          <div v-for="r in pendingReqs" :key="r.id" class="note note--warn">
            <span>⏳</span>
            <div>
              <span class="note__title">{{ r.title }}</span>
              <span class="note__sub">طلب بانتظار الاعتماد — {{ fmtNum(r.amount) }} ر.س</span>
            </div>
          </div>
          <div v-for="t in urgentTrackings" :key="t.id" class="note" :class="t.status === 'expired' ? 'note--danger' : 'note--warn'">
            <span>{{ t.icon }}</span>
            <div>
              <span class="note__title">{{ t.name }}</span>
              <span class="note__sub">{{ t.status === 'expired' ? 'منتهٍ — يتطلب تجديد' : `ينتهي خلال ${t.daysLeft} يوم` }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- مستندات + متابعات المشروع -->
      <div v-if="projDocs.length || projTrackings.length" class="ov-grid">
        <div v-if="projDocs.length" class="app-card panel">
          <div class="panel__head">
            <span class="panel__title">📄 مستندات المشروع</span>
            <button class="link-btn" @click="goSection('documents-page')">عرض الكل ‹</button>
          </div>
          <button v-for="d in projDocs.slice(0, 4)" :key="d.id" class="item" @click="goSection('documents-page')">
            <span class="item__icon">📄</span>
            <div class="item__info">
              <span class="item__name">{{ d.name }}</span>
              <span class="item__sub">{{ d.type }} · {{ d.date }}</span>
            </div>
            <span class="item__action">⚡ إجراءات</span>
          </button>
        </div>

        <div v-if="projTrackings.length" class="app-card panel">
          <div class="panel__head">
            <span class="panel__title">🛡️ متابعات المشروع</span>
            <button class="link-btn" @click="goSection('trackings-page')">عرض الكل ‹</button>
          </div>
          <button v-for="t in projTrackings.slice(0, 4)" :key="t.id" class="item" @click="goSection('trackings-page')">
            <span class="item__icon">{{ t.icon }}</span>
            <div class="item__info">
              <span class="item__name">{{ t.name }}</span>
              <span class="item__sub" :class="{ 'is-expired': t.status === 'expired' }">{{ t.status === 'expired' ? 'منتهٍ' : `${t.daysLeft} يوم` }}</span>
            </div>
            <span class="item__chev">‹</span>
          </button>
        </div>
      </div>
    </div>

    <!-- الأعضاء -->
    <div v-else-if="tab === 'members'" class="ov">
      <!-- ملخّص الأعضاء -->
      <div class="ov-stats">
        <div class="ov-card" style="background: #faf5ff">
          <span class="ov-card__icon">👥</span>
          <strong style="color: #7c3aed">{{ memberSummary.total }}</strong>
          <span class="ov-card__label">إجمالي الأعضاء</span>
        </div>
        <div class="ov-card" style="background: #ecfdf5">
          <span class="ov-card__icon">📤</span>
          <strong style="color: #15803d">{{ fmt(memberSummary.custody) }}</strong>
          <span class="ov-card__label">إجمالي العهد القائمة</span>
        </div>
        <div class="ov-card" style="background: #fffbeb">
          <span class="ov-card__icon">✉️</span>
          <strong style="color: #a16207">{{ memberSummary.invited }}</strong>
          <span class="ov-card__label">دعوات معلّقة</span>
        </div>
        <div class="ov-card" :style="{ background: memberSummary.issues ? '#fef2f2' : '#eff6ff' }">
          <span class="ov-card__icon">{{ memberSummary.issues ? '⚠️' : '✅' }}</span>
          <strong :style="{ color: memberSummary.issues ? '#b91c1c' : '#1d4ed8' }">{{ memberSummary.issues }}</strong>
          <span class="ov-card__label">تنبيهات رصيد</span>
        </div>
      </div>

      <!-- شريط الأدوات -->
      <div class="bar">
        <span class="bar__title">أعضاء المشروع ({{ filteredMembers.length }})</span>
        <div class="bar__actions">
          <button class="app-btn app-btn--outlined" @click="showTxnForm = true">＋ حركة رصيد</button>
          <button class="app-btn" @click="addMember">＋ عضو</button>
        </div>
      </div>

      <!-- بحث + فلتر بالدور -->
      <div class="mfilter app-card">
        <input v-model="memberSearch" class="mfilter__search" type="search" placeholder="🔍 بحث بالاسم أو البريد…" />
        <div class="mfilter__roles">
          <button class="role-chip" :class="{ 'is-on': roleFilter === 'all' }" @click="roleFilter = 'all'">الكل</button>
          <button
            v-for="r in ROLES"
            :key="r.id"
            class="role-chip"
            :class="{ 'is-on': roleFilter === r.id }"
            :style="roleFilter === r.id ? { background: r.color + '18', color: r.color, borderColor: r.color + '55' } : {}"
            @click="roleFilter = r.id"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <!-- حركات معلقة بانتظار القرار -->
      <div v-if="pendingTxns.length" class="pending app-card">
        <span class="pending__title">⏳ حركات بانتظار القبول/الرفض</span>
        <div v-for="t in pendingTxns" :key="t.id" class="pending__row">
          <span>{{ projectsStore.memberById(t.memberId)?.name }} — {{ fmtNum(t.amount) }} ر.س</span>
          <span class="pending__note">{{ t.note }}</span>
          <div class="pending__btns">
            <button class="mini-btn mini-btn--ok" @click="projectsStore.decideMemberTxn(t.id, 'accepted')">✓ قبول</button>
            <button class="mini-btn mini-btn--no" @click="projectsStore.decideMemberTxn(t.id, 'rejected')">✕ رفض</button>
          </div>
        </div>
      </div>

      <!-- حالة فارغة -->
      <div v-if="!filteredMembers.length" class="empty app-card">
        <span class="empty__icon">👥</span>
        <span class="empty__title">{{ projMembers.length ? 'لا يوجد أعضاء مطابقون للبحث' : 'لا يوجد أعضاء بعد' }}</span>
        <span class="empty__sub">{{ projMembers.length ? 'جرّب تغيير الفلتر أو كلمة البحث.' : 'أضف أول طرف للمشروع لبدء إدارة الصلاحيات والعهد.' }}</span>
        <button v-if="!projMembers.length" class="app-btn" @click="addMember">＋ إضافة عضو</button>
      </div>

      <!-- بطاقات الأعضاء -->
      <div class="members">
        <div v-for="m in filteredMembers" :key="m.id" class="member-card app-card">
          <div class="member-card__top">
            <span class="member__avatar member__clickable" :style="{ background: roleOf(m).color + '20', color: roleOf(m).color }" @click="viewingMember = m">
              {{ m.name.charAt(0) }}
            </span>
            <div class="member__info member__clickable" @click="viewingMember = m">
              <span class="member__name">
                {{ m.name }}
                <span v-if="m.status === 'invited'" class="badge badge--invite">دعوة معلّقة</span>
                <button
                  v-if="memberIssue(m)"
                  class="badge badge--issue"
                  title="مشكلة في الرصيد"
                  @click.stop="expandedIssue = expandedIssue === m.id ? null : m.id"
                >
                  ⚠️
                </button>
              </span>
              <span class="member__email">{{ m.email }}</span>
            </div>
            <span class="member__role" :style="{ background: roleOf(m).color + '18', color: roleOf(m).color }">
              {{ roleOf(m).label }}
            </span>
            <div class="member__actions">
              <button class="icon-btn" title="عرض الملف" @click="viewingMember = m">👤</button>
              <button v-if="m.role !== 'owner'" class="icon-btn" title="تعديل" @click="editMember(m)">✎</button>
              <button v-if="m.role !== 'owner'" class="icon-btn icon-btn--danger" title="حذف" @click="removeMember(m)">🗑️</button>
            </div>
          </div>

          <!-- لوحة عدم تطابق الرصيد -->
          <div v-if="memberIssue(m) && expandedIssue === m.id" class="issue">
            <div class="issue__head"><span>⚠️</span><strong>عدم تطابق في رصيد العهدة</strong></div>
            <p class="issue__body">{{ memberIssue(m) }}</p>
            <button class="app-btn app-btn--outlined app-btn--sm" @click="viewingMember = m">↗ فتح ملف العضو لتسجيل تسوية</button>
          </div>

          <!-- رصيد العهدة -->
          <div v-if="m.role !== 'owner'" class="member-card__balance">
            <span>رصيد العضو (عُهد)</span>
            <strong :class="{ 'is-pos': (m.balance ?? 0) > 0 }">{{ fmt(m.balance ?? 0) }}</strong>
          </div>

          <!-- الصلاحيات -->
          <div v-if="m.permissions.length" class="member-card__perms">
            <span v-for="p in m.permissions" :key="p" class="perm-chip">{{ permLabel(p) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- التدفقات النقدية -->
    <div v-else class="ov">
      <!-- بطاقات أنواع التدفق -->
      <div class="ov-stats">
        <div class="ov-card" style="background: #ecfdf5">
          <strong style="color: #15803d">{{ fmt(income) }}</strong>
          <span class="ov-card__label">تدفق داخل (إيرادات)</span>
        </div>
        <div class="ov-card" style="background: #fef2f2">
          <strong style="color: #b91c1c">{{ fmt(expense) }}</strong>
          <span class="ov-card__label">تدفق خارج (مصروفات)</span>
        </div>
        <div class="ov-card" style="background: #eff6ff">
          <strong style="color: #1d4ed8">{{ fmt(transfersIn) }}</strong>
          <span class="ov-card__label">تحويلات واردة</span>
        </div>
        <div class="ov-card" style="background: #fffbeb">
          <strong style="color: #a16207">{{ fmt(transfersOut) }}</strong>
          <span class="ov-card__label">تحويلات صادرة</span>
        </div>
      </div>

      <!-- التدفق النقدي الشهري + مبدّل الرسم -->
      <ChartCard
        v-model="flowView"
        title="التدفق النقدي الشهري"
        :collapsible="false"
        :views="[
          { id: 'bars', icon: '📊', label: 'تفصيلي' },
          { id: 'line', icon: '📈', label: 'خطّي' },
        ]"
      >
        <div v-if="!monthly.rows.length" class="cashflow__empty">لا توجد بيانات تدفق بعد.</div>
        <LineChart v-else-if="flowView === 'line'" :labels="flowLabels" :series="flowSeries" />
        <div v-else class="months">
          <div v-for="row in monthly.rows" :key="row.month" class="month">
            <div class="month__head">
              <span>{{ row.month }}</span>
              <span class="month__net" :class="{ 'is-neg': row.income - row.expense < 0 }">
                صافي: {{ fmtNum(row.income - row.expense) }}
              </span>
            </div>
            <div class="month__bar">
              <span class="month__tag is-in">داخل</span>
              <div class="month__track"><div class="month__fill is-in" :style="{ width: `${(row.income / monthly.max) * 100}%` }" /></div>
              <span class="month__val is-in">{{ fmtNum(row.income) }}</span>
            </div>
            <div class="month__bar">
              <span class="month__tag is-out">خارج</span>
              <div class="month__track"><div class="month__fill is-out" :style="{ width: `${(row.expense / monthly.max) * 100}%` }" /></div>
              <span class="month__val is-out">{{ fmtNum(row.expense) }}</span>
            </div>
          </div>
        </div>
      </ChartCard>

      <!-- تفاصيل عمليات التدفق -->
      <div class="app-card panel">
        <div class="panel__head">
          <span class="panel__title">تفاصيل عمليات التدفق ({{ txns.length }})</span>
          <button class="link-btn" @click="goSection('finance-page')">الإدارة المالية ‹</button>
        </div>
        <div v-if="!txns.length" class="panel__empty">لا توجد عمليات بعد.</div>
        <div class="flows">
          <button
            v-for="t in sortedTxns"
            :key="t.id"
            class="flow"
            :class="{ 'is-flagged': isFlagged(t), 'is-in': isIn(t) && !isFlagged(t), 'is-out': !isIn(t) && !isFlagged(t) }"
            @click="viewingTx = t"
          >
            <span class="flow__badge" :class="isIn(t) ? 'is-in' : 'is-out'">
              {{ t.type === 'income' ? '↓' : t.type === 'expense' ? '↑' : '↔' }}
            </span>
            <div class="flow__info">
              <span class="flow__desc">
                {{ t.description }}
                <span v-if="isFlagged(t)" class="flow__warn" title="تحتاج مراجعة">⚠️</span>
              </span>
              <span class="flow__meta">
                {{ t.category }} · {{ t.date }}{{ t.source ? ` · ${t.source}` : '' }} · بواسطة {{ t.createdBy ?? CURRENT }}
              </span>
            </div>
            <span class="flow__amount" :class="isIn(t) ? 'is-in' : 'is-out'">
              {{ isIn(t) ? '+' : '−' }}{{ fmtNum(t.amount) }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <MemberFormModal
      v-if="showMemberForm"
      :project-id="projectId"
      :member="editingMember"
      @close="showMemberForm = false"
    />
    <MemberTxnFormModal v-if="showTxnForm" :project-id="projectId" @close="showTxnForm = false" />
    <MemberDetailsModal v-if="viewingMember" :member="viewingMember" @close="viewingMember = null" />

    <!-- نماذج الإجراء السريع (مرتبطة بالمشروع) -->
    <TxFormModal v-if="quick === 'tx'" :project-id="projectId" :tx="null" @close="quick = null" />
    <DocFormModal v-if="quick === 'doc'" :project-id="projectId" @close="quick = null" />
    <TrackingFormModal v-if="quick === 'tracking'" :project-id="projectId" :tracking="null" @close="quick = null" />
    <RequestFormModal v-if="quick === 'request'" :project-id="projectId" @close="quick = null" />

    <TxDetailsModal v-if="viewingTx" :tx="viewingTx" @edit="viewingTx = null" @close="viewingTx = null" />

    <ConfirmModal ref="confirmRef" />
  </section>

  <section v-else class="detail">
    <p class="not-found">المشروع غير موجود.</p>
    <button class="app-btn app-btn--outlined" @click="router.push({ name: 'projects-page' })">رجوع للمشاريع</button>
  </section>
</template>

<style lang="scss" scoped>
.detail {
  max-inline-size: 1100px;
}

.back {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  font-family: inherit;
  margin-block-end: 12px;
}

.not-found {
  margin-block-end: 16px;
  color: var(--text-muted);
}

.detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-block-end: 20px;
  flex-wrap: wrap;
}

.detail__avatar {
  inline-size: 64px;
  block-size: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.detail__title {
  flex: 1;
  min-inline-size: 200px;

  h1 {
    font-size: 22px;
    font-weight: 700;
  }

  span {
    font-size: 13px;
    color: var(--text-muted);
  }
}

.detail__balance {
  text-align: start;

  &-label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
  }

  &-value {
    font-size: 24px;
    font-weight: 800;
    color: #15803d;

    &.is-neg {
      color: #b91c1c;
    }
  }
}

.avatars {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-block-end: 20px;
  flex-wrap: wrap;

  &__label {
    font-size: 12px;
    color: var(--text-muted);
    margin-inline-end: 4px;
  }

  &__item {
    inline-size: 34px;
    block-size: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
  }

  &__more {
    font-size: 12px;
    color: var(--text-muted);
  }
}

.tabs {
  display: inline-flex;
  gap: 4px;
  margin-block-end: 20px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;
  flex-wrap: wrap;

  &__btn {
    padding: 7px 18px;
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

.ov {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

// إجراء سريع
.quick {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  flex-wrap: wrap;

  &__label { font-weight: 600; font-size: 13px; color: var(--text-muted); }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 10px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &--ok { background: #ecfdf5; color: #059669; }
    &--info { background: #ecfeff; color: #0891b2; }
    &--warn { background: #fffbeb; color: #d97706; }
    &--purple { background: #faf5ff; color: #7c3aed; }

    &:hover { filter: brightness(0.97); }
  }
}

.ov-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.ov-card {
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__icon { font-size: 22px; }
  &__label { font-size: 12px; color: var(--text-muted); }

  strong { font-size: 18px; }
}

.ov-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.panel {
  padding: 18px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 12px;
  }

  &__title { font-weight: 600; font-size: 15px; }
  &__empty { padding: 16px 0; text-align: center; color: var(--text-muted); font-size: 13px; }
}

.res-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  inline-size: 100%;
  padding: 11px 0;
  border: none;
  border-block-end: 1px solid var(--border);
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;

  &:last-child { border-block-end: none; }
  &:hover { color: var(--primary); }

  &__n { display: flex; align-items: center; gap: 8px; font-weight: 700; }
  &__chev { color: var(--text-muted); font-weight: 400; }
}

.note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  margin-block-end: 8px;

  &--warn { background: #fffbeb; }
  &--danger { background: #fef2f2; }

  &__title { display: block; font-size: 12.5px; font-weight: 500; }
  &__sub { font-size: 11.5px; color: var(--text-muted); }
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  inline-size: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 9px;
  background: var(--bg);
  font-family: inherit;
  cursor: pointer;
  margin-block-end: 6px;
  text-align: start;

  &:hover { background: var(--primary-soft); }

  &__icon { font-size: 18px; }
  &__info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; }
  &__name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__sub { font-size: 11px; color: var(--text-muted); &.is-expired { color: #b91c1c; } }
  &__action { font-size: 11.5px; font-weight: 600; color: var(--primary); background: var(--primary-soft); padding: 5px 10px; border-radius: 8px; flex-shrink: 0; }
  &__chev { color: var(--text-muted); }
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
}

// التدفق الشهري التفصيلي
.months {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.month {
  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
    margin-block-end: 5px;
  }

  &__net {
    font-weight: 600;
    color: #15803d;

    &.is-neg { color: #b91c1c; }
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-block-end: 4px;
  }

  &__tag {
    inline-size: 40px;
    font-size: 10px;

    &.is-in { color: #15803d; }
    &.is-out { color: #b91c1c; }
  }

  &__track {
    flex: 1;
    block-size: 14px;
    background: var(--bg);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    block-size: 100%;
    border-radius: 99px;

    &.is-in { background: #22c55e; }
    &.is-out { background: #f87171; }
  }

  &__val {
    inline-size: 64px;
    text-align: end;
    font-size: 11px;

    &.is-in { color: #15803d; }
    &.is-out { color: #b91c1c; }
  }
}

// خط زمني لعمليات التدفق
.flows {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flow {
  display: flex;
  align-items: center;
  gap: 12px;
  inline-size: 100%;
  padding: 11px 12px;
  border: none;
  border-radius: 10px;
  background: var(--bg);
  border-inline-start: 3px solid var(--border);
  font-family: inherit;
  text-align: start;
  cursor: pointer;

  &.is-in { border-inline-start-color: #22c55e; }
  &.is-out { border-inline-start-color: #f87171; }
  &.is-flagged { background: #fef2f2; border-inline-start-color: var(--error); }

  &:hover { filter: brightness(0.98); }

  &__badge {
    inline-size: 36px;
    block-size: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;

    &.is-in { background: #ecfdf5; color: #059669; }
    &.is-out { background: #fef2f2; color: #dc2626; }
  }

  &__info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; }

  &__desc {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__warn { margin-inline-start: 4px; }

  &__meta { font-size: 11px; color: var(--text-muted); }

  &__amount {
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;

    &.is-in { color: #15803d; }
    &.is-out { color: #b91c1c; }
  }
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 16px;
  flex-wrap: wrap;
  gap: 10px;

  &__title {
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.pending {
  padding: 16px;
  margin-block-end: 16px;

  &__title {
    font-weight: 600;
    font-size: 14px;
    display: block;
    margin-block-end: 10px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    flex-wrap: wrap;
  }

  &__note {
    flex: 1;
    font-size: 12px;
    color: var(--text-muted);
  }

  &__btns {
    display: flex;
    gap: 6px;
  }
}

.mini-btn {
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;

  &--ok {
    background: #ecfdf5;
    color: #059669;
  }

  &--no {
    background: #fef2f2;
    color: #dc2626;
  }
}

// شريط البحث والفلتر
.mfilter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 180px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--bg);
    font-family: inherit;
    font-size: 13px;
    color: var(--text);
  }

  &__roles { display: flex; gap: 6px; flex-wrap: wrap; }
}

.role-chip {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &.is-on { background: var(--primary-soft); color: var(--primary); border-color: var(--primary); }
}

// حالة فارغة
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;

  &__icon { font-size: 34px; }
  &__title { font-weight: 600; font-size: 14px; }
  &__sub { font-size: 12.5px; color: var(--text-muted); max-inline-size: 320px; }
  .app-btn { margin-block-start: 6px; }
}

.members {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-card {
  padding: 16px 18px;

  &__top {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__balance {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-start: 12px;
    padding-block-start: 12px;
    border-block-start: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-muted);

    strong { font-size: 15px; color: var(--text-muted); &.is-pos { color: #15803d; } }
  }

  &__perms {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-block-start: 12px;
    padding-block-start: 12px;
    border-block-start: 1px solid var(--border);
  }
}

.perm-chip {
  font-size: 11px;
  background: var(--bg);
  color: var(--text-muted);
  padding: 3px 9px;
  border-radius: 20px;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 20px;
  border: none;
  font-family: inherit;
  vertical-align: middle;

  &--invite { background: #fffbeb; color: #a16207; }
  &--issue { background: #fef2f2; cursor: pointer; padding: 1px 5px; }
}

.issue {
  margin-block-start: 12px;
  padding: 12px 14px;
  background: #fef2f2;
  border-radius: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-block-end: 6px;

    strong { font-size: 12.5px; color: #b91c1c; }
  }

  &__body { font-size: 12px; color: var(--text); line-height: 1.7; margin-block-end: 10px; }
}

.app-btn--sm { padding: 5px 12px; font-size: 12px; }

.member {
  &__avatar {
    inline-size: 42px;
    block-size: 42px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
  }

  &__clickable { cursor: pointer; }

  &__info {
    flex: 1;
    min-inline-size: 120px;
    display: flex;
    flex-direction: column;
  }

  &__name {
    font-weight: 600;
    font-size: 14px;
  }

  &__email {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__role {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
  }

  &__balance {
    text-align: center;

    span {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
    }

    strong {
      font-size: 14px;
    }
  }

  &__actions {
    display: flex;
    gap: 6px;
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

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  &--danger:hover {
    border-color: var(--error);
    color: var(--error);
  }
}

.cashflow {
  padding: 20px;

  &__title {
    font-weight: 600;
    display: block;
    margin-block-end: 16px;
  }

  &__empty {
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block-end: 10px;
  }

  &__month {
    inline-size: 64px;
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  &__bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__bar {
    block-size: 18px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    padding-inline: 6px;
    min-inline-size: fit-content;

    span {
      font-size: 10px;
      color: #fff;
      white-space: nowrap;
    }

    &--income {
      background: #3b82f6;
    }

    &--expense {
      background: #f87171;
    }
  }
}
</style>
