<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { today } from '@/helpers/date'
import { CURRENT_USER, RECEIVABLE_TERMS } from '@/constants'
import type { ReceivableKind, Attachment, Receivable } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string; preset?: FormPreset; receivable?: Receivable | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

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
    receivablesStore.addReceivable({ ...payload, date: today(), status: 'open', payments: [], createdBy: CURRENT_USER })
  }
  emit('close')
}
</script>

<template>
  <ModalShell :title="editing ? `تعديل ذمة: ${form.party}` : 'ذمة جديدة'" @close="emit('close')">
    <div class="field">
      <label>النوع</label>
      <div class="seg">
        <button type="button" :class="{ 'is-active': form.kind === 'receivable' }" @click="form.kind = 'receivable'">📥 مدينة (لنا)</button>
        <button type="button" :class="{ 'is-active': form.kind === 'payable' }" @click="form.kind = 'payable'">📤 دائنة (علينا)</button>
      </div>
    </div>
    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>
    <div class="field">
      <label>الطرف (عميل / مورد / جهة)</label>
      <input v-model="form.party" type="text" placeholder="مثال: مجموعة الرواد" />
    </div>
    <div class="field">
      <label>المبلغ (ر.س)</label>
      <input v-model.number="form.amount" type="number" placeholder="0" />
    </div>
    <div class="field">
      <label>تاريخ الاستحقاق (اختياري)</label>
      <input v-model="form.dueDate" type="date" />
    </div>
    <div class="field">
      <label>رقم الفاتورة / المرجع (اختياري)</label>
      <input v-model="form.invoiceNo" type="text" placeholder="INV-1024 / PO-88" />
    </div>
    <div class="field">
      <label>شروط السداد (اختياري)</label>
      <select v-model="form.terms">
        <option value="">—</option>
        <option v-for="t in RECEIVABLE_TERMS" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <div class="field">
      <label>ملاحظات (اختياري)</label>
      <textarea v-model="form.note" rows="2"></textarea>
    </div>

    <div class="field">
      <label>المرفقات (صور / ملفات)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إضافة الذمة' }}</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 16px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }

  input,
  select,
  textarea {
    inline-size: 100%;
    max-inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    color: var(--text);

    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

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
