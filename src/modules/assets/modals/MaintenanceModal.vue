<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { CURRENT_USER, MAINT_TYPES } from '@/constants'
import { today } from '@/helpers/date'
import type { Asset, MaintenanceEntry, Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

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
})

const showMeter = computed(() => props.asset.usageUnit != null && props.asset.usageUnit !== '')
const valid = computed(() => form.cost != null && form.cost >= 0)

function save() {
  if (!valid.value) return
  assetsStore.addMaintenance(props.asset.id, {
    type: form.type,
    date: form.date,
    cost: Number(form.cost),
    meter: form.meter != null ? Number(form.meter) : undefined,
    note: form.note.trim(),
    attachments: form.attachments,
    createdBy: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <ModalShell :title="`صيانة: ${asset.name}`" @close="emit('close')">
    <div class="field">
      <label>النوع</label>
      <div class="types">
        <button v-for="t in MAINT_TYPES" :key="t.v" type="button" class="type" :class="{ 'is-active': form.type === t.v }" @click="form.type = t.v">
          {{ t.icon }} {{ t.v }}
        </button>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <label>التاريخ</label>
        <input v-model="form.date" type="date" />
      </div>
      <div class="field">
        <label>التكلفة (ر.س)</label>
        <input v-model.number="form.cost" type="number" placeholder="0" />
      </div>
    </div>
    <div v-if="showMeter" class="field">
      <label>قراءة العداد ({{ asset.usageUnit }}) — اختياري</label>
      <input v-model.number="form.meter" type="number" placeholder="0" />
    </div>
    <div class="field">
      <label>الوصف</label>
      <textarea v-model="form.note" rows="2" placeholder="تفاصيل الصيانة أو العطل..."></textarea>
    </div>

    <div class="field">
      <label>المرفقات (فاتورة، تقرير فحص، صور)</label>
      <AttachmentsField v-model="form.attachments" />
    </div>

    <p class="hint">ℹ️ ستُسجّل التكلفة كمصروف فعلي في الإدارة المالية للمشروع.</p>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!valid" @click="save">تسجيل</button>
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

  input, textarea {
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
</style>
