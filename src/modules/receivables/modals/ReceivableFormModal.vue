<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { today } from '@/helpers/date'
import { CURRENT_USER } from '@/constants'
import type { ReceivableKind } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const receivablesStore = useReceivablesStore()
const { projects } = storeToRefs(projectsStore)

const form = reactive({
  kind: 'receivable' as ReceivableKind,
  projectId: props.projectId,
  party: '',
  amount: null as number | null,
  dueDate: '',
  note: '',
})

const valid = computed(() => form.party.trim() && form.amount != null && form.amount > 0)

function save() {
  if (!valid.value) return
  receivablesStore.addReceivable({
    kind: form.kind,
    projectId: form.projectId,
    party: form.party.trim(),
    amount: Number(form.amount),
    dueDate: form.dueDate || undefined,
    date: today(),
    status: 'open',
    payments: [],
    note: form.note.trim() || undefined,
    createdBy: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="ذمة جديدة" @close="emit('close')">
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
      <label>ملاحظات (اختياري)</label>
      <textarea v-model="form.note" rows="2"></textarea>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">إضافة الذمة</button>
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
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;

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
