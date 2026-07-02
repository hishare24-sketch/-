<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { fmt } from '@/helpers/format'
import { REQUEST_STATUS, REQUEST_FIELD_SCHEMAS, REQUEST_TYPE_META } from '@/constants'
import type { RequestItem } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton } from '@/components/base'

const props = defineProps<{ request: RequestItem }>()
const emit = defineEmits<{ (e: 'edit', r: RequestItem): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const requestsStore = useRequestsStore()

const project = computed(() => projectsStore.projectById(props.request.projectId))
const member = computed(() => (props.request.memberId ? projectsStore.memberById(props.request.memberId)?.name : null))
const statusMeta = computed(() => REQUEST_STATUS[props.request.status])
const typeMeta = computed(() => REQUEST_TYPE_META[props.request.type])
const flowLabel = computed(() =>
  typeMeta.value?.flow === 'in' ? '📥 وارد'
    : typeMeta.value?.flow === 'none' ? 'ⓘ غير مالي'
    : '📤 صادر',
)
const specFields = computed(() => (REQUEST_FIELD_SCHEMAS[props.request.type] ?? []).filter((f) => props.request.specs?.[f.key]))
const openStage = computed(() => props.request.status === 'pending' || props.request.status === 'under_review')

const rejecting = ref(false)
const reason = ref('')

function approve() {
  requestsStore.decide(props.request.id, 'approved')
}
function confirmReject() {
  requestsStore.decide(props.request.id, 'rejected', reason.value)
  rejecting.value = false
}
function underReview() {
  requestsStore.setRequestStatus(props.request.id, 'under_review')
}
function cancel() {
  requestsStore.setRequestStatus(props.request.id, 'cancelled')
}
</script>

<template>
  <ModalShell :title="request.title" @close="emit('close')">
    <div class="topbar">
      <span class="status-badge" :style="{ background: statusMeta.bg, color: statusMeta.color }">{{ statusMeta.label }}</span>
      <span class="amount">{{ fmt(request.amount) }}</span>
    </div>

    <!-- نوع الطلب واتجاهه المالي -->
    <div class="typechip">
      <span class="typechip__type">{{ typeMeta?.icon ?? '📋' }} {{ request.type }}</span>
      <span class="typechip__flow" :class="`is-${typeMeta?.flow ?? 'out'}`">{{ flowLabel }}</span>
      <span v-if="typeMeta?.hint" class="typechip__hint">{{ typeMeta.hint }}</span>
    </div>

    <!-- مركز الإجراءات -->
    <div v-if="openStage" class="hub">
      <button class="hub__btn hub__btn--ok" @click="approve">✅ اعتماد</button>
      <button class="hub__btn hub__btn--no" @click="rejecting = !rejecting">⛔ رفض</button>
      <button v-if="request.status === 'pending'" class="hub__btn" @click="underReview">🔍 قيد المراجعة</button>
      <button class="hub__btn" @click="emit('edit', request)">✎ تعديل</button>
      <button class="hub__btn" @click="cancel">🚫 إلغاء</button>
    </div>

    <!-- إدخال سبب الرفض -->
    <div v-if="rejecting" class="reject">
      <textarea v-model="reason" rows="2" placeholder="سبب الرفض (اختياري)..." />
      <BaseButton size="sm" @click="confirmReject">تأكيد الرفض</BaseButton>
    </div>

    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ typeMeta?.icon ?? '📋' }} {{ request.type }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr><td class="rows__key">مقدّم الطلب</td><td>{{ request.requestedBy }}</td></tr>
      <tr v-if="member"><td class="rows__key">مُسنَد إلى</td><td>{{ member }}</td></tr>
      <tr v-for="f in specFields" :key="f.key"><td class="rows__key">{{ f.label }}</td><td>{{ request.specs?.[f.key] }}</td></tr>
      <tr><td class="rows__key">التاريخ</td><td>{{ request.date }}</td></tr>
      <tr v-if="request.decidedBy"><td class="rows__key">القرار بواسطة</td><td>{{ request.decidedBy }}</td></tr>
      <tr v-if="request.decisionNote"><td class="rows__key">سبب القرار</td><td>{{ request.decisionNote }}</td></tr>
      <tr v-if="request.note"><td class="rows__key">ملاحظات</td><td>{{ request.note }}</td></tr>
    </table>

    <div v-if="request.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="request.attachments" readonly />
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إغلاق</BaseButton>
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
.amount { font-size: 20px; font-weight: 800; }

.typechip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-block-end: 14px;

  &__type {
    font-size: 13px;
    font-weight: 700;
    background: var(--surface-2);
    padding: 4px 12px;
    border-radius: 20px;
  }

  &__flow {
    font-size: 11.5px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;

    &.is-out { background: var(--danger-bg); color: var(--danger-text); }
    &.is-in { background: var(--ok-bg); color: var(--ok-text); }
    &.is-none { background: var(--surface-2); color: var(--text-muted); }
  }

  &__hint { font-size: 11.5px; color: var(--text-muted); }
}

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
  &--ok { background: var(--ok-bg); color: var(--ok-text); border-color: transparent; &:hover { color: var(--ok-text); } }
  &--no { background: var(--danger-bg); color: var(--danger-text); border-color: transparent; &:hover { color: var(--danger-text); } }
}

.reject {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-block-end: 16px;

  textarea {
    flex: 1;
    inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    resize: vertical;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.app-btn--sm { padding: 8px 14px; font-size: 12.5px; white-space: nowrap; }

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }
  &__key { color: var(--text-muted); inline-size: 130px; }
}

.atts {
  margin-block-start: 4px;
  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
