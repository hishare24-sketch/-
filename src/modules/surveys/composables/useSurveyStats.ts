import { computed, type Ref } from 'vue'
import type { Survey, SurveyQuestion } from '@/interfaces/models'

export interface ChoiceStat { label: string; count: number; pct: number }
export interface QuestionStat {
  question: SurveyQuestion
  answered: number
  // حسب النوع
  ratingAvg?: number
  ratingDist?: ChoiceStat[]
  npsScore?: number
  npsBreakdown?: { promoters: number; passives: number; detractors: number }
  choices?: ChoiceStat[]
  numberStats?: { avg: number; min: number; max: number }
  texts?: string[]
}

// تحليل نتائج استبيان (يدعم كل أنواع الأسئلة)
export function useSurveyStats(survey: Ref<Survey>) {
  const responseCount = computed(() => survey.value.responses.length)

  const respondentCount = computed(() => survey.value.respondents?.length ?? 0)
  const responseRate = computed(() => {
    const denom = respondentCount.value || survey.value.maxResponses || 0
    return denom ? Math.round((responseCount.value / denom) * 100) : null
  })

  function statsFor(q: SurveyQuestion): QuestionStat {
    const raw = survey.value.responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined && a !== '')
    const answered = raw.length

    if (q.kind === 'rating') {
      const nums = raw.map(Number).filter((n) => !isNaN(n))
      const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
      const dist: ChoiceStat[] = [5, 4, 3, 2, 1].map((star) => {
        const count = nums.filter((n) => n === star).length
        return { label: `${star} ★`, count, pct: nums.length ? Math.round((count / nums.length) * 100) : 0 }
      })
      return { question: q, answered, ratingAvg: avg, ratingDist: dist }
    }

    if (q.kind === 'nps') {
      const nums = raw.map(Number).filter((n) => !isNaN(n))
      const total = nums.length || 1
      const promoters = nums.filter((n) => n >= 9).length
      const passives = nums.filter((n) => n >= 7 && n <= 8).length
      const detractors = nums.filter((n) => n <= 6).length
      const score = Math.round((promoters / total) * 100 - (detractors / total) * 100)
      return { question: q, answered, npsScore: score, npsBreakdown: { promoters, passives, detractors } }
    }

    if (q.kind === 'number') {
      const nums = raw.map(Number).filter((n) => !isNaN(n))
      if (!nums.length) return { question: q, answered, numberStats: { avg: 0, min: 0, max: 0 } }
      return {
        question: q,
        answered,
        numberStats: {
          avg: Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10,
          min: Math.min(...nums),
          max: Math.max(...nums),
        },
      }
    }

    if (q.kind === 'text') {
      return { question: q, answered, texts: raw.map(String) }
    }

    // single / multi / yesno → عدّ الخيارات
    const counts: Record<string, number> = {}
    raw.forEach((a) => {
      const vals = Array.isArray(a) ? a : [a]
      vals.forEach((v) => {
        counts[String(v)] = (counts[String(v)] ?? 0) + 1
      })
    })
    const total = Object.values(counts).reduce((s, n) => s + n, 0) || 1
    const baseOptions = q.options ?? (q.kind === 'yesno' ? ['نعم', 'لا'] : Object.keys(counts))
    const choices: ChoiceStat[] = baseOptions.map((opt) => ({
      label: opt,
      count: counts[opt] ?? 0,
      pct: Math.round(((counts[opt] ?? 0) / total) * 100),
    }))
    return { question: q, answered, choices }
  }

  const questionStats = computed<QuestionStat[]>(() => survey.value.questions.map(statsFor))

  return { responseCount, respondentCount, responseRate, questionStats, statsFor }
}
