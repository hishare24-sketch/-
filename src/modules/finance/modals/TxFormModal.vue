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
    <div class="field">
      <label>نوع العملية</label>
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
    </div>

    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>

    <div class="field">
      <label>الوصف</label>
      <input v-model="form.description" type="text" placeholder="مثال: فاتورة كهرباء" />
    </div>

    <div class="field">
      <label>المبلغ (ر.س)</label>
      <input v-model.number="form.amount" type="number" placeholder="0" />
    </div>

    <div v-if="form.type === 'transfer'" class="field">
      <label>إلى مشروع</label>
      <select v-model="form.toProject">
        <option v-for="p in projects.filter((x) => x.id !== form.projectId)" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
    </div>
    <div v-else class="field">
      <label>التصنيف</label>
      <select v-model="form.category">
        <option v-for="c in cats" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="field">
      <label>المصدر / الجهة (اختياري)</label>
      <input v-model="form.source" type="text" placeholder="مثال: مورد، عميل، بنك..." />
    </div>

    <div class="field">
      <label>التاريخ</label>
      <input v-model="form.date" type="date" />
    </div>

    <div class="field">
      <label>ملاحظات (اختياري)</label>
      <textarea v-model="form.note" rows="2"></textarea>
    </div>

    <div class="field">
      <label>المرفقات</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

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
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid || hasError" @click="save">
        {{ hasError ? 'صحّح الأخطاء أولاً' : tx ? 'حفظ التعديلات' : 'إضافة العملية' }}
      </button>
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
