<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { today } from '@/helpers/date'
import { RECEIVABLE_TERMS } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import type { ReceivableKind, Attachment, Receivable } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'

const props = defineProps<{ projectId: string; preset?: FormPreset; receivable?: Receivable | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const projectsStore = useProjectsStore()
const receivablesStore = useReceivablesStore()
const { projects } = storeToRefs(projectsStore)
const ps = props.preset
const r = props.receivable
const editing = computed(() => !!props.receivable)

const form = reactive({
  kind: (r?.kind ?? 'receivable') as ReceivableKind,
  projectId: r?.projectId ?? ps?.projectId ?? props.projectId,
  party: r?.party ?? ps?.party ?? '',
  amount: (r?.amount ?? ps?.amount ?? null) as number | null,
  dueDate: r?.dueDate ?? '',
  invoiceNo: r?.invoiceNo ?? '',
  terms: r?.terms ?? '',
  note: r?.note ?? ps?.note ?? '',
  attachments: (r?.attachments ?? []) as Attachment[],
})

const valid = computed(() => form.party.trim() && form.amount != null && form.amount > 0)

function save() {
  if (!valid.value) return
  const payload = {
    kind: form.kind,
    projectId: form.projectId,
    party: form.party.trim(),
    amount: Number(form.amount),
    dueDate: form.dueDate || undefined,
    invoiceNo: form.invoiceNo.trim() || undefined,
    terms: form.terms || undefined,
    note: form.note.trim() || undefined,
    attachments: form.attachments,
  }
  if (editing.value && props.receivable) {
    receivablesStore.updateReceivable(props.receivable.id, payload)
  } else {
    receivablesStore.addReceivable({ ...payload, date: today(), status: 'open', payments: [], createdBy: currentUserName() })
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <ModalShell :title="editing ? `تعديل ذمة: ${form.party}` : 'ذمة جديدة'" @close="emit('close')">
    <BaseField tag="div" label="النوع">
      <div class="seg">
        <button type="button" :class="{ 'is-active': form.kind === 'receivable' }" @click="form.kind = 'receivable'">📥 مدينة (لنا)</button>
        <button type="button" :class="{ 'is-active': form.kind === 'payable' }" @click="form.kind = 'payable'">📤 دائنة (علينا)</button>
      </div>
    </BaseField>
    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="الطرف (عميل / مورد / جهة)">
      <BaseInput v-model="form.party" placeholder="مثال: مجموعة الرواد" />
    </BaseField>
    <BaseField label="المبلغ (ر.س)">
      <BaseInput v-model.number="form.amount" type="number" placeholder="0" />
    </BaseField>
    <BaseField label="تاريخ الاستحقاق (اختياري)">
      <BaseInput v-model="form.dueDate" type="date" />
    </BaseField>
    <BaseField label="رقم الفاتورة / المرجع (اختياري)">
      <BaseInput v-model="form.invoiceNo" placeholder="INV-1024 / PO-88" />
    </BaseField>
    <BaseField label="شروط السداد (اختياري)">
      <BaseSelect v-model="form.terms">
        <option value="">—</option>
        <option v-for="t in RECEIVABLE_TERMS" :key="t" :value="t">{{ t }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="ملاحظات (اختياري)">
      <BaseTextarea v-model="form.note" :rows="2" />
    </BaseField>

    <BaseField tag="div" label="المرفقات (صور / ملفات)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إضافة الذمة' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.seg {
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 10px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active {
      border-color: var(--primary);
      background: var(--primary-soft);
      color: var(--primary);
    }
  }
}
</style>
