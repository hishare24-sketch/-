<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { fmt } from '@/helpers/format'

const { t } = useI18n()

// إثبات عمل البنية التحتية المشتركة: بيانات حيّة من المتاجر (المرحلة 1)
const projectsStore = useProjectsStore()
const notificationsStore = useNotificationsStore()

const stats = computed(() => [
  { label: 'المشاريع', value: String(projectsStore.projects.length), icon: '🏢' },
  { label: 'الأعضاء', value: String(projectsStore.members.length), icon: '👥' },
  { label: 'إجمالي الأرصدة', value: fmt(projectsStore.totalBalance), icon: '💰' },
  { label: 'إشعارات غير مقروءة', value: String(notificationsStore.unreadCount), icon: '🔔' },
])

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
      <p>البنية التحتية المشتركة جاهزة ✅ — بيانات حيّة من المتاجر أدناه.</p>
    </div>

    <div class="home__stats">
      <div v-for="s in stats" :key="s.label" class="stat-card app-card">
        <span class="stat-card__icon">{{ s.icon }}</span>
        <div class="stat-card__body">
          <span class="stat-card__value">{{ s.value }}</span>
          <span class="stat-card__label">{{ s.label }}</span>
        </div>
      </div>
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

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-block-end: 28px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;

  &__icon {
    font-size: 28px;
  }

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 19px;
    font-weight: 700;
    color: var(--primary);
  }

  &__label {
    font-size: 13px;
    color: var(--text-muted);
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
