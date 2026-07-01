import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ModalShell from './ModalShell.vue'

// ModalShell يستخدم Teleport to body → نركّب على body ونستعلم من document
function mountModal(slots: Record<string, string> = { default: '<input id="fld" />' }) {
  return mount(ModalShell, { props: { title: 'عنوان' }, slots, attachTo: document.body })
}

afterEach(() => {
  document.body.style.overflow = ''
})

describe('ModalShell', () => {
  it('يعرض العنوان ودور dialog مع aria', () => {
    const w = mountModal()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.getAttribute('aria-label')).toBe('عنوان')
    expect(document.querySelector('.modal__header h3')!.textContent).toContain('عنوان')
    w.unmount()
  })

  it('يقفل تمرير الخلفية عند الفتح ويستعيده عند الإغلاق', () => {
    const w = mountModal()
    expect(document.body.style.overflow).toBe('hidden')
    w.unmount()
    expect(document.body.style.overflow).toBe('')
  })

  it('Esc يُطلق حدث close', async () => {
    const w = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('زر الإغلاق يُطلق close', async () => {
    const w = mountModal()
    ;(document.querySelector('.modal__close') as HTMLElement).click()
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('النقر على الخلفية نفسها يُطلق close', async () => {
    const w = mountModal()
    ;(document.querySelector('.modal-overlay') as HTMLElement).click()
    expect(w.emitted('close')).toBeTruthy()
    w.unmount()
  })

  it('النقر داخل البطاقة لا يُطلق close', async () => {
    const w = mountModal()
    ;(document.querySelector('.modal') as HTMLElement).click()
    expect(w.emitted('close')).toBeFalsy()
    w.unmount()
  })

  it('يعرض فتحة التذييل عند وجودها فقط', () => {
    const w1 = mountModal({ default: '<p>x</p>' })
    expect(document.querySelector('.modal__footer')).toBeNull()
    w1.unmount()
    const w2 = mountModal({ default: '<p>x</p>', footer: '<button>حفظ</button>' })
    expect(document.querySelector('.modal__footer')).not.toBeNull()
    w2.unmount()
  })

  it('حبس التركيز: Tab من آخر عنصر يعود للأول', () => {
    const w = mountModal()
    const focusables = document.querySelectorAll<HTMLElement>(
      '.modal a[href], .modal button:not([disabled]), .modal input:not([disabled])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    last.focus()
    expect(document.activeElement).toBe(last)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }))
    expect(document.activeElement).toBe(first)
    w.unmount()
  })

  it('حبس التركيز: Shift+Tab من الأول يذهب للأخير', () => {
    const w = mountModal()
    const focusables = document.querySelectorAll<HTMLElement>(
      '.modal a[href], .modal button:not([disabled]), .modal input:not([disabled])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }))
    expect(document.activeElement).toBe(last)
    w.unmount()
  })
})
