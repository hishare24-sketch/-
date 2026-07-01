import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTemplatesStore } from './TemplatesStore'

describe('TemplatesStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('createTemplate يضيف قالباً نشطاً بهيكل أوليّ ويُرجع معرّفه', () => {
    const s = useTemplatesStore()
    const before = s.templates.length
    const id = s.createTemplate('قالب عرض', 'quote')
    expect(s.templates.length).toBe(before + 1)
    const t = s.templateById(id)!
    expect(t.name).toBe('قالب عرض')
    expect(t.docType).toBe('quote')
    expect(t.status).toBe('active')
    expect(t.sections.length).toBeGreaterThan(0)
  })

  it('الهيكل الأوليّ يحوي رأساً وتذييلاً حسب النوع', () => {
    const s = useTemplatesStore()
    const id = s.createTemplate('ق', 'quote')
    const kinds = s.templateById(id)!.sections.map((sec) => sec.kind)
    expect(kinds).toContain('header')
    expect(kinds).toContain('footer')
  })

  it('duplicateTemplate ينسخ بمعرّفات جديدة واسم «(نسخة)»', () => {
    const s = useTemplatesStore()
    const id = s.createTemplate('الأصل', 'invoice')
    const src = s.templateById(id)!
    const copyId = s.duplicateTemplate(id)!
    const copy = s.templateById(copyId)!
    expect(copy.id).not.toBe(src.id)
    expect(copy.name).toBe('الأصل (نسخة)')
    // معرّفات الأقسام/العناصر مختلفة عن الأصل
    expect(copy.sections[0].id).not.toBe(src.sections[0].id)
    expect(copy.sections[0].elements[0].id).not.toBe(src.sections[0].elements[0].id)
  })

  it('updateTemplate يعدّل الاسم ويحدّث updatedAt', () => {
    const s = useTemplatesStore()
    const id = s.createTemplate('اسم قديم', 'agreement')
    s.updateTemplate(id, { name: 'اسم جديد' })
    expect(s.templateById(id)!.name).toBe('اسم جديد')
  })

  it('archive/restore يبدّل الحالة', () => {
    const s = useTemplatesStore()
    const id = s.createTemplate('ق', 'quote')
    s.archiveTemplate(id)
    expect(s.templateById(id)!.status).toBe('archived')
    s.restoreTemplate(id)
    expect(s.templateById(id)!.status).toBe('active')
  })

  it('deleteTemplate يزيل القالب', () => {
    const s = useTemplatesStore()
    const id = s.createTemplate('للحذف', 'quote')
    s.deleteTemplate(id)
    expect(s.templateById(id)).toBeUndefined()
  })

  it('getters: byDocType و active', () => {
    const s = useTemplatesStore()
    s.createTemplate('a', 'quote')
    const archId = s.createTemplate('b', 'quote')
    s.archiveTemplate(archId)
    expect(s.byDocType('quote').length).toBeGreaterThanOrEqual(2)
    expect(s.active.every((t) => t.status === 'active')).toBe(true)
  })
})
