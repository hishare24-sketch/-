<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSurveysStore } from '@/stores/SurveysStore'
import themeConfig from '@themeConfig'
import FillSurveyModal from '@/modules/surveys/modals/FillSurveyModal.vue'

const route = useRoute()
const surveysStore = useSurveysStore()

const survey = computed(() => surveysStore.byShareId(route.params.shareId as string))
const available = computed(() => survey.value && survey.value.status === 'active')
</script>

<template>
  <div class="public">
    <div class="public__brand">
      <span class="public__logo">{{ themeConfig.app.logo }}</span>
      <span class="public__name">{{ themeConfig.app.title }}</span>
    </div>

    <FillSurveyModal v-if="available && survey" :survey="survey" public-mode @close="() => {}" />

    <div v-else class="public__card">
      <span class="public__icon">🔒</span>
      <h2>الاستبيان غير متاح</h2>
      <p>قد يكون الرابط غير صحيح أو أن الاستبيان أُغلق.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.public {
  min-block-size: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block-start: 40px;
  background: linear-gradient(135deg, var(--primary-soft) 0%, var(--bg) 100%);

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-block-end: 24px;
  }

  &__logo { font-size: 28px; }
  &__name { font-size: 22px; font-weight: 700; color: var(--primary); }

  &__card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 48px 40px;
    text-align: center;
    max-inline-size: 420px;

    h2 { font-size: 20px; font-weight: 700; margin-block: 12px 6px; }
    p { color: var(--text-muted); font-size: 14px; }
  }

  &__icon { font-size: 44px; }
}
</style>
