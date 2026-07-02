<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useToast } from '@/composables/useToast'
import { today } from '@/helpers/date'
import { exportPDF, docHTML } from '@/helpers/export'
import type { DocTemplate, TemplateElement } from '@/interfaces/models'
import { docTypeMeta, elementTypeMeta } from '../constants'
import { INPUT_TYPES, TABLE_TYPES, renderTemplateBody, type FieldValues, type TableRows } from '../templateRender'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton, BaseField, BaseSelect } from '@/components/base'

const props = defineProps<{ template: DocTemplate }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const documentsStore = useDocumentsStore()
const { projects, activeProjectId } = storeToRefs(projectsStore)
const toast = useToast()

const view = ref<'fill' | 'preview'>('fill')
const projectId = ref(activeProjectId.value)
const busy = ref(false)
const msg = ref('')

const isImage = (t: TemplateElement['type']) => t === 'image' || t === 'signature'

// حقول الإدخال (عناصر تتطلّب قيمة) مجموعة حسب القسم
const groups = computed(() =>
  props.template.sections
    .map((sec) => ({
      title: sec.title,
      fields: sec.elements.filter((e) => !e.hidden && (INPUT_TYPES.has(e.type) || TABLE_TYPES.has(e.type) || isImage(e.type))),
    }))
    .filter((g) => g.fields.length),
)

// قيم الحقول القياسية + صفوف الجداول
const values = reactive<FieldValues>({})
const tables = reactive<TableRows>({})
props.template.sections.forEach((sec) =>
  sec.elements.forEach((el) => {
    if (TABLE_TYPES.has(el.type)) tables[el.id] = [Array((el.columns ?? []).length).fill('')]
    else if (isImage(el.type)) values[el.id] = el.src ?? '' // يبدأ من صورة القالب (اللوجو) ويمكن استبدالها
    else if (INPUT_TYPES.has(el.type)) values[el.id] = el.defaultValue ?? (el.type === 'checkbox' ? 'false' : '')
  }),
)

// رفع صورة لهذا المستند (يستبدل صورة القالب)
function onImage(el: TemplateElement, e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => { values[el.id] = reader.result as string }
  reader.readAsDataURL(file)
}

// الحقول الإلزامية الفارغة
const missing = computed(() =>
  props.template.sections
    .flatMap((s) => s.elements)
    .filter((e) => e.required && INPUT_TYPES.has(e.type) && !((values[e.id] ?? '').toString().trim()))
    .map((e) => e.label),
)
const canGenerate = computed(() => missing.value.length === 0)

function addRow(el: TemplateElement) {
  tables[el.id].push(Array((el.columns ?? []).length).fill(''))
}
function removeRow(el: TemplateElement, i: number) {
  if (tables[el.id].length > 1) tables[el.id].splice(i, 1)
}

const previewHtml = computed(() => renderTemplateBody(props.template, values, tables))

function build() {
  return docHTML({
    title: props.template.name,
    subtitle: docTypeMeta(props.template.docType)?.label,
    body: previewHtml.value,
    accent: props.template.accent || undefined, // هوية القالب تتقدّم على الهوية العامة
  })
}

