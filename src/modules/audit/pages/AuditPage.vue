<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuditStore } from '@/stores/AuditStore'

const auditStore = useAuditStore()
const { entries } = storeToRefs(auditStore)

const search = ref('')
const filtered = computed(() =>
  entries.value.filter((e) =>
    search.value.trim() === ''
      ? true
      : (e.action + e.entity + e.detail + e.user).includes(search.value.trim()),
  ),
)

const actionColor: Record<string, string> = {
  إنشاء: '#059669',
  تعديل: '#0891b2',
  حذف: '#dc2626',
  اعتماد: '#059669',
  رفض: '#dc2626',
  تحصيل: '#059669',
  سداد: '#d97706',
  دفع: '#d97706',
}
const colorOf = (a: string) => actionColor[a] ?? '#6b7280'
</script>

<template>
  <section class="audit">
    <header class="audit__header">
      <div>
        <h1>سجل العمليات</h1>
        <p>سجل بكل الأحداث والعمليات المهمة في النظام</p>
      </div>
    </header>

    <input v-model="search" type="text" placeholder="🔍 بحث في السجل..." class="search" />

    <div class="app-card timeline">
      <div v-if="!filtered.length" class="empty">لا توجد سجلات مطابقة.</div>
      <div v-for="e in filtered" :key="e.id" class="entry">
        <span class="entry__action" :style="{ background: colorOf(e.action) + '18', color: colorOf(e.action) }">
          {{ e.action }}
        </span>
        <div class="entry__body">
          <span class="entry__detail">
            <strong>{{ e.entity }}:</strong> {{ e.detail }}
          </span>
          <span class="entry__meta">{{ e.user }} · {{ e.ts }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.audit {
  max-inline-size: 800px;

  &__header {
    margin-block-end: 20px;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }
}

.search {
  inline-size: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  margin-block-end: 16px;
  &:focus { outline: none; border-color: var(--primary); }
}

.timeline {
  padding: 8px 20px;
}

.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-muted);
}

.entry {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-block-end: 1px solid var(--border);

  &:last-child { border-block-end: none; }

  &__action {
    font-size: 12px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 20px;
    flex-shrink: 0;
    min-inline-size: 64px;
    text-align: center;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__detail { font-size: 13px; }
  &__meta { font-size: 11px; color: var(--text-muted); }
}
</style>
