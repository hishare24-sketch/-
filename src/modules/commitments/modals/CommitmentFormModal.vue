<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { COMMITMENT_KINDS, FREQ_LABEL, CURRENT_USER } from '@/constants'
import { today } from '@/helpers/date'
import type { CommitmentKind, CommitmentFreq, CommitmentDir, Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const commitmentsStore = useCommitmentsStore()
const { projects } = storeToRefs(projectsStore)

const freqs = Object.keys(FREQ_LABEL) as CommitmentFreq[]

const form = reactive({
  kind: 'installment' as CommitmentKind,
  direction: 'out' as CommitmentDir,
  projectId: props.projectId,
  name: '',
  party: '',
  amount: null as number | null,
  freq: 'monthly' as CommitmentFreq,
  startDate: today(),
  totalCount: null as number | null,
  attachments: [] as Attachment[],
})

const valid = computed(() => form.name.trim() && form.amount != null && form.amount > 0)

function save() {
  if (!valid.value) return
  commitmentsStore.addCommitment({
    kind: form.kind,
    direction: form.direction,
    projectId: form.projectId,
    name: form.name.trim(),
    party: form.party.trim() || undefined,
    amount: Number(form.amount),
    freq: form.freq,
    startDate: form.startDate,
    totalCount: form.kind === 'installment' && form.totalCount ? Number(form.totalCount) : undefined,
    paidCount: 0,
    nextDue: form.startDate,
    active: true,
    payments: [],
    attachments: form.attachments,
    createdBy: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="التزام جديد" @close="emit('close')">
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

    <div class="field">
      <label>المرفقات (عقد، صور)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">إضافة الالتزام</button>
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
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
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
