<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { useAuthStore } from '@/stores/AuthStore'
import { useCan } from '@/composables/useCan'
import { useTasks } from '@/modules/tasks/composables/useTasks'
import themeConfig from '@themeConfig'

const { t } = useI18n()
const router = useRouter()

// تبديل الوضع الفاتح/الداكن
const settingsStore = useSettingsStore()
const { themeMode } = storeToRefs(settingsStore)

// المصادقة والصلاحيات
const authStore = useAuthStore()
const { can } = useCan()
const { currentUser, roleLabel } = storeToRefs(authStore)
const userMenuOpen = ref(false)

function logout() {
  userMenuOpen.value = false
  authStore.logout()
  router.replace({ name: 'login-page' })
}

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
// عناصر الشريط السفلي (جوال): 4 وجهات أساسية + «المزيد» يفتح الدرج
const bottomNavItems = computed(() =>
  [
    { title: 'الرئيسية', icon: '📊', to: { name: 'dashboard-page' }, show: true },
    { title: 'المشاريع', icon: '🏢', to: { name: 'projects-page' }, show: true },
    { title: 'المالية', icon: '💰', to: { name: 'finance-page' }, show: can('finance_view') },
    { title: 'المهام', icon: '✅', to: { name: 'tasks-page' }, show: true, badge: tasksCount.value },
  ].filter((i) => i.show),
)

