<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { TRACKING_TYPES } from '@/constants'
import { daysBetween, statusFromDays } from '@/helpers/date'
import type { Tracking } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string; tracking: Tracking | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const trackingsStore = useTrackingsStore()
const { projects } = storeToRefs(projectsStore)

const form = reactive({
  name: props.tracking?.name ?? '',
  type: props.tracking?.type ?? TRACKING_TYPES[0].id,
  projectId: props.tracking?.projectId ?? props.projectId,
  expiryDate: props.tracking?.expiryDate ?? '',
  memberId: props.tracking?.memberId ?? '',
  note: props.tracking?.note ?? '',
})

const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.name.trim() && form.expiryDate)

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
    note: form.note.trim() || undefined,
    memberId: form.memberId || undefined,
  })
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
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .type {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
