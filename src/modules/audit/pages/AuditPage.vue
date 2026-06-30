<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import HelpIcon from '@/components/shared/HelpIcon.vue'
import { useAuditStore } from '@/stores/AuditStore'

const auditStore = useAuditStore()
const { entries } = storeToRefs(auditStore)

const search = ref('')
const fAction = ref('all')
const fUser = ref('all')
const sort = ref<'newest' | 'oldest'>('newest')

const actionOptions = computed(() => ['all', ...new Set(entries.value.map((e) => e.action))])
const userOptions = computed(() => ['all', ...new Set(entries.value.map((e) => e.user))])

const hasFilter = computed(() => fAction.value !== 'all' || fUser.value !== 'all' || sort.value !== 'newest' || search.value !== '')
function clearFilters() {
  fAction.value = 'all'
  fUser.value = 'all'
  sort.value = 'newest'
  search.value = ''
}

const filtered = computed(() =>
  entries.value
    .filter((e) => (fAction.value === 'all' ? true : e.action === fAction.value))
    .filter((e) => (fUser.value === 'all' ? true : e.user === fUser.value))
    .filter((e) =>
      search.value.trim() === '' ? true : (e.action + e.entity + e.detail + e.user).includes(search.value.trim()),
    )
    .slice()
    .sort((a, b) => {
      const order = a.ts.localeCompare(b.ts)
      return sort.value === 'newest' ? -order : order
    }),
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
        <h1>سجل العمليات <HelpIcon section="audit" /></h1>
        <p>سجل بكل الأحداث والعمليات المهمة في النظام</p>
      </div>
    </header>

    <div class="filters">
      <input v-model="search" type="text" placeholder="🔍 بحث في السجل..." class="filters__search" />
      <select v-model="fAction" class="filters__select">
        <option v-for="a in actionOptions" :key="a" :value="a">{{ a === 'all' ? 'كل الإجراءات' : a }}</option>
      </select>
      <select v-model="fUser" class="filters__select">
        <option v-for="u in userOptions" :key="u" :value="u">{{ u === 'all' ? 'كل المستخدمين' : u }}</option>
      </select>
      <select v-model="sort" class="filters__select">
        <option value="newest">الأحدث أولاً</option>
        <option value="oldest">الأقدم أولاً</option>
      </select>
      <button v-if="hasFilter" class="app-btn app-btn--ghost" @click="clearFilters">مسح</button>
    </div>

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
