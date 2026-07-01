<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { TRACKING_TYPES, TRACKING_FIELD_SCHEMAS } from '@/constants'
import { daysBetween, statusFromDays } from '@/helpers/date'
import type { Tracking, Attachment } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
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
    <div class="field">
      <label>نوع المتابعة</label>
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
    </div>
    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId" @change="form.memberId = ''">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>
    <div class="field">
      <label>الاسم</label>
      <input v-model="form.name" type="text" placeholder="مثال: ضمان الثلاجة" />
    </div>
    <div class="field">
      <label>تاريخ الانتهاء</label>
      <input v-model="form.expiryDate" type="date" />
    </div>

    <!-- حقول خاصة بنوع المتابعة -->
    <div v-if="typeFields.length" class="specs">
      <span class="specs__label">بيانات {{ form.type }}</span>
      <div v-for="f in typeFields" :key="f.key" class="field">
        <label>{{ f.label }}</label>
        <input v-model="form.specs[f.key]" type="text" :placeholder="f.placeholder ?? ''" />
      </div>
    </div>

    <div class="field">
      <label>تكلفة التجديد (اختياري)</label>
      <input v-model.number="form.cost" type="number" placeholder="0" />
    </div>
    <div class="field">
      <label>إسناد لعضو (اختياري)</label>
      <select v-model="form.memberId">
        <option value="">بدون إسناد</option>
        <option v-for="m in projMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>
    <div class="field">
      <label>ملاحظات (اختياري)</label>
      <textarea v-model="form.note" rows="2" placeholder="رقم الضمان، الجهة، تفاصيل..."></textarea>
    </div>

    <div class="field">
      <label>المرفقات (صور / ملفات)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">{{ tracking ? 'حفظ التعديلات' : 'إضافة المتابعة' }}</button>
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

  input, select, textarea {
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
