<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { assetMaintCost } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { daysBetween } from '@/helpers/date'
import { ASSET_CATEGORIES, ASSET_STATUS } from '@/constants'
import { useFocusHighlight } from '@/composables/useFocusHighlight'
import type { Asset, AssetCategory } from '@/interfaces/models'
import ConfirmModal from '@/components/shared/ConfirmModal.vue'
import AssetFormModal from '../modals/AssetFormModal.vue'
import AssetDetailsModal from '../modals/AssetDetailsModal.vue'
import { BaseButton } from '@/components/base'

const assetsStore = useAssetsStore()
const projectsStore = useProjectsStore()
const { assets } = storeToRefs(assetsStore)
const { activeProjectId } = storeToRefs(projectsStore)

const catTab = ref<'all' | AssetCategory>('all')
const search = ref('')
const fProject = ref('all')
const fStatus = ref('all')
const sort = ref<'newest' | 'valueHigh' | 'valueLow'>('newest')
const projects = computed(() => projectsStore.projects)

const filtered = computed(() =>
  assets.value
    .filter((a) => (catTab.value === 'all' ? true : a.category === catTab.value))
    .filter((a) => (fProject.value === 'all' ? true : a.projectId === fProject.value))
    .filter((a) => (fStatus.value === 'all' ? true : a.status === fStatus.value))
    .filter((a) => (search.value.trim() === '' ? true : a.name.includes(search.value.trim())))
    .slice()
    .sort((a, b) =>
      sort.value === 'valueHigh'
        ? b.purchaseValue - a.purchaseValue
        : sort.value === 'valueLow'
          ? a.purchaseValue - b.purchaseValue
          : b.purchaseDate.localeCompare(a.purchaseDate),
    ),
)

const totalValue = computed(() => assets.value.reduce((s, a) => s + a.purchaseValue, 0))
const totalMaint = computed(() => assets.value.reduce((s, a) => s + assetMaintCost(a), 0))

