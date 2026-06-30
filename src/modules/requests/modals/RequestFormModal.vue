<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { REQUEST_TYPES, CURRENT_USER } from '@/constants'
import { today } from '@/helpers/date'
import type { Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const requestsStore = useRequestsStore()
const { projects } = storeToRefs(projectsStore)

const form = reactive({
  title: '',
  type: REQUEST_TYPES[0],
  projectId: props.projectId,
  amount: null as number | null,
  requestedBy: CURRENT_USER,
  memberId: '',
  note: '',
  attachments: [] as Attachment[],
})

const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.title.trim() && form.amount != null && form.amount > 0)

function save() {
  if (!valid.value) return
  requestsStore.saveRequest({
    title: form.title.trim(),
    type: form.type,
    projectId: form.projectId,
    amount: Number(form.amount),
    requestedBy: form.requestedBy,
    status: 'pending',
    date: today(),
    memberId: form.memberId || undefined,
    note: form.note.trim() || undefined,
    attachments: form.attachments,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="طلب جديد" @close="emit('close')">
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
      <button class="app-btn" :disabled="!valid" @click="save">إرسال الطلب</button>
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