async function exportPdf() {
  if (!canGenerate.value) return
  busy.value = true
  msg.value = ''
  try {
    await exportPDF(props.template.name, build())
    msg.value = 'تم تصدير الـ PDF ✅'
  } catch (e) {
    msg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

function saveToDocuments() {
  if (!canGenerate.value) return
  documentsStore.saveDoc({
    name: props.template.name,
    type: docTypeMeta(props.template.docType)?.label ?? 'مستند',
    projectId: projectId.value,
    date: today(),
    size: '—',
    status: 'pending',
    aiRead: false,
    attachments: [],
  })
  msg.value = 'تم حفظ نسخة في المستندات ✅'
  toast.success('حُفظ المستند')
}
</script>

<template>
  <ModalShell :title="`توليد مستند: ${template.name}`" wide @close="emit('close')">
    <div class="switch">
      <button :class="{ 'is-on': view === 'fill' }" @click="view = 'fill'">📝 تعبئة</button>
      <button :class="{ 'is-on': view === 'preview' }" @click="view = 'preview'">👁️ معاينة</button>
    </div>

    <!-- التعبئة -->
    <div v-if="view === 'fill'" class="fill">
      <BaseField label="المشروع">
        <BaseSelect v-model="projectId">
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
        </BaseSelect>
      </BaseField>

      <div v-for="(g, gi) in groups" :key="gi" class="group">
        <span class="group__title">{{ g.title }}</span>

        <template v-for="el in g.fields" :key="el.id">
          <!-- جدول -->
          <div v-if="el.type === 'table' || el.type === 'items_table'" class="tbl">
            <div class="tbl__head">
              <span>{{ el.label }}</span>
              <button class="mini" @click="addRow(el)">＋ صف</button>
            </div>
            <div v-for="(row, ri) in tables[el.id]" :key="ri" class="tbl__row">
              <input
                v-for="(col, ci) in (el.columns ?? [])"
                :key="ci"
                v-model="row[ci]"
                type="text"
                :placeholder="col"
              />
              <button class="tbl__x" aria-label="حذف الصف" :disabled="tables[el.id].length === 1" @click="removeRow(el, ri)">✕</button>
            </div>
          </div>

          <!-- صورة / توقيع (رفع) -->
          <div v-else-if="el.type === 'image' || el.type === 'signature'" class="field">
            <label>
              <span class="field__ico">{{ elementTypeMeta(el.type)?.icon }}</span>
              {{ el.label }}
            </label>
            <div v-if="values[el.id]" class="imgrow">
              <img :src="values[el.id]" alt="" />
              <button class="imgrow__x" @click="values[el.id] = ''">✕ إزالة</button>
            </div>
            <label class="uploader">
              <input type="file" accept="image/*" @change="onImage(el, $event)" />
              <span>{{ values[el.id] ? 'استبدال الصورة' : '⬆ رفع صورة' }}</span>
            </label>
          </div>

          <!-- حقول قياسية -->
          <div v-else class="field">
            <label>
              <span class="field__ico">{{ elementTypeMeta(el.type)?.icon }}</span>
              {{ el.label }}<span v-if="el.required" class="req">*</span>
            </label>
            <textarea v-if="el.type === 'long_text'" v-model="values[el.id]" rows="3" :placeholder="el.placeholder" />
            <select v-else-if="el.type === 'dropdown'" v-model="values[el.id]">
              <option value="">— اختر —</option>
              <option v-for="o in (el.options ?? [])" :key="o" :value="o">{{ o }}</option>
            </select>
            <label v-else-if="el.type === 'checkbox'" class="chk">
              <input type="checkbox" :checked="values[el.id] === 'true'" @change="values[el.id] = ($event.target as HTMLInputElement).checked ? 'true' : 'false'" />
              نعم
            </label>
            <input v-else-if="el.type === 'number'" v-model="values[el.id]" type="number" :placeholder="el.placeholder" />
            <input v-else-if="el.type === 'date'" v-model="values[el.id]" type="date" />
            <input v-else v-model="values[el.id]" type="text" :placeholder="el.placeholder" />
          </div>
        </template>
      </div>

      <div v-if="missing.length" class="warn">حقول إلزامية ناقصة: {{ missing.join('، ') }}</div>
    </div>

    <!-- المعاينة -->
    <div v-else class="preview">
      <!-- آمن: previewHtml من renderTemplateBody الذي يهرّب كل المدخلات (تحصين ج-3) -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="preview__page" v-html="previewHtml" />
    </div>

    <div v-if="msg" class="msg">{{ msg }}</div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إغلاق</BaseButton>
      <BaseButton variant="outlined" :disabled="!canGenerate" @click="saveToDocuments">💾 حفظ في المستندات</BaseButton>
      <BaseButton :disabled="!canGenerate || busy" @click="exportPdf">{{ busy ? 'جارٍ التصدير…' : '⬇ تصدير PDF' }}</BaseButton>
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
    padding: 7px 14px;
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

.group {
  margin-block-end: 18px;

  &__title {
    display: block;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    border-block-end: 1px solid var(--border);
    padding-block-end: 5px;
    margin-block-end: 12px;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 14px;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
  &__ico { font-size: 14px; }
  .req { color: var(--danger-text); font-weight: 700; }

  input, select, textarea {
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
  .chk { flex-direction: row; align-items: center; gap: 7px; color: var(--text); cursor: pointer; input { inline-size: 15px; block-size: 15px; } }
}

.tbl {
  margin-block-end: 14px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    margin-block-end: 8px;
  }
  &__row {
    display: flex;
    gap: 6px;
    margin-block-end: 6px;

    input {
      flex: 1;
      min-inline-size: 0;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 13px;
      background: var(--surface);
      color: var(--text);
      &:focus { outline: none; border-color: var(--primary); }
    }
  }
  &__x {
    border: none;
    background: var(--danger-bg);
    color: var(--danger-text);
    border-radius: 6px;
    inline-size: 30px;
    cursor: pointer;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

.mini {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--primary);
  border-radius: 8px;
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.imgrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-block-end: 8px;

  img { max-block-size: 60px; max-inline-size: 140px; object-fit: contain; border: 1px solid var(--border); border-radius: 6px; padding: 4px; background: #fff; }
  &__x { border: none; background: var(--danger-bg); color: var(--danger-text); border-radius: 6px; padding: 6px 10px; font-family: inherit; font-size: 12px; cursor: pointer; }
}
.uploader {
  display: block;
  padding: 10px 12px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  &:hover { background: var(--primary-soft); border-color: var(--primary); }
  input { display: none; }
}

.preview {
  display: flex;
  justify-content: center;

  &__page {
    inline-size: 100%;
    max-inline-size: 640px;
    background: #fff;
    color: #111;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    direction: rtl;
  }
}

.warn {
  padding: 10px 14px;
  background: var(--warn-bg);
  color: var(--warn-text);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
}

.msg {
  margin-block-start: 12px;
  padding: 10px 14px;
  background: var(--ok-bg);
  color: var(--ok-text);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
}
</style>
