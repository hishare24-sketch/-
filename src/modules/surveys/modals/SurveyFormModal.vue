<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSurveysStore } from '@/stores/SurveysStore'
import { SURVEY_TEMPLATES } from '@/constants/surveyTemplates'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import ModalShell from '@/components/shared/ModalShell.vue'

const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const surveysStore = useSurveysStore()
const { projects, activeProjectId } = storeToRefs(projectsStore)

const form = reactive({
  templateId: SURVEY_TEMPLATES[0].id,
  title: '',
  projectId: activeProjectId.value,
})

const selectedTemplate = computed(() => SURVEY_TEMPLATES.find((t) => t.id === form.templateId)!)
const valid = computed(() => form.title.trim().length > 0)

function save() {
  if (!valid.value) return
  const tpl = selectedTemplate.value
  surveysStore.saveSurvey({
    id: uid('sv'),
    title: form.title.trim(),
    surveyType: tpl.id,
    projectId: form.projectId,
    status: 'active',
    createdAt: today(),
    questions: tpl.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })),
    responses: [],
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="استبيان جديد" @close="emit('close')">
    <div class="field">
      <label>القالب</label>
      <div class="templates">
        <button
          v-for="t in SURVEY_TEMPLATES"
          :key="t.id"
          type="button"
          class="tpl"
          :class="{ 'is-active': form.templateId === t.id }"
          @click="form.templateId = t.id"
        >
          <span class="tpl__icon">{{ t.icon }}</span>
          <span class="tpl__name">{{ t.name }}</span>
          <span class="tpl__desc">{{ t.desc }}</span>
        </button>
      </div>
    </div>

    <div class="field">
      <label>عنوان الاستبيان</label>
      <input v-model="form.title" type="text" :placeholder="selectedTemplate.name" />
    </div>

    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>

    <div class="preview">
      <span class="preview__label">الأسئلة ({{ selectedTemplate.questions.length }}):</span>
      <ul>
        <li v-for="(q, i) in selectedTemplate.questions" :key="i">{{ q.text }}</li>
      </ul>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">إنشاء الاستبيان</button>
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

.templates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tpl {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 12px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface);
  text-align: start;
  cursor: pointer;

  &.is-active { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 20px; }
  &__name { font-size: 13px; font-weight: 600; }
  &__desc { font-size: 11px; color: var(--text-muted); }
}

.preview {
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 12px 14px;

  &__label { font-size: 12px; font-weight: 600; color: var(--text-muted); }

  ul {
    margin-block-start: 8px;
    padding-inline-start: 18px;

    li { font-size: 12px; color: var(--text); line-height: 1.7; }
  }
}
</style>
