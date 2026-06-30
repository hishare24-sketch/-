<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSurveysStore } from '@/stores/SurveysStore'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import type { Survey, SurveyQuestion } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ survey: Survey; publicMode?: boolean }>()
const emit = defineEmits<{ (e: 'submitted'): void; (e: 'close'): void }>()

const surveysStore = useSurveysStore()

// المستبينون الذين لم يجيبوا بعد
const pending = computed(() => (props.survey.respondents ?? []).filter((r) => !r.responded))
const respondentId = ref('')
const guestName = ref('')

const answers = reactive<Record<string, string | string[] | number>>({})

function toggleMulti(qid: string, opt: string) {
  const cur = (answers[qid] as string[]) ?? []
  answers[qid] = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]
}
function isChecked(qid: string, opt: string) {
  return ((answers[qid] as string[]) ?? []).includes(opt)
}

function answered(q: SurveyQuestion) {
  const a = answers[q.id]
  if (Array.isArray(a)) return a.length > 0
  return a !== undefined && a !== ''
}

const submitted = ref(false)
const missing = computed(() => props.survey.questions.filter((q) => q.required && !answered(q)))

function submit() {
  if (missing.value.length) return
  const r = pending.value.find((x) => x.id === respondentId.value)
  surveysStore.addResponse(props.survey.id, {
    id: uid('resp'),
    answers: { ...answers },
    submittedAt: today(),
    respondent: props.survey.anonymous ? undefined : r?.name ?? (guestName.value.trim() || 'ضيف'),
    respondentId: r?.id,
  })
  submitted.value = true
  emit('submitted')
}
</script>

<template>
  <ModalShell :title="survey.title" wide @close="emit('close')">
    <!-- شاشة الشكر بعد الإرسال -->
    <div v-if="submitted" class="thanks">
      <span class="thanks__icon">🎉</span>
      <h3>شكراً لك!</h3>
      <p>تم تسجيل إجابتك بنجاح.</p>
    </div>

    <template v-else>
      <p v-if="survey.description" class="desc">{{ survey.description }}</p>

      <!-- اختيار المستبين (إن لم يكن مجهولاً) -->
      <div v-if="!survey.anonymous" class="who">
        <label>المستبين</label>
        <select v-if="pending.length" v-model="respondentId">
          <option value="">— اختر مستبيناً —</option>
          <option v-for="r in pending" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
        <input v-else v-model="guestName" type="text" placeholder="اسمك" />
      </div>

      <!-- الأسئلة -->
      <div v-for="(q, i) in survey.questions" :key="q.id" class="q">
        <span class="q__text">
          {{ i + 1 }}. {{ q.text }}
          <span v-if="q.required" class="q__req">*</span>
        </span>

        <!-- اختيار واحد -->
        <div v-if="q.kind === 'single'" class="opts">
          <label v-for="opt in q.options" :key="opt" class="opt">
            <input v-model="answers[q.id]" type="radio" :value="opt" />{{ opt }}
          </label>
        </div>

        <!-- اختيار متعدد -->
        <div v-else-if="q.kind === 'multi'" class="opts">
          <label v-for="opt in q.options" :key="opt" class="opt">
            <input type="checkbox" :checked="isChecked(q.id, opt)" @change="toggleMulti(q.id, opt)" />{{ opt }}
          </label>
        </div>

        <!-- تقييم -->
        <div v-else-if="q.kind === 'rating'" class="stars">
          <button v-for="n in 5" :key="n" class="star" :class="{ 'is-on': Number(answers[q.id]) >= n }" @click="answers[q.id] = n">★</button>
        </div>

        <!-- NPS -->
        <div v-else-if="q.kind === 'nps'" class="nps">
          <button v-for="n in 11" :key="n - 1" class="nps__btn" :class="{ 'is-on': answers[q.id] === n - 1 }" @click="answers[q.id] = n - 1">{{ n - 1 }}</button>
        </div>

        <!-- نعم/لا -->
        <div v-else-if="q.kind === 'yesno'" class="yesno">
          <button class="yn" :class="{ 'is-on': answers[q.id] === 'نعم' }" @click="answers[q.id] = 'نعم'">نعم</button>
          <button class="yn" :class="{ 'is-on': answers[q.id] === 'لا' }" @click="answers[q.id] = 'لا'">لا</button>
        </div>

        <!-- رقم -->
        <input v-else-if="q.kind === 'number'" v-model.number="answers[q.id]" type="number" class="q__input" placeholder="0" />

        <!-- نص -->
        <textarea v-else v-model="answers[q.id]" rows="2" class="q__input" placeholder="إجابتك..."></textarea>
      </div>
    </template>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">{{ submitted ? 'إغلاق' : 'إلغاء' }}</button>
      <button v-if="!submitted" class="app-btn" :disabled="missing.length > 0" @click="submit">
        {{ missing.length ? `أكمل ${missing.length} سؤال إلزامي` : 'إرسال' }}
      </button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.desc { color: var(--text-muted); font-size: 14px; line-height: 1.7; margin-block-end: 16px; }

.who {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 20px;
  padding-block-end: 16px;
  border-block-end: 1px solid var(--border);

  label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
  select, input { padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 14px; }
}

.q {
  margin-block-end: 20px;

  &__text { display: block; font-weight: 600; font-size: 14px; margin-block-end: 10px; }
  &__req { color: var(--error); }

  &__input {
    inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.opts { display: flex; flex-direction: column; gap: 8px; }
.opt {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  input { inline-size: 16px; block-size: 16px; }
}

.stars { display: flex; gap: 6px; }
.star {
  font-size: 28px;
  border: none;
  background: none;
  color: #d1d5db;
  &.is-on { color: #f59e0b; }
}

.nps { display: flex; flex-wrap: wrap; gap: 6px; }
.nps__btn {
  inline-size: 36px;
  block-size: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  font-weight: 600;
  font-family: inherit;
  &.is-on { background: var(--primary); color: #fff; border-color: var(--primary); }
}

.yesno { display: flex; gap: 10px; }
.yn {
  padding: 10px 28px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  &.is-on { background: var(--primary-soft); border-color: var(--primary); color: var(--primary); }
}

.thanks {
  text-align: center;
  padding: 40px 20px;

  &__icon { font-size: 48px; display: block; margin-block-end: 12px; }
  h3 { font-size: 20px; font-weight: 700; margin-block-end: 6px; }
  p { color: var(--text-muted); }
}
</style>
