<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { recvRemaining } from '@/helpers/calc'
import { fmt } from '@/helpers/format'
import type { Attachment, Receivable } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect } from '@/components/base'

const props = defineProps<{ receivable: Receivable }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const receivablesStore = useReceivablesStore()
const remaining = computed(() => recvRemaining(props.receivable))
const isRecv = computed(() => props.receivable.kind === 'receivable')

// مصادر السداد الجاهزة + «أخرى» تفتح حقلاً حرّاً
const SOURCES = ['نقدي', 'تحويل بنكي', 'صندوق', 'شيك', 'عهدة عضو', 'أخرى']

const form = reactive({
  amount: remaining.value as number | null,
  note: '',
  source: 'نقدي',
  sourceOther: '',
  attachments: [] as Attachment[],
})

// المصدر الفعلي: قيمة القائمة، أو النص الحر عند اختيار «أخرى»
const resolvedSource = computed(() => (form.source === 'أخرى' ? form.sourceOther.trim() : form.source))
const valid = computed(() => form.amount != null && form.amount > 0 && form.amount <= remaining.value)

function pay() {
  if (!valid.value) return
  receivablesStore.payReceivable(props.receivable.id, Number(form.amount), {
    note: form.note,
    source: resolvedSource.value,
    attachments: form.attachments,
  })
  emit('close')
}
</script>

<template>
  <ModalShell :title="isRecv ? 'تحصيل ذمة' : 'سداد ذمة'" @close="emit('close')">
    <div class="summary">
      <span>{{ receivable.party }}</span>
      <span class="summary__remaining">المتبقّي: {{ fmt(remaining) }}</span>
    </div>

    <BaseField :label="`${isRecv ? 'المبلغ المُحصَّل' : 'المبلغ المُسدَّد'} (ر.س)`">
      <BaseInput v-model.number="form.amount" type="number" :max="remaining" placeholder="0" />
    </BaseField>
    <BaseField label="مصدر السداد">
      <BaseSelect v-model="form.source">
        <option v-for="s in SOURCES" :key="s" :value="s">{{ s }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField v-if="form.source === 'أخرى'" label="حدّد المصدر">
      <BaseInput v-model="form.sourceOther" placeholder="مثال: محفظة إلكترونية" />
    </BaseField>

    <BaseField label="ملاحظة (اختياري)">
      <BaseInput v-model="form.note" placeholder="مثال: دفعة أولى" />
    </BaseField>

    <BaseField tag="div" label="مرفق (اختياري)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <p class="hint">ℹ️ تسجيل الدفعة يُنشئ عملية {{ isRecv ? 'إيراد' : 'مصروف' }} فعلية في الإدارة المالية ويُحدّث الرصيد.</p>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="pay">{{ isRecv ? 'تسجيل التحصيل' : 'تسجيل السداد' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  margin-block-end: 16px;
  font-weight: 600;

  &__remaining {
    color: var(--primary);
    font-size: 14px;
  }
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
  background: var(--primary-soft);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
}
</style>
