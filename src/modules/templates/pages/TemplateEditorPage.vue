<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplatesStore } from '@/stores/TemplatesStore'
import { useToast } from '@/composables/useToast'
import { docTypeMeta, sectionKindMeta, elementTypeMeta } from '../constants'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const toast = useToast()

const template = computed(() => templatesStore.templateById(route.params.id as string))
const name = ref(template.value?.name ?? '')

// المرحلة 1: تعديل الاسم متاح؛ المحرّر البنائي الكامل في المرحلة 2
function saveName() {
  if (!template.value || !name.value.trim()) return
  templatesStore.updateTemplate(template.value.id, { name: name.value.trim() })
  toast.success('حُفظ اسم القالب')
}
</script>

<template>
  <section class="editor">
    <button class="back" @click="router.push({ name: 'templates-page' })">‹ رجوع للقوالب</button>

    <div v-if="!template" class="app-card missing">القالب غير موجود.</div>

    <template v-else>
      <header class="editor__head app-card">
        <div class="editor__title">
          <span class="editor__type">{{ docTypeMeta(template.docType)?.icon }} {{ docTypeMeta(template.docType)?.label }}</span>
          <div class="editor__name">
            <input v-model="name" type="text" @keyup.enter="saveName" />
            <button class="app-btn" @click="saveName">حفظ الاسم</button>
          </div>
        </div>
      </header>

      <div class="note app-card">
        🚧 المحرّر البنائي (إضافة/حذف/ترتيب العناصر + لوحة الخصائص + المعاينة الحية) قيد الإنشاء — <b>المرحلة 2</b>.
        فيما يلي هيكل القالب الحاليّ.
      </div>

      <div class="sections">
        <div v-for="sec in template.sections" :key="sec.id" class="sec app-card">
          <div class="sec__head">
            <span class="sec__title">{{ sec.title }}</span>
            <span class="sec__kind">
              {{ sectionKindMeta(sec.kind)?.label }}<template v-if="sec.repeatable"> · مكرّر</template>
            </span>
          </div>
          <div class="sec__els">
            <span v-for="el in sec.elements" :key="el.id" class="el">
              <span class="el__icon">{{ elementTypeMeta(el.type)?.icon }}</span>
              {{ el.label }}
              <span v-if="el.required" class="el__req">*</span>
            </span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style lang="scss" scoped>
.editor { max-inline-size: 900px; }

.back {
  background: none;
  border: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  margin-block-end: 14px;
}

.missing { padding: 30px; text-align: center; color: var(--text-muted); }

.editor__head { padding: 18px; margin-block-end: 14px; }
.editor__type { font-size: 12px; color: var(--text-muted); }
.editor__name {
  display: flex;
  gap: 8px;
  margin-block-start: 8px;

  input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.note {
  padding: 14px 18px;
  margin-block-end: 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
  background: var(--warn-bg);
  border-color: transparent;
}

.sections { display: flex; flex-direction: column; gap: 12px; }

.sec {
  padding: 14px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 10px;
  }
  &__title { font-weight: 700; font-size: 14px; }
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
}
</style>
