<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTemplatesStore } from '@/stores/TemplatesStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { useToast } from '@/composables/useToast'
import { uid } from '@/helpers/id'
import type { DocTemplate, TemplateElementType, TemplateSectionKind } from '@/interfaces/models'
import {
  docTypeMeta,
  sectionKindMeta,
  elementTypeMeta,
  makeElement,
  makeSection,
  TEMPLATE_SECTION_KINDS,
  TEMPLATE_ELEMENT_TYPES,
} from '../constants'
import ElementPickerModal from '../modals/ElementPickerModal.vue'
import ElementProperties from '../components/ElementProperties.vue'

const route = useRoute()
const router = useRouter()
const templatesStore = useTemplatesStore()
const settingsStore = useSettingsStore()
const toast = useToast()

const original = templatesStore.templateById(route.params.id as string)

// مسودة محلية قابلة للتعديل (deep clone) — تُحفظ صراحةً بزر «حفظ»
const draft = original ? reactive<DocTemplate>(JSON.parse(JSON.stringify(original))) : null
const dirty = ref(false)
const view = ref<'build' | 'preview'>('build')
const sel = ref<{ sectionId: string; elementId: string } | null>(null)
const pickerFor = ref<string | null>(null) // sectionId الذي نضيف له عنصراً
const showSectionKinds = ref(false)
const showIdentity = ref(false)

function touch() {
  dirty.value = true
}

// العنصر المحدّد (للوحة الخصائص)
const selectedElement = computed(() => {
  if (!draft || !sel.value) return null
  const sec = draft.sections.find((s) => s.id === sel.value!.sectionId)
  return sec?.elements.find((e) => e.id === sel.value!.elementId) ?? null
})

const defaultTitle = (kind: TemplateSectionKind) => sectionKindMeta(kind)?.label ?? 'قسم'
const defaultLabel = (type: TemplateElementType) => elementTypeMeta(type)?.label ?? 'عنصر'

// ── أقسام ──
function addSection(kind: TemplateSectionKind) {
  if (!draft) return
  const meta = sectionKindMeta(kind)
  draft.sections.push(makeSection(kind, defaultTitle(kind), [], { repeatable: meta?.repeatable || undefined }))
  showSectionKinds.value = false
  touch()
}
function removeSection(i: number) {
  if (!draft) return
  draft.sections.splice(i, 1)
  touch()
}
function moveSection(i: number, dir: -1 | 1) {
  if (!draft) return
  const j = i + dir
  if (j < 0 || j >= draft.sections.length) return
  const [s] = draft.sections.splice(i, 1)
  draft.sections.splice(j, 0, s)
  touch()
}

// ── عناصر ──
function onPick(type: TemplateElementType) {
  if (!draft || !pickerFor.value) return
  const sec = draft.sections.find((s) => s.id === pickerFor.value)
  if (sec) {
    const el = makeElement(type, defaultLabel(type))
    sec.elements.push(el)
    sel.value = { sectionId: sec.id, elementId: el.id }
  }
  pickerFor.value = null
  touch()
}
function removeElement(sectionId: string, i: number) {
  if (!draft) return
  const sec = draft.sections.find((s) => s.id === sectionId)
  if (!sec) return
  if (sel.value?.elementId === sec.elements[i].id) sel.value = null
  sec.elements.splice(i, 1)
  touch()
}
function duplicateElement(sectionId: string, i: number) {
  if (!draft) return
  const sec = draft.sections.find((s) => s.id === sectionId)
  if (!sec) return
  sec.elements.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(sec.elements[i])), id: uid('el') })
  touch()
}
function moveElement(sectionId: string, i: number, dir: -1 | 1) {
  if (!draft) return
  const sec = draft.sections.find((s) => s.id === sectionId)
  if (!sec) return
  const j = i + dir
  if (j < 0 || j >= sec.elements.length) return
  const [e] = sec.elements.splice(i, 1)
  sec.elements.splice(j, 0, e)
  touch()
}
function toggleHide(sectionId: string, i: number) {
  if (!draft) return
  const sec = draft.sections.find((s) => s.id === sectionId)
  if (!sec) return
  sec.elements[i].hidden = !sec.elements[i].hidden
  touch()
}

