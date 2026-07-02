import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ErrorBoundary from './ErrorBoundary.vue'

// مسار وهمي حتى لا يحتاج الاختبار Router كاملًا
vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/test' }),
}))

// مكوّن يرمي خطأً عند العرض حسب مفتاح خارجي
const shouldThrow = ref(true)
const Bomb = defineComponent({
  name: 'Bomb',
  setup() {
    return () => {
      if (shouldThrow.value) throw new Error('عطل تجريبي')
      return h('div', { class: 'ok' }, 'يعمل')
    }
  },
})

describe('ErrorBoundary', () => {
  it('يلتقط خطأ العرض ويعرض البديل بدل شاشة بيضاء', async () => {
    shouldThrow.value = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = mount(ErrorBoundary, {
      slots: { default: () => h(Bomb) },
      global: { stubs: { BaseButton: { template: '<button><slot /></button>' } } },
    })
    await nextTick()
    expect(w.find('.err-boundary').exists()).toBe(true)
    expect(w.text()).toContain('حدث خطأ غير متوقّع')
    expect(w.text()).toContain('عطل تجريبي')
    spy.mockRestore()
  })

  it('زر إعادة المحاولة يعيد عرض المحتوى بعد زوال السبب', async () => {
    shouldThrow.value = true
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const w = mount(ErrorBoundary, {
      slots: { default: () => h(Bomb) },
      global: { stubs: { BaseButton: { template: '<button><slot /></button>' } } },
    })
    await nextTick()
    expect(w.find('.err-boundary').exists()).toBe(true)

    // زال سبب العطل ثم أعاد المستخدم المحاولة
    shouldThrow.value = false
    await w.find('button').trigger('click')
    await nextTick()
    expect(w.find('.err-boundary').exists()).toBe(false)
    expect(w.find('.ok').text()).toBe('يعمل')
    spy.mockRestore()
  })
})
