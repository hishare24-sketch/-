<script setup lang="ts">
// جدول بيانات عام — يلعب دور InfiniteScrollTable في الدليل (مع ترقيم بدل التمرير اللانهائي)
export interface TableHeader {
  key: string
  label: string
  align?: 'start' | 'center' | 'end'
  width?: string
}

withDefaults(
  defineProps<{
    headers: TableHeader[]
    items: Record<string, any>[]
    loading?: boolean
    emptyText?: string
  }>(),
  { loading: false, emptyText: 'لا توجد بيانات' },
)
</script>

<template>
  <div class="data-table app-card">
    <table>
      <thead>
        <tr>
          <th
            v-for="h in headers"
            :key="h.key"
            :style="{ textAlign: h.align ?? 'start', width: h.width }"
          >
            {{ h.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="headers.length" class="data-table__state">جارٍ التحميل...</td>
        </tr>
        <tr v-else-if="!items.length">
          <td :colspan="headers.length" class="data-table__state">{{ emptyText }}</td>
        </tr>
        <tr v-for="(item, ri) in items" v-else :key="item.id ?? ri">
          <td
            v-for="h in headers"
            :key="h.key"
            :style="{ textAlign: h.align ?? 'start' }"
          >
            <slot :name="`cell.${h.key}`" :item="item" :value="item[h.key]">
              {{ item[h.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <slot name="bottom" />
  </div>
</template>

<style lang="scss" scoped>
.data-table {
  overflow-x: auto;

  table {
    inline-size: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  th {
    text-align: start;
    padding: 14px 16px;
    background: var(--bg);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 13px;
    border-block-end: 1px solid var(--border);
    white-space: nowrap;
  }

  td {
    padding: 14px 16px;
    border-block-end: 1px solid var(--border);
    color: var(--text);
  }

  tbody tr:last-child td {
    border-block-end: none;
  }

  tbody tr:hover td {
    background: var(--primary-soft);
  }

  &__state {
    text-align: center !important;
    color: var(--text-muted);
    padding: 40px 16px !important;
  }
}
</style>
