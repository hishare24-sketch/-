<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { aiExtract, suggestedActions, type DocActionKind } from '../docAI'
import type { DocItem } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ doc: DocItem }>()
const emit = defineEmits<{
  (e: 'action', payload: { kind: DocActionKind; preset: FormPreset }): void
  (e: 'close'): void
}>()

const documentsStore = useDocumentsStore()
const projectsStore = useProjectsStore()

const project = computed(() => projectsStore.projectById(props.doc.projectId))
const extraction = computed(() => aiExtract(props.doc))
const actions = computed(() => suggestedActions(props.doc.type))

// حالة التحليل
const analyzing = ref(false)
const analyzed = ref(props.doc.aiRead)

function runAnalysis() {
  analyzing.value = true
  setTimeout(() => {
    analyzing.value = false
    analyzed.value = true
    documentsStore.markProcessed(props.doc.id)
  }, 1300)
}

// بناء التعبئة المسبقة للإجراء
function presetFor(kind: DocActionKind): FormPreset {
  const d = props.doc
  const ex = extraction.value.data
  const note = `أُنشئ من المستند: ${d.name}`
  switch (kind) {
    case 'tx':
      return { projectId: d.projectId, type: 'expense', amount: ex.amount, source: ex.party, description: d.name, category: 'فواتير', note }
    case 'tracking':
      return { projectId: d.projectId, name: d.name, trackingType: d.type === 'عقد' ? 'عقد' : d.type === 'وثيقة رسمية' ? 'وثيقة' : 'ضمان', expiryDate: ex.expiryDate ?? ex.warrantyEnd, note }
    case 'asset':
      return { projectId: d.projectId, name: d.name, amount: ex.amount, supplier: ex.party, warrantyEnd: ex.warrantyEnd, note }
    case 'commitment':
      return { projectId: d.projectId, name: d.name, party: ex.party, amount: ex.amount, note }
    case 'receivable':
      return { projectId: d.projectId, party: ex.party ?? d.name, amount: ex.amount, note }
  }
}

function trigger(kind: DocActionKind) {
  emit('action', { kind, preset: presetFor(kind) })
}
</script>

<template>
  <ModalShell :title="doc.name" wide @close="emit('close')">
    <!-- معلومات المستند -->
    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ doc.type }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr><td class="rows__key">التاريخ</td><td>{{ doc.date }}</td></tr>
      <tr><td class="rows__key">الحجم</td><td>{{ doc.size }}</td></tr>
    </table>

    <div v-if="doc.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="doc.attachments" readonly />
    </div>

    <!-- التحليل الذكي -->
    <div class="ai">
      <div class="ai__head">
        <span class="ai__title">✨ تحليل ذكي واستخراج البيانات</span>
        <span v-if="analyzed" class="ai__conf">دقة {{ extraction.confidence }}%</span>
      </div>

      <!-- زر التحليل -->
      <button v-if="!analyzed && !analyzing" class="ai__run" @click="runAnalysis">
        🤖 تشغيل التحليل الذكي
      </button>

      <!-- جارٍ التحليل -->
      <div v-else-if="analyzing" class="ai__loading">
        <span class="ai__spinner" />
        جارٍ قراءة المستند واستخراج البيانات...
      </div>

      <!-- النتائج -->
      <div v-else class="ai__results">
        <div v-for="[k, v] in extraction.fields" :key="k" class="ai__field">
          <span class="ai__field-k">{{ k }}</span>
          <span class="ai__field-v">{{ v }}</span>
        </div>
      </div>
    </div>

    <!-- الإجراءات المقترحة -->
    <div v-if="analyzed" class="actions">
      <span class="actions__label">⚡ إجراءات مقترحة (من المستند إلى عملية)</span>
      <div class="actions__grid">
        <button v-for="a in actions" :key="a.kind" class="action" @click="trigger(a.kind)">
          <span class="action__icon">{{ a.icon }}</span>
          <span class="action__label">{{ a.label }}</span>
          <span class="action__desc">{{ a.desc }}</span>
        </button>
      </div>
    </div>

    <template #footer>
      <button class="app-btn" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 16px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }
  &__key { color: var(--text-muted); inline-size: 120px; }
}

.atts {
  margin-block-end: 18px;
  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}

.ai {
  background: linear-gradient(135deg, var(--purple-bg), var(--surface));
  border: 1px solid #e9d5ff;
  border-radius: var(--radius);
  padding: 18px;
  margin-block-end: 18px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 14px;
  }

  &__title { font-weight: 700; font-size: 14px; color: var(--purple-text); }
  &__conf { font-size: 12px; font-weight: 600; color: var(--ok-text); background: var(--ok-bg); padding: 2px 10px; border-radius: 20px; }

  &__run {
    inline-size: 100%;
    padding: 12px;
    border: 1.5px dashed #c4b5fd;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--purple-text);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover { background: var(--purple-bg); }
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    color: var(--purple-text);
    font-size: 14px;
  }

  &__spinner {
    inline-size: 22px;
    block-size: 22px;
    border: 3px solid #ddd6fe;
    border-block-start-color: var(--purple-text);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  &__results {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    @media (max-width: 520px) { grid-template-columns: 1fr; }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--surface);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }

  &__field-k { font-size: 11px; color: var(--text-muted); }
  &__field-v { font-size: 13px; font-weight: 600; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.actions {
  &__label { display: block; font-size: 13px; font-weight: 700; margin-block-end: 12px; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
}

.action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  text-align: start;
  cursor: pointer;

  &:hover { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 22px; }
  &__label { font-size: 13px; font-weight: 700; }
  &__desc { font-size: 11px; color: var(--text-muted); }
}
</style>
