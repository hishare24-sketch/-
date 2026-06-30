<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue: boolean; disabled?: boolean }>(),
  { disabled: false },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="toggle"
    :class="{ 'is-on': modelValue, 'is-disabled': disabled }"
    type="button"
    @click="toggle"
  >
    <span class="toggle__knob" />
  </button>
</template>

<style lang="scss" scoped>
.toggle {
  inline-size: 42px;
  block-size: 24px;
  border-radius: 999px;
  border: none;
  background: #cbd5e1;
  position: relative;
  transition: background 0.15s ease;

  &.is-on {
    background: var(--success);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__knob {
    position: absolute;
    inset-block-start: 3px;
    inset-inline-end: 3px;
    inline-size: 18px;
    block-size: 18px;
    border-radius: 50%;
    background: #fff;
    transition: inset-inline-end 0.15s ease;
  }

  &.is-on .toggle__knob {
    inset-inline-end: 21px;
  }
}
</style>