const navItems = computed(() => [
  { title: t('nav.dashboard'), icon: '📊', to: { name: 'dashboard-page' }, show: true },
  { title: 'الإجراءات المطلوبة', icon: '✅', to: { name: 'tasks-page' }, show: true, badge: tasksCount.value },
  { title: t('nav.projects'), icon: '🏢', to: { name: 'projects-page' }, show: true },
  { title: t('nav.finance'), icon: '💰', to: { name: 'finance-page' }, show: can('finance_view') },
  { title: 'السجل المالي', icon: '⛃', to: { name: 'ledger-page' }, show: can('finance_view') },
  { title: t('nav.receivables'), icon: '🧾', to: { name: 'receivables-page' }, show: can('finance_view') },
  { title: t('nav.commitments'), icon: '📌', to: { name: 'commitments-page' }, show: can('finance_view') },
  { title: t('nav.assets'), icon: '🚗', to: { name: 'assets-page' }, show: true },
  { title: t('nav.trackings'), icon: '🔔', to: { name: 'trackings-page' }, show: true },
  { title: t('nav.requests'), icon: '📥', to: { name: 'requests-page' }, show: true },
  { title: t('nav.documents'), icon: '📄', to: { name: 'documents-page' }, show: true },
  { title: 'مولّد القوالب', icon: '🧩', to: { name: 'templates-page' }, show: can('docs_manage') },
  { title: t('nav.surveys'), icon: '📋', to: { name: 'surveys-page' }, show: true },
  { title: t('nav.notifications'), icon: '🔔', to: { name: 'notifications-page' }, show: true, badge: unreadCount.value },
  { title: 'سجل العمليات', icon: '🗂️', to: { name: 'audit-page' }, show: can('audit_view') },
  { title: t('nav.settings'), icon: '⚙️', to: { name: 'settings-page' }, show: can('project_edit') },
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
        <button class="navbar__toggle" aria-label="القائمة" @click="toggleNav">☰</button>
        <button class="navbar__back" title="رجوع للخلف" aria-label="رجوع للخلف" @click="goBack">
          <span class="navbar__back-arrow" aria-hidden="true">›</span>
          <span class="navbar__back-text">رجوع</span>
        </button>
        <div class="navbar__title">{{ t('app.subtitle') }}</div>
        <div class="navbar__spacer" />
        <button
          class="navbar__theme"
          :title="themeMode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'"
          :aria-label="themeMode === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'"
          @click="settingsStore.toggleThemeMode()"
        >
          {{ themeMode === 'dark' ? '☀️' : '🌙' }}
        </button>
        <RouterLink
          :to="{ name: 'notifications-page' }"
          class="navbar__bell"
          title="الإشعارات"
          :aria-label="unreadCount ? `الإشعارات، ${unreadCount} غير مقروء` : 'الإشعارات'"
        >
          <span aria-hidden="true">🔔</span>
          <span v-if="unreadCount" class="navbar__bell-count">{{ unreadCount }}</span>
        </RouterLink>
        <div class="navbar__user-wrap">
          <button
            class="navbar__user"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            @click="userMenuOpen = !userMenuOpen"
          >
            <span class="navbar__user-avatar" aria-hidden="true">👤</span>
            <span class="navbar__user-info">
              <span class="navbar__user-name">{{ currentUser?.name }}</span>
              <span class="navbar__user-role">{{ roleLabel }}</span>
            </span>
            <span class="navbar__user-caret" aria-hidden="true">▾</span>
          </button>

          <div v-if="userMenuOpen" class="user-menu">
            <div class="user-menu__backdrop" @click="userMenuOpen = false" />
            <div class="user-menu__panel" role="menu">
              <div class="user-menu__head">
                <strong>{{ currentUser?.name }}</strong>
                <small>{{ currentUser?.email }}</small>
                <span class="user-menu__role">{{ roleLabel }}</span>
              </div>
              <button class="user-menu__item" role="menuitem" @click="logout">
                <span aria-hidden="true">🚪</span> {{ t('auth.logout') }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="page-content">
        <slot />
      </main>

      <!-- شريط تنقّل سفلي (جوال فقط) -->
      <nav class="bottom-nav" aria-label="التنقّل السريع">
        <RouterLink
          v-for="(item, i) in bottomNavItems"
          :key="i"
          :to="item.to"
          class="bottom-nav__item"
        >
          <span class="bottom-nav__icon" aria-hidden="true">
            {{ item.icon }}
            <span v-if="item.badge" class="bottom-nav__badge">{{ item.badge }}</span>
          </span>
          <span class="bottom-nav__label">{{ item.title }}</span>
        </RouterLink>
        <button class="bottom-nav__item" aria-label="كل الأقسام" @click="mobileOpen = true">
          <span class="bottom-nav__icon" aria-hidden="true">☰</span>
          <span class="bottom-nav__label">المزيد</span>
        </button>
      </nav>
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
  position: sticky;
  inset-block-start: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 20px;
  block-size: 60px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: saturate(1.4) blur(10px);
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

  &__user-wrap {
    position: relative;
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
    font-family: inherit;

    &:hover {
      border-color: var(--primary);
    }
  }

  &__user-avatar {
    font-size: 16px;
    line-height: 1;
  }

  &__user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.25;
  }

  &__user-name {
    font-weight: 600;
    font-size: 13px;
    color: var(--text);
  }

  &__user-role {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__user-caret {
    font-size: 10px;
    color: var(--text-muted);
  }
}

.user-menu {
  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 110;
  }

  &__panel {
    position: absolute;
    inset-block-start: calc(100% + 8px);
    inset-inline-end: 0;
    z-index: 120;
    min-inline-size: 220px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
  }

  &__head {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px;
    border-block-end: 1px solid var(--border);

    strong {
      font-size: 14px;
      color: var(--text);
    }

    small {
      font-size: 12px;
      color: var(--text-muted);
    }
  }

  &__role {
    align-self: flex-start;
    margin-block-start: 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--primary);
    background: var(--primary-soft);
    padding: 2px 8px;
    border-radius: 99px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    inline-size: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    font-family: inherit;
    font-size: 14px;
    color: var(--danger-text);
    cursor: pointer;
    text-align: start;

    &:hover {
      background: var(--danger-bg);
    }
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

// ── الشريط السفلي: مخفيّ على سطح المكتب ──
.bottom-nav {
  display: none;
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
    // متّسع أسفل للشريط السفلي الثابت
    padding: 16px 16px calc(76px + env(safe-area-inset-bottom, 0px));
  }

  .navbar {
    padding: 0 14px;
  }

  // ── الشريط السفلي (جوال) ──
  .bottom-nav {
    display: flex;
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: 95;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: saturate(1.4) blur(10px);
    border-block-start: 1px solid var(--border);
    padding-block-end: env(safe-area-inset-bottom, 0px);
  }

  .bottom-nav__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 8px 4px 7px;
    background: transparent;
    border: none;
    font-family: inherit;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 11px;
    min-block-size: 54px;

    &.router-link-active {
      color: var(--primary);
      font-weight: 600;
    }
  }

  .bottom-nav__icon {
    position: relative;
    font-size: 20px;
    line-height: 1;
  }

  .bottom-nav__badge {
    position: absolute;
    inset-block-start: -4px;
    inset-inline-end: -10px;
    font-size: 9px;
    font-weight: 700;
    background: var(--error);
    color: #fff;
    border-radius: 99px;
    padding: 1px 5px;
    min-inline-size: 15px;
    text-align: center;
  }

  .bottom-nav__label {
    line-height: 1;
  }

  .navbar__user-info,
  .navbar__user-caret,
  .navbar__back-text {
    display: none;
  }

  .navbar__user {
    padding: 6px 8px;
  }
}
</style>
