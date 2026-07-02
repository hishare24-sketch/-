<script setup lang="ts">
// هيكل تحميل وامض — للاستخدام أثناء جلب/تحليل غير فوري
withDefaults(
  defineProps<{
    /** شكل الهيكل */
    variant?: 'line' | 'block' | 'circle'
    /** العرض (CSS) */
    width?: string
    /** الارتفاع (CSS) */
    height?: string
  }>(),
  { variant: 'line', width: '100%' },
)
</script>

<template>
  <span
    class="skeleton"
    :class="`skeleton--${variant}`"
    :style="{ inlineSize: width, blockSize: height }"
    aria-hidden="true"
  />
</template>

<style lang="scss" scoped>
.skeleton {
  display: block;
  background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.4s ease infinite;

  &--line {
    block-size: 12px;
    border-radius: 6px;
  }

  &--block {
    block-size: 80px;
    border-radius: var(--radius-sm);
  }

  &--circle {
    inline-size: 40px;
    block-size: 40px;
    border-radius: 50%;
  }
}

@keyframes skeletonShimmer {
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
</style>
