import { defineStore } from 'pinia'
import type { DocTemplate, TemplateDocType, TemplateStatus } from '@/interfaces/models'
import { INITIAL_TEMPLATES } from '@/data/seed'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import { CURRENT_USER } from '@/constants'
import { buildTemplate } from '@/modules/templates/constants'
import { useAuditStore } from '@/stores/AuditStore'

// نسخ عميق للقالب مع معرّفات جديدة لكل قسم/عنصر (للنسخ والتكرار)
function cloneSections(sections: DocTemplate['sections']): DocTemplate['sections'] {
  return sections.map((s) => ({
    ...s,
    id: uid('sec'),
    elements: s.elements.map((e) => ({ ...e, id: uid('el') })),
  }))
}

// متجر قوالب المستندات الديناميكية
export const useTemplatesStore = defineStore('templates', {
  state: () => ({
    templates: [...INITIAL_TEMPLATES] as DocTemplate[],
  }),

  getters: {
    templateById: (s) => (id: string) => s.templates.find((t) => t.id === id),
    byDocType: (s) => (docType: TemplateDocType) => s.templates.filter((t) => t.docType === docType),
    active: (s) => s.templates.filter((t) => t.status === 'active'),
  },

  actions: {
    // إنشاء قالب جديد بهيكل أوليّ حسب نوع المستند → يُرجع معرّفه
    createTemplate(name: string, docType: TemplateDocType): string {
      const tpl = buildTemplate(name.trim() || 'قالب بدون اسم', docType, today())
      tpl.createdBy = CURRENT_USER
      this.templates.unshift(tpl)
      useAuditStore().log('إنشاء', 'قالب مستند', `${tpl.name} — ${docType}`)
      return tpl.id
    },

    // حفظ قالب كامل (من المحرّر لاحقاً) — تحديث إن وُجد، وإلا إضافة
    saveTemplate(tpl: DocTemplate) {
      const i = this.templates.findIndex((t) => t.id === tpl.id)
      if (i !== -1) this.templates[i] = { ...tpl, updatedAt: today() }
      else this.templates.unshift({ ...tpl, updatedAt: today() })
    },

    // تعديل جزئي لبيانات القالب
    updateTemplate(id: string, patch: Partial<DocTemplate>) {
      const i = this.templates.findIndex((t) => t.id === id)
      if (i === -1) return
      this.templates[i] = { ...this.templates[i], ...patch, id, updatedAt: today() }
    },

    // نسخ قالب (إعادة استخدام) → يُرجع معرّف النسخة
    duplicateTemplate(id: string): string | null {
      const src = this.templates.find((t) => t.id === id)
      if (!src) return null
      const copy: DocTemplate = {
        ...src,
        id: uid('tpl'),
        name: `${src.name} (نسخة)`,
        status: 'active',
        sections: cloneSections(src.sections),
        createdAt: today(),
        updatedAt: today(),
        createdBy: CURRENT_USER,
      }
      this.templates.unshift(copy)
      useAuditStore().log('نسخ', 'قالب مستند', copy.name)
      return copy.id
    },

    setStatus(id: string, status: TemplateStatus) {
      const t = this.templates.find((x) => x.id === id)
      if (!t) return
      t.status = status
      t.updatedAt = today()
      useAuditStore().log(status === 'archived' ? 'أرشفة' : 'استعادة', 'قالب مستند', t.name)
    },
    archiveTemplate(id: string) {
      this.setStatus(id, 'archived')
    },
    restoreTemplate(id: string) {
      this.setStatus(id, 'active')
    },

    deleteTemplate(id: string) {
      const t = this.templates.find((x) => x.id === id)
      this.templates = this.templates.filter((x) => x.id !== id)
      if (t) useAuditStore().log('حذف', 'قالب مستند', t.name)
    },
  },
})
