<script setup lang="ts">
import type { DocTemplate } from '@/interfaces/models'
import { docTypeMeta, sectionKindMeta, elementTypeMeta } from '../constants'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ template: DocTemplate }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const meta = docTypeMeta(props.template.docType)
</script>

<template>
  <ModalShell :title="`معاينة: ${template.name}`" wide @close="emit('close')">
    <div class="head">
      <span class="head__type">{{ meta?.icon }} {{ meta?.label }}</span>
      <span class="head__count">{{ template.sections.length }} قسم</span>
    </div>

    <div class="sections">
      <div v-for="sec in template.sections" :key="sec.id" class="sec">
        <div class="sec__head">
          <span class="sec__title">{{ sec.title }}</span>
          <span class="sec__kind">
            {{ sectionKindMeta(sec.kind)?.label }}<template v-if="sec.repeatable"> · مكرّر</template>
          </span>
        </div>
        <div class="sec__els">
          <span v-for="el in sec.elements" :key="el.id" class="el" :class="{ 'is-hidden': el.hidden }">
            <span class="el__icon">{{ elementTypeMeta(el.type)?.icon }}</span>
            {{ el.label }}
            <span v-if="el.required" class="el__req">*</span>
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="app-btn" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 16px;

  &__type { font-weight: 700; font-size: 15px; }
  &__count { font-size: 12px; color: var(--text-muted); }
}

.sections { display: flex; flex-direction: column; gap: 12px; }

.sec {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  background: var(--surface);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 10px;
  }
  &__title { font-weight: 700; font-size: 13.5px; }
  &__kind { font-size: 11px; color: var(--text-muted); background: var(--surface-2); padding: 2px 10px; border-radius: 20px; }
  &__els { display: flex; flex-wrap: wrap; gap: 6px; }
}

.el {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 10px;

  &__icon { font-size: 13px; }
  &__req { color: var(--danger-text); font-weight: 700; }
  &.is-hidden { opacity: 0.45; text-decoration: line-through; }
}
</style>