function updateSelected(patch: Record<string, unknown>) {
  if (!selectedElement.value) return
  Object.assign(selectedElement.value, patch)
  touch()
}

// ── الهوية البصرية للقالب ──
function applyAccentToHeadings() {
  if (!draft?.accent) return
  draft.sections.forEach((s) => s.elements.forEach((e) => { if (e.type === 'heading') e.color = draft.accent }))
  touch()
  toast.success('طُبّق اللون على كل العناوين')
}
function useSystemAccent() {
  if (!draft) return
  draft.accent = settingsStore.docBranding.accent
  touch()
}

function save() {
  if (!draft) return
  templatesStore.saveTemplate(JSON.parse(JSON.stringify(draft)))
  dirty.value = false
  toast.success('حُفظ القالب')
}
</script>

<template>
  <section class="editor">
    <div v-if="!draft" class="app-card missing">القالب غير موجود.</div>

    <template v-else>
      <!-- شريط الأدوات -->
      <header class="bar app-card">
        <button class="bar__back" @click="router.push({ name: 'templates-page' })">‹ القوالب</button>
        <span class="bar__type">{{ docTypeMeta(draft.docType)?.icon }} {{ docTypeMeta(draft.docType)?.label }}</span>
        <input v-model="draft.name" class="bar__name" type="text" @input="touch" />
        <span v-if="dirty" class="bar__dirty" title="تغييرات غير محفوظة">●</span>
        <div class="bar__spacer" />
        <div class="switch">
          <button :class="{ 'is-on': view === 'build' }" @click="view = 'build'">🛠️ بناء</button>
          <button :class="{ 'is-on': view === 'preview' }" @click="view = 'preview'">👁️ معاينة</button>
        </div>
        <button class="app-btn app-btn--outlined" :class="{ 'is-on': showIdentity }" @click="showIdentity = !showIdentity">🎨 الهوية</button>
        <button class="app-btn" :disabled="!dirty" @click="save">💾 حفظ</button>
      </header>

      <!-- لوحة الهوية البصرية -->
      <div v-if="showIdentity" class="identity app-card">
        <span class="identity__label">🎨 لون هوية القالب</span>
        <input v-model="draft.accent" type="color" class="identity__color" @input="touch" />
        <input v-model="draft.accent" type="text" class="identity__hex" placeholder="#2563eb" @input="touch" />
        <button class="app-btn app-btn--outlined identity__btn" @click="useSystemAccent">استخدام لون النظام</button>
        <button class="app-btn identity__btn" :disabled="!draft.accent" @click="applyAccentToHeadings">تطبيق على كل العناوين</button>
        <span class="identity__hint">يُطبَّق اللون على العناوين وترويسة المستند عند التوليد.</span>
      </div>

      <!-- وضع البناء -->
      <div v-if="view === 'build'" class="build">
        <div class="build__main">
          <div v-for="(sec, si) in draft.sections" :key="sec.id" class="sec app-card">
            <div class="sec__head">
              <input v-model="sec.title" class="sec__title" type="text" @input="touch" />
              <span class="sec__kind">{{ sectionKindMeta(sec.kind)?.label }}</span>
              <label v-if="sec.kind === 'repeatable' || sec.kind === 'group'" class="sec__rep">
                <input type="checkbox" :checked="!!sec.repeatable" @change="sec.repeatable = ($event.target as HTMLInputElement).checked; touch()" /> مكرّر
              </label>
              <div class="sec__ctrl">
                <button title="أعلى" :disabled="si === 0" @click="moveSection(si, -1)">↑</button>
                <button title="أسفل" :disabled="si === draft.sections.length - 1" @click="moveSection(si, 1)">↓</button>
                <button class="danger" title="حذف القسم" @click="removeSection(si)">🗑️</button>
              </div>
            </div>

            <div v-if="!sec.elements.length" class="sec__empty">لا عناصر — أضف عنصراً</div>
            <div v-else class="els">
              <div
                v-for="(el, ei) in sec.elements"
                :key="el.id"
                class="el"
                :class="{ 'is-sel': sel?.elementId === el.id, 'is-hidden': el.hidden }"
                @click="sel = { sectionId: sec.id, elementId: el.id }"
              >
                <span class="el__icon">{{ elementTypeMeta(el.type)?.icon }}</span>
                <span class="el__label">{{ el.label }}<span v-if="el.required" class="el__req">*</span></span>
                <span class="el__type">{{ elementTypeMeta(el.type)?.label }}</span>
                <div class="el__ctrl" @click.stop>
                  <button title="أعلى" :disabled="ei === 0" @click="moveElement(sec.id, ei, -1)">↑</button>
                  <button title="أسفل" :disabled="ei === sec.elements.length - 1" @click="moveElement(sec.id, ei, 1)">↓</button>
                  <button title="نسخ" @click="duplicateElement(sec.id, ei)">📋</button>
                  <button :title="el.hidden ? 'إظهار' : 'إخفاء'" @click="toggleHide(sec.id, ei)">{{ el.hidden ? '🙈' : '👁️' }}</button>
                  <button class="danger" title="حذف" @click="removeElement(sec.id, ei)">🗑️</button>
                </div>
              </div>
            </div>

            <button class="add-el" @click="pickerFor = sec.id">＋ عنصر</button>
          </div>

          <!-- إضافة قسم -->
          <div class="add-sec">
            <button v-if="!showSectionKinds" class="add-sec__btn" @click="showSectionKinds = true">＋ إضافة قسم</button>
            <div v-else class="add-sec__kinds">
              <button v-for="k in TEMPLATE_SECTION_KINDS" :key="k.id" @click="addSection(k.id)">{{ k.label }}</button>
              <button class="add-sec__cancel" @click="showSectionKinds = false">إلغاء</button>
            </div>
          </div>
        </div>

        <!-- لوحة الخصائص -->
        <aside class="build__props app-card">
          <ElementProperties v-if="selectedElement" :element="selectedElement" @update="updateSelected" />
          <div v-else class="props-empty">
            <span class="props-empty__icon">🎛️</span>
            اختر عنصراً لعرض خصائصه
          </div>
        </aside>
      </div>

      <!-- وضع المعاينة -->
      <div v-else class="preview app-card">
        <div class="preview__page">
          <template v-for="sec in draft.sections" :key="sec.id">
            <div class="pv-sec">
              <span class="pv-sec__title">{{ sec.title }}<span v-if="sec.repeatable" class="pv-sec__rep">⟳</span></span>
              <div class="pv-els">
                <div
                  v-for="el in sec.elements.filter((e) => !e.hidden)"
                  :key="el.id"
                  class="pv-el"
                  :style="{
                    fontSize: el.fontSize ? el.fontSize + 'px' : undefined,
                    color: el.color || undefined,
                    fontWeight: el.bold ? 700 : undefined,
                    fontStyle: el.italic ? 'italic' : undefined,
                    textAlign: el.align || undefined,
                  }"
                >
                  <span class="pv-el__lbl">{{ elementTypeMeta(el.type)?.icon }} {{ el.label }}<span v-if="el.required" class="el__req">*</span></span>
                  <span v-if="el.type === 'dropdown' && el.options?.length" class="pv-el__hint">[{{ el.options.join(' / ') }}]</span>
                  <span v-else-if="el.type === 'items_table' || el.type === 'table'" class="pv-el__hint">[{{ (el.columns ?? []).join(' | ') }}]</span>
                  <span v-else-if="el.placeholder" class="pv-el__hint">{{ el.placeholder }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <ElementPickerModal v-if="pickerFor" @pick="onPick" @close="pickerFor = null" />
    </template>
  </section>
</template>

<style lang="scss" scoped>
.editor { max-inline-size: 1100px; }
.missing { padding: 30px; text-align: center; color: var(--text-muted); }

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-block-end: 14px;
  flex-wrap: wrap;

  &__back { background: none; border: none; color: var(--primary); font-family: inherit; font-size: 13px; cursor: pointer; }
  &__type { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
  &__name {
    flex: 1;
    min-inline-size: 140px;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
  &__dirty { color: var(--warn-text); font-size: 18px; }
  &__spacer { flex: 1; }
}

.switch {
  display: inline-flex;
  gap: 2px;
  background: var(--bg);
  padding: 3px;
  border-radius: 10px;

  button {
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    border-radius: 8px;
    cursor: pointer;
    &.is-on { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.identity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-block-end: 14px;
  flex-wrap: wrap;

  &__label { font-size: 13px; font-weight: 700; }
  &__color { inline-size: 40px; block-size: 34px; padding: 2px; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; }
  &__hex { inline-size: 100px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 13px; background: var(--surface); color: var(--text); }
  &__btn { padding: 7px 12px; font-size: 13px; }
  &__hint { font-size: 12px; color: var(--text-muted); flex-basis: 100%; }
}
.is-on { border-color: var(--primary); color: var(--primary); }

.build {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 14px;
  align-items: start;

  @media (max-width: 860px) { grid-template-columns: 1fr; }
}

.build__main { display: flex; flex-direction: column; gap: 12px; }

.build__props {
  padding: 16px;
  position: sticky;
  inset-block-start: 12px;
}
.props-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 10px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  &__icon { font-size: 30px; }
}

.sec {
  padding: 14px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-end: 10px;
    flex-wrap: wrap;
  }
  &__title {
    flex: 1;
    min-inline-size: 120px;
    padding: 6px 10px;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    background: var(--bg);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); background: var(--surface); }
  }
  &__kind { font-size: 11px; color: var(--text-muted); background: var(--surface-2); padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
  &__rep { font-size: 12px; color: var(--text-muted); display: inline-flex; align-items: center; gap: 5px; cursor: pointer; }
  &__ctrl {
    display: inline-flex;
    gap: 3px;
    button {
      inline-size: 28px; block-size: 28px;
      border: 1px solid var(--border); background: var(--surface); color: var(--text-muted);
      border-radius: 6px; cursor: pointer; font-size: 12px;
      &:disabled { opacity: 0.35; cursor: not-allowed; }
      &.danger:hover { border-color: var(--error); color: var(--error); }
    }
  }
  &__empty { font-size: 12.5px; color: var(--text-muted); padding: 10px; text-align: center; }
}

.els { display: flex; flex-direction: column; gap: 6px; }

.el {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  cursor: pointer;

  &:hover { border-color: var(--primary); }
  &.is-sel { border-color: var(--primary); background: var(--primary-soft); }
  &.is-hidden { opacity: 0.5; }

  &__icon { font-size: 16px; inline-size: 20px; text-align: center; }
  &__label { font-size: 13px; font-weight: 600; flex: 1; min-inline-size: 0; }
  &__req { color: var(--danger-text); font-weight: 700; margin-inline-start: 2px; }
  &__type { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
  &__ctrl {
    display: inline-flex;
    gap: 2px;
    button {
      inline-size: 26px; block-size: 26px;
      border: 1px solid var(--border); background: var(--surface); color: var(--text-muted);
      border-radius: 6px; cursor: pointer; font-size: 11px;
      &:disabled { opacity: 0.35; cursor: not-allowed; }
      &.danger:hover { border-color: var(--error); color: var(--error); }
    }
  }
}

.add-el {
  margin-block-start: 10px;
  inline-size: 100%;
  padding: 8px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: var(--primary-soft); border-color: var(--primary); }
}

.add-sec {
  &__btn {
    inline-size: 100%;
    padding: 12px;
    border: 1.5px dashed var(--border);
    border-radius: var(--radius);
    background: transparent;
    color: var(--primary);
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    &:hover { background: var(--primary-soft); border-color: var(--primary); }
  }
  &__kinds {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    button {
      padding: 8px 14px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      cursor: pointer;
      &:hover { border-color: var(--primary); background: var(--primary-soft); }
    }
  }
  &__cancel { color: var(--text-muted) !important; }
}

// المعاينة
.preview { padding: 24px; display: flex; justify-content: center; }
.preview__page {
  inline-size: 100%;
  max-inline-size: 720px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.pv-sec {
  &__title { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-block-end: 8px; border-block-end: 1px solid var(--border); padding-block-end: 4px; }
  &__rep { margin-inline-start: 6px; color: var(--primary); }
}
.pv-els { display: flex; flex-direction: column; gap: 8px; }
.pv-el {
  display: flex;
  align-items: baseline;
  gap: 8px;
  &__lbl { font-weight: 600; }
  &__hint { font-size: 12px; color: var(--text-muted); }
  .el__req { color: var(--danger-text); }
}
</style>
