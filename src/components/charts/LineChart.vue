<script setup lang="ts">
import { computed } from 'vue'
import type { ChartSeries } from './types'

const props = withDefaults(
  defineProps<{
    labels: string[]
    series: ChartSeries[]
    height?: number
    legend?: boolean
    area?: boolean
  }>(),
  { height: 150, legend: true, area: true },
)

const W = 320
const PAD = { t: 10, r: 8, b: 18, l: 8 }
const innerH = computed(() => props.height - PAD.t - PAD.b)
const innerW = W - PAD.l - PAD.r

const allVals = computed(() => props.series.flatMap((s) => s.values))
const max = computed(() => Math.max(...allVals.value, 1))
const min = computed(() => Math.min(...allVals.value, 0))
const range = computed(() => max.value - min.value || 1)

function px(i: number, n: number) {
  return PAD.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
}
function py(v: number) {
  return PAD.t + innerH.value - ((v - min.value) / range.value) * innerH.value
}

const paths = computed(() =>
  props.series.map((s) => {
    const pts = s.values.map((v, i) => `${px(i, s.values.length)},${py(v)}`)
    const line = `M ${pts.join(' L ')}`
    const areaPath = `${line} L ${px(s.values.length - 1, s.values.length)},${PAD.t + innerH.value} L ${px(0, s.values.length)},${PAD.t + innerH.value} Z`
    return { ...s, line, areaPath, points: s.values.map((v, i) => ({ x: px(i, s.values.length), y: py(v) })) }
  }),
)
</script>

<template>
  <div class="line">
    <svg :viewBox="`0 0 ${W} ${height}`" preserveAspectRatio="none" class="line__svg" :style="{ blockSize: `${height}px` }" role="img" :aria-label="'رسم خطي: ' + series.map((s) => s.name).join('، ')">
      <line v-for="g in 3" :key="g" :x1="PAD.l" :x2="W - PAD.r" :y1="PAD.t + (innerH / 3) * g" :y2="PAD.t + (innerH / 3) * g" stroke="var(--border)" stroke-width="1" opacity="0.4" />
      <template v-for="(p, i) in paths" :key="i">
        <path v-if="area" :d="p.areaPath" :fill="p.color" opacity="0.12" />
        <path :d="p.line" fill="none" :stroke="p.color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" class="line__path" />
        <circle v-for="(pt, j) in p.points" :key="j" :cx="pt.x" :cy="pt.y" r="3" :fill="p.color">
          <title>{{ p.name }} · {{ labels[j] }}: {{ (p.values[j] ?? 0).toLocaleString('ar-SA') }}</title>
        </circle>
      </template>
    </svg>

    <div class="line__labels">
      <span v-for="(label, i) in labels" :key="i">{{ label.slice(0, 3) }}</span>
    </div>

    <div v-if="legend" class="line__legend">
      <span v-for="(s, i) in series" :key="i"><i :style="{ background: s.color }" />{{ s.name }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.line {
  &__svg { inline-size: 100%; }
  &__path { transition: d 0.4s ease; }

  &__labels {
    display: flex;
    justify-content: space-between;
    padding-inline: 4px;
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
