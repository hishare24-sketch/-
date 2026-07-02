<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { COMMITMENT_KINDS, FREQ_LABEL } from '@/constants'
import { fmt } from '@/helpers/format'
import { today } from '@/helpers/date'
import type { Commitment, Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput } from '@/components/base'

const props = defineProps<{ commitment: Commitment }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const commitmentsStore = useCommitmentsStore()
const isOut = computed(() => props.commitment.direction === 'out')
const kindLabel = computed(() => COMMITMENT_KINDS.find((k) => k.id === props.commitment.kind)?.label)
const dueNo = computed(() => `${props.commitment.paidCount + 1}${props.commitment.totalCount ? `/${props.commitment.totalCount}` : ''}`)

const form = reactive({
  amount: props.commitment.amount as number | null,
  date: today(),
  note: '',
  attachments: [] as Attachment[],
})

const valid = computed(() => form.amount != null && form.amount > 0 && form.date)

function pay() {
  if (!valid.value) return
  commitmentsStore.payCommitment(props.commitment.id, {
    amount: Number(form.amount),
    date: form.date,
    note: form.note,
    attachments: form.attachments,
  })
  emit('close')
}
</script>

<template>
  <ModalShell :title="isOut ? 'تسجيل دفعة' : 'تسجيل استلام'" @close="emit('close')">
    <!-- ملخص الالتزام -->
    <div class="summary">
      <div class="summary__row">
        <span>الالتزام</span><strong>{{ commitment.name }}</strong>
      </div>
      <div class="summary__row">
        <span>النوع</span><strong>{{ kindLabel }} · {{ FREQ_LABEL[commitment.freq] }}</strong>
      </div>
      <div v-if="commitment.party" class="summary__row">
        <span>الطرف</span><strong>{{ commitment.party }}</strong>
      </div>
      <div class="summary__row">
        <span>رقم الدفعة</span><strong>{{ dueNo }}</strong>
      </div>
      <div class="summary__row">
        <span>الاستحقاق</span><strong>{{ commitment.nextDue }}</strong>
      </div>
    </div>

    <!-- بيانات الدفعة -->
    <BaseField :label="`${isOut ? 'المبلغ المدفوع' : 'المبلغ المُستلم'} (ر.س)`">
      <BaseInput v-model.number="form.amount" type="number" placeholder="0" />
      <span class="hint-line">القيمة المعتادة: {{ fmt(commitment.amount) }}</span>
    </BaseField>
    <BaseField label="تاريخ الدفعة">
      <BaseInput v-model="form.date" type="date" />
    </BaseField>
    <BaseField label="ملاحظة (اختياري)">
      <BaseInput v-model="form.note" placeholder="مثال: دفعت عبر تحويل بنكي" />
    </BaseField>
    <BaseField tag="div" label="المرفقات (إيصال، سند تحويل) — اختياري">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <p class="hint">
      ℹ️ تسجيل الدفعة يُنشئ عملية {{ isOut ? 'مصروف' : 'إيراد' }} فعلية في المالية، ويقدّم تاريخ الاستحقاق للموعد التالي تلقائياً.
    </p>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="pay">{{ isOut ? 'تأكيد الدفع' : 'تأكيد الاستلام' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.summary {
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin-block-end: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;

    span { color: var(--text-muted); }
  }
}

.hint-line { font-size: 11px; color: var(--text-muted); }

.hint {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--primary-soft);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}
</style>
