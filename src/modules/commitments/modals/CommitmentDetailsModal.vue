<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { commitmentDone } from '@/helpers/calc'
import { fmt } from '@/helpers/format'
import { COMMITMENT_KINDS, FREQ_LABEL } from '@/constants'
import type { Commitment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ commitment: Commitment }>()
const emit = defineEmits<{ (e: 'pay', c: Commitment): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.projectById(props.commitment.projectId))
const kindLabel = computed(() => COMMITMENT_KINDS.find((k) => k.id === props.commitment.kind)?.label)
const progress = computed(() =>
  props.commitment.totalCount ? Math.round((props.commitment.paidCount / props.commitment.totalCount) * 100) : null,
)
const totalPaid = computed(() => props.commitment.payments.reduce((s, p) => s + p.amount, 0))
</script>

<template>
  <ModalShell :title="commitment.name" @close="emit('close')">
    <div class="head">
      <span class="head__amount" :class="commitment.direction">
        {{ commitment.direction === 'out' ? '−' : '+' }}{{ fmt(commitment.amount) }}
      </span>
      <span class="head__freq">{{ FREQ_LABEL[commitment.freq] }}</span>
    </div>

    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ kindLabel }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr v-if="commitment.party"><td class="rows__key">الطرف</td><td>{{ commitment.party }}</td></tr>
      <tr><td class="rows__key">الاستحقاق القادم</td><td>{{ commitment.nextDue }}</td></tr>
      <tr><td class="rows__key">إجمالي المدفوع</td><td>{{ fmt(totalPaid) }}</td></tr>
    </table>

    <div v-if="progress !== null" class="progress">
      <div class="progress__head">
        <span>التقدّم: {{ commitment.paidCount }} / {{ commitment.totalCount }}</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="progress__track"><div class="progress__fill" :style="{ width: `${progress}%` }" /></div>
    </div>

    <div class="payments">
      <span class="payments__label">سجل الدفعات ({{ commitment.payments.length }})</span>
      <div v-if="!commitment.payments.length" class="payments__empty">لم تُسجَّل دفعات بعد.</div>
      <div v-for="p in commitment.payments" :key="p.id" class="payment">
        <span class="payment__dot" />
        <div class="payment__info">
          <span class="payment__amount">{{ fmt(p.amount) }}</span>
          <span class="payment__meta">{{ p.date }} · {{ p.dueLabel }}</span>
        </div>
      </div>
    </div>

    <div v-if="commitment.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="commitment.attachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
      <button v-if="commitment.active && !commitmentDone(commitment)" class="app-btn" @click="emit('pay', commitment)">
        {{ commitment.direction === 'out' ? 'دفع' : 'استلام' }} دفعة
      </button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-block-end: 18px;

  &__amount {
    font-size: 22px;
    font-weight: 800;

    &.out { color: #b91c1c; }
    &.in { color: #15803d; }
  }

  &__freq { font-size: 13px; color: var(--text-muted); }
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }

  &__key { color: var(--text-muted); inline-size: 140px; }
}

.progress {
  margin-block-end: 18px;

  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-muted);
    margin-block-end: 6px;
  }

  &__track { block-size: 10px; background: var(--bg); border-radius: 99px; overflow: hidden; }
  &__fill { block-size: 100%; background: var(--primary); border-radius: 99px; }
}

.payments {
  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
}

.payment {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-block: 8px;

  &__dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; }
  &__amount { font-weight: 600; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
