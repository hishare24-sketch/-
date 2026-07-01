import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('يعرض الأيقونة والعنوان والرسالة عند تمريرها', () => {
    const w = mount(EmptyState, { props: { icon: '📭', title: 'لا بيانات', message: 'ابدأ بإضافة عنصر' } })
    expect(w.find('.empty__icon').text()).toBe('📭')
    expect(w.find('.empty__title').text()).toBe('لا بيانات')
    expect(w.find('.empty__msg').text()).toBe('ابدأ بإضافة عنصر')
  })

  it('يُخفي العناصر غير الممرّرة', () => {
    const w = mount(EmptyState, { props: { title: 'فقط عنوان' } })
    expect(w.find('.empty__icon').exists()).toBe(false)
    expect(w.find('.empty__msg').exists()).toBe(false)
    expect(w.find('.empty__title').exists()).toBe(true)
  })

  it('يعرض فتحة الإجراء عند وجودها', () => {
    const w = mount(EmptyState, { slots: { action: '<button>إضافة</button>' } })
    expect(w.find('.empty__action').exists()).toBe(true)
    expect(w.find('.empty__action button').text()).toBe('إضافة')
  })

  it('لا يعرض حاوية الإجراء بلا فتحة', () => {
    const w = mount(EmptyState, { props: { title: 'x' } })
    expect(w.find('.empty__action').exists()).toBe(false)
  })
})
