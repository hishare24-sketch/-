// ═══════════════════════════════════════════
//  ثوابت مولّد القوالب: أنواع المستندات + العناصر + الأقسام + الهياكل الأولية
// ═══════════════════════════════════════════
import type {
  DocTemplate,
  TemplateDocType,
  TemplateElement,
  TemplateElementType,
  TemplateSection,
  TemplateSectionKind,
} from '@/interfaces/models'
import { uid } from '@/helpers/id'

// أنواع المستندات الخمسة
export const TEMPLATE_DOC_TYPES: { id: TemplateDocType; label: string; icon: string; desc: string }[] = [
  { id: 'quote', label: 'عرض سعر', icon: '📋', desc: 'مستند تجاري بالخدمات/المنتجات والأسعار' },
  { id: 'invoice', label: 'فاتورة فورية', icon: '🧾', desc: 'مستند مالي يُصدر بعد إتمام صفقة' },
  { id: 'agreement', label: 'اتفاقية / عقد', icon: '📜', desc: 'مستند قانوني بين طرفين' },
  { id: 'payment_order', label: 'أمر دفع', icon: '💸', desc: 'تحويل مبلغ مالي لجهة محددة' },
  { id: 'official', label: 'ورق رسمي', icon: '🏛️', desc: 'خطاب/قرار/تعميم/محضر رسمي' },
]

export const docTypeMeta = (id: TemplateDocType) => TEMPLATE_DOC_TYPES.find((t) => t.id === id)

// أنواع الأقسام الستة
export const TEMPLATE_SECTION_KINDS: { id: TemplateSectionKind; label: string; repeatable: boolean }[] = [
  { id: 'header', label: 'رأس الصفحة', repeatable: false },
  { id: 'fixed', label: 'قسم ثابت', repeatable: false },
  { id: 'repeatable', label: 'قسم مكرر', repeatable: true },
  { id: 'group', label: 'مجموعة عناصر', repeatable: true },
  { id: 'conditional', label: 'قسم شرطي', repeatable: false },
  { id: 'footer', label: 'تذييل الصفحة', repeatable: false },
]

export const sectionKindMeta = (id: TemplateSectionKind) =>
  TEMPLATE_SECTION_KINDS.find((k) => k.id === id)

// فئات لتنظيم لوحة العناصر في المحرّر (المرحلة 2)
export type ElementCategory = 'text' | 'structure' | 'numeric' | 'visual' | 'choice' | 'group'

// أنواع العناصر الـ15
export const TEMPLATE_ELEMENT_TYPES: {
  id: TemplateElementType
  label: string
  icon: string
  category: ElementCategory
  repeatable: boolean
}[] = [
  { id: 'paragraph', label: 'فقرة نصية', icon: '¶', category: 'text', repeatable: true },
  { id: 'heading', label: 'عنوان', icon: 'H', category: 'text', repeatable: true },
  { id: 'short_text', label: 'نص قصير', icon: '🔤', category: 'text', repeatable: true },
  { id: 'long_text', label: 'نص طويل', icon: '📝', category: 'text', repeatable: false },
  { id: 'table', label: 'جدول بسيط', icon: '▦', category: 'structure', repeatable: true },
  { id: 'items_table', label: 'جدول منتجات/خدمات', icon: '🧮', category: 'structure', repeatable: true },
  { id: 'page_break', label: 'فاصل صفحة', icon: '⤵', category: 'structure', repeatable: false },
  { id: 'number', label: 'حقل رقمي', icon: '#', category: 'numeric', repeatable: true },
  { id: 'computed', label: 'حقل محسوب', icon: '∑', category: 'numeric', repeatable: true },
  { id: 'date', label: 'حقل تاريخ', icon: '📅', category: 'numeric', repeatable: true },
  { id: 'image', label: 'صورة', icon: '🖼️', category: 'visual', repeatable: false },
  { id: 'signature', label: 'توقيع إلكتروني', icon: '✍️', category: 'visual', repeatable: false },
  { id: 'dropdown', label: 'قائمة منسدلة', icon: '▾', category: 'choice', repeatable: true },
  { id: 'checkbox', label: 'خانة اختيار', icon: '☑', category: 'choice', repeatable: true },
  { id: 'group', label: 'مجموعة عناصر', icon: '▣', category: 'group', repeatable: true },
]

export const elementTypeMeta = (id: TemplateElementType) =>
  TEMPLATE_ELEMENT_TYPES.find((e) => e.id === id)

// ── بناة العناصر/الأقسام (بمعرّفات فريدة) ──
export function makeElement(type: TemplateElementType, label: string, extra: Partial<TemplateElement> = {}): TemplateElement {
  return { id: uid('el'), type, label, ...extra }
}

export function makeSection(kind: TemplateSectionKind, title: string, elements: TemplateElement[], extra: Partial<TemplateSection> = {}): TemplateSection {
  return { id: uid('sec'), kind, title, elements, ...extra }
}

