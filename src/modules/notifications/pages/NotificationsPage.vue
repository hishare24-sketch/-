<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/NotificationsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import type { Notif, Page } from '@/interfaces/models'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const projectsStore = useProjectsStore()
const { notifs } = storeToRefs(notificationsStore)

const filter = ref<'all' | 'unread'>('all')
const filtered = computed(() =>
  notifs.value.filter((n) => (filter.value === 'unread' ? !n.read : true)),
)

const typeMeta: Record<string, { icon: string; color: string; bg: string }> = {
  danger: { icon: '🔴', color: '#dc2626', bg: '#fef2f2' },
  warning: { icon: '🟠', color: '#d97706', bg: '#fffbeb' },
  success: { icon: '🟢', color: '#059669', bg: '#ecfdf5' },
  info: { icon: '🔵', color: '#0891b2', bg: '#ecfeff' },
}
const meta = (t: string) => typeMeta[t] ?? typeMeta.info

// خريطة روابط الإشعار إلى مسارات الموديولات
const LINK_ROUTES: Partial<Record<Page, string>> = {
  trackings: 'trackings-page',
  requests: 'requests-page',
  documents: 'documents-page',
  receivables: 'receivables-page',
  commitments: 'commitments-page',
  assets: 'assets-page',
  finance: 'finance-page',
}

function openNotif(n: Notif) {
  notificationsStore.markRead(n.id)
  if (n.projectId) projectsStore.setActiveProject(n.projectId)
  const route = n.link ? LINK_ROUTES[n.link] : undefined
  if (route) router.push({ name: route })
}
</script>

<template>
  <section class="notifs">
    <header class="notifs__header">
      <div>
        <h1>الإشعارات</h1>
        <p>{{ notificationsStore.unreadCount }} غير مقروء من أصل {{ notifs.length }}</p>
      </div>
      <button class="app-btn app-btn--outlined" @click="notificationsStore.markAllRead()">
        ✓ تعليم الكل كمقروء
      </button>
    </header>

    <div class="tabs">
      <button class="tabs__btn" :class="{ 'is-active': filter === 'all' }" @click="filter = 'all'">الكل</button>
      <button class="tabs__btn" :class="{ 'is-active': filter === 'unread' }" @click="filter = 'unread'">
        غير المقروءة
      </button>
    </div>

    <div class="list">
      <div v-if="!filtered.length" class="empty app-card">✅ لا توجد إشعارات.</div>
      <button
        v-for="n in filtered"
        :key="n.id"
        class="notif app-card"
        :class="{ 'is-unread': !n.read }"
        @click="openNotif(n)"
      >
        <span class="notif__icon" :style="{ background: meta(n.type).bg }">{{ meta(n.type).icon }}</span>
        <div class="notif__body">
          <div class="notif__top">
            <span class="notif__title">{{ n.title }}</span>
            <span class="notif__time">{{ n.time }}</span>
          </div>
          <span class="notif__text">{{ n.body }}</span>
        </div>
        <span v-if="!n.read" class="notif__dot" />
      </button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.notifs {
  max-inline-size: 800px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 20px;
    flex-wrap: wrap;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }
}

.tabs {
  display: inline-flex;
  gap: 4px;
  margin-block-end: 16px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.notif {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  text-align: start;
  font-family: inherit;
  cursor: pointer;
  border-width: 1px;

  &.is-unread {
    border-inline-start: 3px solid var(--primary);
  }

  &__icon {
    inline-size: 36px;
    block-size: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-inline-size: 0;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-block-end: 3px;
  }

  &__title { font-weight: 600; font-size: 14px; }
  &__time { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
  &__text { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

  &__dot {
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background: var(--primary);
    flex-shrink: 0;
    margin-block-start: 6px;
  }
}
</style>
