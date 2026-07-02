<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useToast } from '@/composables/useToast'
import { currentUserName } from '@/helpers/currentUser'
import { today } from '@/helpers/date'
import type { Asset, AssetWarranty, Attachment, WarrantyContext } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton } from '@/components/base'

const props = defineProps<{
  asset: Asset
  warranty?: AssetWarranty
  initialContext?: WarrantyContext
  initialMaintenanceId?: string
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const assetsStore = useAssetsStore()
const toast = useToast()
const isEdit = computed(() => !!props.warranty)

const CONTEXTS: { v: WarrantyContext; l: string; icon: string }[] = [
  { v: 'purchase', l: 'من الشراء الأصلي', icon: '🧾' },
  { v: 'component', l: 'مكوّن مُشترى', icon: '🔩' },
  { v: 'maintenance', l: 'صيانة', icon: '🔧' },
  { v: 'repair', l: 'إصلاح', icon: '🛠️' },
  { v: 'other', l: 'أخرى', icon: '📄' },
]

const MAINT_ICON: Record<string, string> = { صيانة: '🔧', إصلاح: '🛠️', عطل: '⚠️', فحص: '🔍', دورية: '🔁' }

const form = reactive({
  name: props.warranty?.name ?? '',
  provider: props.warranty?.provider ?? props.asset.supplier ?? '',
  context: (props.warranty?.context ?? props.initialContext ?? 'component') as WarrantyContext,
  startDate: props.warranty?.startDate ?? today(),
  endDate: props.warranty?.endDate ?? '',
  cost: (props.warranty?.cost ?? null) as number | null,
  invoiceNo: props.warranty?.invoiceNo ?? '',
  linkedMaintenanceId: props.warranty?.linkedMaintenanceId ?? props.initialMaintenanceId ?? '',
  note: props.warranty?.note ?? '',
  attachments: (props.warranty?.attachments ?? []) as Attachment[],
  linkToReminders: props.warranty ? !!props.warranty.trackingId : true,
})

const valid = computed(() => form.name.trim() !== '' && form.endDate !== '')

function save() {
  if (!valid.value) return
  const payload = {
    name: form.name.trim(),
    provider: form.provider.trim() || undefined,
    context: form.context,
    startDate: form.startDate || undefined,
    endDate: form.endDate,
    cost: form.cost != null ? Number(form.cost) : undefined,
    invoiceNo: form.invoiceNo.trim() || undefined,
    linkedMaintenanceId: form.linkedMaintenanceId || undefined,
    note: form.note.trim() || undefined,
    attachments: form.attachments.length ? form.attachments : undefined,
    createdBy: currentUserName(),
  }

  if (props.warranty) {
    assetsStore.updateWarranty(props.asset.id, props.warranty.id, payload)
    if (form.linkToReminders && !props.warranty.trackingId) {
      assetsStore.linkSubWarranty(props.asset.id, props.warranty.id)
    }
    toast.success('تم تحديث الضمان الفرعي')
  } else {
    const id = assetsStore.addWarranty(props.asset.id, payload)
    if (id && form.linkToReminders) assetsStore.linkSubWarranty(props.asset.id, id)
    toast.success('تمت إضافة الضمان الفرعي')
  }
  emit('close')
}
</script>

<template>
  <ModalShell :title="isEdit ? 'تعديل ضمان فرعي' : `ضمان فرعي: ${asset.name}`" @close="emit('close')">
    <div class="field">
      <label>اسم الضمان / المكوّن</label>
      <input v-model="form.name" type="text" placeholder="مثال: ضمان المحرك، بطارية، إطارات..." />
    </div>

    <div class="field">
      <label>السياق</label>
      <div class="types">
        <button
          v-for="c in CONTEXTS"
          :key="c.v"
          type="button"
          class="type"
          :class="{ 'is-active': form.context === c.v }"
          @click="form.context = c.v"
        >
          {{ c.icon }} {{ c.l }}
        </button>
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label>الجهة الضامنة (اختياري)</label>
        <input v-model="form.provider" type="text" placeholder="المورّد / الوكيل" />
      </div>
      <div class="field">
        <label>رقم الفاتورة (اختياري)</label>
        <input v-model="form.invoiceNo" type="text" placeholder="—" />
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label>تاريخ البداية (اختياري)</label>
        <input v-model="form.startDate" type="date" />
      </div>
      <div class="field">
        <label>تاريخ انتهاء الضمان</label>
        <input v-model="form.endDate" type="date" />
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label>التكلفة (اختياري)</label>
        <input v-model.number="form.cost" type="number" placeholder="0" />
      </div>
      <div v-if="asset.maintenance.length" class="field">
        <label>ربط بعملية صيانة/إصلاح (اختياري)</label>
        <select v-model="form.linkedMaintenanceId" class="control">
          <option value="">— بدون —</option>
          <option v-for="m in asset.maintenance" :key="m.id" :value="m.id">
            {{ MAINT_ICON[m.type] ?? '🔧' }} {{ m.type }} · {{ m.date }}
          </option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>ملاحظة (اختياري)</label>
      <textarea v-model="form.note" rows="2" placeholder="تفاصيل التغطية أو شروط الضمان..."></textarea>
    </div>

    <div class="field">
      <label>المرفقات (فاتورة، بطاقة ضمان، صور)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <label class="check">
      <input v-model="form.linkToReminders" type="checkbox" />
      ربط بالمتابعات للتذكير قبل انتهاء الضمان
    </label>

    <p class="hint">
      ℹ️ الضمان الفرعي يبقى داخل الأصل ويُتتبَّع باستقلالية. عند ربطه بالمتابعات يظهر في التذكيرات ولوحة التحكم قبل انتهائه.
    </p>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="save">{{ isEdit ? 'حفظ' : 'إضافة' }}</BaseButton>
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
  min-inline-size: 0;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input,
  textarea,
  .control {
    inline-size: 100%;
    max-inline-size: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.row { display: flex; gap: 10px; flex-wrap: wrap; }

.types {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .type {
    flex: 1 1 auto;
    padding: 9px 12px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 12.5px;
    cursor: pointer;
    white-space: nowrap;

    &.is-active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }
  }
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
  margin-block-end: 14px;
  cursor: pointer;

  input { inline-size: 16px; block-size: 16px; accent-color: var(--primary); }
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--primary-soft);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  line-height: 1.6;
}
</style>
