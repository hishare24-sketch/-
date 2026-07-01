<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { fmt } from '@/helpers/format'
import { exportPDF, docHTML } from '@/helpers/export'
import { useToast } from '@/composables/useToast'
import { TX_TYPES, CURRENT_USER } from '@/constants'
import type { Transaction } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ tx: Transaction }>()
const emit = defineEmits<{ (e: 'edit', tx: Transaction): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const toast = useToast()
const project = computed(() => projectsStore.projectById(props.tx.projectId))
const typeLabel = computed(() => TX_TYPES.find((t) => t.id === props.tx.type)?.label ?? props.tx.type)

const rows = computed(() => {
  const t = props.tx
  return [
    ['النوع', typeLabel.value],
    ['المشروع', project.value?.name ?? '—'],
    ['التصنيف', t.category],
    ['المبلغ', fmt(t.amount)],
    ['التاريخ', t.date],
    ['المصدر / الجهة', t.source ?? '—'],
    ['بواسطة', t.createdBy ?? CURRENT_USER],
    ['ملاحظات', t.note ?? '—'],
  ] as [string, string][]
})

function exportInvoice() {
  const t = props.tx
  const body = `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows.value.map(([k, v]) => `<tr><td style="padding:8px 0;color:#666;width:160px">${k}</td><td style="padding:8px 0;font-weight:600">${v}</td></tr>`).join('')}
      <tr style="font-size:18px"><td style="padding:14px 0;font-weight:800;border-top:2px solid #2563eb">الإجمالي</td><td style="padding:14px 0;font-weight:800;border-top:2px solid #2563eb;color:var(--info-text)">${fmt(t.amount)}</td></tr>
    </table>`
  exportPDF(`فاتورة_${t.description}`, docHTML({ title: 'سند مالي', subtitle: t.description, body }))
    .then(() => toast.success('تم تصدير السند'))
    .catch((e) => toast.error(e.message))
}
</script>

<template>
  <ModalShell :title="tx.description" @close="emit('close')">
    <div class="badge" :class="`is-${tx.type}`">{{ typeLabel }} · {{ fmt(tx.amount) }}</div>

    <table class="rows">
      <tr v-for="[k, v] in rows" :key="k">
        <td class="rows__key">{{ k }}</td>
        <td class="rows__val">{{ v }}</td>
      </tr>
    </table>

    <div v-if="tx.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="tx.attachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
      <button class="app-btn app-btn--outlined" @click="exportInvoice">⬇ تصدير PDF</button>
      <button class="app-btn" @click="emit('edit', tx)">✎ تعديل</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-block;
  font-weight: 700;
  font-size: 15px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  margin-block-end: 18px;

  &.is-income { background: var(--ok-bg); color: var(--ok-text); }
  &.is-expense { background: var(--danger-bg); color: var(--danger-text); }
  &.is-transfer { background: var(--info-bg); color: var(--info-text); }
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;

  td { padding: 10px 0; border-block-end: 1px solid var(--border); font-size: 14px; }

  &__key { color: var(--text-muted); inline-size: 140px; }
  &__val { font-weight: 500; }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
