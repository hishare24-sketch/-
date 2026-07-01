<script setup lang="ts">
import { ref } from 'vue'
import type { ChartView } from './types'

withDefaults(
  defineProps<{
    title: string
    views?: ChartView[]
    modelValue?: string
    collapsible?: boolean
  }>(),
  { collapsible: true },
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const collapsed = ref(false)
</script>

<template>
  <div class="chart-card app-card" :class="{ 'is-collapsed': collapsed }">
    <div class="chart-card__head">
      <span class="chart-card__title">{{ title }}</span>
      <div class="chart-card__tools">
        <!-- مبدّل نوع الشكل -->
        <div v-if="views && views.length > 1" class="switch" role="group" :aria-label="`نوع عرض: ${title}`">
          <button
            v-for="v in views"
            :key="v.id"
            class="switch__btn"
            :class="{ 'is-active': modelValue === v.id }"
            :title="v.label"
            :aria-label="v.label"
            :aria-pressed="modelValue === v.id"
            @click="emit('update:modelValue', v.id)"
          >
            {{ v.icon }}
          </button>
        </div>
        <!-- طيّ -->
        <button
          v-if="collapsible"
          class="collapse"
          :title="collapsed ? 'إظهار' : 'إخفاء'"
          :aria-label="collapsed ? 'إظهار الرسم' : 'إخفاء الرسم'"
          :aria-expanded="!collapsed"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? '▸' : '▾' }}
        </button>
      </div>
    </div>

    <div v-show="!collapsed" class="chart-card__body">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-card {
  padding: 18px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-block-end: 16px;
  }

  &.is-collapsed .chart-card__head { margin-block-end: 0; }

  &__title { font-weight: 600; font-size: 14px; }

  &__tools { display: flex; align-items: center; gap: 8px; }
}

.switch {
  display: flex;
  gap: 2px;
  background: var(--bg);
  border-radius: 8px;
  padding: 2px;

  &__btn {
    inline-size: 28px;
    block-size: 26px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-size: 13px;
    cursor: pointer;

    &.is-active { background: var(--surface); box-shadow: var(--shadow); }
  }
}

.collapse {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}
</style>
