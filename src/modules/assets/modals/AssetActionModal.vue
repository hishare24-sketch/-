<script lang="ts">
export type AssetActionKind = 'meter' | 'transfer' | 'status' | 'periodic' | 'sell'
</script>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { ASSET_STATUS } from '@/constants'
import { today } from '@/helpers/date'
import type { Asset, AssetStatus, AssetPeriodic } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton } from '@/components/base'

const props = defineProps<{ asset: Asset; kind: AssetActionKind }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const assetsStore = useAssetsStore()
const projectsStore = useProjectsStore()
const members = computed(() => projectsStore.membersByProject(props.asset.projectId))

const TITLES: Record<AssetActionKind, string> = {
  meter: 'تحديث العداد',
  transfer: 'نقل المسؤول / العهدة',
  status: 'تغيير الحالة',
  periodic: 'جدولة صيانة دورية',
  sell: 'بيع الأصل',
}

const STATUS_LIST = Object.keys(ASSET_STATUS) as AssetStatus[]
const UNITS: AssetPeriodic['unit'][] = ['يوم', 'أسبوع', 'شهر', 'سنة']

const form = reactive({
  meter: (props.asset.usageMeter ?? null) as number | null,
  memberId: props.asset.memberId ?? '',
  status: props.asset.status as AssetStatus,
  statusNote: '',
  every: props.asset.periodic?.every ?? 6,
  unit: (props.asset.periodic?.unit ?? 'شهر') as AssetPeriodic['unit'],
  nextDue: props.asset.periodic?.nextDue ?? today(),
  saleAmount: null as number | null,
  saleDate: today(),
})

const valid = computed(() => {
  if (props.kind === 'meter') return form.meter != null && form.meter >= 0
  if (props.kind === 'sell') return form.saleAmount != null && form.saleAmount >= 0
  if (props.kind === 'periodic') return form.every > 0 && !!form.nextDue
  return true
})

function submit() {
  if (!valid.value) return
  const id = props.asset.id
  if (props.kind === 'meter') assetsStore.updateMeter(id, Number(form.meter), props.asset.usageUnit)
  else if (props.kind === 'transfer') assetsStore.transferHolder(id, form.memberId)
  else if (props.kind === 'status') assetsStore.setStatus(id, form.status, form.statusNote.trim() || undefined)
  else if (props.kind === 'periodic') assetsStore.setPeriodic(id, { every: Number(form.every), unit: form.unit, nextDue: form.nextDue })
  else if (props.kind === 'sell') assetsStore.sellAsset(id, Number(form.saleAmount), form.saleDate)
  emit('close')
}
</script>

<template>
  <ModalShell :title="`${TITLES[kind]}: ${asset.name}`" @close="emit('close')">
    <!-- تحديث العداد -->
    <div v-if="kind === 'meter'" class="field">
      <label>قراءة العداد الحالية ({{ asset.usageUnit || 'وحدة' }})</label>
      <input v-model.number="form.meter" type="number" placeholder="0" />
    </div>

    <!-- نقل المسؤول -->
    <div v-else-if="kind === 'transfer'" class="field">
      <label>المسؤول / الحائز الجديد</label>
      <select v-model="form.memberId">
        <option value="">بدون</option>
        <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>

    <!-- تغيير الحالة -->
    <template v-else-if="kind === 'status'">
      <div class="field">
        <label>الحالة الجديدة</label>
        <div class="chips">
          <button
            v-for="s in STATUS_LIST"
            :key="s"
            type="button"
            class="chip"
            :class="{ 'is-active': form.status === s }"
            :style="form.status === s ? { background: ASSET_STATUS[s].bg, color: ASSET_STATUS[s].color } : {}"
            @click="form.status = s"
          >
            {{ ASSET_STATUS[s].label }}
          </button>
        </div>
      </div>
      <div class="field">
        <label>ملاحظة (اختياري)</label>
        <input v-model="form.statusNote" type="text" placeholder="سبب تغيير الحالة" />
      </div>
    </template>

    <!-- صيانة دورية -->
    <template v-else-if="kind === 'periodic'">
      <div class="row">
        <div class="field">
          <label>كل</label>
          <input v-model.number="form.every" type="number" min="1" />
        </div>
        <div class="field">
          <label>الوحدة</label>
          <select v-model="form.unit"><option v-for="u in UNITS" :key="u" :value="u">{{ u }}</option></select>
        </div>
      </div>
      <div class="field">
        <label>موعد الصيانة القادمة</label>
        <input v-model="form.nextDue" type="date" />
      </div>
      <p class="hint">ℹ️ يظهر الموعد ضمن تنبيهات الأصل، ويُجدَّد تلقائياً عند تسجيل صيانة «دورية».</p>
    </template>

    <!-- بيع -->
    <template v-else>
      <div class="row">
        <div class="field">
          <label>مبلغ البيع (ر.س)</label>
          <input v-model.number="form.saleAmount" type="number" placeholder="0" />
        </div>
        <div class="field">
          <label>تاريخ البيع</label>
          <input v-model="form.saleDate" type="date" />
        </div>
      </div>
      <p class="hint">ℹ️ يُسجَّل المبلغ كإيراد فعلي في مالية المشروع، وتتحوّل حالة الأصل إلى «مُباع».</p>
    </template>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إلغاء</BaseButton>
      <BaseButton :disabled="!valid" @click="submit">تأكيد</BaseButton>
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

  input, select {
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

.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;

  &.is-active { border-color: transparent; font-weight: 600; }
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
