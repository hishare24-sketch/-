<script setup lang="ts">
import { reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import { ASSET_CATEGORIES, CURRENT_USER } from '@/constants'
import { today } from '@/helpers/date'
import type { AssetCategory } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const assetsStore = useAssetsStore()
const { projects } = storeToRefs(projectsStore)

const form = reactive({
  name: '',
  category: 'vehicle' as AssetCategory,
  projectId: props.projectId,
  purchaseDate: today(),
  purchaseValue: null as number | null,
  supplier: '',
  warrantyEnd: '',
  serial: '',
  usageMeter: null as number | null,
  usageUnit: '',
  memberId: '',
  note: '',
})

const projMembers = computed(() => projectsStore.membersByProject(form.projectId))
const valid = computed(() => form.name.trim() && form.purchaseValue != null && form.purchaseValue >= 0)

function save() {
  if (!valid.value) return
  assetsStore.addAsset({
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
    status: 'active',
    memberId: form.memberId || undefined,
    maintenance: [],
    note: form.note.trim() || undefined,
    createdBy: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="أصل جديد" @close="emit('close')">
    <div class="field">
      <label>نوع الأصل</label>
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
    </div>
    <div class="field">
      <label>اسم الأصل</label>
      <input v-model="form.name" type="text" placeholder="مثال: سيارة هايلكس، خادم Dell" />
    </div>
    <div class="field">
      <label>المشروع</label>
      <select v-model="form.projectId" @change="form.memberId = ''">
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.icon }} {{ p.name }}</option>
      </select>
    </div>
    <div class="row">
      <div class="field">
        <label>تاريخ الشراء</label>
        <input v-model="form.purchaseDate" type="date" />
      </div>
      <div class="field">
        <label>قيمة الشراء (ر.س)</label>
        <input v-model.number="form.purchaseValue" type="number" placeholder="0" />
      </div>
    </div>
    <div class="field">
      <label>المورّد (اختياري)</label>
      <input v-model="form.supplier" type="text" placeholder="مثال: الوكالة" />
    </div>
    <div class="field">
      <label>انتهاء الضمان (اختياري)</label>
      <input v-model="form.warrantyEnd" type="date" />
    </div>
    <div class="field">
      <label>الرقم التسلسلي / اللوحة (اختياري)</label>
      <input v-model="form.serial" type="text" placeholder="مثال: أ ب ج 1234" />
    </div>
    <div class="row">
      <div class="field">
        <label>عداد الاستخدام (اختياري)</label>
        <input v-model.number="form.usageMeter" type="number" placeholder="0" />
      </div>
      <div class="field">
        <label>وحدة العداد</label>
        <input v-model="form.usageUnit" type="text" placeholder="كم / ساعة" />
      </div>
    </div>
    <div class="field">
      <label>المسؤول / الحائز (اختياري)</label>
      <select v-model="form.memberId">
        <option value="">بدون</option>
        <option v-for="m in projMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>
    <div class="field">
      <label>ملاحظات (اختياري)</label>
      <textarea v-model="form.note" rows="2"></textarea>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">إضافة الأصل</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 16px;
  flex: 1;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input, select, textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.row { display: flex; gap: 10px; }

.types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .type {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}
</style>
