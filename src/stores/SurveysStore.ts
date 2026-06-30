import { defineStore } from 'pinia'
import type { Survey, SurveyResponse, SurveyRespondent } from '@/interfaces/models'
import { INITIAL_SURVEYS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { useAuditStore } from '@/stores/AuditStore'

// متجر الاستبيانات
export const useSurveysStore = defineStore('surveys', {
  state: () => ({
    surveys: [...INITIAL_SURVEYS] as Survey[],
  }),

  getters: {
    byId: (s) => (id: string) => s.surveys.find((x) => x.id === id) ?? null,
    byShareId: (s) => (shareId: string) => s.surveys.find((x) => x.shareId === shareId) ?? null,
  },

  actions: {
    saveSurvey(survey: Survey) {
      const i = this.surveys.findIndex((s) => s.id === survey.id)
      if (i !== -1) {
        this.surveys[i] = survey
        useAuditStore().log('تعديل', 'استبيان', survey.title)
      } else {
        this.surveys.unshift(survey)
        useAuditStore().log('إنشاء', 'استبيان', survey.title)
      }
    },
    deleteSurvey(id: string) {
      this.surveys = this.surveys.filter((s) => s.id !== id)
    },
    setStatus(surveyId: string, status: Survey['status']) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (sv) sv.status = status
    },
    // توليد رابط مشاركة عام
    ensureShareId(surveyId: string): string {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (!sv) return ''
      if (!sv.shareId) sv.shareId = uid('sh')
      return sv.shareId
    },

    // ── المستبينون ──
    addRespondent(surveyId: string, respondent: Omit<SurveyRespondent, 'id'>) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (!sv) return
      if (!sv.respondents) sv.respondents = []
      // تجنّب التكرار بالبريد أو الاسم
      const exists = sv.respondents.some(
        (r) => (respondent.email && r.email === respondent.email) || r.name === respondent.name,
      )
      if (!exists) sv.respondents.push({ ...respondent, id: uid('rsp') })
    },
    removeRespondent(surveyId: string, respondentId: string) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (sv?.respondents) sv.respondents = sv.respondents.filter((r) => r.id !== respondentId)
    },

    // ── الردود ──
    addResponse(surveyId: string, response: SurveyResponse) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (!sv) return
      sv.responses.push(response)
      // علّم المستبين كمُجيب
      if (response.respondentId && sv.respondents) {
        const r = sv.respondents.find((x) => x.id === response.respondentId)
        if (r) r.responded = true
      }
    },
  },
})
