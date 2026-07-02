<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { TX_TYPES } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import { today } from '@/helpers/date'
import { analyzeTx } from '@/helpers/txAnalysis'
import type { Transaction, TxType } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string; tx: Transaction | null; preset?: FormPreset }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const projectsStore = useProjectsStore()
const financeStore = useFinanceStore()
const settingsStore = useSettingsStore()
const { projects } = storeToRefs(projectsStore)

const cats = settingsStore.lists.txCategories
const ps = props.preset

const form = reactive({
  type: (props.tx?.type ?? ps?.type ?? 'expense') as TxType,
  projectId: props.tx?.projectId ?? ps?.projectId ?? props.projectId,
  description: props.tx?.description ?? ps?.description ?? '',
  amount: (props.tx?.amount ?? ps?.amount ?? null) as number | null,
  category: props.tx?.category ?? ps?.category ?? cats[0],
  date: props.tx?.date ?? today(),
  toProject: props.tx?.toProject ?? projects.value.find((p) => p.id !== props.projectId)?.id ?? '',
  source: props.tx?.source ?? ps?.source ?? '',
  note: props.tx?.note ?? ps?.note ?? '',
  attachments: props.tx?.attachments ? [...props.tx.attachments] : [],
})

const valid = computed(() => form.description.trim().length > 0 && form.amount != null && form.amount > 0)

const warnings = computed(() => {
  if (form.amount == null || form.amount < 0) return []
  return analyzeTx(
    {
      type: form.type,
      amount: Number(form.amount),
      projectId: form.projectId,
      toProject: form.type === 'transfer' ? form.toProject : undefined,
      date: form.date,
      description: form.description,
      category: form.category,
      id: props.tx?.id,
    },
    { project: projectsStore.projectById(form.projectId), transactions: financeStore.transactions },
  )
})

const hasError = computed(() => warnings.value.some((w) => w.level === 'error'))

function wMeta(level: string) {
  if (level === 'error') return { c: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '🔴' }
  if (level === 'warning') return { c: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '🟠' }
  return { c: 'var(--info-text)', bg: 'var(--info-bg)', icon: 'ℹ️' }
}

function save() {
  if (!valid.value || hasError.value) return
  financeStore.saveTransaction({
    id: props.tx?.id,
    projectId: form.projectId,
    type: form.type,
    description: form.description.trim(),
    amount: Number(form.amount),
    category: form.type === 'transfer' ? 'تحويل' : form.category,
    date: form.date,
    hasDoc: form.attachments.length > 0 || (props.tx?.hasDoc ?? false),
    note: form.note,
    source: form.source.trim() || undefined,
    attachments: form.attachments,
    toProject: form.type === 'transfer' ? form.toProject : undefined,
    createdBy: props.tx?.createdBy ?? currentUserName(),
  })
  emit('saved')
  emit('close')
}
</script>

<template>
  <ModalShell :title="tx ? 'تعديل العملية' : 'عملية جديدة'" @close="emit('close')">
    <BaseField tag="div" label="نوع العملية">
      <div class="types">
        <button
          v-for="t in TX_TYPES"
          :key="t.id"
          type="button"
          class="type"
          :class="{ 'is-active': form.type === t.id }"
          @click="form.type = t.id"
        >
          <span>{{ t.icon }}</span>{{ t.label }}
        </button>
      </div>
    </BaseField>

    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>

    <BaseField label="الوصف">
      <BaseInput v-model="form.description" placeholder="مثال: فاتورة كهرباء" />
    </BaseField>

    <BaseField label="المبلغ (ر.س)">
      <BaseInput v-model.number="form.amount" type="number" placeholder="0" />
    </BaseField>

    <BaseField v-if="form.type === 'transfer'" label="إلى مشروع">
      <BaseSelect v-model="form.toProject">
        <option v-for="p in projects.filter((x) => x.id !== form.projectId)" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </BaseSelect>
    </BaseField>
    <BaseField v-else label="التصنيف">
      <BaseSelect v-model="form.category">
        <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
      </BaseSelect>
    </BaseField>

    <BaseField label="المصدر / الجهة (اختياري)">
      <BaseInput v-model="form.source" placeholder="مثال: مورد، عميل، بنك..." />
    </BaseField>

    <BaseField label="التاريخ">
      <BaseInput v-model="form.date" type="date" />
    </BaseField>

    <BaseField label="ملاحظات (اختياري)">
      <BaseTextarea v-model="form.note" :rows="2" />
    </BaseField>

    <BaseField tag="div" label="المرفقات">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <!-- تنبيهات التحقق الذكي الحيّة -->
    <div v-if="warnings.length" class="warnings">
      <div v-for="(w, i) in warnings" :key="i" class="warning" :style="{ background: wMeta(w.level).bg }">
        <div class="warning__head">
          <span>{{ wMeta(w.level).icon }}</span>
          <strong :style="{ color: wMeta(w.level).c }">{{ w.title }}</strong>
        </div>
        <p class="warning__detail">{{ w.detail }}</p>
        <p v-if="w.consequence" class="warning__line"><b>ماذا يترتب:</b> {{ w.consequence }}</p>
        <p v-if="w.fix" class="warning__line" :style="{ color: wMeta(w.level).c }"><b>الحل:</b> {{ w.fix }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid || hasError" @click="save">
        {{ hasError ? 'صحّح الأخطاء أولاً' : tx ? 'حفظ التعديلات' : 'إضافة العملية' }}
      </BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.types {
  display: flex;
  gap: 8px;
}

.type {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.warnings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning {
  border-radius: 10px;
  padding: 11px 13px;

  &__head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-block-end: 4px;

    strong {
      font-size: 12.5px;
    }
  }

  &__detail,
  &__line {
    font-size: 12px;
    color: var(--text);
    line-height: 1.6;
    margin-block-start: 4px;
  }
}
</style>
