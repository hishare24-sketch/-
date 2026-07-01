// ═══════════════════════════════════════════
//  إبراز عنصر مستهدَف بعد التنقّل إليه (?focus=<id>)
//  الصفحات تضيف :data-focus + :class="{ 'is-focused': isFocused(id) }"
// ═══════════════════════════════════════════
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useFocusHighlight() {
  const route = useRoute()
  const router = useRouter()
  const focusId = ref<string | undefined>(route.query.focus as string | undefined)

  onMounted(async () => {
    if (!focusId.value) return
    await nextTick()
    // تمرير للعنصر المستهدَف بعد رسم الصفحة
    setTimeout(() => {
      const el = document.querySelector(`[data-focus="${focusId.value}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 250)
    // إزالة الإبراز والاستعلام بعد لحظات
    setTimeout(() => {
      focusId.value = undefined
      router.replace({ query: { ...route.query, focus: undefined } }).catch(() => {})
    }, 3200)
  })

  const isFocused = (id: string) => focusId.value === id
  return { focusId, isFocused }
}
