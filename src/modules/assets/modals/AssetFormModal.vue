<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import { ASSET_CATEGORIES, ASSET_FIELD_SCHEMAS, ASSET_METER_UNIT } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import { today } from '@/helpers/date'
import type { AssetCategory, Attachment, Asset } from '@/interfaces/models'
import type { FormPreset } from '@/interfaces/forms'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'

const props = defineProps<{ projectId: string; preset?: FormPreset; asset?: Asset | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

const projectsStore = useProjectsStore()
const assetsStore = useAssetsStore()
const { projects } = storeToRefs(projectsStore)
const ps = props.preset
const editing = computed(() => !!props.asset)

const a = props.asset
const form = reactive({
  name: a?.name ?? ps?.name ?? '',
  category: a?.category ?? ('vehicle' as AssetCategory),
  projectId: a?.projectId ?? ps?.projectId ?? props.projectId,
  purchaseDate: a?.purchaseDate ?? today(),
  purchaseValue: (a?.purchaseValue ?? ps?.amount ?? null) as number | null,
  supplier: a?.supplier ?? ps?.supplier ?? '',
  warrantyEnd: a?.warrantyEnd ?? ps?.warrantyEnd ?? '',
  serial: a?.serial ?? '',
  usageMeter: (a?.usageMeter ?? null) as number | null,
  usageUnit: a?.usageUnit ?? ASSET_METER_UNIT[a?.category ?? 'vehicle'] ?? '',
  memberId: a?.memberId ?? '',
  note: a?.note ?? ps?.note ?? '',
  attachments: (a?.attachments ?? []) as Attachment[],
  specs: { ...(a?.specs ?? {}) } as Record<string, string>,
})

// الحقول الخاصة بالطبيعة الحالية
const categoryFields = computed(() => ASSET_FIELD_SCHEMAS[form.category])

// عند تغيير الطبيعة: ضبط وحدة العداد الافتراضية إن كانت فارغة
watch(
  () => form.category,
  (cat) => {
    if (!form.usageUnit) form.usageUnit = ASSET_METER_UNIT[cat] ?? ''
  },
)

const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.name.trim() && form.purchaseValue != null && form.purchaseValue >= 0)

function cleanSpecs(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  categoryFields.value.forEach((f) => {
    const v = (form.specs[f.key] ?? '').trim()
    if (v) out[f.key] = v
  })
  return Object.keys(out).length ? out : undefined
}

function save() {
  if (!valid.value) return
  const payload = {
    projectId: form.projectId,
    name: form.name.trim(),
    category: form.category,
    purchaseDate: form.purchaseDate,
    purchaseValue: Number(form.purchaseValue),
    supplier: form.supplier.trim() || undefined,
    warrantyEnd: form.warrantyEnd || undefined,
    serial: form.serial.trim() || undefined,
    usageMeter: form.usageMeter != null ? Number(form.usageMeter) : undefined,
    usageUnit: form.usageUnit.trim() || undefined,
    memberId: form.memberId || undefined,
    note: form.note.trim() || undefined,
    attachments: form.attachments,
    specs: cleanSpecs(),
  }
  if (editing.value && props.asset) {
    assetsStore.updateAsset(props.asset.id, payload)
  } else {
    assetsStore.addAsset({ ...payload, status: 'active', maintenance: [], createdBy: currentUserName() })
  }
  emit('saved')
  emit('close')
}
</script>

<template>
  <ModalShell :title="editing ? `تعديل: ${form.name}` : 'أصل جديد'" @close="emit('close')">
    <BaseField tag="div" label="نوع الأصل">
      <div class="types">
        <button
          v-for="c in ASSET_CATEGORIES"
          :key="c.id"
          type="button"
          class="type"
          :class="{ 'is-active': form.category === c.id }"
          @click="form.category = c.id"
        >
          {{ c.icon }} {{ c.label }}
        </button>
      </div>
    </BaseField>
    <BaseField label="اسم الأصل">
      <BaseInput v-model="form.name" placeholder="مثال: سيارة هايلكس، خادم Dell" />
    </BaseField>
    <BaseField label="المشروع">
      <BaseSelect v-model="form.projectId" @change="form.memberId = ''">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </BaseSelect>
    </BaseField>
    <div class="row">
      <BaseField label="تاريخ الشراء">
        <BaseInput v-model="form.purchaseDate" type="date" />
      </BaseField>
      <BaseField label="قيمة الشراء (ر.س)">
        <BaseInput v-model.number="form.purchaseValue" type="number" placeholder="0" />
      </BaseField>
    </div>

    <!-- حقول خاصة بطبيعة الأصل -->
    <div v-if="categoryFields.length" class="specs">
      <span class="specs__label">بيانات {{ ASSET_CATEGORIES.find((c) => c.id === form.category)?.label }}</span>
      <div class="specs__grid">
        <BaseField v-for="f in categoryFields" :key="f.key" :label="f.label">
          <BaseInput v-model="form.specs[f.key]" :placeholder="f.placeholder ?? ''" />
        </BaseField>
      </div>
    </div>

    <BaseField label="المورّد (اختياري)">
      <BaseInput v-model="form.supplier" placeholder="مثال: الوكالة" />
    </BaseField>
    <BaseField label="انتهاء الضمان (اختياري)">
      <BaseInput v-model="form.warrantyEnd" type="date" />
    </BaseField>
    <BaseField label="الرقم التسلسلي (اختياري)">
      <BaseInput v-model="form.serial" placeholder="مثال: SN-12345" />
    </BaseField>
    <div class="row">
      <BaseField label="عداد الاستخدام (اختياري)">
        <BaseInput v-model.number="form.usageMeter" type="number" placeholder="0" />
      </BaseField>
      <BaseField label="وحدة العداد">
        <BaseInput v-model="form.usageUnit" placeholder="كم / ساعة" />
      </BaseField>
    </div>
    <BaseField label="المسؤول / الحائز (اختياري)">
      <BaseSelect v-model="form.memberId">
        <option value="">بدون</option>
        <option v-for="m in projMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
      </BaseSelect>
    </BaseField>
    <BaseField label="ملاحظات (اختياري)">
      <BaseTextarea v-model="form.note" :rows="2" />
    </BaseField>

    <BaseField tag="div" label="المرفقات (فاتورة الشراء، صور، وثائق)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ editing ? 'حفظ التعديلات' : 'إضافة الأصل' }}</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.row { display: flex; gap: 10px; flex-wrap: wrap; }

.specs {
  margin-block-end: 16px;
  padding: 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);

  &__label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
  &__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; @media (max-width: 520px) { grid-template-columns: 1fr; } }
  .field { margin-block-end: 0; }
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .type {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
