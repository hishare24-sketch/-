<script setup lang="ts">
// غلاف حقل: تسمية + تلميح + خطأ حول أي إدخال (slot)
defineProps<{
  label?: string
  hint?: string
  error?: string
  required?: boolean
}>()
</script>

<template>
  <label class="field" :class="{ 'has-error': !!error }">
    <span v-if="label" class="field__label">
      {{ label }}
      <span v-if="required" class="field__req" aria-hidden="true">*</span>
    </span>
    <slot />
    <span v-if="error" class="field__error">{{ error }}</span>
    <span v-else-if="hint" class="field__hint">{{ hint }}</span>
  </label>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  &__label {
    font-size: var(--fs-sm);
    font-weight: var(--fw-semibold);
    color: var(--text);
  }

  &__req { color: var(--error); }

  &__hint {
    font-size: var(--fs-xs);
    color: var(--text-muted);
  }

  &__error {
    font-size: var(--fs-xs);
    color: var(--danger-text);
    font-weight: var(--fw-medium);
  }
}
</style>
