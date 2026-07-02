<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { COMMITMENT_KINDS, COMMITMENT_FIELD_SCHEMAS, FREQ_LABEL } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import { today } from '@/helpers/date'
import type { CommitmentKind, CommitmentFreq, CommitmentDir, Attachment, Commitment } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton } from '@/components/base'

const props = defineProps<{ projectId: string; preset?: FormPreset; commitment?: Commitment | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const projectsStore = useProjectsStore()
const commitmentsStore = useCommitmentsStore()
const { projects } = storeToRefs(projectsStore)
const ps = props.preset
const c = props.commitment
const editing = computed(() => !!props.commitment)

const freqs = Object.keys(FREQ_LABEL) as CommitmentFreq[]

const form = reactive({
  kind: (c?.kind ?? 'installment') as CommitmentKind,
  direction: (c?.direction ?? 'out') as CommitmentDir,
  projectId: c?.projectId ?? ps?.projectId ?? props.projectId,
  name: c?.name ?? ps?.name ?? '',
  party: c?.party ?? ps?.party ?? '',
  amount: (c?.amount ?? ps?.amount ?? null) as number | null,
  freq: (c?.freq ?? 'monthly') as CommitmentFreq,
  startDate: c?.startDate ?? today(),
  totalCount: (c?.totalCount ?? null) as number | null,
  attachments: (c?.attachments ?? []) as Attachment[],
  specs: { ...(c?.specs ?? {}) } as Record<string, string>,
})

const kindFields = computed(() => COMMITMENT_FIELD_SCHEMAS[form.kind])
const valid = computed(() => form.name.trim() && form.amount != null && form.amount > 0)

function cleanSpecs(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  kindFields.value.forEach((f) => {
    const v = (form.specs[f.key] ?? '').trim()
    if (v) out[f.key] = v
  })
  return Object.keys(out).length ? out : undefined
}

function save() {
  if (!valid.value) return
  const base = {
    kind: form.kind,
    direction: form.direction,
    projectId: form.projectId,
    name: form.name.trim(),
    party: form.party.trim() || undefined,
    amount: Number(form.amount),
    freq: form.freq,
    startDate: form.startDate,
    totalCount: form.kind === 'installment' && form.totalCount ? Number(form.totalCount) : undefined,
    specs: cleanSpecs(),
    attachments: form.attachments,
  }
  if (editing.value && props.commitment) {
    commitmentsStore.updateCommitment(props.commitment.id, base)
  } else {
    commitmentsStore.addCommitment({ ...base, paidCount: 0, nextDue: form.startDate, active: true, payments: [], createdBy: currentUserName() })
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <ModalShell :title="editing ? `تعديل: ${form.name}` : 'التزام جديد'" @close="emit('close')">
    <div class="field">
      <label>النوع</label>
      <div class="seg">
        <button v-for="k in COMMITMENT_KINDS" :key="k.id" type="button" :class="{ 'is-active': form.kind === k.id }" @click="form.kind = k.id">
          {{ k.icon }} {{ k.label }}
        </button>
      </div>
    </div>

    <div class="field">
      <label>الاتجاه</label>
      <div class="seg">
        <button type="button" :class="{ 'is-active': form.direction === 'out' }" @click="form.direction = 'out'">📤 صادر (ندفع)</button>
        <button type="button" :class="{ 'is-active': form.direction === 'in' }" @click="form.direction = 'in'">📥 وارد (نستلم)</button>
      </div>
    </div>

    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>

    <div class="field">
      <label>الاسم</label>
      <input v-model="form.name" type="text" placeholder="مثال: قسط السيارة" />
    </div>
    <div class="field">
      <label>الطرف (اختياري)</label>
      <input v-model="form.party" type="text" placeholder="مثال: بنك التمويل" />
    </div>
    <div class="field">
      <label>مبلغ الدفعة (ر.س)</label>
      <input v-model.number="form.amount" type="number" placeholder="0" />
    </div>
    <div class="field">
      <label>التكرار</label>
      <select v-model="form.freq">
        <option v-for="f in freqs" :key="f" :value="f">{{ FREQ_LABEL[f] }}</option>
      </select>
    </div>
    <div class="field">
      <label>تاريخ البداية / أول استحقاق</label>
      <input v-model="form.startDate" type="date" />
    </div>
    <div v-if="form.kind === 'installment'" class="field">
      <label>عدد الدفعات الكلي (اختياري للأقساط)</label>
      <input v-model.number="form.totalCount" type="number" placeholder="مثال: 36" />
    </div>

    <!-- حقول خاصة بنوع الالتزام -->
    <div v-if="kindFields.length" class="specs">
      <span class="specs__label">بيانات {{ COMMITMENT_KINDS.find((k) => k.id === form.kind)?.label }}</span>
      <div v-for="f in kindFields" :key="f.key" class="field">
        <label>{{ f.label }}</label>
        <input v-model="form.specs[f.key]" type="text" :placeholder="f.placeholder ?? ''" />
      </div>
    </div>

    <div class="field">
      <label>المرفقات (عقد، صور)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إضافة الالتزام' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 16px;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input, select {
    inline-size: 100%;
    max-inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.specs {
  margin-block-end: 16px;
  padding: 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);

  &__label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
  .field { margin-block-end: 12px; &:last-child { margin-block-end: 0; } }
}

.seg {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    flex: 1;
    min-inline-size: 90px;
    padding: 9px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
