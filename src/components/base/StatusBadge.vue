<script setup lang="ts">
// شارة حالة موحّدة بنغمات دلالية
withDefaults(
  defineProps<{
    label: string
    tone?: 'ok' | 'warn' | 'danger' | 'info' | 'purple' | 'neutral'
    dot?: boolean
  }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span class="badge" :class="`is-${tone}`">
    <span v-if="dot" class="badge__dot" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  white-space: nowrap;

  &__dot {
    inline-size: 6px;
    block-size: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &.is-ok { background: var(--ok-bg); color: var(--ok-text); }
  &.is-warn { background: var(--warn-bg); color: var(--warn-text); }
  &.is-danger { background: var(--danger-bg); color: var(--danger-text); }
  &.is-info { background: var(--info-bg); color: var(--info-text); }
  &.is-purple { background: var(--purple-bg); color: var(--purple-text); }
  &.is-neutral { background: var(--surface-2); color: var(--text-muted); }
}
</style>
