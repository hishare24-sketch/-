<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/SettingsStore'

// لوحة أوامر سريعة (⌘/Ctrl+K): تنقّل فوري + إجراءات سريعة مع بحث ولوحة مفاتيح
interface Command {
  id: string
  label: string
  icon: string
  hint?: string
  run: () => void
}

const router = useRouter()
const settingsStore = useSettingsStore()

const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)

const NAV: { id: string; label: string; icon: string }[] = [
  { id: 'dashboard-page', label: 'لوحة التحكم', icon: '📊' },
  { id: 'tasks-page', label: 'الإجراءات المطلوبة', icon: '✅' },
  { id: 'projects-page', label: 'المشاريع', icon: '🏢' },
  { id: 'finance-page', label: 'المالية', icon: '💰' },
  { id: 'ledger-page', label: 'السجل المالي', icon: '⛃' },
  { id: 'receivables-page', label: 'الذمم', icon: '🧾' },
  { id: 'commitments-page', label: 'الالتزامات', icon: '📌' },
  { id: 'assets-page', label: 'الأصول', icon: '🚗' },
  { id: 'trackings-page', label: 'المتابعات', icon: '🔔' },
  { id: 'requests-page', label: 'الطلبات', icon: '📥' },
  { id: 'documents-page', label: 'المستندات', icon: '📄' },
  { id: 'surveys-page', label: 'الاستبيانات', icon: '📋' },
  { id: 'notifications-page', label: 'الإشعارات', icon: '🔔' },
  { id: 'audit-page', label: 'سجل العمليات', icon: '🗂️' },
  { id: 'settings-page', label: 'الإعدادات', icon: '⚙️' },
]

const commands = computed<Command[]>(() => {
  const navCmds: Command[] = NAV.map((n) => ({
    id: n.id,
    label: n.label,
    icon: n.icon,
    hint: 'انتقال',
    run: () => router.push({ name: n.id }).catch(() => {}),
  }))
  const actions: Command[] = [
    {
      id: 'toggle-theme',
      label: settingsStore.themeMode === 'dark' ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن',
      icon: settingsStore.themeMode === 'dark' ? '☀️' : '🌙',
      hint: 'إجراء',
      run: () => settingsStore.toggleThemeMode(),
    },
    {
      id: 'toggle-density',
      label: settingsStore.prefs.density === 'compact' ? 'كثافة مريحة' : 'كثافة مدمجة',
      icon: '↔️',
      hint: 'إجراء',
      run: () =>
        settingsStore.setPref('density', settingsStore.prefs.density === 'compact' ? 'comfortable' : 'compact'),
    },
  ]
  return [...navCmds, ...actions]
})

const filtered = computed(() => {
  const q = query.value.trim()
  if (!q) return commands.value
  return commands.value.filter((c) => c.label.includes(q))
})

watch(filtered, () => (activeIndex.value = 0))

function show() {
  open.value = true
  query.value = ''
  activeIndex.value = 0
  nextTick(() => inputEl.value?.focus())
}
function hide() {
  open.value = false
}
function runAt(i: number) {
  const cmd = filtered.value[i]
  if (!cmd) return
  hide()
  cmd.run()
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    open.value ? hide() : show()
  }
}
function onPanelKey(e: KeyboardEvent) {
  if (e.key === 'Escape') return hide()
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % Math.max(1, filtered.value.length)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % Math.max(1, filtered.value.length)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    runAt(activeIndex.value)
  }
}

onMounted(() => document.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="cmd">
      <div v-if="open" class="cmd-overlay" @click.self="hide">
        <div class="cmd app-card" role="dialog" aria-modal="true" aria-label="لوحة الأوامر" @keydown="onPanelKey">
          <div class="cmd__search">
            <span aria-hidden="true">🔍</span>
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              placeholder="ابحث عن قسم أو إجراء..."
              aria-label="بحث الأوامر"
            />
            <kbd>Esc</kbd>
          </div>

          <div class="cmd__list" role="listbox">
            <button
              v-for="(c, i) in filtered"
              :key="c.id"
              class="cmd__item"
              :class="{ 'is-active': i === activeIndex }"
              role="option"
              :aria-selected="i === activeIndex"
              @mouseenter="activeIndex = i"
              @click="runAt(i)"
            >
              <span class="cmd__icon" aria-hidden="true">{{ c.icon }}</span>
              <span class="cmd__label">{{ c.label }}</span>
              <span v-if="c.hint" class="cmd__hint">{{ c.hint }}</span>
            </button>
            <div v-if="!filtered.length" class="cmd__empty">لا نتائج لـ «{{ query }}»</div>
          </div>

          <div class="cmd__foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span>
            <span><kbd>↵</kbd> تنفيذ</span>
            <span><kbd>⌘/Ctrl</kbd><kbd>K</kbd> فتح/إغلاق</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.cmd-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 12vh 16px 16px;
  z-index: var(--z-popover);
}

.cmd {
  inline-size: 100%;
  max-inline-size: 560px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--elev-3);

  &__search {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 14px 18px;
    border-block-end: 1px solid var(--border);
    font-size: var(--fs-lg);

    input {
      flex: 1;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--fs-md);
      color: var(--text);
      &:focus { outline: none; }
    }
  }

  &__list {
    max-block-size: 340px;
    overflow-y: auto;
    padding: var(--space-2);
  }

  &__item {
    inline-size: 100%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 10px 12px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    text-align: start;
    color: var(--text);

    &.is-active { background: var(--primary-soft); }
  }

  &__icon { font-size: 17px; flex-shrink: 0; }
  &__label { flex: 1; font-size: var(--fs-md); font-weight: var(--fw-medium); }
  &__hint { font-size: var(--fs-xs); color: var(--text-muted); }

  &__empty {
    padding: var(--space-8);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--fs-sm);
  }

  &__foot {
    display: flex;
    gap: var(--space-4);
    padding: 10px 18px;
    border-block-start: 1px solid var(--border);
    font-size: var(--fs-xs);
    color: var(--text-muted);

    span { display: inline-flex; align-items: center; gap: 4px; }
  }

  kbd {
    font-family: inherit;
    font-size: 10px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1px 6px;
    color: var(--text-muted);
  }
}

.cmd-enter-active { animation: mzOverlayIn var(--dur) var(--ease); .cmd { animation: mzCmdIn var(--dur) var(--ease-spring); } }
.cmd-leave-active { animation: mzOverlayIn var(--dur) var(--ease) reverse forwards; .cmd { animation: mzCmdIn var(--dur) var(--ease) reverse forwards; } }

@keyframes mzOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mzCmdIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .cmd-enter-active, .cmd-leave-active { animation-duration: 0.01ms; .cmd { animation: none; } }
}
</style>
