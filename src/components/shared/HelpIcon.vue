<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/SettingsStore'
import { BaseButton } from '@/components/base'

// أيقونة شرح (ⓘ) بجانب عنوان الشاشة — تفتح نافذة منبثقة بنص الشرح
const props = defineProps<{ section: string }>()

const settingsStore = useSettingsStore()
const entry = computed(() => settingsStore.help[props.section])
const visible = computed(() => entry.value && entry.value.show && entry.value.body.trim())

const open = ref(false)

// إغلاق بمفتاح Esc أثناء فتح النافذة
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

watch(open, (val) => {
  if (val) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <span v-if="visible" class="help-icon-wrap">
    <button class="help-icon" title="شرح القسم" @click="open = true">ⓘ</button>

    <Teleport to="body">
      <div v-if="open" class="help-overlay" @click.self="open = false">
        <div class="help-pop app-card" role="dialog" aria-modal="true" :aria-label="entry?.title">
          <div class="help-pop__head">
            <span class="help-pop__title">💡 {{ entry?.title }}</span>
            <button class="help-pop__close" aria-label="إغلاق الشرح" @click="open = false">✕</button>
          </div>
          <p class="help-pop__body">{{ entry?.body }}</p>
          <BaseButton block @click="open = false">فهمت</BaseButton>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<style lang="scss" scoped>
.help-icon-wrap {
  display: inline-flex;
}

.help-icon {
  inline-size: 22px;
  block-size: 22px;
  border-radius: 50%;
  border: none;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  &:hover {
    background: var(--primary);
    color: #fff;
  }
}

.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1100;
}

.help-pop {
  inline-size: 100%;
  max-inline-size: 440px;
  padding: 24px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 12px;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: var(--primary);
  }

  &__close {
    border: none;
    background: transparent;
    font-size: 15px;
    color: var(--text-muted);
  }

  &__body {
    font-size: 14px;
    line-height: 1.9;
    color: var(--text);
    white-space: pre-line;
    margin-block-end: 20px;
  }
}
</style>
