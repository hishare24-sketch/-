<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { BaseButton } from '@/components/base'

// نافذة تأكيد عامة (للحذف وغيره) — تُستدعى عبر ref
const isOpen = ref(false)
const title = ref('تأكيد')
const message = ref('')
let resolver: ((ok: boolean) => void) | null = null

function open(opts: { title?: string; message: string }): Promise<boolean> {
  title.value = opts.title ?? 'تأكيد'
  message.value = opts.message
  isOpen.value = true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

function close(ok: boolean) {
  isOpen.value = false
  resolver?.(ok)
  resolver = null
}

// إغلاق بمفتاح Esc أثناء فتح النافذة
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close(false)
}

watch(isOpen, (val) => {
  if (val) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ open })
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="cm-overlay" @click.self="close(false)">
      <div class="cm-dialog app-card" role="dialog" aria-modal="true" :aria-label="title">
        <h3 class="cm-title">{{ title }}</h3>
        <p class="cm-message">{{ message }}</p>
        <div class="cm-actions">
          <BaseButton variant="ghost" @click="close(false)">إلغاء</BaseButton>
          <BaseButton variant="danger" autofocus @click="close(true)">تأكيد</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.cm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.cm-dialog {
  inline-size: 100%;
  max-inline-size: 380px;
  padding: 24px;
}

.cm-title {
  font-size: 17px;
  font-weight: 700;
  margin-block-end: 8px;
}

.cm-message {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-block-end: 20px;
}

.cm-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}
</style>
