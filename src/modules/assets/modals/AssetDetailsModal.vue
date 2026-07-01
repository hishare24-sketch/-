<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { assetMaintCost } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { daysBetween } from '@/helpers/date'
import { ASSET_CATEGORIES, ASSET_STATUS, ASSET_FIELD_SCHEMAS } from '@/constants'
import type { Asset, AssetEventKind, AssetWarranty } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import MaintenanceModal from './MaintenanceModal.vue'
import AssetActionModal, { type AssetActionKind } from './AssetActionModal.vue'
import AssetWarrantyModal from './AssetWarrantyModal.vue'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ asset: Asset }>()
const emit = defineEmits<{ (e: 'edit', a: Asset): void; (e: 'close'): void }>()

const assetsStore = useAssetsStore()
const projectsStore = useProjectsStore()
const toast = useToast()

// ── الضمانات الفرعية ──
const WARRANTY_CTX: Record<string, string> = {
  purchase: 'من الشراء', component: 'مكوّن', maintenance: 'صيانة', repair: 'إصلاح', other: 'أخرى',
}
function warrantyState(w: AssetWarranty) {
  const d = daysBetween(w.endDate)
  const cls = d < 0 ? 'is-danger' : d <= 30 ? 'is-warn' : 'is-ok'
  return { d, cls, label: d < 0 ? `منتهٍ منذ ${Math.abs(d)} يوم` : `يتبقّى ${d} يوم` }
}
const subWarranties = computed(() => props.asset.warranties ?? [])

const editingWarranty = ref<AssetWarranty | null>(null)
const showWarrantyForm = ref(false)
function openAddWarranty() {
  editingWarranty.value = null
  showWarrantyForm.value = true
}
function openEditWarranty(w: AssetWarranty) {
  editingWarranty.value = w
  showWarrantyForm.value = true
}
function closeWarrantyForm() {
  showWarrantyForm.value = false
  editingWarranty.value = null
}
function linkSubWarranty(w: AssetWarranty) {
  if (assetsStore.linkSubWarranty(props.asset.id, w.id)) toast.success('تم ربط الضمان بالمتابعات ✅')
}
function removeWarranty(w: AssetWarranty) {
  assetsStore.removeWarranty(props.asset.id, w.id)
  toast.info('تم حذف الضمان الفرعي')
}
function maintLabel(id?: string) {
  if (!id) return ''
  const m = props.asset.maintenance.find((x) => x.id === id)
  return m ? `${m.type} · ${m.date}` : ''
}

const cat = computed(() => ASSET_CATEGORIES.find((c) => c.id === props.asset.category))
const project = computed(() => projectsStore.projectById(props.asset.projectId))
const holder = computed(() => (props.asset.memberId ? projectsStore.memberById(props.asset.memberId)?.name : null))
const specFields = computed(() => ASSET_FIELD_SCHEMAS[props.asset.category].filter((f) => props.asset.specs?.[f.key]))

// حالة الضمان
const warranty = computed(() => {
  if (!props.asset.warrantyEnd) return null
  const d = daysBetween(props.asset.warrantyEnd)
  const cls = d < 0 ? 'is-danger' : d <= 30 ? 'is-warn' : 'is-ok'
  return { d, cls, label: d < 0 ? 'منتهٍ' : `${d} يوم` }
})

// المرفقات المجمّعة (الأصل + مرفقات الصيانة + مرفقات الضمانات الفرعية)
const allAttachments = computed(() => [
  ...(props.asset.attachments ?? []),
  ...props.asset.maintenance.flatMap((m) => m.attachments ?? []),
  ...(props.asset.warranties ?? []).flatMap((w) => w.attachments ?? []),
])

