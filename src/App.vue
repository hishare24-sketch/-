<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/stores/SettingsStore'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import FormsLayout from '@/layouts/FormsLayout.vue'
import ToastHost from '@/components/base/ToastHost.vue'
import CommandPalette from '@/components/base/CommandPalette.vue'
import ErrorBoundary from '@/components/shared/ErrorBoundary.vue'
import RouteProgress from '@/components/shared/RouteProgress.vue'

const route = useRoute()
const settingsStore = useSettingsStore()

// تطبيق الثيم وهوية المستندات (المحفوظة) عند بدء التطبيق
onMounted(() => {
  settingsStore.applyTheme()
  settingsStore.applyBranding()
  settingsStore.applyDensity()
})

const layout = computed(() => {
  switch (route.meta.layout) {
    case 'blank':
      return BlankLayout
    case 'forms':
      return FormsLayout
    default:
      return DefaultLayout
  }
})
</script>

<template>
  <RouteProgress />
  <component :is="layout">
    <ErrorBoundary>
      <RouterView />
    </ErrorBoundary>
  </component>
  <ToastHost />
  <CommandPalette />
</template>
