<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { fmt } from '@/helpers/format'
import { today } from '@/helpers/date'
import { TRACKING_FIELD_SCHEMAS } from '@/constants'
import type { Tracking } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ tracking: Tracking }>()
const emit = defineEmits<{ (e: 'edit', t: Tracking): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const trackingsStore = useTrackingsStore()

const project = computed(() => projectsStore.projectById(props.tracking.projectId))
const member = computed(() => (props.tracking.memberId ? projectsStore.memberById(props.tracking.memberId)?.name : null))
const specFields = computed(() => (TRACKING_FIELD_SCHEMAS[props.tracking.type] ?? []).filter((f) => props.tracking.specs?.[f.key]))

const badge = computed(() => {
  const t = props.tracking
  if (t.cancelled) return { label: 'ملغى', c: 'var(--text-muted)', bg: 'var(--surface-2)' }
  if (t.status === 'active') return { label: 'نشط', c: 'var(--ok-text)', bg: 'var(--ok-bg)' }
  if (t.status === 'expiring') return { label: 'يوشك على الانتهاء', c: 'var(--warn-text)', bg: 'var(--warn-bg)' }
  return { label: 'منتهٍ', c: 'var(--danger-text)', bg: 'var(--danger-bg)' }
})
const remaining = computed(() =>
  props.tracking.daysLeft < 0 ? `منتهٍ منذ ${Math.abs(props.tracking.daysLeft)} يوم` : `${props.tracking.daysLeft} يوم`,
)

const renewing = ref(false)
const newExpiry = ref(props.tracking.expiryDate || today())
function confirmRenew() {
  trackingsStore.renewTracking(props.tracking.id, newExpiry.value)
  renewing.value = false
}
function cancel() {
  trackingsStore.cancelTracking(props.tracking.id)
}
</script>

<template>
  <ModalShell :title="`${tracking.icon} ${tracking.name}`" @close="emit('close')">
    <div class="topbar">
      <span class="status-badge" :style="{ background: badge.bg, color: badge.c }">{{ badge.label }}</span>
      <span class="remain" :style="{ color: badge.c }">{{ remaining }}</span>
    </div>

    <!-- مركز الإجراءات -->
    <div class="hub">
      <button class="hub__btn hub__btn--primary" @click="renewing = !renewing">🔄 تجديد</button>
      <button class="hub__btn" @click="emit('edit', tracking)">✎ تعديل</button>
      <button v-if="!tracking.cancelled" class="hub__btn" @click="cancel">🚫 إلغاء</button>
    </div>

    <!-- تجديد: تاريخ انتهاء جديد -->
    <div v-if="renewing" class="renew">
      <input v-model="newExpiry" type="date" />
      <button class="app-btn app-btn--sm" @click="confirmRenew">تأكيد التجديد</button>
    </div>

    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ tracking.type }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr><td class="rows__key">تاريخ الانتهاء</td><td>{{ tracking.expiryDate }}</td></tr>
      <tr v-for="f in specFields" :key="f.key"><td class="rows__key">{{ f.label }}</td><td>{{ tracking.specs?.[f.key] }}</td></tr>
      <tr v-if="tracking.cost != null"><td class="rows__key">تكلفة التجديد</td><td>{{ fmt(tracking.cost) }}</td></tr>
      <tr v-if="member"><td class="rows__key">المسؤول</td><td>{{ member }}</td></tr>
      <tr v-if="tracking.renewedCount"><td class="rows__key">عدد التجديدات</td><td>{{ tracking.renewedCount }}</td></tr>
      <tr v-if="tracking.note"><td class="rows__key">ملاحظات</td><td>{{ tracking.note }}</td></tr>
    </table>

    <div v-if="tracking.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="tracking.attachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-block-end: 14px;
}

.status-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
.remain { font-size: 13px; font-weight: 600; }

.hub {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-block-end: 14px;
}

.hub__btn {
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover { border-color: var(--primary); color: var(--primary); }
  &--primary { background: var(--primary); color: #fff; border-color: var(--primary); &:hover { color: #fff; opacity: 0.9; } }
}

.renew {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-block-end: 16px;

  input {
    flex: 1;
    inline-size: 100%;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.app-btn--sm { padding: 8px 14px; font-size: 12.5px; white-space: nowrap; }

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }
  &__key { color: var(--text-muted); inline-size: 140px; }
}

.atts {
  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
