<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const messageKey = (route.query.message as string) || 'errors.not_found'
// رمز مناسب: 403 لعدم التصريح، 404 لغير الموجود
const code = computed(() => (messageKey.includes('not_authorized') ? '403' : '404'))
</script>

<template>
  <div class="error-page">
    <div class="error-page__code">{{ code }}</div>
    <p class="error-page__msg">{{ t(messageKey) }}</p>
    <button class="app-btn" @click="router.push({ name: 'dashboard-page' })">
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