// هيكل أوليّ بسيط لكل نوع مستند (يُثرى في المرحلة 3)
export function starterSections(docType: TemplateDocType): TemplateSection[] {
  const header = makeSection('header', 'رأس الصفحة', [
    makeElement('image', 'الشعار', { imageKind: 'logo' }),
    makeElement('heading', 'اسم الجهة', { align: 'center', bold: true }),
  ])
  const footer = makeSection('footer', 'التذييل', [
    makeElement('signature', 'التوقيع'),
  ])

  switch (docType) {
    case 'quote':
      return [
        header,
        makeSection('fixed', 'بيانات العميل', [
          makeElement('short_text', 'اسم العميل', { required: true }),
          makeElement('short_text', 'اسم المشروع'),
          makeElement('date', 'التاريخ', { dateFormat: 'gregorian' }),
        ]),
        makeSection('repeatable', 'البنود', [
          makeElement('items_table', 'جدول المنتجات/الخدمات', { columns: ['الوصف', 'الكمية', 'السعر', 'الإجمالي'] }),
        ], { repeatable: true }),
        makeSection('fixed', 'الإجماليات', [
          makeElement('number', 'الضريبة %', { numberFormat: 'percent', defaultValue: '15' }),
          makeElement('computed', 'الإجمالي النهائي', { formula: 'sum(items) + vat', numberFormat: 'currency' }),
          makeElement('number', 'صلاحية العرض (يوم)', { numberFormat: 'integer', defaultValue: '30' }),
        ]),
        footer,
      ]
    case 'invoice':
      return [
        header,
        makeSection('fixed', 'بيانات الفاتورة', [
          makeElement('short_text', 'رقم الفاتورة', { required: true }),
          makeElement('date', 'تاريخ الإصدار', { dateFormat: 'gregorian' }),
        ]),
        makeSection('group', 'بيانات العميل', [
          makeElement('short_text', 'اسم العميل', { required: true }),
          makeElement('short_text', 'الرقم الضريبي'),
        ]),
        makeSection('repeatable', 'المبيعات', [
          makeElement('items_table', 'جدول المبيعات', { columns: ['الصنف', 'الكمية', 'السعر', 'الإجمالي'] }),
        ], { repeatable: true }),
        makeSection('fixed', 'الإجماليات', [
          makeElement('computed', 'الإجمالي والضريبة', { formula: 'sum(items) + vat', numberFormat: 'currency' }),
          makeElement('dropdown', 'طريقة الدفع', { options: ['نقدي', 'تحويل بنكي', 'شبكة', 'شيك'] }),
        ]),
        footer,
      ]
    case 'agreement':
      return [
        makeSection('header', 'رأس الصفحة', [
          makeElement('image', 'الشعار', { imageKind: 'logo' }),
          makeElement('heading', 'عنوان الاتفاقية', { align: 'center', bold: true }),
        ]),
        makeSection('group', 'أطراف الاتفاقية', [
          makeElement('short_text', 'الطرف الأول', { required: true }),
          makeElement('short_text', 'الطرف الثاني', { required: true }),
        ]),
        makeSection('repeatable', 'بنود الاتفاقية', [
          makeElement('paragraph', 'بند'),
        ], { repeatable: true }),
        makeSection('fixed', 'الشروط والمدة', [
          makeElement('long_text', 'شروط وأحكام'),
          makeElement('date', 'من تاريخ', { dateFormat: 'gregorian' }),
          makeElement('date', 'إلى تاريخ', { dateFormat: 'gregorian' }),
        ]),
        makeSection('footer', 'توقيعات الطرفين', [
          makeElement('signature', 'توقيع الطرف الأول'),
          makeElement('signature', 'توقيع الطرف الثاني'),
        ]),
      ]
    case 'payment_order':
      return [
        header,
        makeSection('fixed', 'بيانات الأمر', [
          makeElement('short_text', 'اسم المستفيد', { required: true }),
          makeElement('number', 'المبلغ', { numberFormat: 'currency', required: true }),
          makeElement('short_text', 'المبلغ كتابةً'),
          makeElement('short_text', 'الغرض من الدفع'),
          makeElement('date', 'تاريخ الاستحقاق', { dateFormat: 'gregorian' }),
        ]),
        makeSection('group', 'الحساب البنكي', [
          makeElement('short_text', 'اسم البنك'),
          makeElement('short_text', 'رقم الآيبان (IBAN)'),
        ]),
        makeSection('footer', 'الاعتماد', [
          makeElement('signature', 'توقيع الآمر بالصرف'),
        ]),
      ]
    case 'official':
      return [
        makeSection('header', 'رأس الصفحة', [
          makeElement('image', 'شعار الجهة', { imageKind: 'logo' }),
          makeElement('dropdown', 'نوع الورقة', { options: ['خطاب', 'قرار', 'تعميم', 'طلب', 'محضر', 'شهادة'] }),
        ]),
        makeSection('fixed', 'الترويسة', [
          makeElement('short_text', 'رقم الورقة'),
          makeElement('date', 'التاريخ', { dateFormat: 'hijri' }),
          makeElement('short_text', 'الجهة المصدرة'),
          makeElement('short_text', 'الجهة الموجّه إليها'),
          makeElement('short_text', 'الموضوع'),
        ]),
        makeSection('fixed', 'المتن', [
          makeElement('long_text', 'النص الرئيسي'),
        ]),
        makeSection('repeatable', 'المرفقات', [makeElement('short_text', 'مرفق')], { repeatable: true }),
        makeSection('repeatable', 'نسخة إلى', [makeElement('short_text', 'جهة')], { repeatable: true }),
        makeSection('footer', 'التذييل', [
          makeElement('short_text', 'الاسم'),
          makeElement('short_text', 'الصفة'),
          makeElement('signature', 'التوقيع'),
        ]),
      ]
  }
}

// بناء قالب جديد كامل بهيكل أوليّ
export function buildTemplate(name: string, docType: TemplateDocType, createdAt: string): DocTemplate {
  return {
    id: uid('tpl'),
    name,
    docType,
    status: 'active',
    sections: starterSections(docType),
    createdAt,
    updatedAt: createdAt,
  }
}
