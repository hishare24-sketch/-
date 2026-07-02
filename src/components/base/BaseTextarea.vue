<script setup lang="ts">
// منطقة نصّ موحّدة (v-model)
withDefaults(
  defineProps<{
    modelValue?: string | null
    placeholder?: string
    rows?: number
    disabled?: boolean
    invalid?: boolean
  }>(),
  { rows: 4 },
)
defineEmits<{ (e: 'update:modelValue', v: string): void }>()
</script>

<template>
  <textarea
    class="base-control"
    :class="{ 'is-invalid': invalid }"
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    :aria-invalid="invalid || undefined"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  ></textarea>
</template>
