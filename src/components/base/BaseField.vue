<script setup lang="ts">
// غلاف حقل: تسمية + تلميح + خطأ حول أي إدخال (slot)
// tag='label' للحقول ذات إدخال واحد (النقر يركّز الإدخال)،
// tag='div' للمحتوى التفاعلي المخصّص (أزرار/مرفقات) تفاديًا لاختطاف النقر.
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    required?: boolean
    tag?: 'label' | 'div'
  }>(),
  { tag: 'label' },
)
</script>

<template>
  <component :is="tag" class="field" :class="{ 'has-error': !!error }">
    <span v-if="label || $slots.label" class="field__label">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="field__req" aria-hidden="true">*</span>
    </span>
    <slot />
    <span v-if="error" class="field__error">{{ error }}</span>
    <span v-else-if="hint" class="field__hint">{{ hint }}</span>
  </component>
</template>

<style lang="scss" scoped>
// مطابق للنمط السائد في النماذج (توحيد بلا تغيير بصري)
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 16px;

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
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
