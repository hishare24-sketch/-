<script setup lang="ts">
import { computed } from 'vue'
import { BaseButton } from '@/components/base'

interface ActionButton {
  label: string
  icon?: string
  show?: boolean
  onClick: () => void
}

const props = withDefaults(
  defineProps<{
    search?: string
    showSearch?: boolean
    buttons?: ActionButton[]
  }>(),
  { search: '', showSearch: true, buttons: () => [] },
)

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'reload'): void
}>()

const visibleButtons = computed(() => props.buttons.filter((b) => b.show !== false))
</script>

<template>
  <div class="page-actions">
    <div v-if="showSearch" class="page-actions__search">
      <span class="page-actions__search-icon">🔍</span>
      <input
        :value="search"
        type="text"
        placeholder="بحث..."
        @input="emit('update:search', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="page-actions__spacer" />

    <BaseButton variant="ghost" title="تحديث" @click="emit('reload')">⟳</BaseButton>

    <BaseButton
      v-for="(btn, i) in visibleButtons"
      :key="i"
      @click="btn.onClick"
    >
      <span v-if="btn.icon">{{ btn.icon }}</span>
      {{ btn.label }}
    </BaseButton>
  </div>
</template>

<style lang="scss" scoped>
.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-block-end: 16px;
  flex-wrap: wrap;

  &__search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    min-inline-size: 220px;

    input {
      border: none;
      background: transparent;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      inline-size: 100%;
      color: var(--text);
    }
  }

  &__search-icon {
    font-size: 13px;
    opacity: 0.6;
  }

  &__spacer {
    flex: 1;
  }
}
</style>
