<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import FormsLayout from '@/layouts/FormsLayout.vue'

const route = useRoute()

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
  <component :is="layout">
    <RouterView />
  </component>
</template>
