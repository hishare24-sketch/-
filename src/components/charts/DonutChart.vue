<script setup lang="ts">
import { computed } from 'vue'
import type { DonutSegment } from './types'

const props = withDefaults(
  defineProps<{
    data: DonutSegment[]
    size?: number
    thickness?: number
    centerLabel?: string
    centerValue?: string
    legend?: boolean
  }>(),
  { size: 150, thickness: 22, legend: true },
)

const radius = computed(() => (props.size - props.thickness) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const total = computed(() => props.data.reduce((s, d) => s + Math.max(0, d.value), 0))

// تحويل كل قطعة إلى dash مع إزاحة تراكمية
const arcs = computed(() => {
  let acc = 0
  return props.data
    .filter((d) => d.value > 0)
    .map((d) => {
      const frac = total.value ? d.value / total.value : 0
      const len = frac * circumference.value
      const arc = { ...d, len, gap: circumference.value - len, offset: -acc, frac }
      acc += len
      return arc
    })
})
</script>

<template>
  <div class="donut" :class="{ 'donut--with-legend': legend }">
    <svg :viewBox="`0 0 ${size} ${size}`" class="donut__svg" :style="{ maxInlineSize: `${size}px` }" role="img" :aria-label="'رسم دائري: ' + data.map((d) => d.label).join('، ')">
      <g :transform="`rotate(-90 ${size / 2} ${size / 2})`">
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="'var(--border)'"
          :stroke-width="thickness"
          opacity="0.35"
        />
        <circle
          v-for="(a, i) in arcs"
          :key="i"
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          fill="none"
          :stroke="a.color"
          :stroke-width="thickness"
          :stroke-dasharray="`${a.len} ${a.gap}`"
          :stroke-dashoffset="a.offset"
          stroke-linecap="butt"
          class="donut__arc"
        >
          <title>{{ a.label }}: {{ Math.round(a.frac * 100) }}%</title>
        </circle>
      </g>
      <text v-if="centerValue" :x="size / 2" :y="size / 2 - 2" text-anchor="middle" class="donut__cval">{{ centerValue }}</text>
      <text v-if="centerLabel" :x="size / 2" :y="size / 2 + 16" text-anchor="middle" class="donut__clabel">{{ centerLabel }}</text>
    </svg>

    <div v-if="legend" class="donut__legend">
      <div v-for="(d, i) in data" :key="i" class="leg">
        <span class="leg__dot" :style="{ background: d.color }" />
        <span class="leg__label">{{ d.label }}</span>
        <span class="leg__pct">{{ total ? Math.round((d.value / total) * 100) : 0 }}%</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.donut {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  &__svg { inline-size: 100%; block-size: auto; }

  &__arc {
    transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease;
  }

  &__cval { font-size: 18px; font-weight: 800; fill: var(--text); }
  &__clabel { font-size: 11px; fill: var(--text-muted); }

  &__legend {
    flex: 1;
    min-inline-size: 130px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

.leg {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;

  &__dot { inline-size: 10px; block-size: 10px; border-radius: 3px; flex-shrink: 0; }
  &__label { flex: 1; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  &__pct { font-weight: 700; }
}

@media (max-width: 520px) {
  .donut {
    flex-direction: column;
    gap: 14px;

    &__svg { max-inline-size: 130px !important; }
  }
}
</style>
