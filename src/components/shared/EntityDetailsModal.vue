<script setup lang="ts">
// نافذة استعراض عامة: عنوان + شارة + صفوف (مفتاح/قيمة) + ملاحظات + مرفقات
import type { Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton } from '@/components/base'

defineProps<{
  title: string
  badge?: { label: string; color: string; bg: string }
  rows: [string, string][]
  note?: string
  attachments?: Attachment[]
}>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <ModalShell :title="title" @close="emit('close')">
    <span v-if="badge" class="badge" :style="{ background: badge.bg, color: badge.color }">{{ badge.label }}</span>

    <table class="rows">
      <tr v-for="[k, v] in rows" :key="k">
        <td class="rows__key">{{ k }}</td>
        <td class="rows__val">{{ v }}</td>
      </tr>
    </table>

    <div v-if="note" class="note">
      <span class="note__label">ملاحظات</span>
      <p>{{ note }}</p>
    </div>

    <div v-if="attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="attachments" readonly />
    </div>

    <template #footer>
      <BaseButton @click="emit('close')">إغلاق</BaseButton>
      <slot name="actions" />
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-block;
  font-weight: 600;
  font-size: 13px;
  padding: 5px 14px;
  border-radius: 20px;
  margin-block-end: 16px;
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;

  td { padding: 10px 0; border-block-end: 1px solid var(--border); font-size: 14px; }

  &__key { color: var(--text-muted); inline-size: 140px; }
  &__val { font-weight: 500; }
}

.note {
  margin-block-start: 16px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 6px; }
  p { font-size: 14px; line-height: 1.7; }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
