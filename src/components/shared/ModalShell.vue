<script setup lang="ts">
// قشرة مودال عامة: خلفية + بطاقة + ترويسة + جسم + تذييل (slots)
// تشمل: حركة دخول/خروج، إغلاق بـ Esc، حبس التركيز، قفل تمرير الخلفية، وإعادة التركيز
import { onBeforeUnmount, onMounted, ref } from 'vue'
defineProps<{ title: string; wide?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const card = ref<HTMLElement | null>(null)
let lastFocused: HTMLElement | null = null

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  if (e.key === 'Tab' && card.value) {
    // حبس التركيز داخل المودال
    const focusables = card.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement as HTMLElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

onMounted(() => {
  lastFocused = document.activeElement as HTMLElement
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
  // تركيز أول عنصر داخل المودال
  requestAnimationFrame(() => {
    const first = card.value?.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not(.modal__close)',
    )
    first?.focus()
  })
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
  lastFocused?.focus?.()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div class="modal-overlay" @click.self="emit('close')">
        <div
          ref="card"
          class="modal app-card"
          :class="{ 'modal--wide': wide }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="modal__header">
            <h3>{{ title }}</h3>
            <button class="modal__close" aria-label="إغلاق" @click="emit('close')">✕</button>
          </header>

          <div class="modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  overflow-y: auto;
  z-index: var(--z-modal);
}

.modal {
  inline-size: 100%;
  max-inline-size: 480px;
  display: flex;
  flex-direction: column;
  max-block-size: calc(100vh - 80px);

  &--wide {
    max-inline-size: 720px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px;
    border-block-end: 1px solid var(--border);

    h3 {
      font-size: 17px;
      font-weight: 700;
    }
  }

  &__close {
    border: none;
    background: transparent;
    font-size: 16px;
    color: var(--text-muted);
  }

  &__body {
    padding: 22px;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    padding: 16px 22px;
    border-block-start: 1px solid var(--border);
  }
}

// ── حركة الدخول/الخروج (تعتمد keyframes: الحالة الساكنة مرئية دائماً) ──
.modal-enter-active { animation: mzOverlayIn var(--dur) var(--ease); .modal { animation: mzCardIn var(--dur) var(--ease-spring); } }
.modal-leave-active { animation: mzOverlayIn var(--dur) var(--ease) reverse forwards; .modal { animation: mzCardIn var(--dur) var(--ease) reverse forwards; } }

@keyframes mzOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes mzCardIn {
  from { opacity: 0; transform: translateY(-16px) scale(0.97); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active, .modal-leave-active { animation-duration: 0.01ms; .modal { animation: none; } }
}
</style>
