<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useTemplatesStore } from '@/stores/TemplatesStore'
import { useToast } from '@/composables/useToast'
import type { DocTemplate, TemplateDocType } from '@/interfaces/models'
import { TEMPLATE_DOC_TYPES, docTypeMeta } from '../constants'
import { generateTemplateFromDescription } from '../templatesAI'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import NewTemplateModal from '../modals/NewTemplateModal.vue'
import TemplatePreviewModal from '../modals/TemplatePreviewModal.vue'
import FillDocumentModal from '../modals/FillDocumentModal.vue'

const templatesStore = useTemplatesStore()
const { templates } = storeToRefs(templatesStore)
const router = useRouter()
const toast = useToast()

const fType = ref<'all' | TemplateDocType>('all')
const fStatus = ref<'active' | 'archived'>('active')
const search = ref('')

const filtered = computed(() =>
  templates.value
    .filter((t) => t.status === fStatus.value)
    .filter((t) => (fType.value === 'all' ? true : t.docType === fType.value))
    .filter((t) => (search.value.trim() === '' ? true : t.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
)

const stats = computed(() => [
  { label: 'إجمالي القوالب', value: String(templates.value.length), icon: '🧩', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  { label: 'نشطة', value: String(templates.value.filter((t) => t.status === 'active').length), icon: '✅', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  { label: 'مؤرشفة', value: String(templates.value.filter((t) => t.status === 'archived').length), icon: '🗄️', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
])

const showNew = ref(false)
const preview = ref<DocTemplate | null>(null)
const using = ref<DocTemplate | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function onCreate(payload: { name: string; docType: TemplateDocType }) {
  const id = templatesStore.createTemplate(payload.name, payload.docType)
  showNew.value = false
  router.push({ name: 'template-editor', params: { id } })
}

// توليد قالب بالذكاء (محاكاة) من وصف نصّي
function onGenerate(payload: { description: string }) {
  const g = generateTemplateFromDescription(payload.description)
  const id = templatesStore.createTemplate(g.name, g.docType)
  templatesStore.updateTemplate(id, { sections: g.sections })
  showNew.value = false
  toast.success('أُنشئ القالب بالذكاء ✨')
  router.push({ name: 'template-editor', params: { id } })
}

function edit(t: DocTemplate) {
  router.push({ name: 'template-editor', params: { id: t.id } })
}

function duplicate(t: DocTemplate) {
  const id = templatesStore.duplicateTemplate(t.id)
  if (id) toast.success('تم إنشاء نسخة من القالب')
}

function toggleArchive(t: DocTemplate) {
  if (t.status === 'active') {
    templatesStore.archiveTemplate(t.id)
    toast.info('نُقل القالب إلى الأرشيف')
  } else {
    templatesStore.restoreTemplate(t.id)
    toast.success('أُعيد القالب للنشاط')
  }
}

async function remove(t: DocTemplate) {
  const ok = await confirmRef.value?.open({ title: 'حذف القالب', message: `حذف "${t.name}" نهائياً؟` })
  if (ok) {
    templatesStore.deleteTemplate(t.id)
    toast.success('حُذف القالب')
  }
}
</script>

<template>
  <section class="templates">
    <header class="templates__header">
      <div>
        <h1>مولّد القوالب <HelpIcon section="templates" /></h1>
        <p>أنشئ قوالب مستندات ديناميكية وأعد استخدامها</p>
      </div>
      <button class="app-btn" @click="showNew = true">＋ قالب جديد</button>
    </header>

    <div class="templates__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tabs__btn" :class="{ 'is-active': fType === 'all' }" @click="fType = 'all'">الكل</button>
      <button
        v-for="t in TEMPLATE_DOC_TYPES"
        :key="t.id"
        class="tabs__btn"
        :class="{ 'is-active': fType === t.id }"
        @click="fType = t.id"
      >
        {{ t.icon }} {{ t.label }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث بالاسم..." class="filters__search" />
      <select v-model="fStatus" class="filters__select">
        <option value="active">النشطة</option>
        <option value="archived">المؤرشفة</option>
      </select>
    </div>

    <div class="grid">
      <div v-if="!filtered.length" class="empty app-card">لا توجد قوالب مطابقة.</div>
      <div v-for="t in filtered" :key="t.id" class="tpl app-card">
        <button class="tpl__preview" title="معاينة سريعة" @click="preview = t">
          <span class="tpl__thumb">{{ docTypeMeta(t.docType)?.icon }}</span>
        </button>
        <span class="tpl__name">{{ t.name }}</span>
        <span class="tpl__meta">{{ docTypeMeta(t.docType)?.label }} · {{ t.sections.length }} قسم</span>
        <span class="tpl__date">آخر تعديل: {{ t.updatedAt }}</span>

        <div class="tpl__actions">
          <button class="app-btn act" @click="using = t">🧾 توليد</button>
          <button class="app-btn app-btn--outlined act" @click="edit(t)">✎ تعديل</button>
          <button class="icon-btn" title="نسخ" @click="duplicate(t)">📋</button>
          <button class="icon-btn" :title="t.status === 'active' ? 'أرشفة' : 'استعادة'" @click="toggleArchive(t)">
            {{ t.status === 'active' ? '🗄️' : '↩️' }}
          </button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="remove(t)">🗑️</button>
        </div>
      </div>
    </div>

    <NewTemplateModal v-if="showNew" @create="onCreate" @generate="onGenerate" @close="showNew = false" />
    <TemplatePreviewModal v-if="preview" :template="preview" @close="preview = null" />
    <FillDocumentModal v-if="using" :template="using" @close="using = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.templates {
  max-inline-size: 1100px;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-block-end: 20px;
    flex-wrap: wrap;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-block-end: 20px;
  }
}

.stat {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px;

  &__label { display: block; font-size: 12px; color: var(--text-muted); margin-block-end: 6px; }
  &__value { font-size: 17px; font-weight: 700; }
  &__icon { inline-size: 42px; block-size: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; }
}

.tabs {
  display: inline-flex;
  gap: 4px;
  margin-block-end: 14px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;
  flex-wrap: wrap;

  &__btn {
    padding: 7px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.filters {
  display: flex;
  gap: 8px;
  margin-block-end: 16px;
  flex-wrap: wrap;

  &__search {
    flex: 1;
    min-inline-size: 160px;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }

  &__select {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.empty {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.tpl {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__preview {
    border: 1px dashed var(--border);
    border-radius: 12px;
    background: var(--bg);
    padding: 18px;
    cursor: pointer;
    margin-block-end: 8px;
    transition: border-color 0.15s ease;
    &:hover { border-color: var(--primary); }
  }
  &__thumb { font-size: 34px; }

  &__name { font-weight: 700; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
  &__date { font-size: 11px; color: var(--text-muted); }

  &__actions {
    display: flex;
    gap: 6px;
    margin-block-start: 10px;
    padding-block-start: 10px;
    border-block-start: 1px solid var(--border);
  }
}

.act { flex: 1; padding: 7px; font-size: 13px; }

.icon-btn {
  inline-size: 34px;
  block-size: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;

  &--danger:hover { border-color: var(--error); color: var(--error); }
}
</style>
