<script setup lang="ts">
// قشرة مودال عامة: خلفية + بطاقة + ترويسة + جسم + تذييل (slots)
defineProps<{ title: string; wide?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="emit('close')">
      <div class="modal app-card" :class="{ 'modal--wide': wide }">
        <header class="modal__header">
          <h3>{{ title }}</h3>
          <button class="modal__close" @click="emit('close')">✕</button>
        </header>

        <div class="modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  overflow-y: auto;
  z-index: 1000;
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
</style>
