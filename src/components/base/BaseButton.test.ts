import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('يعرض المحتوى من الفتحة (slot)', () => {
    const w = mount(BaseButton, { slots: { default: 'حفظ' } })
    expect(w.text()).toContain('حفظ')
  })

  it('النوع الافتراضي button', () => {
    const w = mount(BaseButton)
    expect(w.attributes('type')).toBe('button')
  })

  it('المتغيّر primary لا يضيف صنف متغيّر (الافتراضي)', () => {
    const w = mount(BaseButton, { props: { variant: 'primary' } })
    expect(w.classes()).not.toContain('app-btn--primary')
    expect(w.classes()).toContain('app-btn')
  })

  it('المتغيّرات الأخرى تضيف صنفها', () => {
    const w = mount(BaseButton, { props: { variant: 'danger' } })
    expect(w.classes()).toContain('app-btn--danger')
  })

  it('الحجم غير الافتراضي يضيف صنفه', () => {
    const w = mount(BaseButton, { props: { size: 'sm' } })
    expect(w.classes()).toContain('app-btn--sm')
  })

  it('block يضيف صنف العرض الكامل', () => {
    const w = mount(BaseButton, { props: { block: true } })
    expect(w.classes()).toContain('app-btn--block')
  })

  it('disabled يعطّل الزر', () => {
    const w = mount(BaseButton, { props: { disabled: true } })
    expect(w.attributes('disabled')).toBeDefined()
  })

  it('loading يعطّل الزر ويضبط aria-busy ويُظهر السبينر', () => {
    const w = mount(BaseButton, { props: { loading: true } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
    expect(w.find('.base-btn__spinner').exists()).toBe(true)
  })

  it('يُطلق حدث النقر', async () => {
    const w = mount(BaseButton)
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })
})
