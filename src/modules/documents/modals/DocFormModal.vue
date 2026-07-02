<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { today } from '@/helpers/date'
import { uid } from '@/helpers/id'
import type { Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect } from '@/components/base'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'created', docId: string, autoAnalyze: boolean): void }>()

const projectsStore = useProjectsStore()
const documentsStore = useDocumentsStore()
const settingsStore = useSettingsStore()
const { projects } = storeToRefs(projectsStore)

const docTypes = settingsStore.lists.docTypes

const form = reactive({
  name: '',
  type: docTypes[0],
  projectId: props.projectId,
  date: today(),
  attachments: [] as Attachment[],
  autoAnalyze: true,
})

const valid = computed(() => form.name.trim().length > 0)

// اقتراح ذكي لتوجيه المستند لمشروع مناسب حسب نوعه
const suggestedProject = computed(() => {
  const map: Record<string, string[]> = {
    فاتورة: ['شركة', 'متجر إلكتروني', 'مطعم', 'مؤسسة'],
    عقد: ['شركة', 'مؤسسة'],
    'كشف حساب': ['شركة', 'مؤسسة', 'مشروع منزلي'],
    'وثيقة رسمية': ['شركة', 'مؤسسة'],
  }
  const wanted = map[form.type]
  if (!wanted) return null
  const match = projects.value.find((p) => p.type && wanted.includes(p.type))
  return match && match.id !== form.projectId ? match : null
})

// حجم تقديري من عدد المرفقات
const estimatedSize = computed(() =>
  form.attachments.length ? form.attachments[0].size : `${Math.round(100 + Math.random() * 900)} KB`,
)

function save() {
  if (!valid.value) return
  const id = uid('d')
  documentsStore.saveDoc({
    id,
    name: form.name.trim(),
    type: form.type,
    projectId: form.projectId,
    date: form.date,
    size: estimatedSize.value,
    status: 'pending',
    aiRead: false,
    attachments: form.attachments,
  })
  // يُفتح مركز الإجراءات دائماً بعد الإضافة؛ autoAnalyze يقرّر تشغيل التحليل تلقائياً
  emit('created', id, form.autoAnalyze)
  emit('close')
}
</script>

<template>
  <ModalShell title="مستند جديد" @close="emit('close')">
    <!-- منطقة رفع الملفات -->
    <div class="dropzone">
      <span class="dropzone__icon">☁️</span>
      <span class="dropzone__hint">ارفع المستند (صور / PDF / ملفات) — مفرد أو متعدد</span>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <BaseField label="نوع المستند">
      <BaseSelect v-model="form.type">
        <option v-for="t in docTypes" :key="t" :value="t">{{ t }}</option>
      </BaseSelect>
    </BaseField>

    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>

    <!-- اقتراح التوجيه الذكي -->
    <div v-if="suggestedProject" class="suggest">
      <span>🤖 مقترح حسب النوع: {{ suggestedProject.icon }} {{ suggestedProject.name }}</span>
      <button @click="form.projectId = suggestedProject.id">توجيه</button>
    </div>

    <BaseField label="اسم المستند">
      <BaseInput v-model="form.name" placeholder="مثال: فاتورة مورد يونيو" />
    </BaseField>

    <BaseField label="تاريخ المستند">
      <BaseInput v-model="form.date" type="date" />
    </BaseField>

    <label class="auto">
      <input v-model="form.autoAnalyze" type="checkbox" />
      ✨ تشغيل التحليل الذكي واستخراج البيانات بعد الإضافة
    </label>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">إضافة المستند</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.dropzone {
  border: 2px dashed var(--border);
  border-radius: 14px;
  padding: 20px 16px;
  text-align: center;
  margin-block-end: 18px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &__icon { font-size: 28px; }
  &__hint { font-size: 13px; color: var(--text-muted); }
}

.auto {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--purple-text);
  background: var(--purple-bg);
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;

  input { inline-size: 16px; block-size: 16px; }
}

.suggest {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--purple-bg);
  border-radius: 10px;
  padding: 10px 14px;
  margin-block: -8px 16px;
  font-size: 12px;
  color: var(--purple-text);

  button {
    background: #7c3aed;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 11px;
    font-family: inherit;
    flex-shrink: 0;
  }
}
</style>
