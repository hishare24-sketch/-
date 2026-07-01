<script setup lang="ts">
// حالة فراغ موحّدة: أيقونة + عنوان + رسالة + إجراء اختياري (slot)
defineProps<{
  icon?: string
  title?: string
  message?: string
}>()
</script>

<template>
  <div class="empty">
    <span v-if="icon" class="empty__icon" aria-hidden="true">{{ icon }}</span>
    <span v-if="title" class="empty__title">{{ title }}</span>
    <span v-if="message" class="empty__msg">{{ message }}</span>
    <div v-if="$slots.action" class="empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-5);
  text-align: center;

  &__icon { font-size: 34px; opacity: 0.85; }
  &__title { font-size: var(--fs-lg); font-weight: var(--fw-semibold); color: var(--text); }
  &__msg { font-size: var(--fs-sm); color: var(--text-muted); max-inline-size: 320px; line-height: var(--lh-normal); }
  &__action { margin-block-start: var(--space-3); }
}
</style>
