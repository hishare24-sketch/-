import { describe, it, expect } from 'vitest'
import {
  suggestPalettes,
  improveText,
  generateTemplateFromDescription,
  validateTemplate,
} from './templatesAI'
import { buildTemplate } from './constants'
import type { DocTemplate } from '@/interfaces/models'

describe('suggestPalettes', () => {
  it('يُرجع لوحات حسب الوصف (المطابق أولاً)', () => {
    const p = suggestPalettes('أريد طابعاً فاخراً')
    expect(p.length).toBeGreaterThan(0)
    expect(p[0].name).toContain('فخامة')
    expect(p[0].accent).toMatch(/^#/)
  })
  it('يُرجع افتراضيات عند وصف فارغ', () => {
    expect(suggestPalettes('').length).toBe(3)
  })
})

describe('improveText', () => {
  it('يعيد صياغة بنبرة رسمية', () => {
    const out = improveText('نرسل لكم العرض', 'رسمية')
    expect(out).toContain('نفيدكم')
    expect(out.length).toBeGreaterThan('نرسل لكم العرض'.length)
  })
  it('نبرات مختلفة تُنتج نصوصاً مختلفة', () => {
    const a = improveText('مرحبا', 'ودية')
    const b = improveText('مرحبا', 'قانونية')
    expect(a).not.toBe(b)
  })
  it('نص فارغ يبقى فارغاً', () => {
    expect(improveText('   ', 'رسمية')).toBe('')
  })
})

describe('generateTemplateFromDescription', () => {
  it('يكتشف نوع المستند من الوصف', () => {
    expect(generateTemplateFromDescription('فاتورة ضريبية لعميل').docType).toBe('invoice')
    expect(generateTemplateFromDescription('عقد إيجار بين طرفين').docType).toBe('agreement')
    expect(generateTemplateFromDescription('أمر صرف مبلغ').docType).toBe('payment_order')
    expect(generateTemplateFromDescription('خطاب رسمي للجهة').docType).toBe('official')
  })
  it('الافتراضي عرض سعر عند غياب الكلمات', () => {
    expect(generateTemplateFromDescription('شيء عام').docType).toBe('quote')
  })
  it('يُنتج أقساماً غير فارغة', () => {
    expect(generateTemplateFromDescription('فاتورة').sections.length).toBeGreaterThan(0)
  })
})

describe('validateTemplate', () => {
  it('قالب احترافي كامل → لا تحذيرات حاجبة (ok أو معلومات فقط)', () => {
    const t = buildTemplate('ق', 'quote', '2026-01-01') // starter فيه شعار وعنوان وتوقيع
    const issues = validateTemplate(t)
    expect(issues.some((i) => i.level === 'warning' && i.title === 'لا يوجد شعار')).toBe(false)
  })
  it('قالب بلا عناصر → يرصد نقص الشعار والعنوان', () => {
    const empty: DocTemplate = {
      id: 't', name: 'ق', docType: 'quote', status: 'active',
      sections: [{ id: 's', kind: 'fixed', title: 'قسم', elements: [] }],
      createdAt: '2026-01-01', updatedAt: '2026-01-01',
    }
    const titles = validateTemplate(empty).map((i) => i.title)
    expect(titles).toContain('لا يوجد شعار')
    expect(titles).toContain('لا يوجد عنوان رئيسي')
  })
})
