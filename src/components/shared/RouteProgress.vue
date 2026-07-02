<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// شريط تقدّم علوي رفيع أثناء تحميل شرائح المسارات الكسولة
const router = useRouter()
const active = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const stop = () => {
  if (timer) clearTimeout(timer)
  timer = null
  active.value = false
}

let removeBefore: (() => void) | null = null
let removeAfter: (() => void) | null = null
let removeError: (() => void) | null = null

onMounted(() => {
  removeBefore = router.beforeEach(() => {
    // يظهر فقط إن استغرق التنقّل ≥150ms (تجنّب الوميض على التنقّل الفوري)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { active.value = true }, 150)
  })
  removeAfter = router.afterEach(() => stop())
  removeError = router.onError(() => stop())
})

onUnmounted(() => {
  stop()
  removeBefore?.()
  removeAfter?.()
  removeError?.()
})
</script>

<template>
  <Transition name="rp">
    <div v-if="active" class="route-progress" role="progressbar" aria-label="جارٍ التحميل">
      <div class="route-progress__bar" />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.route-progress {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  block-size: 3px;
  z-index: 2000;
  background: transparent;
  overflow: hidden;

  &__bar {
    block-size: 100%;
    inline-size: 40%;
    background: var(--primary);
    border-radius: 3px;
    animation: rpSlide 1s ease-in-out infinite;
  }
}

@keyframes rpSlide {
  0% { transform: translateX(120%); }
  100% { transform: translateX(-350%); }
}

.rp-enter-active,
.rp-leave-active { transition: opacity 0.2s ease; }
.rp-enter-from,
.rp-leave-to { opacity: 0; }
</style>
