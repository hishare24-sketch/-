<script setup lang="ts">
import { computed } from 'vue'
import type { Survey, SurveyQuestion } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ survey: Survey }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const responseCount = computed(() => props.survey.responses.length)

// تجميع نتائج سؤال
function aggregate(q: SurveyQuestion) {
  const answers = props.survey.responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined && a !== '')

  if (q.kind === 'rating') {
    const nums = answers.map((a) => Number(a)).filter((n) => !isNaN(n))
    const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
    return { type: 'rating' as const, avg: avg.toFixed(1), count: nums.length }
  }

  if (q.kind === 'text') {
    return { type: 'text' as const, texts: answers.map((a) => String(a)) }
  }

  // single / multi → counts per option
  const counts: Record<string, number> = {}
  answers.forEach((a) => {
    const vals = Array.isArray(a) ? a : [a]
    vals.forEach((v) => {
      counts[String(v)] = (counts[String(v)] ?? 0) + 1
    })
  })
  const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1
  const options = (q.options ?? Object.keys(counts)).map((opt) => ({
    label: opt,
    count: counts[opt] ?? 0,
    pct: Math.round(((counts[opt] ?? 0) / total) * 100),
  }))
  return { type: 'choice' as const, options }
}
</script>

<template>
  <ModalShell :title="survey.title" wide @close="emit('close')">
    <div class="head">
      <span class="head__count">{{ responseCount }} رد</span>
      <span class="head__status" :class="`is-${survey.status}`">
        {{ survey.status === 'active' ? 'نشط' : survey.status === 'closed' ? 'مغلق' : 'مسودة' }}
      </span>
    </div>

    <div v-if="!responseCount" class="empty">لا توجد ردود بعد على هذا الاستبيان.</div>

    <div v-for="q in survey.questions" v-else :key="q.id" class="q">
      <span class="q__text">{{ q.text }}</span>

      <template v-for="agg in [aggregate(q)]" :key="q.id">
        <div v-if="agg.type === 'rating'" class="rating">
          <span class="rating__avg">{{ agg.avg }}</span>
          <span class="rating__stars">⭐ من 5 · {{ agg.count }} تقييم</span>
        </div>

        <div v-else-if="agg.type === 'choice'" class="choices">
          <div v-for="opt in agg.options" :key="opt.label" class="choice">
            <span class="choice__label">{{ opt.label }}</span>
            <div class="choice__track">
              <div class="choice__fill" :style="{ width: `${opt.pct}%` }" />
            </div>
            <span class="choice__pct">{{ opt.pct }}% ({{ opt.count }})</span>
          </div>
        </div>

        <div v-else class="texts">
          <p v-for="(t, i) in agg.texts" :key="i" class="texts__item">"{{ t }}"</p>
          <span v-if="!agg.texts.length" class="texts__empty">لا توجد إجابات نصية.</span>
        </div>
      </template>
    </div>

    <template #footer>
      <button class="app-btn" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-block-end: 18px;

  &__count {
    font-weight: 700;
    font-size: 15px;
  }

  &__status {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 12px;
    border-radius: 20px;

    &.is-active { background: #ecfdf5; color: #059669; }
    &.is-closed { background: #fef2f2; color: #dc2626; }
    &.is-draft { background: #fffbeb; color: #d97706; }
  }
}

.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.q {
  padding-block: 16px;
  border-block-start: 1px solid var(--border);

  &__text {
    display: block;
    font-weight: 600;
    font-size: 14px;
    margin-block-end: 12px;
  }
}

.rating {
  display: flex;
  align-items: baseline;
  gap: 10px;

  &__avg {
    font-size: 28px;
    font-weight: 800;
    color: var(--primary);
  }

  &__stars {
    font-size: 13px;
    color: var(--text-muted);
  }
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice {
  display: flex;
  align-items: center;
  gap: 12px;

  &__label {
    inline-size: 110px;
    font-size: 13px;
    flex-shrink: 0;
  }

  &__track {
    flex: 1;
    block-size: 10px;
    background: var(--bg);
    border-radius: 99px;
    overflow: hidden;
  }

  &__fill {
    block-size: 100%;
    background: var(--primary);
    border-radius: 99px;
  }

  &__pct {
    inline-size: 80px;
    text-align: end;
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
}

.texts {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__item {
    font-size: 13px;
    color: var(--text);
    background: var(--bg);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
  }

  &__empty {
    font-size: 13px;
    color: var(--text-muted);
  }
}
</style>
