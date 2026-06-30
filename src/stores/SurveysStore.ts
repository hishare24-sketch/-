import { defineStore } from 'pinia'
import type { Survey, SurveyResponse } from '@/interfaces/models'
import { INITIAL_SURVEYS } from '@/data/seed'
import { useAuditStore } from '@/stores/AuditStore'

// متجر الاستبيانات
export const useSurveysStore = defineStore('surveys', {
  state: () => ({
    surveys: [...INITIAL_SURVEYS] as Survey[],
  }),

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
    addResponse(surveyId: string, response: SurveyResponse) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (sv) sv.responses.push(response)
    },
    setStatus(surveyId: string, status: Survey['status']) {
      const sv = this.surveys.find((s) => s.id === surveyId)
      if (sv) sv.status = status
    },
  },
})
