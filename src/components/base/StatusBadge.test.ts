import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from './StatusBadge.vue'

describe('StatusBadge', () => {
  it('يعرض التسمية', () => {
    const w = mount(StatusBadge, { props: { label: 'معتمد' } })
    expect(w.text()).toContain('معتمد')
  })

  it('النغمة الافتراضية neutral', () => {
    const w = mount(StatusBadge, { props: { label: 'x' } })
    expect(w.classes()).toContain('is-neutral')
  })

  it('يطبّق صنف النغمة المطلوبة', () => {
    const w = mount(StatusBadge, { props: { label: 'x', tone: 'ok' } })
    expect(w.classes()).toContain('is-ok')
  })

  it('لا نقطة افتراضياً', () => {
    const w = mount(StatusBadge, { props: { label: 'x' } })
    expect(w.find('.badge__dot').exists()).toBe(false)
  })

  it('dot يُظهر النقطة', () => {
    const w = mount(StatusBadge, { props: { label: 'x', dot: true } })
    expect(w.find('.badge__dot').exists()).toBe(true)
  })
})
