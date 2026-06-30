<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: { month: string; income: number; expense: number }[]
}>()

const maxVal = computed(() =>
  Math.max(...props.data.map((d) => Math.max(d.income, d.expense)), 1),
)
</script>

<template>
  <div class="chart app-card">
    <div class="chart__head">
      <span class="chart__title">الإيرادات والمصروفات</span>
      <div class="chart__legend">
        <span><i class="dot dot--income" />إيرادات</span>
        <span><i class="dot dot--expense" />مصروفات</span>
      </div>
    </div>

    <div class="chart__bars">
      <div v-for="(d, i) in data" :key="i" class="chart__col">
        <div class="chart__pair">
          <div
            class="chart__bar chart__bar--income"
            :style="{ height: `${(d.income / maxVal) * 100}%` }"
            :title="`إيرادات: ${d.income.toLocaleString('ar-SA')}`"
          />
          <div
            class="chart__bar chart__bar--expense"
            :style="{ height: `${(d.expense / maxVal) * 100}%` }"
            :title="`مصروفات: ${d.expense.toLocaleString('ar-SA')}`"
          />
        </div>
        <span class="chart__label">{{ d.month.slice(0, 3) }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart {
  padding: 20px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 18px;
  }

  &__title {
    font-weight: 600;
    font-size: 15px;
  }

  &__legend {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--text-muted);

    span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  &__bars {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    block-size: 150px;
  }

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    block-size: 100%;
    justify-content: flex-end;
  }

  &__pair {
    inline-size: 100%;
    display: flex;
    gap: 3px;
    align-items: flex-end;
    block-size: 120px;
  }

  &__bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    min-block-size: 4px;

    &--income {
      background: #3b82f6;
    }

    &--expense {
      background: #f87171;
    }
  }

  &__label {
    font-size: 10px;
    color: var(--text-muted);
  }
}

.dot {
  inline-size: 10px;
  block-size: 10px;
  border-radius: 2px;
  display: inline-block;

  &--income {
    background: #3b82f6;
  }

  &--expense {
    background: #f87171;
  }
}
</style>
