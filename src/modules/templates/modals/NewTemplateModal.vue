<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TemplateDocType } from '@/interfaces/models'
import { TEMPLATE_DOC_TYPES } from '../constants'
import { generateTemplateFromDescription } from '../templatesAI'
import ModalShell from '@/components/shared/ModalShell.vue'

const emit = defineEmits<{
  (e: 'create', payload: { name: string; docType: TemplateDocType }): void
  (e: 'generate', payload: { description: string }): void
  (e: 'close'): void
}>()

const mode = ref<'manual' | 'ai'>('manual')
const docType = ref<TemplateDocType | null>(null)
const name = ref('')

// مولّد بالذكاء (محاكاة)
const aiDesc = ref('')
const aiPreview = computed(() => (aiDesc.value.trim() ? generateTemplateFromDescription(aiDesc.value) : null))
function generate() {
  if (!aiDesc.value.trim()) return
  emit('generate', { description: aiDesc.value.trim() })
}

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
    <div class="switch">
      <button :class="{ 'is-on': mode === 'manual' }" @click="mode = 'manual'">✍️ يدويّاً</button>
      <button :class="{ 'is-on': mode === 'ai' }" @click="mode = 'ai'">✨ بالذكاء</button>
    </div>

    <!-- التوليد بالذكاء (محاكاة) -->
    <div v-if="mode === 'ai'" class="ai">
      <div class="field">
        <label>صف القالب الذي تريده</label>
        <textarea v-model="aiDesc" rows="3" placeholder="مثال: قالب عرض سعر لمشروع تقني يشمل جدول منتجات وإجمالي وضريبة" />
      </div>
      <div v-if="aiPreview" class="ai__preview">
        🤖 سيُنشأ: <b>{{ aiPreview.name }}</b> · {{ aiPreview.sections.length }} قسم
      </div>
      <span class="ai__tag">🧪 محاكاة — يُستبدل بخادم لاحقاً</span>
    </div>

    <!-- يدويّاً -->
    <template v-else>
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
    </template>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button v-if="mode === 'ai'" class="app-btn" :disabled="!aiDesc.trim()" @click="generate">✨ توليد بالذكاء</button>
      <button v-else class="app-btn" :disabled="!valid" @click="create">إنشاء والانتقال للمحرّر</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.switch {
  display: inline-flex;
  gap: 2px;
  background: var(--bg);
  padding: 3px;
  border-radius: 10px;
  margin-block-end: 16px;

  button {
    padding: 7px 16px; border: none; background: transparent; color: var(--text-muted);
    font-family: inherit; font-size: 13px; border-radius: 8px; cursor: pointer;
    &.is-on { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.ai {
  &__preview { margin-block: 10px; padding: 10px 14px; background: var(--purple-bg); color: var(--purple-text); border-radius: var(--radius-sm); font-size: 13px; }
  &__tag { display: inline-block; margin-block-start: 8px; font-size: 11px; color: var(--text-muted); }
}

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

  input,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    inline-size: 100%;
    max-inline-size: 100%;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
  textarea { resize: vertical; }
}
</style>
