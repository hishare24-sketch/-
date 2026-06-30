<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  lastPage: number
}>()

const emit = defineEmits<{ (e: 'update:page', value: number): void }>()

const pages = computed(() => Array.from({ length: props.lastPage }, (_, i) => i + 1))

function go(p: number) {
  if (p >= 1 && p <= props.lastPage) emit('update:page', p)
}
</script>

<template>
  <div v-if="lastPage > 1" class="pagination">
    <button class="pagination__btn" :disabled="page <= 1" @click="go(page - 1)">‹</button>
    <button
      v-for="p in pages"
      :key="p"
      class="pagination__btn"
      :class="{ 'is-active': p === page }"
      @click="go(p)"
    >
      {{ p }}
    </button>
    <button class="pagination__btn" :disabled="page >= lastPage" @click="go(page + 1)">›</button>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 16px 0;

  &__btn {
    min-inline-size: 36px;
    block-size: 36px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 14px;

    &:hover:not(:disabled) {
      border-color: var(--primary);
      color: var(--primary);
    }

    &.is-active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}
</style>
