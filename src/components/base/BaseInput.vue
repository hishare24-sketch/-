<script setup lang="ts">
// إدخال نصّي موحّد (v-model)
withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
  }>(),
  { type: 'text' },
)
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <input
    class="base-control"
    :class="{ 'is-invalid': invalid }"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
