<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TemplateDocType } from '@/interfaces/models'
import { TEMPLATE_DOC_TYPES } from '../constants'
import ModalShell from '@/components/shared/ModalShell.vue'

const emit = defineEmits<{ (e: 'create', payload: { name: string; docType: TemplateDocType }): void; (e: 'close'): void }>()

const docType = ref<TemplateDocType | null>(null)
const name = ref('')

// اقتراح اسم افتراضي حسب النوع المختار
const suggested = computed(() => TEMPLATE_DOC_TYPES.find((t) => t.id === docType.value)?.label ?? '')
const valid = computed(() => !!docType.value && name.value.trim().length > 0)

function pick(id: TemplateDocType) {
  docType.value = id
  if (!name.value.trim()) name.value = `قالب ${suggested.value}`
}

function create() {
  if (!valid.value) return
  emit('create', { name: name.value.trim(), docType: docType.value! })
}
</script>

<template>
  <ModalShell title="قالب جديد" wide @close="emit('close')">
    <span class="lbl">اختر نوع المستند</span>
    <div class="types">
      <button
        v-for="t in TEMPLATE_DOC_TYPES"
        :key="t.id"
        class="type"
        :class="{ 'is-active': docType === t.id }"
        @click="pick(t.id)"
      >
        <span class="type__icon">{{ t.icon }}</span>
        <span class="type__label">{{ t.label }}</span>
        <span class="type__desc">{{ t.desc }}</span>
      </button>
    </div>

    <div class="field">
      <label>اسم القالب</label>
      <input v-model="name" type="text" placeholder="مثال: عرض سعر لمشاريع التقنية" />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="create">إنشاء والانتقال للمحرّر</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.lbl {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-block-end: 10px;
}

.types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-block-end: 18px;
}

.type {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover { border-color: var(--primary); background: var(--primary-soft); }
  &.is-active { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 28px; }
  &__label { font-weight: 700; font-size: 14px; }
  &__desc { font-size: 11.5px; color: var(--text-muted); line-height: 1.6; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    inline-size: 100%;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}
</style>
