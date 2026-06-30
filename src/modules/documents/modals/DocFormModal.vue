<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { today } from '@/helpers/date'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const documentsStore = useDocumentsStore()
const settingsStore = useSettingsStore()
const { projects } = storeToRefs(projectsStore)

const docTypes = settingsStore.lists.docTypes

const form = reactive({
  name: '',
  type: docTypes[0],
  projectId: props.projectId,
  size: '—',
})

const valid = computed(() => form.name.trim().length > 0)

function save() {
  if (!valid.value) return
  documentsStore.saveDoc({
    name: form.name.trim(),
    type: form.type,
    projectId: form.projectId,
    date: today(),
    size: form.size,
    status: 'pending',
    aiRead: false,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="مستند جديد" @close="emit('close')">
    <div class="field">
      <label>اسم المستند</label>
      <input v-model="form.name" type="text" placeholder="مثال: فاتورة مورد يونيو" />
    </div>
    <div class="field">
      <label>النوع</label>
      <select v-model="form.type">
        <option v-for="t in docTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>

    <p class="hint">ℹ️ بعد الإضافة يمكنك "معالجة" المستند لمحاكاة القراءة الذكية.</p>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">إضافة المستند</button>
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

.hint {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--primary-soft);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}
</style>
