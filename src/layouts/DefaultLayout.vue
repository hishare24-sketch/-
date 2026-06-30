<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { useTasks } from '@/modules/tasks/composables/useTasks'
import themeConfig from '@themeConfig'

const { t } = useI18n()

const collapsed = ref(false)

const notificationsStore = useNotificationsStore()
const { unreadCount } = storeToRefs(notificationsStore)
const { totalCount: tasksCount } = useTasks()

// عناصر القائمة الجانبية — كل قسم له مساره الخاص (الأقسام غير المبنية تذهب لصفحة "قيد الإنشاء")
// show يعتمد على الصلاحيات (تُترك true حالياً لعدم تفعيل الدخول الإجباري)
const navItems = computed(() => [
  { title: t('nav.dashboard'), icon: '📊', to: { name: 'dashboard-page' }, show: true },
  { title: 'الإجراءات المطلوبة', icon: '✅', to: { name: 'tasks-page' }, show: true, badge: tasksCount.value },
  { title: t('nav.projects'), icon: '🏢', to: { name: 'projects-page' }, show: true },
  { title: t('nav.finance'), icon: '💰', to: { name: 'finance-page' }, show: true },
  { title: 'السجل المالي', icon: '⛃', to: { name: 'ledger-page' }, show: true },
  { title: t('nav.receivables'), icon: '🧾', to: { name: 'receivables-page' }, show: true },
  { title: t('nav.commitments'), icon: '📌', to: { name: 'commitments-page' }, show: true },
  { title: t('nav.assets'), icon: '🚗', to: { name: 'assets-page' }, show: true },
  { title: t('nav.trackings'), icon: '🔔', to: { name: 'trackings-page' }, show: true },
  { title: t('nav.requests'), icon: '📥', to: { name: 'requests-page' }, show: true },
  { title: t('nav.documents'), icon: '📄', to: { name: 'documents-page' }, show: true },
  { title: t('nav.surveys'), icon: '📋', to: { name: 'surveys-page' }, show: true },
  { title: t('nav.notifications'), icon: '🔔', to: { name: 'notifications-page' }, show: true, badge: unreadCount.value },
  { title: 'سجل التدقيق', icon: '🗂️', to: { name: 'audit-page' }, show: true },
  { title: t('nav.settings'), icon: '⚙️', to: { name: 'settings-page' }, show: true },
])
</script>

<template>
  <div class="default-layout" :class="{ 'is-collapsed': collapsed }">
    <!-- الشريط الجانبي -->
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">{{ themeConfig.app.logo }}</span>
        <span v-if="!collapsed" class="sidebar__title">{{ t('app.name') }}</span>
      </div>

      <nav class="sidebar__nav">
        <template v-for="(item, i) in navItems" :key="i">
          <RouterLink v-if="item.show" :to="item.to" class="nav-item">
            <span class="nav-item__icon">{{ item.icon }}</span>
            <span v-if="!collapsed" class="nav-item__title">{{ item.title }}</span>
            <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
          </RouterLink>
        </template>
      </nav>
    </aside>

    <!-- المحتوى -->
    <div class="content-wrapper">
      <header class="navbar">
        <button class="navbar__toggle" @click="collapsed = !collapsed">☰</button>
        <div class="navbar__title">{{ t('app.subtitle') }}</div>
        <div class="navbar__spacer" />
        <RouterLink :to="{ name: 'notifications-page' }" class="navbar__bell" title="الإشعارات">
          🔔
          <span v-if="unreadCount" class="navbar__bell-count">{{ unreadCount }}</span>
        </RouterLink>
        <div class="navbar__user">👤 محمد العمري</div>
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.default-layout {
  display: flex;
  min-block-size: 100vh;
}

.sidebar {
  inline-size: 250px;
  background: var(--surface);
  border-inline-start: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: inline-size 0.2s ease;

  .is-collapsed & {
    inline-size: 72px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 16px;
    border-block-end: 1px solid var(--border);
  }

  &__logo {
    font-size: 24px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
  }

  &__nav {
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--primary-soft);
    color: var(--primary);
  }

  &.router-link-exact-active {
    background: var(--primary);
    color: #fff;
  }

  &__icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  &__badge {
    margin-inline-start: auto;
    font-size: 11px;
    font-weight: 700;
    background: var(--error);
    color: #fff;
    border-radius: 99px;
    padding: 1px 7px;
    min-inline-size: 18px;
    text-align: center;
  }

  &.router-link-exact-active .nav-item__badge {
    background: rgba(255, 255, 255, 0.3);
  }
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  block-size: 60px;
  background: var(--surface);
  border-block-end: 1px solid var(--border);

  &__toggle {
    background: transparent;
    border: none;
    font-size: 20px;
    color: var(--text-muted);
  }

  &__title {
    font-weight: 600;
    color: var(--text);
  }

  &__spacer {
    flex: 1;
  }

  &__bell {
    position: relative;
    font-size: 18px;
    text-decoration: none;
    padding: 4px;

    &-count {
      position: absolute;
      inset-block-start: -2px;
      inset-inline-end: -4px;
      font-size: 10px;
      font-weight: 700;
      background: var(--error);
      color: #fff;
      border-radius: 99px;
      padding: 0 5px;
      min-inline-size: 16px;
      text-align: center;
    }
  }

  &__user {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-muted);
  }
}

.page-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}
</style>
