<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useAssetsStore } from '@/stores/AssetsStore'
import { CURRENT_USER } from '@/constants'
import { today } from '@/helpers/date'
import type { Asset, MaintenanceEntry } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ asset: Asset }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const assetsStore = useAssetsStore()

const TYPES: { v: MaintenanceEntry['type']; icon: string }[] = [
  { v: 'صيانة', icon: '🔧' },
  { v: 'عطل', icon: '⚠️' },
  { v: 'فحص', icon: '🔍' },
]

const form = reactive({
  type: 'صيانة' as MaintenanceEntry['type'],
  date: today(),
  cost: null as number | null,
  note: '',
})

const valid = computed(() => form.cost != null && form.cost >= 0)

function save() {
  if (!valid.value) return
  assetsStore.addMaintenance(props.asset.id, {
    type: form.type,
    date: form.date,
    cost: Number(form.cost),
    note: form.note.trim(),
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
        <button v-for="t in TYPES" :key="t.v" type="button" class="type" :class="{ 'is-active': form.type === t.v }" @click="form.type = t.v">
          {{ t.icon }} {{ t.v }}
        </button>
      </div>
    </div>
    <div class="field">
      <label>التاريخ</label>
      <input v-model="form.date" type="date" />
    </div>
    <div class="field">
      <label>التكلفة (ر.س)</label>
      <input v-model.number="form.cost" type="number" placeholder="0" />
    </div>
    <div class="field">
      <label>الوصف</label>
      <textarea v-model="form.note" rows="2" placeholder="تفاصيل الصيانة أو العطل..."></textarea>
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

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input, textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

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
