<script setup lang="ts">
// زر موحّد يعتمد على رموز التصميم — يستبدل الاستخدام المبعثر لـ .app-btn
withDefaults(
  defineProps<{
    variant?: 'primary' | 'outlined' | 'ghost' | 'danger' | 'success'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)
</script>

<template>
  <button
    class="app-btn base-btn"
    :class="[
      variant !== 'primary' && `app-btn--${variant}`,
      size !== 'md' && `app-btn--${size}`,
      block && 'app-btn--block',
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span v-if="loading" class="base-btn__spinner" aria-hidden="true" />
    <slot v-else name="icon" />
    <slot />
  </button>
</template>

<style lang="scss" scoped>
.base-btn__spinner {
  inline-size: 14px;
  block-size: 14px;
  border: 2px solid currentColor;
  border-block-start-color: transparent;
  border-radius: 50%;
  animation: btnSpin 0.6s linear infinite;
}

@keyframes btnSpin {
  to { transform: rotate(360deg); }
}
</style>
