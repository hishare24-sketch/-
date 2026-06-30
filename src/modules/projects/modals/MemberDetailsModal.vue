<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { fmt, fmtNum } from '@/helpers/format'
import { ROLES, MEMBER_TXN_TYPES } from '@/constants'
import type { Member, MemberTxn } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ member: Member }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const role = computed(() => ROLES.find((r) => r.id === props.member.role)!)
const txns = computed(() => projectsStore.txnsByMember(props.member.id))

const txnInfo = (t: MemberTxn) => MEMBER_TXN_TYPES.find((x) => x.id === t.type)
function statusInfo(s: MemberTxn['status']) {
  if (s === 'accepted') return { l: 'مقبولة', c: '#059669', bg: '#ecfdf5' }
  if (s === 'rejected') return { l: 'مرفوضة', c: '#dc2626', bg: '#fef2f2' }
  return { l: 'معلّقة', c: '#d97706', bg: '#fffbeb' }
}
</script>

<template>
  <ModalShell :title="member.name" @close="emit('close')">
    <div class="head">
      <span class="head__avatar" :style="{ background: role.color + '20', color: role.color }">
        {{ member.name.charAt(0) }}
      </span>
      <div class="head__info">
        <span class="head__email">{{ member.email }}</span>
        <span class="head__role" :style="{ background: role.color + '18', color: role.color }">{{ role.label }}</span>
      </div>
      <div class="head__balance">
        <span>الرصيد</span>
        <strong>{{ fmt(member.balance ?? 0) }}</strong>
      </div>
    </div>

    <!-- الصلاحيات -->
    <div class="perms">
      <span class="perms__label">الصلاحيات ({{ member.permissions.length }})</span>
      <div class="perms__list">
        <span v-for="p in member.permissions" :key="p" class="perm-chip">{{ p }}</span>
      </div>
    </div>

    <!-- حركات الرصيد -->
    <div class="txns">
      <span class="txns__label">حركات الرصيد ({{ txns.length }})</span>
      <div v-if="!txns.length" class="txns__empty">لا توجد حركات.</div>
      <div v-for="t in txns" :key="t.id" class="txn">
        <span class="txn__icon">{{ txnInfo(t)?.icon }}</span>
        <div class="txn__info">
          <span class="txn__type">{{ txnInfo(t)?.label }}</span>
          <span class="txn__meta">{{ t.date }}{{ t.note ? ` · ${t.note}` : '' }}</span>
        </div>
        <span class="txn__amount" :class="t.direction">
          {{ t.direction === 'to_member' ? '+' : '−' }}{{ fmtNum(t.amount) }}
        </span>
        <span class="txn__status" :style="{ background: statusInfo(t.status).bg, color: statusInfo(t.status).c }">
          {{ statusInfo(t.status).l }}
        </span>
      </div>
    </div>

    <template #footer>
      <button class="app-btn" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-block-end: 20px;

  &__avatar {
    inline-size: 48px;
    block-size: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
  }

  &__info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
  &__email { font-size: 13px; color: var(--text-muted); }

  &__role {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }

  &__balance {
    text-align: center;

    span { display: block; font-size: 11px; color: var(--text-muted); }
    strong { font-size: 15px; }
  }
}

.perms {
  margin-block-end: 20px;

  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 10px; }
  &__list { display: flex; flex-wrap: wrap; gap: 6px; }
}

.perm-chip {
  background: var(--bg);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-muted);
}

.txns {
  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
}

.txn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-block: 8px;
  border-block-end: 1px solid var(--border);

  &:last-child { border-block-end: none; }

  &__icon { font-size: 18px; }
  &__info { flex: 1; display: flex; flex-direction: column; }
  &__type { font-weight: 600; font-size: 13px; }
  &__meta { font-size: 11px; color: var(--text-muted); }

  &__amount {
    font-weight: 600;
    font-size: 13px;

    &.to_member { color: #15803d; }
    &.from_member { color: #b91c1c; }
  }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
  }
}
</style>
