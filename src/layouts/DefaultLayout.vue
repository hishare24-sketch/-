<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { useTasks } from '@/modules/tasks/composables/useTasks'
import themeConfig from '@themeConfig'

const { t } = useI18n()
const router = useRouter()

// تبديل الوضع الفاتح/الداكن
const settingsStore = useSettingsStore()
const { themeMode } = storeToRefs(settingsStore)

// رجوع للشاشة السابقة (عام لكل الشاشات)
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'dashboard-page' })
}

const collapsed = ref(false)
const mobileOpen = ref(false)

// على الجوال: فتح/إغلاق الدرج · على سطح المكتب: طيّ الشريط
function toggleNav() {
  if (window.innerWidth <= 768) mobileOpen.value = !mobileOpen.value
  else collapsed.value = !collapsed.value
}

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
  { title: 'سجل العمليات', icon: '🗂️', to: { name: 'audit-page' }, show: true },
  { title: t('nav.settings'), icon: '⚙️', to: { name: 'settings-page' }, show: true },
])
</script>

<template>
  <div class="default-layout" :class="{ 'is-collapsed': collapsed, 'is-mobile-open': mobileOpen }">
    <!-- خلفية معتمة للجوال -->
    <div v-if="mobileOpen" class="backdrop" @click="mobileOpen = false" />

    <!-- الشريط الجانبي -->
    <aside class="sidebar">
      <div class="sidebar__brand">
        <span class="sidebar__logo">{{ themeConfig.app.logo }}</span>
        <span class="sidebar__title">{{ t('app.name') }}</span>
      </div>

      <nav class="sidebar__nav">
        <template v-for="(item, i) in navItems" :key="i">
          <RouterLink v-if="item.show" :to="item.to" class="nav-item" @click="mobileOpen = false">
            <span class="nav-item__icon">{{ item.icon }}</span>
            <span class="nav-item__title">{{ item.title }}</span>
            <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
          </RouterLink>
        </template>
      </nav>
    </aside>

    <!-- المحتوى -->
    <div class="content-wrapper">
      <header class="navbar">
        <button class="navbar__toggle" @click="toggleNav">☰</button>
        <button class="navbar__back" title="رجوع للخلف" @click="goBack">
          <span class="navbar__back-arrow">›</span>
          <span class="navbar__back-text">رجوع</span>
        </button>
        <div class="navbar__title">{{ t('app.subtitle') }}</div>
        <div class="navbar__spacer" />
        <button
          class="navbar__theme"
          :title="themeMode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'"
          @click="settingsStore.toggleThemeMode()"
        >
          {{ themeMode === 'dark' ? '☀️' : '🌙' }}
        </button>
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
  transition: inline-size 0.2s ease, transform 0.25s ease;

  .is-collapsed & {
    inline-size: 72px;
  }

  // إخفاء النصوص عند الطيّ (سطح المكتب)
  .is-collapsed & &__title,
  .is-collapsed & .nav-item__title {
    display: none;
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

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 6px 12px;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    &-arrow {
      font-size: 16px;
      line-height: 1;
    }
  }

  &__title {
    font-weight: 600;
    color: var(--text);
  }

  &__spacer {
    flex: 1;
  }

  &__theme {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 36px;
    block-size: 36px;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg);
    font-size: 16px;
    line-height: 1;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
      border-color: var(--primary);
      background: var(--primary-soft);
    }
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

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  z-index: 90;
}

// ── الجوال: الشريط الجانبي يصبح درجاً منزلقاً ──
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0; // في RTL = الحافة اليمنى
    z-index: 100;
    inline-size: 250px !important;
    transform: translateX(100%); // يدفعه خارج الشاشة لليمين
    box-shadow: var(--shadow-lg);
  }

  .is-mobile-open .sidebar {
    transform: translateX(0);
  }

  // إظهار النصوص دائماً في الدرج (تجاهل وضع الطيّ على الجوال)
  .is-collapsed .sidebar .nav-item__title,
  .is-collapsed .sidebar .sidebar__title {
    display: inline;
  }

  .page-content {
    padding: 16px;
  }

  .navbar {
    padding: 0 14px;
  }

  .navbar__user,
  .navbar__back-text {
    display: none;
  }
}
</style>
