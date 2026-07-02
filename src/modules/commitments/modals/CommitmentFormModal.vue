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
import { BaseButton, BaseField, BaseInput, BaseSelect } from '@/components/base'

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
    <BaseField tag="div" label="النوع">
      <div class="seg">
        <button v-for="k in COMMITMENT_KINDS" :key="k.id" type="button" :class="{ 'is-active': form.kind === k.id }" @click="form.kind = k.id">
          {{ k.icon }} {{ k.label }}
        </button>
      </div>
    </BaseField>

    <BaseField tag="div" label="الاتجاه">
      <div class="seg">
        <button type="button" :class="{ 'is-active': form.direction === 'out' }" @click="form.direction = 'out'">📤 صادر (ندفع)</button>
        <button type="button" :class="{ 'is-active': form.direction === 'in' }" @click="form.direction = 'in'">📥 وارد (نستلم)</button>
      </div>
    </BaseField>

    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>

    <BaseField label="الاسم">
      <BaseInput v-model="form.name" placeholder="مثال: قسط السيارة" />
    </BaseField>
    <BaseField label="الطرف (اختياري)">
      <BaseInput v-model="form.party" placeholder="مثال: بنك التمويل" />
    </BaseField>
    <BaseField label="مبلغ الدفعة (ر.س)">
      <BaseInput v-model.number="form.amount" type="number" placeholder="0" />
    </BaseField>
    <BaseField label="التكرار">
      <BaseSelect v-model="form.freq">
        <option v-for="f in freqs" :key="f" :value="f">{{ FREQ_LABEL[f] }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="تاريخ البداية / أول استحقاق">
      <BaseInput v-model="form.startDate" type="date" />
    </BaseField>
    <BaseField v-if="form.kind === 'installment'" label="عدد الدفعات الكلي (اختياري للأقساط)">
      <BaseInput v-model.number="form.totalCount" type="number" placeholder="مثال: 36" />
    </BaseField>

    <!-- حقول خاصة بنوع الالتزام -->
    <div v-if="kindFields.length" class="specs">
      <span class="specs__label">بيانات {{ COMMITMENT_KINDS.find((k) => k.id === form.kind)?.label }}</span>
      <BaseField v-for="f in kindFields" :key="f.key" :label="f.label">
        <BaseInput v-model="form.specs[f.key]" :placeholder="f.placeholder ?? ''" />
      </BaseField>
    </div>

    <BaseField tag="div" label="المرفقات (عقد، صور)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إضافة الالتزام' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.specs {
  margin-block-end: 16px;
  padding: 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);

  &__label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
  :deep(.field) { margin-block-end: 12px; &:last-child { margin-block-end: 0; } }
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
