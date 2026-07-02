<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSurveysStore } from '@/stores/SurveysStore'
import { SURVEY_TEMPLATES, QUESTION_KINDS } from '@/constants/surveyTemplates'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import type { Survey, SurveyQuestion, SurveyQuestionKind } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'

const props = defineProps<{ survey: Survey | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const surveysStore = useSurveysStore()
const { projects, activeProjectId } = storeToRefs(projectsStore)

const isEdit = computed(() => !!props.survey)

// نسخة عمل قابلة للتحرير
const draft = reactive<Survey>(
  props.survey
    ? JSON.parse(JSON.stringify(props.survey))
    : {
        id: '',
        title: '',
        description: '',
        surveyType: 'customer',
        projectId: activeProjectId.value,
        questions: [],
        responses: [],
        respondents: [],
        status: 'active',
        createdAt: today(),
        anonymous: false,
        maxResponses: undefined,
        closeDate: undefined,
      },
)

const step = ref<'template' | 'build'>(isEdit.value ? 'build' : 'template')

function pickTemplate(tplId: string) {
  const tpl = SURVEY_TEMPLATES.find((t) => t.id === tplId)!
  draft.surveyType = tpl.id
  if (!draft.title) draft.title = tpl.name
  draft.questions = tpl.questions.map((q, i) => ({ ...q, id: `q${i + 1}` }))
  step.value = 'build'
}

function addQuestion() {
  draft.questions.push({ id: uid('q'), text: '', kind: 'single', options: ['خيار 1', 'خيار 2'], required: false })
}
function removeQuestion(i: number) {
  draft.questions.splice(i, 1)
}
function moveQuestion(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= draft.questions.length) return
  const [q] = draft.questions.splice(i, 1)
  draft.questions.splice(j, 0, q)
}
function onKindChange(q: SurveyQuestion, kind: SurveyQuestionKind) {
  q.kind = kind
  const meta = QUESTION_KINDS.find((k) => k.id === kind)!
  if (meta.hasOptions && !q.options?.length) q.options = ['خيار 1', 'خيار 2']
  if (!meta.hasOptions) q.options = undefined
}
function addOption(q: SurveyQuestion) {
  if (!q.options) q.options = []
  q.options.push(`خيار ${q.options.length + 1}`)
}
function removeOption(q: SurveyQuestion, oi: number) {
  q.options?.splice(oi, 1)
}

const valid = computed(
  () => draft.title.trim().length > 0 && draft.questions.length > 0 && draft.questions.every((q) => q.text.trim()),
)

function save() {
  if (!valid.value) return
  surveysStore.saveSurvey({
    ...draft,
    id: draft.id || uid('sv'),
    title: draft.title.trim(),
    maxResponses: draft.maxResponses || undefined,
    closeDate: draft.closeDate || undefined,
  })
  emit('close')
}
</script>