// الخط الزمني: صيانة + أحداث مدمجة ومرتّبة
const MAINT_ICON: Record<string, string> = { صيانة: '🔧', إصلاح: '🛠️', عطل: '⚠️', فحص: '🔍', دورية: '🔁' }
const EVENT_ICON: Record<AssetEventKind, string> = {
  status: '🏷️', transfer: '👤', meter: '📊', sale: '💰', warranty: '🛡️', periodic: '🔁', note: '📝',
}
interface TimelineItem { id: string; date: string; icon: string; title: string; meta: string; cost?: number; atts?: number }
const timeline = computed<TimelineItem[]>(() => {
  const fromMaint: TimelineItem[] = props.asset.maintenance.map((m) => ({
    id: m.id,
    date: m.date,
    icon: MAINT_ICON[m.type] ?? '🔧',
    title: m.type,
    meta: m.note || '—',
    cost: m.cost,
    atts: m.attachments?.length ?? 0,
  }))
  const fromEvents: TimelineItem[] = (props.asset.events ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    icon: EVENT_ICON[e.kind] ?? '•',
    title: e.text,
    meta: e.createdBy ?? '',
  }))
  return [...fromMaint, ...fromEvents].sort((x, y) => y.date.localeCompare(x.date))
})

// الأكشنات (مركز الإجراءات) — تظهر حسب طبيعة الأصل وحالته
const hasMeter = computed(() => !!props.asset.usageUnit)
const canLinkWarranty = computed(() => !!props.asset.warrantyEnd && !props.asset.trackingId)

// المودالات الفرعية
const showMaint = ref(false)
const actionKind = ref<AssetActionKind | null>(null)
const flash = ref('')

function linkWarranty() {
  if (assetsStore.linkWarranty(props.asset.id)) {
    flash.value = 'تم ربط الضمان بالمتابعات ✅'
    setTimeout(() => (flash.value = ''), 2500)
  }
}
</script>

