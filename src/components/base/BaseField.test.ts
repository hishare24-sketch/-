import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseField from './BaseField.vue'
import BaseInput from './BaseInput.vue'

describe('BaseField', () => {
  it('يعرض التسمية ويلفّ الإدخال في الفتحة', () => {
    const w = mount(BaseField, { props: { label: 'الاسم' }, slots: { default: '<input class="x" />' } })
    expect(w.find('.field__label').text()).toContain('الاسم')
    expect(w.find('input.x').exists()).toBe(true)
  })

  it('required يُظهر النجمة', () => {
    const w = mount(BaseField, { props: { label: 'الاسم', required: true } })
    expect(w.find('.field__req').exists()).toBe(true)
  })

  it('يعرض التلميح عند عدم وجود خطأ', () => {
    const w = mount(BaseField, { props: { hint: 'تلميح مفيد' } })
    expect(w.find('.field__hint').text()).toBe('تلميح مفيد')
    expect(w.find('.field__error').exists()).toBe(false)
  })

  it('الخطأ يحلّ محلّ التلميح ويضيف صنف has-error', () => {
    const w = mount(BaseField, { props: { hint: 'تلميح', error: 'حقل مطلوب' } })
    expect(w.find('.field__error').text()).toBe('حقل مطلوب')
    expect(w.find('.field__hint').exists()).toBe(false)
    expect(w.find('.field').classes()).toContain('has-error')
  })
})

describe('BaseInput', () => {
  it('يعكس القيمة الممرّرة', () => {
    const w = mount(BaseInput, { props: { modelValue: 'مرحبا' } })
    expect((w.find('input').element as HTMLInputElement).value).toBe('مرحبا')
  })

  it('يُطلق update:modelValue عند الإدخال (v-model)', async () => {
    const w = mount(BaseInput, { props: { modelValue: '' } })
    await w.find('input').setValue('جديد')
    expect(w.emitted('update:modelValue')![0]).toEqual(['جديد'])
  })

  it('invalid يضبط الصنف و aria-invalid', () => {
    const w = mount(BaseInput, { props: { invalid: true } })
    expect(w.find('input').classes()).toContain('is-invalid')
    expect(w.find('input').attributes('aria-invalid')).toBe('true')
  })

  it('النوع الافتراضي text', () => {
    const w = mount(BaseInput)
    expect(w.find('input').attributes('type')).toBe('text')
  })
})
