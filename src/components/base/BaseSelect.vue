<script setup lang="ts">
// قائمة اختيار موحّدة (v-model) — عبر options أو slot لعناصر <option>
withDefaults(
  defineProps<{
    modelValue?: string | number
    options?: { value: string | number; label: string }[]
    disabled?: boolean
    invalid?: boolean
  }>(),
  { options: () => [] },
)
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <select
    class="base-control"
    :class="{ 'is-invalid': invalid }"
    :value="modelValue"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <slot>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </slot>
  </select>
</template>
