<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ values: number[]; color?: string; width?: number; height?: number }>(),
  { color: 'var(--primary)', width: 80, height: 28 },
)

const max = computed(() => Math.max(...props.values, 1))
const min = computed(() => Math.min(...props.values, 0))
const range = computed(() => max.value - min.value || 1)

const path = computed(() => {
  const n = props.values.length
  if (!n) return ''
  const pts = props.values.map((v, i) => {
    const x = n <= 1 ? props.width / 2 : (i / (n - 1)) * props.width
    const y = props.height - ((v - min.value) / range.value) * (props.height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${pts.join(' L ')}`
})
const areaPath = computed(() => (path.value ? `${path.value} L ${props.width},${props.height} L 0,${props.height} Z` : ''))
</script>

<template>
  <svg :viewBox="`0 0 ${width} ${height}`" :style="{ inlineSize: `${width}px`, blockSize: `${height}px` }" class="spark">
    <path :d="areaPath" :fill="color" opacity="0.12" />
    <path :d="path" fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.spark { display: block; }
</style>
