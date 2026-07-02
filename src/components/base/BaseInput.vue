<script setup lang="ts">
// إدخال نصّي موحّد (v-model) — يدعم مُعدّلات .number / .trim
const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    type?: string
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    modelModifiers?: { number?: boolean; trim?: boolean }
  }>(),
  { type: 'text', modelModifiers: () => ({}) },
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string | number): void }>()

function onInput(e: Event) {
  let v: string | number = (e.target as HTMLInputElement).value
  if (props.modelModifiers.trim && typeof v === 'string') v = v.trim()
  if (props.modelModifiers.number) {
    const n = Number(v)
    v = v === '' || Number.isNaN(n) ? v : n
  }
  emit('update:modelValue', v)
}
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
    @input="onInput"
  />
</template>