<template>
  <ModalShell :title="asset.name" wide @close="emit('close')">
    <!-- الترويسة -->
    <div class="head">
      <span class="head__icon">{{ cat?.icon }}</span>
      <div class="head__main">
        <span class="head__value">{{ fmt(asset.purchaseValue) }}</span>
        <span class="head__cat">{{ cat?.label }} · {{ project?.name }}</span>
      </div>
      <span class="head__status" :style="{ background: ASSET_STATUS[asset.status].bg, color: ASSET_STATUS[asset.status].color }">
        {{ ASSET_STATUS[asset.status].label }}
      </span>
    </div>

    <!-- مركز الإجراءات -->
    <div class="actions">
      <button class="act act--primary" @click="showMaint = true">🔧 صيانة / عطل</button>
      <button class="act" @click="openAddWarranty">🛡️ ضمان فرعي</button>
      <button v-if="hasMeter" class="act" @click="actionKind = 'meter'">📊 تحديث العداد</button>
      <button class="act" @click="actionKind = 'periodic'">🔁 صيانة دورية</button>
      <button v-if="canLinkWarranty" class="act" @click="linkWarranty">🛡️ ربط الضمان</button>
      <button class="act" @click="actionKind = 'transfer'">👤 نقل المسؤول</button>
      <button class="act" @click="actionKind = 'status'">🏷️ تغيير الحالة</button>
      <button v-if="asset.status !== 'sold'" class="act" @click="actionKind = 'sell'">💰 بيع</button>
      <button class="act" @click="emit('edit', asset)">✎ تعديل</button>
    </div>
    <div v-if="flash" class="flash">{{ flash }}</div>

    <!-- شارات التنبيه -->
    <div class="chips">
      <span v-if="warranty" class="chip" :class="warranty.cls">🛡️ الضمان: {{ warranty.label }}</span>
      <span v-if="asset.trackingId" class="chip is-ok">🔗 مرتبط بالمتابعات</span>
      <span v-if="asset.periodic" class="chip is-info">🔁 دورية كل {{ asset.periodic.every }} {{ asset.periodic.unit }} · التالية {{ asset.periodic.nextDue }}</span>
      <span v-if="holder" class="chip is-neutral">👤 {{ holder }}</span>
    </div>

    <!-- التفاصيل + الحقول حسب الطبيعة -->
    <table class="rows">
      <tr><td class="rows__key">تاريخ الشراء</td><td>{{ asset.purchaseDate }}</td></tr>
      <tr v-if="asset.supplier"><td class="rows__key">المورّد</td><td>{{ asset.supplier }}</td></tr>
      <tr v-if="asset.warrantyEnd"><td class="rows__key">انتهاء الضمان</td><td>{{ asset.warrantyEnd }}</td></tr>
      <tr v-if="asset.serial"><td class="rows__key">الرقم التسلسلي</td><td>{{ asset.serial }}</td></tr>
      <tr v-if="asset.usageMeter != null"><td class="rows__key">العداد</td><td>{{ fmtNum(asset.usageMeter) }} {{ asset.usageUnit }}</td></tr>
      <tr v-for="f in specFields" :key="f.key"><td class="rows__key">{{ f.label }}</td><td>{{ asset.specs?.[f.key] }}</td></tr>
      <tr><td class="rows__key">إجمالي الصيانة</td><td>{{ fmt(assetMaintCost(asset)) }}</td></tr>
      <tr v-if="asset.saleValue != null"><td class="rows__key">قيمة البيع</td><td>{{ fmt(asset.saleValue) }} · {{ asset.saleDate }}</td></tr>
      <tr v-if="asset.note"><td class="rows__key">ملاحظات</td><td>{{ asset.note }}</td></tr>
    </table>

    <!-- الضمانات الفرعية -->
    <div class="warr">
      <div class="warr__head">
        <span class="warr__label">🛡️ الضمانات الفرعية ({{ subWarranties.length }})</span>
        <button class="warr__add" @click="openAddWarranty">＋ إضافة ضمان</button>
      </div>
      <div v-if="!subWarranties.length" class="warr__empty">
        لا توجد ضمانات فرعية. أضِف ضماناً لأي مكوّن أو إصلاح (لكلٍّ فاتورته وتاريخ انتهائه ومرفقاته).
      </div>
      <div v-for="w in subWarranties" :key="w.id" class="wcard">
        <div class="wcard__top">
          <span class="wcard__name">{{ w.name }}</span>
          <span class="wcard__state" :class="warrantyState(w).cls">{{ warrantyState(w).label }}</span>
        </div>
        <div class="wcard__meta">
          <span class="wtag">{{ WARRANTY_CTX[w.context] ?? w.context }}</span>
          <span v-if="w.provider">🏢 {{ w.provider }}</span>
          <span>⏳ ينتهي {{ w.endDate }}</span>
          <span v-if="w.cost">💰 {{ fmt(w.cost) }}</span>
          <span v-if="w.invoiceNo">🧾 {{ w.invoiceNo }}</span>
          <span v-if="w.linkedMaintenanceId">🔧 {{ maintLabel(w.linkedMaintenanceId) }}</span>
          <span v-if="w.attachments?.length" class="wtag">📎 {{ w.attachments.length }}</span>
          <span v-if="w.trackingId" class="wtag is-linked">🔗 بالمتابعات</span>
        </div>
        <div class="wcard__actions">
          <button v-if="!w.trackingId" class="wbtn" @click="linkSubWarranty(w)">🔔 تذكير</button>
          <button class="wbtn" @click="openEditWarranty(w)">✎ تعديل</button>
          <button class="wbtn is-danger" @click="removeWarranty(w)">🗑️ حذف</button>
        </div>
      </div>
    </div>

    <!-- الخط الزمني -->
    <div class="tl">
      <span class="tl__label">السجل الزمني ({{ timeline.length }})</span>
      <div v-if="!timeline.length" class="tl__empty">لا توجد أحداث بعد.</div>
      <div v-for="t in timeline" :key="t.id" class="tl-row">
        <span class="tl-row__icon">{{ t.icon }}</span>
        <div class="tl-row__info">
          <span class="tl-row__title">
            {{ t.title }}
            <span v-if="t.cost" class="tl-row__cost">{{ fmt(t.cost) }}</span>
            <span v-if="t.atts" class="tl-row__clip">📎{{ t.atts }}</span>
          </span>
          <span class="tl-row__meta">{{ t.date }}{{ t.meta ? ` · ${t.meta}` : '' }}</span>
        </div>
      </div>
    </div>

    <!-- المرفقات المجمّعة -->
    <div v-if="allAttachments.length" class="atts">
      <span class="atts__label">المرفقات ({{ allAttachments.length }})</span>
      <AttachmentsField :model-value="allAttachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
      <button class="app-btn" @click="showMaint = true">🔧 تسجيل صيانة</button>
    </template>

    <!-- مودالات فرعية -->
    <MaintenanceModal v-if="showMaint" :asset="asset" @close="showMaint = false" />
    <AssetActionModal v-if="actionKind" :asset="asset" :kind="actionKind" @close="actionKind = null" />
    <AssetWarrantyModal
      v-if="showWarrantyForm"
      :asset="asset"
      :warranty="editingWarranty ?? undefined"
      @close="closeWarrantyForm"
    />
  </ModalShell>
