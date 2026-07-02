<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { TRACKING_TYPES, TRACKING_FIELD_SCHEMAS } from '@/constants'
import { daysBetween, statusFromDays } from '@/helpers/date'
import type { Tracking, Attachment } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string; tracking: Tracking | null; preset?: FormPreset }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const projectsStore = useProjectsStore()
const trackingsStore = useTrackingsStore()
const { projects } = storeToRefs(projectsStore)
const ps = props.preset

const form = reactive({
  name: props.tracking?.name ?? ps?.name ?? '',
  type: props.tracking?.type ?? ps?.trackingType ?? TRACKING_TYPES[0].id,
  projectId: props.tracking?.projectId ?? ps?.projectId ?? props.projectId,
  expiryDate: props.tracking?.expiryDate ?? ps?.expiryDate ?? '',
  cost: (props.tracking?.cost ?? null) as number | null,
  memberId: props.tracking?.memberId ?? '',
  note: props.tracking?.note ?? ps?.note ?? '',
  attachments: (props.tracking?.attachments ? [...props.tracking.attachments] : []) as Attachment[],
  specs: { ...(props.tracking?.specs ?? {}) } as Record<string, string>,
})

const typeFields = computed(() => TRACKING_FIELD_SCHEMAS[form.type] ?? [])
const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.name.trim() && form.expiryDate)

function cleanSpecs(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  typeFields.value.forEach((f) => {
    const v = (form.specs[f.key] ?? '').trim()
    if (v) out[f.key] = v
  })
  return Object.keys(out).length ? out : undefined
}

function save() {
  if (!valid.value) return
  const d = daysBetween(form.expiryDate)
  const icon = TRACKING_TYPES.find((t) => t.id === form.type)?.icon ?? '🛡️'
  trackingsStore.saveTracking({
    id: props.tracking?.id,
    name: form.name.trim(),
    type: form.type,
    icon: props.tracking?.icon ?? icon,
    status: statusFromDays(d),
    daysLeft: d,
    expiryDate: form.expiryDate,
    projectId: form.projectId,
    cost: form.cost != null ? Number(form.cost) : undefined,
    note: form.note.trim() || undefined,
    memberId: form.memberId || undefined,
    specs: cleanSpecs(),
    attachments: form.attachments,
  })
  emit('saved')
  emit('close')
}
</script>

<template>
  <ModalShell :title="tracking ? 'تعديل المتابعة' : 'متابعة جديدة'" @close="emit('close')">
    <BaseField tag="div" label="نوع المتابعة">
      <div class="types">
        <button
          v-for="t in TRACKING_TYPES"
          :key="t.id"
          type="button"
          class="type"
          :class="{ 'is-active': form.type === t.id }"
          @click="form.type = t.id"
        >
          {{ t.icon }} {{ t.id }}
        </button>
      </div>
    </BaseField>
    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId" @change="form.memberId = ''">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="الاسم">
      <BaseInput v-model="form.name" placeholder="مثال: ضمان الثلاجة" />
    </BaseField>
    <BaseField label="تاريخ الانتهاء">
      <BaseInput v-model="form.expiryDate" type="date" />
    </BaseField>

    <!-- حقول خاصة بنوع المتابعة -->
    <div v-if="typeFields.length" class="specs">
      <span class="specs__label">بيانات {{ form.type }}</span>
      <BaseField v-for="f in typeFields" :key="f.key" :label="f.label">
        <BaseInput v-model="form.specs[f.key]" :placeholder="f.placeholder ?? ''" />
      </BaseField>
    </div>

    <BaseField label="تكلفة التجديد (اختياري)">
      <BaseInput v-model.number="form.cost" type="number" placeholder="0" />
    </BaseField>
    <BaseField label="إسناد لعضو (اختياري)">
      <BaseSelect v-model="form.memberId">
        <option value="">بدون إسناد</option>
        <option v-for="m in projMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="ملاحظات (اختياري)">
      <BaseTextarea v-model="form.note" :rows="2" placeholder="رقم الضمان، الجهة، تفاصيل..." />
    </BaseField>

    <BaseField tag="div" label="المرفقات (صور / ملفات)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ tracking ? 'حفظ التعديلات' : 'إضافة المتابعة' }}</BaseButton>
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
  .field { margin-block-end: 12px; &:last-child { margin-block-end: 0; } }
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .type {
    padding: 8px 12px;
    min-inline-size: 84px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
