<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { MAINT_TYPES } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import { today } from '@/helpers/date'
import type { Asset, MaintenanceEntry, Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton, BaseField, BaseInput, BaseTextarea } from '@/components/base'

const props = defineProps<{ asset: Asset; initialType?: MaintenanceEntry['type'] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const assetsStore = useAssetsStore()

const form = reactive({
  type: (props.initialType ?? 'صيانة') as MaintenanceEntry['type'],
  date: today(),
  cost: null as number | null,
  meter: (props.asset.usageMeter ?? null) as number | null,
  note: '',
  attachments: [] as Attachment[],
  // ضمان فرعي اختياري لهذا الإصلاح/المكوّن
  addWarranty: false,
  warrantyName: '',
  warrantyProvider: (props.asset.supplier ?? '') as string,
  warrantyEnd: '',
})

const showMeter = computed(() => props.asset.usageUnit != null && props.asset.usageUnit !== '')
const valid = computed(
  () =>
    form.cost != null &&
    form.cost >= 0 &&
    (!form.addWarranty || (form.warrantyName.trim() !== '' && form.warrantyEnd !== '')),
)

function save() {
  if (!valid.value) return
  const mnId = assetsStore.addMaintenance(props.asset.id, {
    type: form.type,
    date: form.date,
    cost: Number(form.cost),
    meter: form.meter != null ? Number(form.meter) : undefined,
    note: form.note.trim(),
    attachments: form.attachments,
    createdBy: currentUserName(),
  })
  // إنشاء ضمان فرعي مرتبط بهذه العملية، يرث مرفقاتها ويُربط بالتذكيرات
  if (mnId && form.addWarranty) {
    const id = assetsStore.addWarranty(props.asset.id, {
      name: form.warrantyName.trim(),
      provider: form.warrantyProvider.trim() || undefined,
      context: form.type === 'إصلاح' ? 'repair' : form.type === 'صيانة' ? 'maintenance' : 'component',
      startDate: form.date,
      endDate: form.warrantyEnd,
      cost: form.cost != null ? Number(form.cost) : undefined,
      linkedMaintenanceId: mnId,
      note: form.note.trim() || undefined,
      attachments: form.attachments.length ? [...form.attachments] : undefined,
      createdBy: currentUserName(),
    })
    if (id) assetsStore.linkSubWarranty(props.asset.id, id)
  }
  emit('close')
}
</script>

<template>
  <ModalShell :title="`صيانة: ${asset.name}`" @close="emit('close')">
    <BaseField tag="div" label="النوع">
      <div class="types">
        <button v-for="t in MAINT_TYPES" :key="t.v" type="button" class="type" :class="{ 'is-active': form.type === t.v }" @click="form.type = t.v">
          {{ t.icon }} {{ t.v }}
        </button>
      </div>
    </BaseField>
    <div class="row">
      <BaseField label="التاريخ">
        <BaseInput v-model="form.date" type="date" />
      </BaseField>
      <BaseField label="التكلفة (ر.س)">
        <BaseInput v-model.number="form.cost" type="number" placeholder="0" />
      </BaseField>
    </div>
    <BaseField v-if="showMeter" :label="`قراءة العداد (${asset.usageUnit}) — اختياري`">
      <BaseInput v-model.number="form.meter" type="number" placeholder="0" />
    </BaseField>
    <BaseField label="الوصف">
      <BaseTextarea v-model="form.note" :rows="2" placeholder="تفاصيل الصيانة أو العطل..." />
    </BaseField>

    <BaseField tag="div" label="المرفقات (فاتورة، تقرير فحص، صور)">
      <AttachmentsField v-model="form.attachments" />
    </BaseField>

    <!-- ضمان فرعي اختياري لهذا الإصلاح/المكوّن -->
    <label class="check">
      <input v-model="form.addWarranty" type="checkbox" />
      🛡️ لهذا الإصلاح/المكوّن ضمان — أضِفه وتتبّعه
    </label>
    <div v-if="form.addWarranty" class="warr-box">
      <BaseField label="اسم الضمان / المكوّن">
        <BaseInput v-model="form.warrantyName" placeholder="مثال: ضمان قطعة الغيار، بطارية..." />
      </BaseField>
      <div class="row">
        <BaseField label="الجهة الضامنة (اختياري)">
          <BaseInput v-model="form.warrantyProvider" placeholder="الورشة / المورّد" />
        </BaseField>
        <BaseField label="تاريخ انتهاء الضمان">
          <BaseInput v-model="form.warrantyEnd" type="date" />
        </BaseField>
      </div>
      <p class="warr-note">سيُربط الضمان بهذه العملية ويرث مرفقاتها، ويظهر في التذكيرات قبل انتهائه.</p>
    </div>

    <p class="hint">ℹ️ ستُسجّل التكلفة كمصروف فعلي في الإدارة المالية للمشروع.</p>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">تسجيل</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.row { display: flex; gap: 10px; flex-wrap: wrap; }

.types {
  display: flex;
  gap: 8px;

  .type {
    flex: 1;
    padding: 9px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    font-family: inherit;
    font-size: 13px;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--primary-soft);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  margin-block-end: 12px;
  cursor: pointer;

  input { inline-size: 16px; block-size: 16px; accent-color: var(--primary); }
}

.warr-box {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-block-end: 16px;
  background: var(--bg);
}

.warr-note {
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