<template>
  <ModalShell :title="isEdit ? 'تعديل الاستبيان' : 'منشئ الاستبيان'" wide @close="emit('close')">
    <!-- اختيار القالب -->
    <div v-if="step === 'template'">
      <p class="muted">اختر قالباً جاهزاً للبدء — يمكنك تعديل كل الأسئلة بعدها.</p>
      <div class="templates">
        <button v-for="t in SURVEY_TEMPLATES" :key="t.id" class="tpl" @click="pickTemplate(t.id)">
          <span class="tpl__icon">{{ t.icon }}</span>
          <span class="tpl__name">{{ t.name }}</span>
          <span class="tpl__desc">{{ t.desc }}</span>
          <span class="tpl__count">{{ t.questions.length }} سؤال</span>
        </button>
      </div>
    </div>

    <!-- البناء -->
    <div v-else class="build">
      <!-- معلومات عامة -->
      <BaseField label="عنوان الاستبيان">
        <BaseInput v-model="draft.title" placeholder="مثال: استبيان رضا عملاء" />
      </BaseField>
      <BaseField label="وصف (اختياري)">
        <BaseTextarea v-model="draft.description" :rows="2" placeholder="نبذة تظهر للمستبين" />
      </BaseField>
      <div class="row">
        <BaseField label="المشروع">
          <BaseSelect v-model="draft.projectId">
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
          </BaseSelect>
        </BaseField>
        <BaseField label="حد أقصى للردود (اختياري)">
          <BaseInput v-model.number="draft.maxResponses" type="number" placeholder="∞" />
        </BaseField>
      </div>
      <div class="row">
        <BaseField label="تاريخ الإغلاق (اختياري)">
          <BaseInput v-model="draft.closeDate" type="date" />
        </BaseField>
        <label class="checkbox">
          <input v-model="draft.anonymous" type="checkbox" />
          استبيان مجهول الهوية
        </label>
      </div>

      <!-- الأسئلة -->
      <div class="qhead">
        <span>الأسئلة ({{ draft.questions.length }})</span>
        <BaseButton variant="outlined" class="add-q" @click="addQuestion">＋ سؤال</BaseButton>
      </div>

      <div v-for="(q, i) in draft.questions" :key="q.id" class="qcard">
        <div class="qcard__top">
          <span class="qcard__num">{{ i + 1 }}</span>
          <input v-model="q.text" class="qcard__text" placeholder="نص السؤال" />
          <div class="qcard__move">
            <button :disabled="i === 0" @click="moveQuestion(i, -1)">↑</button>
            <button :disabled="i === draft.questions.length - 1" @click="moveQuestion(i, 1)">↓</button>
            <button class="qcard__del" @click="removeQuestion(i)">🗑️</button>
          </div>
        </div>

        <div class="qcard__row">
          <select :value="q.kind" class="qcard__kind" @change="onKindChange(q, ($event.target as HTMLSelectElement).value as SurveyQuestionKind)">
            <option v-for="k in QUESTION_KINDS" :key="k.id" :value="k.id">{{ k.icon }} {{ k.label }}</option>
          </select>
          <label class="checkbox checkbox--sm">
            <input v-model="q.required" type="checkbox" />
            إلزامي
          </label>
        </div>

        <!-- خيارات (للأنواع ذات الخيارات) -->
        <div v-if="q.options" class="options">
          <div v-for="(_, oi) in q.options" :key="oi" class="option">
            <input v-model="q.options[oi]" type="text" />
            <button class="option__del" @click="removeOption(q, oi)">✕</button>
          </div>
          <button class="option__add" @click="addOption(q)">＋ خيار</button>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton v-if="step === 'build'" :disabled="!valid" @click="save">
        {{ isEdit ? 'حفظ التعديلات' : 'إنشاء الاستبيان' }}
      </BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.muted { color: var(--text-muted); font-size: 13px; margin-block-end: 16px; }

.templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.tpl {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--surface);
  text-align: start;
  cursor: pointer;

  &:hover { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 22px; }
  &__name { font-size: 13px; font-weight: 700; }
  &__desc { font-size: 11px; color: var(--text-muted); }
  &__count { font-size: 11px; color: var(--primary); margin-block-start: 4px; }
}

.field {
  margin-block-end: 14px;
  flex: 1;
}

.row { display: flex; gap: 12px; flex-wrap: wrap; }

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  align-self: center;

  input { inline-size: 16px; block-size: 16px; }

  &--sm { font-size: 12px; }
}

.qhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block: 8px 14px;
  font-weight: 700;
  font-size: 14px;
}

.add-q { padding: 6px 14px; font-size: 13px; }

.qcard {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-block-end: 12px;
  background: var(--bg);

  &__top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-block-end: 10px;
  }

  &__num {
    inline-size: 24px;
    block-size: 24px;
    border-radius: 50%;
    background: var(--primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    &:focus { outline: none; border-color: var(--primary); }
  }

  &__move {
    display: flex;
    gap: 4px;

    button {
      inline-size: 28px;
      block-size: 28px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface);
      font-size: 12px;
      &:disabled { opacity: 0.4; }
    }
  }

  &__del { color: var(--error); }

  &__row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-block-end: 8px;
  }

  &__kind {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
  }
}

.options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-inline-start: 34px;
}

.option {
  display: flex;
  align-items: center;
  gap: 6px;

  input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
  }

  &__del {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    &:hover { color: var(--error); }
  }

  &__add {
    align-self: flex-start;
    border: 1px dashed var(--border);
    background: transparent;
    color: var(--primary);
    border-radius: 6px;
    padding: 5px 12px;
    font-size: 12px;
    font-family: inherit;
  }
}
</style>
