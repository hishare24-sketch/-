<script setup lang="ts">
import { computed } from 'vue'
import type { TemplateElementType } from '@/interfaces/models'
import { TEMPLATE_ELEMENT_TYPES, type ElementCategory } from '../constants'
import ModalShell from '@/components/shared/ModalShell.vue'

const emit = defineEmits<{ (e: 'pick', type: TemplateElementType): void; (e: 'close'): void }>()

const CATEGORIES: { id: ElementCategory; label: string }[] = [
  { id: 'text', label: 'عناصر نصية' },
  { id: 'structure', label: 'عناصر هيكلية' },
  { id: 'numeric', label: 'عناصر رقمية' },
  { id: 'visual', label: 'عناصر بصرية' },
  { id: 'choice', label: 'عناصر اختيارية' },
  { id: 'group', label: 'مجموعات' },
]

const grouped = computed(() =>
  CATEGORIES.map((c) => ({
    ...c,
    items: TEMPLATE_ELEMENT_TYPES.filter((e) => e.category === c.id),
  })).filter((c) => c.items.length),
)
</script>

<template>
  <ModalShell title="إضافة عنصر" wide @close="emit('close')">
    <div v-for="cat in grouped" :key="cat.id" class="cat">
      <span class="cat__label">{{ cat.label }}</span>
      <div class="cat__grid">
        <button v-for="el in cat.items" :key="el.id" class="el" @click="emit('pick', el.id)">
          <span class="el__icon">{{ el.icon }}</span>
          <span class="el__label">{{ el.label }}</span>
        </button>
      </div>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.cat {
  margin-block-end: 16px;

  &__label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-block-end: 8px; }
  &__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
}

.el {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;
  font-family: inherit;
  text-align: start;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 18px; inline-size: 22px; text-align: center; }
  &__label { font-size: 13px; font-weight: 600; }
}
</style>
