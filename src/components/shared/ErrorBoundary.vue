<script setup lang="ts">
import { ref, watch, onErrorCaptured } from 'vue'
import { useRoute } from 'vue-router'
import { BaseButton } from '@/components/base'

// حدّ خطأ عام: يلتقط أعطال المكوّنات ويعرض بديلًا أنيقًا بدل شاشة بيضاء
const error = ref<Error | null>(null)
const retryKey = ref(0)
const route = useRoute()

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  // منع تصعيد الخطأ (يبقى مسجّلًا في console للمطوّر)
  console.error('[ErrorBoundary]', err)
  return false
})

// تغيير المسار يمسح حالة الخطأ (شاشة أخرى قد تعمل)
watch(() => route.fullPath, () => { error.value = null })

function retry() {
  error.value = null
  retryKey.value++
}
</script>

<template>
  <div v-if="error" class="err-boundary">
    <div class="err-boundary__card app-card">
      <span class="err-boundary__icon" aria-hidden="true">⚠️</span>
      <h2>حدث خطأ غير متوقّع</h2>
      <p>نعتذر — تعذّر عرض هذا الجزء. يمكنك إعادة المحاولة أو العودة للوحة التحكم.</p>
      <details class="err-boundary__details">
        <summary>التفاصيل التقنية</summary>
        <pre>{{ error.message }}</pre>
      </details>
      <div class="err-boundary__actions">
        <BaseButton @click="retry">🔄 إعادة المحاولة</BaseButton>
        <BaseButton variant="outlined" @click="$router.push({ name: 'dashboard-page' })">🏠 لوحة التحكم</BaseButton>
      </div>
    </div>
  </div>
  <slot v-else :key="retryKey" />
</template>

<style lang="scss" scoped>
.err-boundary {
  display: flex;
  justify-content: center;
  padding: 48px 16px;

  &__card {
    inline-size: 100%;
    max-inline-size: 460px;
    padding: 32px;
    text-align: center;

    h2 { font-size: 18px; margin-block: 10px 6px; }
    p { color: var(--text-muted); font-size: 14px; line-height: 1.7; }
  }

  &__icon { font-size: 40px; }

  &__details {
    margin-block: 14px;
    text-align: start;

    summary {
      cursor: pointer;
      font-size: 12.5px;
      color: var(--text-muted);
    }

    pre {
      margin-block-start: 8px;
      padding: 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--danger-text);
    }
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-block-start: 6px;
  }
}
</style>