const stats = computed(() => [
  { label: 'عدد الأصول', value: String(assets.value.length), icon: '📦', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  { label: 'إجمالي القيمة', value: fmt(totalValue.value), icon: '💎', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  { label: 'تكاليف الصيانة', value: fmt(totalMaint.value), icon: '🔧', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
  { label: 'تحت الصيانة', value: String(assets.value.filter((a) => a.status === 'maintenance').length), icon: '⚠️', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
])

const catInfo = (c: AssetCategory) => ASSET_CATEGORIES.find((x) => x.id === c)!
const { isFocused } = useFocusHighlight()

// تتبّع الضمان: حالة الضمان حسب الأيام المتبقية
function warrantyInfo(a: Asset) {
  if (!a.warrantyEnd) return null
  const d = daysBetween(a.warrantyEnd)
  if (d < 0) return { label: 'الضمان منتهٍ', days: d, color: 'var(--danger-text)', bg: 'var(--danger-bg)' }
  if (d <= 30) return { label: `الضمان: ${d} يوم`, days: d, color: 'var(--warn-text)', bg: 'var(--warn-bg)' }
  return { label: 'الضمان ساري', days: d, color: 'var(--ok-text)', bg: 'var(--ok-bg)' }
}
const holderName = (a: Asset) => (a.memberId ? projectsStore.memberById(a.memberId)?.name : null)

// المودالات
const showForm = ref(false)
const editing = ref<Asset | null>(null)
const viewing = ref<Asset | null>(null)
const confirmRef = ref<InstanceType<typeof ConfirmModal>>()

function openCreate() {
  editing.value = null
  showForm.value = true
}
function onEdit(a: Asset) {
  viewing.value = null
  editing.value = a
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editing.value = null
}

async function onDelete(a: Asset) {
  const ok = await confirmRef.value?.open({ title: 'حذف الأصل', message: `حذف "${a.name}"؟` })
  if (ok) assetsStore.deleteAsset(a.id)
}
</script>

<template>
  <section class="assets">
    <header class="assets__header">
      <div>
        <h1>الأصول <HelpIcon section="assets" /></h1>
        <p>الأصول الملموسة وسجل الصيانة والضمانات</p>
      </div>
      <BaseButton @click="openCreate">＋ أصل جديد</BaseButton>
    </header>

    <div class="assets__stats">
      <div v-for="(s, i) in stats" :key="i" class="stat app-card">
        <div>
          <span class="stat__label">{{ s.label }}</span>
          <span class="stat__value">{{ s.value }}</span>
        </div>
        <span class="stat__icon" :style="{ background: s.bg, color: s.color }">{{ s.icon }}</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tabs__btn" :class="{ 'is-active': catTab === 'all' }" @click="catTab = 'all'">الكل</button>
      <button v-for="c in ASSET_CATEGORIES" :key="c.id" class="tabs__btn" :class="{ 'is-active': catTab === c.id }" @click="catTab = c.id">
        {{ c.icon }} {{ c.label }}
      </button>
    </div>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث..." class="filters__search" />
      <select v-model="fProject" class="filters__select">
        <option value="all">كل المشاريع</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="fStatus" class="filters__select">
        <option value="all">كل الحالات</option>
        <option v-for="(s, key) in ASSET_STATUS" :key="key" :value="key">{{ s.label }}</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="newest">الأحدث شراءً</option>
        <option value="valueHigh">الأعلى قيمة</option>
        <option value="valueLow">الأقل قيمة</option>
      </select>
    </div>

    <div class="grid">
      <div v-if="!filtered.length" class="empty app-card">لا توجد أصول مطابقة.</div>
      <div v-for="a in filtered" :key="a.id" class="asset app-card" :class="{ 'is-focused': isFocused(a.id) }" :data-focus="a.id">
        <div class="asset__top">
          <span class="asset__icon">{{ catInfo(a.category).icon }}</span>
          <span class="asset__status" :style="{ background: ASSET_STATUS[a.status].bg, color: ASSET_STATUS[a.status].color }">
            {{ ASSET_STATUS[a.status].label }}
          </span>
        </div>

        <span class="asset__name asset__clickable" role="button" tabindex="0" @click="viewing = a" @keydown.enter="viewing = a" @keydown.space.prevent="viewing = a">
          {{ a.name }}
          <span v-if="a.attachments?.length" class="asset__clip" title="مرفقات">📎{{ a.attachments.length }}</span>
        </span>
        <span class="asset__meta">{{ catInfo(a.category).label }} · {{ projectsStore.projectById(a.projectId)?.name }}</span>

        <!-- تتبّع: شارات الضمان والمسؤول -->
        <div class="asset__chips">
          <span v-if="warrantyInfo(a)" class="chip" :style="{ background: warrantyInfo(a)!.bg, color: warrantyInfo(a)!.color }">
            🛡️ {{ warrantyInfo(a)!.label }}
          </span>
          <span v-if="holderName(a)" class="chip chip--neutral">👤 {{ holderName(a) }}</span>
        </div>

        <div class="asset__rows">
          <div><span>القيمة</span><strong>{{ fmt(a.purchaseValue) }}</strong></div>
          <div v-if="a.usageMeter != null"><span>العداد</span><strong>{{ fmtNum(a.usageMeter) }} {{ a.usageUnit }}</strong></div>
          <div><span>الصيانة ({{ a.maintenance.length }})</span><strong>{{ fmt(assetMaintCost(a)) }}</strong></div>
        </div>

        <!-- مدخل واحد واضح لإدارة الأصل (صيانة وكل الإجراءات بالداخل) + اختصارات -->
        <div class="asset__actions">
          <BaseButton class="act-btn" @click="viewing = a">⚙️ استعراض وإدارة</BaseButton>
          <button class="icon-btn" title="تعديل" @click="onEdit(a)">✎</button>
          <button class="icon-btn icon-btn--danger" title="حذف" @click="onDelete(a)">🗑️</button>
        </div>
      </div>
    </div>

    <AssetFormModal v-if="showForm" :project-id="activeProjectId" :asset="editing" @close="closeForm" />
    <AssetDetailsModal v-if="viewing" :asset="viewing" @edit="onEdit" @close="viewing = null" />
    <ConfirmModal ref="confirmRef" />
  </section>
</template>

<style lang="scss" scoped>
.assets {
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
    padding: 7px 16px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.empty {
  grid-column: 1 / -1;
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.asset {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__icon { font-size: 26px; }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }

  &__name { font-weight: 700; font-size: 15px; margin-block-start: 4px; }
  &__clickable { cursor: pointer; }
  &__clip { font-size: 11px; color: var(--primary); margin-inline-start: 6px; }
  &__meta { font-size: 12px; color: var(--text-muted); }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-block-start: 10px;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-block: 10px;
    padding-block: 10px;
    border-block: 1px solid var(--border);

    div {
      display: flex;
      justify-content: space-between;
      font-size: 12px;

      span { color: var(--text-muted); }
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}

.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;

  &--neutral { background: var(--bg); color: var(--text-muted); }
}

.act-btn {
  flex: 1;
  padding: 8px;
  font-size: 12.5px;
}

.icon-btn {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 13px;

  &--danger:hover { border-color: var(--error); color: var(--error); }
}
</style>
