<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/ToastStore'

// مضيف التنبيهات — يُركّب مرة واحدة في الجذر
const toastStore = useToastStore()
const { toasts } = storeToRefs(toastStore)

const ICON: Record<string, string> = {
  success: '✅',
  error: '⛔',
  info: 'ℹ️',
  warning: '⚠️',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" role="region" aria-live="polite" aria-label="التنبيهات">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`is-${t.type}`" role="status">
          <span class="toast__icon" aria-hidden="true">{{ ICON[t.type] }}</span>
          <span class="toast__msg">{{ t.message }}</span>
          <button class="toast__close" aria-label="إغلاق" @click="toastStore.dismiss(t.id)">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.toast-host {
  position: fixed;
  inset-block-start: var(--space-5);
  inset-inline-start: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-toast);
  inline-size: min(92vw, 420px);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
  border-inline-start: 4px solid var(--info-text);
  box-shadow: var(--elev-3);
  pointer-events: auto;

  &__icon { font-size: 17px; flex-shrink: 0; }

  &__msg {
    flex: 1;
    font-size: var(--fs-sm);
    line-height: var(--lh-normal);
    color: var(--text);
  }

  &__close {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 13px;
    flex-shrink: 0;
    &:hover { color: var(--text); }
  }

  &.is-success { border-inline-start-color: var(--ok-text); }
  &.is-error { border-inline-start-color: var(--danger-text); }
  &.is-warning { border-inline-start-color: var(--warn-text); }
  &.is-info { border-inline-start-color: var(--info-text); }
}

// حركة الدخول/الخروج (keyframes: الحالة الساكنة مرئية دائماً)
.toast-enter-active { animation: mzToastIn var(--dur) var(--ease-spring); }
.toast-leave-active { animation: mzToastIn var(--dur) var(--ease) reverse forwards; }
.toast-move { transition: transform var(--dur) var(--ease); }

@keyframes mzToastIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.96); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active { animation-duration: 0.01ms; }
  .toast-move { transition: none; }
}
</style>
