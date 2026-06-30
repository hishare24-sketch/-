<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import { exportXLSX, exportPDF, docHTML } from '@/helpers/export'
import { useSurveysStore } from '@/stores/SurveysStore'
import { useSurveyStats } from '../composables/useSurveyStats'
import type { Survey } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ survey: Survey }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const surveysStore = useSurveysStore()
const live = computed(() => surveysStore.byId(props.survey.id) ?? props.survey)
const { responseCount, respondentCount, responseRate, questionStats } = useSurveyStats(toRef(props, 'survey'))

type Tab = 'summary' | 'questions' | 'respondents' | 'share'
const tab = ref<Tab>('summary')

const npsColor = (n: number) => (n >= 50 ? '#059669' : n >= 0 ? '#d97706' : '#dc2626')

// رابط المشاركة
const shareLink = computed(() => `${location.origin}/s/${surveysStore.ensureShareId(props.survey.id)}`)
const copied = ref(false)
function copyLink() {
  navigator.clipboard?.writeText(shareLink.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
const webhook = ref(live.value.webhookUrl ?? '')
function saveWebhook() {
  const sv = surveysStore.byId(props.survey.id)
  if (sv) sv.webhookUrl = webhook.value.trim() || undefined
}

// تصدير Excel: مصفوفة الردود (مستبين × أسئلة) + ملخص
function exportExcel() {
  const qs = props.survey.questions
  const responseRows = props.survey.responses.map((r) => {
    const row: Record<string, any> = { المستبين: r.respondent ?? 'مجهول', التاريخ: r.submittedAt }
    qs.forEach((q, i) => {
      const a = r.answers[q.id]
      row[`س${i + 1}`] = Array.isArray(a) ? a.join('، ') : (a ?? '')
    })
    return row
  })
  const summaryRows = questionStats.value.map((st, i) => ({
    السؤال: `س${i + 1}: ${st.question.text}`,
    النوع: st.question.kind,
    'عدد الإجابات': st.answered,
    النتيجة: st.ratingAvg != null ? `متوسط ${st.ratingAvg.toFixed(1)}` : st.npsScore != null ? `NPS ${st.npsScore}` : st.numberStats ? `متوسط ${st.numberStats.avg}` : st.choices ? st.choices.map((c) => `${c.label}: ${c.pct}%`).join(' / ') : `${st.texts?.length ?? 0} إجابة نصية`,
  }))
  exportXLSX(`نتائج_${props.survey.title}`, [
    { name: 'الملخص', rows: summaryRows },
    { name: 'الردود', rows: responseRows.length ? responseRows : [{ '—': 'لا توجد ردود' }] },
  ]).catch((e) => alert(e.message))
}

// تصدير PDF: تقرير النتائج
function exportReport() {
  const body = questionStats.value
    .map((st, i) => {
      let detail = ''
      if (st.choices) detail = st.choices.map((c) => `<div style="margin:3px 0">${c.label}: <b>${c.pct}%</b> (${c.count})</div>`).join('')
      else if (st.ratingAvg != null) detail = `متوسط التقييم: <b>${st.ratingAvg.toFixed(1)} / 5</b>`
      else if (st.npsScore != null) detail = `مؤشر NPS: <b>${st.npsScore}</b>`
      else if (st.numberStats) detail = `المتوسط: <b>${st.numberStats.avg}</b> · الأدنى: ${st.numberStats.min} · الأعلى: ${st.numberStats.max}`
      else if (st.texts) detail = st.texts.map((t) => `<div style="margin:2px 0;color:#555">— ${t}</div>`).join('')
      return `<div style="margin-bottom:18px"><div style="font-weight:700;margin-bottom:6px">${i + 1}. ${st.question.text}</div>${detail}</div>`
    })
    .join('')
  exportPDF(`تقرير_${props.survey.title}`, docHTML({ title: 'تقرير نتائج استبيان', subtitle: `${props.survey.title} · ${responseCount.value} رد`, body })).catch((e) => alert(e.message))
}
</script>

<template>
  <ModalShell :title="survey.title" wide @close="emit('close')">
    <!-- بطاقات علوية -->
    <div class="kpis">
      <div class="kpi"><span class="kpi__v">{{ responseCount }}</span><span class="kpi__l">رد</span></div>
      <div class="kpi"><span class="kpi__v">{{ respondentCount }}</span><span class="kpi__l">مستبين</span></div>
      <div class="kpi"><span class="kpi__v">{{ responseRate != null ? responseRate + '%' : '—' }}</span><span class="kpi__l">نسبة الاستجابة</span></div>
      <div class="kpi"><span class="kpi__v">{{ survey.questions.length }}</span><span class="kpi__l">سؤال</span></div>
    </div>

    <div class="tabs">
      <button v-for="t in (['summary','questions','respondents','share'] as Tab[])" :key="t" class="tabs__btn" :class="{ 'is-active': tab === t }" @click="tab = t">
        {{ t === 'summary' ? 'ملخص' : t === 'questions' ? 'حسب السؤال' : t === 'respondents' ? 'المستبينون' : 'المشاركة' }}
      </button>
    </div>

    <!-- ملخص + حسب السؤال (نفس العرض، الملخص مختصر) -->
    <div v-if="tab === 'summary' || tab === 'questions'">
      <div v-if="!responseCount" class="empty">لا توجد ردود بعد على هذا الاستبيان.</div>

      <div v-for="(st, i) in questionStats" :key="st.question.id" class="qstat">
        <span class="qstat__text">{{ i + 1 }}. {{ st.question.text }}</span>
        <span class="qstat__answered">{{ st.answered }} إجابة</span>

        <!-- خيارات (single/multi/yesno) -->
        <div v-if="st.choices" class="bars">
          <div v-for="c in st.choices" :key="c.label" class="bar">
            <span class="bar__label">{{ c.label }}</span>
            <div class="bar__track"><div class="bar__fill" :style="{ width: `${c.pct}%` }" /></div>
            <span class="bar__pct">{{ c.pct }}% ({{ c.count }})</span>
          </div>
        </div>

        <!-- تقييم -->
        <div v-else-if="st.ratingAvg != null" class="rating">
          <span class="rating__avg">{{ st.ratingAvg.toFixed(1) }}</span>
          <span class="rating__sub">★ من 5</span>
          <div class="bars bars--inline">
            <div v-for="d in st.ratingDist" :key="d.label" class="bar">
              <span class="bar__label">{{ d.label }}</span>
              <div class="bar__track"><div class="bar__fill bar__fill--amber" :style="{ width: `${d.pct}%` }" /></div>
              <span class="bar__pct">{{ d.count }}</span>
            </div>
          </div>
        </div>

        <!-- NPS -->
        <div v-else-if="st.npsScore != null" class="nps">
          <div class="nps__score" :style="{ color: npsColor(st.npsScore) }">{{ st.npsScore }}</div>
          <div class="nps__bd">
            <span class="nps__seg is-promoter">مروّجون: {{ st.npsBreakdown?.promoters }}</span>
            <span class="nps__seg is-passive">محايدون: {{ st.npsBreakdown?.passives }}</span>
            <span class="nps__seg is-detractor">منتقدون: {{ st.npsBreakdown?.detractors }}</span>
          </div>
        </div>

        <!-- رقم -->
        <div v-else-if="st.numberStats" class="nums">
          <span>المتوسط: <b>{{ st.numberStats.avg }}</b></span>
          <span>الأدنى: <b>{{ st.numberStats.min }}</b></span>
          <span>الأعلى: <b>{{ st.numberStats.max }}</b></span>
        </div>

        <!-- نص -->
        <div v-else-if="st.texts" class="texts">
          <p v-for="(t, ti) in st.texts" :key="ti">"{{ t }}"</p>
          <span v-if="!st.texts.length" class="texts__empty">لا توجد إجابات نصية.</span>
        </div>
      </div>
    </div>

    <!-- المستبينون -->
    <div v-else-if="tab === 'respondents'" class="resps">
      <div v-if="!live.respondents?.length" class="empty">لا يوجد مستبينون. أضِفهم من زر 👥.</div>
      <div v-for="r in live.respondents ?? []" :key="r.id" class="resp">
        <span class="resp__status">{{ r.responded ? '✅' : '⏳' }}</span>
        <div class="resp__info"><span class="resp__name">{{ r.name }}</span><span class="resp__email">{{ r.email ?? '—' }}</span></div>
        <span class="resp__tag">{{ r.responded ? 'أجاب' : 'لم يجب' }}</span>
      </div>
    </div>

    <!-- المشاركة والتكامل -->
    <div v-else class="share">
      <div class="share__block">
        <span class="share__label">🔗 رابط المشاركة العام</span>
        <p class="share__hint">شارك هذا الرابط مع أي شخص لتعبئة الاستبيان (يفتح بدون تسجيل دخول).</p>
        <div class="share__row">
          <input :value="shareLink" readonly />
          <button class="app-btn" @click="copyLink">{{ copied ? '✓ نُسخ' : 'نسخ' }}</button>
        </div>
      </div>

      <div class="share__block">
        <span class="share__label">🧩 كود التضمين (Embed)</span>
        <textarea readonly rows="2" class="share__embed">&lt;iframe src="{{ shareLink }}" width="100%" height="600"&gt;&lt;/iframe&gt;</textarea>
      </div>

      <div class="share__block">
        <span class="share__label">🔌 Webhook (تكامل خارجي)</span>
        <p class="share__hint">عند كل رد جديد، يُرسل النظام البيانات إلى هذا الرابط (عند توفّر backend).</p>
        <div class="share__row">
          <input v-model="webhook" type="url" placeholder="https://example.com/webhook" @blur="saveWebhook" />
          <button class="app-btn app-btn--outlined" @click="saveWebhook">حفظ</button>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
      <button class="app-btn app-btn--outlined" @click="exportExcel">⬇ Excel</button>
      <button class="app-btn app-btn--outlined" @click="exportReport">⬇ PDF</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-block-end: 18px;
}

.kpi {
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 14px;
  text-align: center;

  &__v { display: block; font-size: 20px; font-weight: 800; color: var(--primary); }
  &__l { font-size: 11px; color: var(--text-muted); }
}

.tabs {
  display: flex;
  gap: 4px;
  margin-block-end: 18px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;
  flex-wrap: wrap;

  &__btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.empty { padding: 30px; text-align: center; color: var(--text-muted); }

.qstat {
  padding-block: 16px;
  border-block-start: 1px solid var(--border);

  &__text { display: block; font-weight: 600; font-size: 14px; }
  &__answered { font-size: 11px; color: var(--text-muted); }
}

.bars { display: flex; flex-direction: column; gap: 8px; margin-block-start: 12px; }

.bar {
  display: flex;
  align-items: center;
  gap: 12px;

  &__label { inline-size: 90px; font-size: 12px; flex-shrink: 0; }
  &__track { flex: 1; block-size: 10px; background: var(--bg); border-radius: 99px; overflow: hidden; }
  &__fill { block-size: 100%; background: var(--primary); border-radius: 99px; &--amber { background: #f59e0b; } }
  &__pct { inline-size: 78px; text-align: end; font-size: 12px; color: var(--text-muted); flex-shrink: 0; }
}

.rating {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-block-start: 10px;

  &__avg { font-size: 28px; font-weight: 800; color: #f59e0b; }
  &__sub { font-size: 13px; color: var(--text-muted); }

  .bars--inline { flex: 1; min-inline-size: 220px; margin: 0; }
}

.nps {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-block-start: 12px;
  flex-wrap: wrap;

  &__score { font-size: 34px; font-weight: 800; }
  &__bd { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
  &__seg { padding: 2px 10px; border-radius: 20px;
    &.is-promoter { background: #ecfdf5; color: #059669; }
    &.is-passive { background: #fffbeb; color: #d97706; }
    &.is-detractor { background: #fef2f2; color: #dc2626; }
  }
}

.nums {
  display: flex;
  gap: 20px;
  margin-block-start: 12px;
  font-size: 14px;
  color: var(--text-muted);
}

.texts {
  margin-block-start: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  p { font-size: 13px; background: var(--bg); padding: 8px 12px; border-radius: var(--radius-sm); }
  &__empty { font-size: 13px; color: var(--text-muted); }
}

.resps { display: flex; flex-direction: column; }
.resp {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-block-end: 1px solid var(--border);

  &__status { font-size: 14px; }
  &__info { flex: 1; display: flex; flex-direction: column; }
  &__name { font-weight: 600; font-size: 13px; }
  &__email { font-size: 11px; color: var(--text-muted); }
  &__tag { font-size: 11px; color: var(--text-muted); }
}

.share {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__block { display: flex; flex-direction: column; gap: 6px; }
  &__label { font-weight: 700; font-size: 14px; }
  &__hint { font-size: 12px; color: var(--text-muted); }

  &__row {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 13px;
      background: var(--bg);
    }
  }

  &__embed {
    inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 12px;
    background: var(--bg);
    resize: none;
  }
}
</style>
