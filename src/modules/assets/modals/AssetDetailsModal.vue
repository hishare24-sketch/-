<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { assetMaintCost } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { ASSET_CATEGORIES, ASSET_STATUS } from '@/constants'
import type { Asset } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ asset: Asset }>()
const emit = defineEmits<{ (e: 'maintain', a: Asset): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const project = computed(() => projectsStore.projectById(props.asset.projectId))
const catLabel = computed(() => ASSET_CATEGORIES.find((c) => c.id === props.asset.category)?.label)
const holder = computed(() => (props.asset.memberId ? projectsStore.memberById(props.asset.memberId)?.name : null))

const maintIcon: Record<string, string> = { صيانة: '🔧', عطل: '⚠️', فحص: '🔍' }
</script>

<template>
  <ModalShell :title="asset.name" wide @close="emit('close')">
    <div class="head">
      <span class="head__value">{{ fmt(asset.purchaseValue) }}</span>
      <span class="head__status" :style="{ background: ASSET_STATUS[asset.status].bg, color: ASSET_STATUS[asset.status].color }">
        {{ ASSET_STATUS[asset.status].label }}
      </span>
    </div>

    <table class="rows">
      <tr><td class="rows__key">الفئة</td><td>{{ catLabel }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr><td class="rows__key">تاريخ الشراء</td><td>{{ asset.purchaseDate }}</td></tr>
      <tr v-if="asset.supplier"><td class="rows__key">المورّد</td><td>{{ asset.supplier }}</td></tr>
      <tr v-if="asset.warrantyEnd"><td class="rows__key">انتهاء الضمان</td><td>{{ asset.warrantyEnd }}</td></tr>
      <tr v-if="asset.serial"><td class="rows__key">الرقم التسلسلي</td><td>{{ asset.serial }}</td></tr>
      <tr v-if="asset.usageMeter != null"><td class="rows__key">العداد</td><td>{{ fmtNum(asset.usageMeter) }} {{ asset.usageUnit }}</td></tr>
      <tr v-if="holder"><td class="rows__key">المسؤول</td><td>{{ holder }}</td></tr>
      <tr><td class="rows__key">إجمالي الصيانة</td><td>{{ fmt(assetMaintCost(asset)) }}</td></tr>
      <tr v-if="asset.note"><td class="rows__key">ملاحظات</td><td>{{ asset.note }}</td></tr>
    </table>

    <div class="maint">
      <span class="maint__label">سجل الصيانة ({{ asset.maintenance.length }})</span>
      <div v-if="!asset.maintenance.length" class="maint__empty">لا توجد سجلات صيانة.</div>
      <div v-for="m in asset.maintenance" :key="m.id" class="maint-row">
        <span class="maint-row__icon">{{ maintIcon[m.type] }}</span>
        <div class="maint-row__info">
          <span class="maint-row__top">{{ m.type }} — {{ fmt(m.cost) }}</span>
          <span class="maint-row__meta">{{ m.date }}{{ m.note ? ` · ${m.note}` : '' }}</span>
        </div>
      </div>
    </div>

    <div v-if="asset.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="asset.attachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
      <button class="app-btn" @click="emit('maintain', asset)">🔧 تسجيل صيانة</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-block-end: 18px;

  &__value { font-size: 22px; font-weight: 800; }

  &__status {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
  }
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }

  &__key { color: var(--text-muted); inline-size: 140px; }
}

.maint {
  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
}

.maint-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-block: 8px;

  &__icon { font-size: 18px; }
  &__info { display: flex; flex-direction: column; }
  &__top { font-weight: 600; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
