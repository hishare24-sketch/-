<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSeries } from './types'

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: ChartSeries[]
    height?: number
    legend?: boolean
  }>(),
  { height: 150, legend: true },
)

const W = 320
const PAD = { t: 8, r: 4, b: 18, l: 4 }
const innerH = computed(() => props.height - PAD.t - PAD.b)

const max = computed(() => Math.max(...props.series.flatMap((s) => s.values), 1))
const groupCount = computed(() => props.labels.length)
const groupW = computed(() => (W - PAD.l - PAD.r) / Math.max(1, groupCount.value))
const barW = computed(() => {
  const inner = groupW.value * 0.66
  return inner / Math.max(1, props.series.length)
})

function barX(group: number, si: number) {
  const gx = PAD.l + group * groupW.value + groupW.value * 0.17
  return gx + si * barW.value
}
function barH(v: number) {
  return (Math.max(0, v) / max.value) * innerH.value
}
</script>

<template>
  <div class="bars">
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" class="bars__svg" :style="{ blockSize: `${height}px` }">
      <!-- خطوط شبكية -->
      <line v-for="g in 3" :key="g" :x1="PAD.l" :x2="W - PAD.r" :y1="PAD.t + (innerH / 3) * g" :y2="PAD.t + (innerH / 3) * g" stroke="var(--border)" stroke-width="1" opacity="0.4" />
      <!-- الأعمدة -->
      <template v-for="(label, gi) in labels" :key="gi">
        <rect
          v-for="(s, si) in series"
          :key="si"
          :x="barX(gi, si)"
          :y="PAD.t + innerH - barH(s.values[gi] ?? 0)"
          :width="Math.max(2, barW - 1)"
          :height="barH(s.values[gi] ?? 0)"
          :fill="s.color"
          rx="2"
          class="bars__bar"
        >
          <title>{{ s.name }} · {{ label }}: {{ (s.values[gi] ?? 0).toLocaleString('ar-SA') }}</title>
        </rect>
      </template>
    </svg>

    <div class="bars__labels">
      <span v-for="(label, i) in labels" :key="i">{{ label.slice(0, 3) }}</span>
    </div>

    <div v-if="legend" class="bars__legend">
      <span v-for="(s, i) in series" :key="i"><i :style="{ background: s.color }" />{{ s.name }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bars {
  &__svg { inline-size: 100%; }

  &__bar { transition: height 0.4s ease, y 0.4s ease; }

  &__labels {
    display: flex;
    justify-content: space-around;
    margin-block-start: -14px;

    span { font-size: 10px; color: var(--text-muted); }
  }

  &__legend {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-block-start: 10px;

    span { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
    i { inline-size: 10px; block-size: 10px; border-radius: 2px; }
  }
}
</style>
