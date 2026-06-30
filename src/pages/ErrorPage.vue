<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const messageKey = (route.query.message as string) || 'errors.not_found'
</script>

<template>
  <div class="error-page">
    <div class="error-page__code">404</div>
    <p class="error-page__msg">{{ t(messageKey) }}</p>
    <button class="app-btn" @click="router.push({ name: 'home' })">
      {{ t('common.back') }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  text-align: center;

  &__code {
    font-size: 72px;
    font-weight: 700;
    color: var(--primary);
  }

  &__msg {
    color: var(--text-muted);
    margin-block: 8px 20px;
  }
}
</style>
