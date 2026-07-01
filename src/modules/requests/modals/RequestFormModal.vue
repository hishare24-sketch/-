<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { REQUEST_TYPES, REQUEST_FIELD_SCHEMAS, CURRENT_USER } from '@/constants'
import { today } from '@/helpers/date'
import type { Attachment, RequestItem } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string; request?: RequestItem | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const requestsStore = useRequestsStore()
const { projects } = storeToRefs(projectsStore)
const rq = props.request
const editing = computed(() => !!props.request)

const form = reactive({
  title: rq?.title ?? '',
  type: rq?.type ?? REQUEST_TYPES[0],
  projectId: rq?.projectId ?? props.projectId,
  amount: (rq?.amount ?? null) as number | null,
  requestedBy: rq?.requestedBy ?? CURRENT_USER,
  memberId: rq?.memberId ?? '',
  note: rq?.note ?? '',
  attachments: (rq?.attachments ?? []) as Attachment[],
  specs: { ...(rq?.specs ?? {}) } as Record<string, string>,
})

const typeFields = computed(() => REQUEST_FIELD_SCHEMAS[form.type] ?? [])
const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.title.trim() && form.amount != null && form.amount > 0)

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
  requestsStore.saveRequest({
    id: props.request?.id,
    title: form.title.trim(),
    type: form.type,
    projectId: form.projectId,
    amount: Number(form.amount),
    requestedBy: form.requestedBy,
    status: props.request?.status ?? 'pending',
    date: props.request?.date ?? today(),
    memberId: form.memberId || undefined,
    note: form.note.trim() || undefined,
    specs: cleanSpecs(),
    attachments: form.attachments,
  })
  emit('close')
}
</script>

<template>
  <ModalShell :title="editing ? `تعديل الطلب` : 'طلب جديد'" @close="emit('close')">
    <div class="field">
      <label>نوع الطلب</label>
      <div class="types">
        <button v-for="t in REQUEST_TYPES" :key="t" type="button" class="type" :class="{ 'is-active': form.type === t }" @click="form.type = t">
          {{ t }}
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
      <label>عنوان الطلب</label>
      <input v-model="form.title" type="text" placeholder="مثال: طلب صرف مصروفات السفر" />
    </div>
    <div class="field">
      <label>المبلغ (ر.س)</label>
      <input v-model.number="form.amount" type="number" placeholder="0" />
    </div>

    <!-- حقول خاصة بنوع الطلب -->
    <div v-if="typeFields.length" class="specs">
      <span class="specs__label">بيانات {{ form.type }}</span>
      <div v-for="f in typeFields" :key="f.key" class="field">
        <label>{{ f.label }}</label>
        <input v-model="form.specs[f.key]" type="text" :placeholder="f.placeholder ?? ''" />
      </div>
    </div>
    <div class="field">
      <label>مقدّم الطلب</label>
      <input v-model="form.requestedBy" type="text" placeholder="الاسم" />
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
      <textarea v-model="form.note" rows="2" placeholder="مبرر الطلب أو تفاصيل..."></textarea>
    </div>

    <div class="field">
      <label>المرفقات (صور / ملفات)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إرسال الطلب' }}</button>
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
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
