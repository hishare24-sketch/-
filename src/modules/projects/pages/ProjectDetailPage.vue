<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { fmt, fmtNum } from '@/helpers/format'
import { ROLES } from '@/constants'
import type { Member } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import MemberFormModal from '../modals/MemberFormModal.vue'
import MemberTxnFormModal from '../modals/MemberTxnFormModal.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectsStore.projectById(projectId.value))

type Tab = 'overview' | 'members' | 'cashflow'
const tab = ref<Tab>('overview')

const txns = computed(() => financeStore.byProject(projectId.value))
const income = computed(() => txns.value.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0))
const expense = computed(() => txns.value.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0))
const balance = computed(() => financeStore.balanceOf(projectId.value))
const projMembers = computed(() => projectsStore.membersByProject(projectId.value))

const roleOf = (m: Member) => ROLES.find((r) => r.id === m.role)!

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

// المودالات
const showMemberForm = ref(false)
const editingMember = ref<Member | null>(null)
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
    <div v-if="tab === 'overview'" class="ov-stats">
      <div class="ov-stat app-card">
        <span class="ov-stat__icon" style="background: #ecfdf5">📈</span>
        <div><span class="ov-stat__label">إجمالي الإيرادات</span><strong style="color: #15803d">{{ fmt(income) }}</strong></div>
      </div>
      <div class="ov-stat app-card">
        <span class="ov-stat__icon" style="background: #fef2f2">📉</span>
        <div><span class="ov-stat__label">إجمالي المصروفات</span><strong style="color: #b91c1c">{{ fmt(expense) }}</strong></div>
      </div>
      <div class="ov-stat app-card">
        <span class="ov-stat__icon" style="background: #eff6ff">🧮</span>
        <div><span class="ov-stat__label">عدد العمليات</span><strong>{{ txns.length }}</strong></div>
      </div>
    </div>

    <!-- الأعضاء -->
    <div v-else-if="tab === 'members'">
      <div class="bar">
        <span class="bar__title">أعضاء المشروع ({{ projMembers.length }})</span>
        <div class="bar__actions">
          <button class="app-btn app-btn--outlined" @click="showTxnForm = true">＋ حركة رصيد</button>
          <button class="app-btn" @click="addMember">＋ عضو</button>
        </div>
      </div>

      <!-- حركات معلقة بانتظار القرار -->
      <div v-if="pendingTxns.length" class="pending app-card">
        <span class="pending__title">⏳ حركات بانتظار القرار</span>
        <div v-for="t in pendingTxns" :key="t.id" class="pending__row">
          <span>{{ projectsStore.memberById(t.memberId)?.name }} — {{ fmtNum(t.amount) }} ر.س</span>
          <span class="pending__note">{{ t.note }}</span>
          <div class="pending__btns">
            <button class="mini-btn mini-btn--ok" @click="projectsStore.decideMemberTxn(t.id, 'accepted')">قبول</button>
            <button class="mini-btn mini-btn--no" @click="projectsStore.decideMemberTxn(t.id, 'rejected')">رفض</button>
          </div>
        </div>
      </div>

      <div class="members">
        <div v-for="m in projMembers" :key="m.id" class="member app-card">
          <span class="member__avatar" :style="{ background: roleOf(m).color + '20', color: roleOf(m).color }">
            {{ m.name.charAt(0) }}
          </span>
          <div class="member__info">
            <span class="member__name">{{ m.name }}</span>
            <span class="member__email">{{ m.email }}</span>
          </div>
          <span class="member__role" :style="{ background: roleOf(m).color + '18', color: roleOf(m).color }">
            {{ roleOf(m).label }}
          </span>
          <div class="member__balance">
            <span>الرصيد</span>
            <strong>{{ fmtNum(m.balance ?? 0) }}</strong>
          </div>
          <div class="member__actions">
            <button class="icon-btn" title="تعديل" @click="editMember(m)">✎</button>
            <button class="icon-btn icon-btn--danger" title="حذف" @click="removeMember(m)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- التدفقات النقدية -->
    <div v-else class="app-card cashflow">
      <span class="cashflow__title">التدفقات النقدية الشهرية</span>
      <div v-if="!monthly.rows.length" class="cashflow__empty">لا توجد عمليات.</div>
      <div v-for="row in monthly.rows" :key="row.month" class="cashflow__row">
        <span class="cashflow__month">{{ row.month }}</span>
        <div class="cashflow__bars">
          <div class="cashflow__bar cashflow__bar--income" :style="{ width: `${(row.income / monthly.max) * 100}%` }">
            <span v-if="row.income">{{ fmtNum(row.income) }}</span>
          </div>
          <div class="cashflow__bar cashflow__bar--expense" :style="{ width: `${(row.expense / monthly.max) * 100}%` }">
            <span v-if="row.expense">{{ fmtNum(row.expense) }}</span>
          </div>
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

.ov-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.ov-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px;

  &__icon {
    inline-size: 40px;
    block-size: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  &__label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-block-end: 2px;
  }

  strong {
    font-size: 17px;
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

.members {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  flex-wrap: wrap;

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
