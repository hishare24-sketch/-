<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// شاشات سيتم بناؤها كموديولات في المراحل القادمة
const modules = [
  { name: 'dashboard', label: t('nav.dashboard'), icon: '📊', phase: 2 },
  { name: 'projects', label: t('nav.projects'), icon: '🏢', phase: 3 },
  { name: 'finance', label: t('nav.finance'), icon: '💰', phase: 4 },
  { name: 'receivables', label: t('nav.receivables'), icon: '🧾', phase: 5 },
  { name: 'commitments', label: t('nav.commitments'), icon: '📌', phase: 5 },
  { name: 'assets', label: t('nav.assets'), icon: '🚗', phase: 6 },
  { name: 'trackings', label: t('nav.trackings'), icon: '🔔', phase: 6 },
  { name: 'requests', label: t('nav.requests'), icon: '📥', phase: 7 },
  { name: 'documents', label: t('nav.documents'), icon: '📄', phase: 7 },
  { name: 'surveys', label: t('nav.surveys'), icon: '📋', phase: 7 },
  { name: 'settings', label: t('nav.settings'), icon: '⚙️', phase: 9 },
]
</script>

<template>
  <section class="home">
    <div class="home__header">
      <h1>{{ t('app.name') }} — {{ t('app.subtitle') }}</h1>
      <p>تم تأسيس هيكل Vue 3 بنجاح ✅ — الموديولات التالية ستُبنى تباعاً.</p>
    </div>

    <div class="home__grid">
      <div v-for="m in modules" :key="m.name" class="module-card app-card">
        <span class="module-card__icon">{{ m.icon }}</span>
        <span class="module-card__label">{{ m.label }}</span>
        <span class="module-card__phase">المرحلة {{ m.phase }}</span>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.home {
  &__header {
    margin-block-end: 24px;

    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-block-end: 6px;
    }

    p {
      color: var(--text-muted);
      font-size: 14px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &__icon {
    font-size: 32px;
  }

  &__label {
    font-weight: 600;
    font-size: 15px;
  }

  &__phase {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--primary-soft);
    color: var(--primary);
    padding: 2px 10px;
    border-radius: 20px;
  }
}
</style>
