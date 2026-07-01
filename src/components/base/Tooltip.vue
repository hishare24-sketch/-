<script setup lang="ts">
// تلميح CSS خفيف — يلتفّ حول أي عنصر (slot) ويعرض نصاً عند المرور/التركيز
defineProps<{ text: string; placement?: 'top' | 'bottom' }>()
</script>

<template>
  <span class="tip" :class="`tip--${placement ?? 'top'}`" tabindex="0">
    <slot />
    <span class="tip__bubble" role="tooltip">{{ text }}</span>
  </span>
</template>

<style lang="scss" scoped>
.tip {
  position: relative;
  display: inline-flex;

  &__bubble {
    position: absolute;
    inset-inline-start: 50%;
    transform: translateX(50%) translateY(4px);
    background: var(--text);
    color: var(--surface);
    font-size: var(--fs-xs);
    font-weight: var(--fw-medium);
    padding: 5px 10px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    box-shadow: var(--elev-2);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--dur-fast) var(--ease), transform var(--dur-fast) var(--ease);
    z-index: var(--z-popover);
  }

  &--top .tip__bubble { inset-block-end: 100%; margin-block-end: 6px; }
  &--bottom .tip__bubble { inset-block-start: 100%; margin-block-start: 6px; }

  &:hover .tip__bubble,
  &:focus-visible .tip__bubble {
    opacity: 1;
    transform: translateX(50%) translateY(0);
  }
}
</style>