</template>

<style lang="scss" scoped>
.head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-block-end: 16px;

  &__icon { font-size: 32px; }
  &__main { flex: 1; display: flex; flex-direction: column; }
  &__value { font-size: 22px; font-weight: 800; }
  &__cat { font-size: 12.5px; color: var(--text-muted); }

  &__status { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
}

.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin-block-end: 12px;
}

.act {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover { border-color: var(--primary); color: var(--primary); }
  &--primary { background: var(--primary); color: #fff; border-color: var(--primary); &:hover { color: #fff; opacity: 0.9; } }
}

.flash {
  padding: 9px 14px;
  background: var(--ok-bg);
  color: var(--ok-text);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  margin-block-end: 12px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-block-end: 16px;
}

.chip {
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;

  &.is-ok { background: var(--ok-bg); color: var(--ok-text); }
  &.is-warn { background: var(--warn-bg); color: var(--warn-text); }
  &.is-danger { background: var(--danger-bg); color: var(--danger-text); }
  &.is-info { background: var(--info-bg); color: var(--info-text); }
  &.is-neutral { background: var(--bg); color: var(--text-muted); }
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }
  &__key { color: var(--text-muted); inline-size: 150px; }
}

// ── الضمانات الفرعية ──
.warr {
  margin-block-end: 18px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 10px;
  }

  &__label { font-size: 13px; font-weight: 600; }

  &__add {
    border: 1px dashed var(--border);
    background: transparent;
    color: var(--primary);
    border-radius: var(--radius-sm);
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    &:hover { border-color: var(--primary); }
  }

  &__empty {
    font-size: 12.5px;
    color: var(--text-muted);
    background: var(--bg);
    border-radius: var(--radius-sm);
    padding: 12px 14px;
    line-height: 1.6;
  }
}

.wcard {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-block-end: 8px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-block-end: 8px;
  }

  &__name { font-weight: 600; font-size: 13.5px; }

  &__state {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 20px;
    flex-shrink: 0;

    &.is-ok { background: var(--ok-bg); color: var(--ok-text); }
    &.is-warn { background: var(--warn-bg); color: var(--warn-text); }
    &.is-danger { background: var(--danger-bg); color: var(--danger-text); }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 11.5px;
    color: var(--text-muted);
    margin-block-end: 10px;
  }

  &__actions { display: flex; gap: 6px; flex-wrap: wrap; }
}

.wtag {
  background: var(--surface-2);
  border-radius: 20px;
  padding: 1px 8px;
  color: var(--text-muted);

  &.is-linked { background: var(--ok-bg); color: var(--ok-text); }
}

.wbtn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-family: inherit;
  cursor: pointer;

  &:hover { border-color: var(--primary); color: var(--primary); }
  &.is-danger:hover { border-color: var(--error); color: var(--error); }
}

.tl {
  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
}

.tl-row {
  display: flex;
  gap: 12px;
  padding-block: 9px;
  border-block-end: 1px solid var(--border);

  &:last-child { border-block-end: none; }

  &__icon { font-size: 18px; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 2px; min-inline-size: 0; }
  &__title { font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  &__cost { font-weight: 700; color: var(--danger-text); font-size: 12.5px; }
  &__clip { font-size: 11px; color: var(--primary); }
  &__meta { font-size: 12px; color: var(--text-muted); }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
