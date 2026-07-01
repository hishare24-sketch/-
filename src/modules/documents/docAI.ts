// ═══════════════════════════════════════════
//  محاكاة الذكاء الاصطناعي للمستندات: استخراج البيانات + الإجراءات المقترحة
//  (منقول ومُحسّن من legacy/App.tsx — جاهز للاستبدال بـ AI حقيقي عبر backend)
// ═══════════════════════════════════════════
import type { DocItem } from '@/interfaces/models'

export type DocActionKind = 'tx' | 'tracking' | 'commitment' | 'asset' | 'receivable'

export interface DocSuggestion {
  kind: DocActionKind
  icon: string
  label: string
  desc: string
}

// بيانات مُستخرجة جاهزة لتعبئة النماذج
export interface ExtractedData {
  amount?: number
  party?: string
  description?: string
  expiryDate?: string
  warrantyEnd?: string
}

export interface DocExtraction {
  fields: [string, string][] // للعرض
  data: ExtractedData // للتعبئة المسبقة
  confidence: number // 0-100
}

// رقم شبه-عشوائي ثابت لكل مستند (لتبقى القيم مستقرة بين الفتحات)
function seedFrom(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function plusYear(date: string, years = 1): string {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

// استخراج البيانات حسب نوع المستند
export function aiExtract(doc: DocItem): DocExtraction {
  const seed = seedFrom(doc.id)
  const base: [string, string][] = [
    ['نوع المستند', doc.type],
    ['تاريخ المستند', doc.date],
  ]

  if (doc.type === 'فاتورة') {
    const amount = 1000 + (seed % 9000)
    const tax = Math.round(amount * 0.15)
    const party = 'مؤسسة الإمداد التجارية'
    return {
      confidence: 96,
      data: { amount, party, description: doc.name, warrantyEnd: plusYear(doc.date) },
      fields: [...base, ['المورد', party], ['المبلغ الإجمالي', `${amount.toLocaleString('ar-SA')} ر.س`], ['الضريبة (15%)', `${tax.toLocaleString('ar-SA')} ر.س`], ['طريقة الدفع', 'تحويل بنكي'], ['الضمان', '12 شهر']],
    }
  }

  if (doc.type === 'عقد') {
    const amount = 12000 + (seed % 48000)
    const party = 'الطرف الثاني'
    return {
      confidence: 92,
      data: { amount, party, description: doc.name, expiryDate: plusYear(doc.date) },
      fields: [...base, ['الأطراف', 'الطرف الأول / الطرف الثاني'], ['قيمة العقد', `${amount.toLocaleString('ar-SA')} ر.س`], ['مدة العقد', '12 شهر'], ['تاريخ البداية', doc.date], ['الالتزامات', 'دفعات شهرية']],
    }
  }

  if (doc.type === 'كشف حساب') {
    const deposits = 30000 + (seed % 40000)
    const withdrawals = 20000 + (seed % 30000)
    return {
      confidence: 90,
      data: { amount: deposits, description: doc.name },
      fields: [...base, ['البنك', 'البنك الأهلي'], ['عدد العمليات', String(12 + (seed % 30))], ['إجمالي الإيداعات', `${deposits.toLocaleString('ar-SA')} ر.س`], ['إجمالي السحوبات', `${withdrawals.toLocaleString('ar-SA')} ر.س`], ['الرصيد الختامي', `${(deposits - withdrawals).toLocaleString('ar-SA')} ر.س`]],
    }
  }

  if (doc.type === 'وثيقة رسمية') {
    const expiry = plusYear(doc.date)
    return {
      confidence: 94,
      data: { description: doc.name, expiryDate: expiry },
      fields: [...base, ['رقم الوثيقة', `${1000 + (seed % 9000)}-${seed % 9999}`], ['الجهة المصدرة', 'وزارة التجارة'], ['تاريخ الإصدار', doc.date], ['تاريخ الانتهاء', expiry], ['الحالة', 'سارية']],
    }
  }

  return {
    confidence: 80,
    data: { description: doc.name },
    fields: [...base, ['المحتوى', 'تم تحليل المستند العام'], ['عدد الصفحات', String(1 + (seed % 8))]],
  }
}

// كل الإجراءات الممكنة من أي مستند (تُعرض كاملةً في مركز الإجراءات)
export const ALL_DOC_ACTIONS: DocSuggestion[] = [
  { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'مصروف/إيراد من المستند' },
  { kind: 'tracking', icon: '🛡️', label: 'إضافة متابعة', desc: 'ضمان/عقد/وثيقة بتاريخ انتهاء' },
  { kind: 'receivable', icon: '⇄', label: 'تسجيل ذمة', desc: 'مبلغ مستحق لك أو عليك' },
  { kind: 'commitment', icon: '🔁', label: 'إنشاء التزام دوري', desc: 'دفعات متكررة (قسط/اشتراك)' },
  { kind: 'asset', icon: '📦', label: 'تسجيل كأصل', desc: 'أصل ملموس بقيمة شراء' },
]

// أنواع الإجراءات المُوصى بها لنوع المستند (لإبرازها ضمن القائمة الكاملة)
export function recommendedKinds(docType: string): Set<DocActionKind> {
  return new Set(suggestedActions(docType).map((a) => a.kind))
}

// الإجراءات المقترحة حسب نوع المستند
export function suggestedActions(docType: string): DocSuggestion[] {
  if (docType === 'فاتورة')
    return [
      { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'مصروف/إيراد بقيمة الفاتورة' },
      { kind: 'tracking', icon: '🛡️', label: 'إضافة ضمان للمتابعة', desc: 'تتبّع ضمان المنتج/الخدمة' },
      { kind: 'asset', icon: '📦', label: 'تسجيل كأصل', desc: 'إن كانت فاتورة شراء أصل ملموس' },
    ]
  if (docType === 'عقد')
    return [
      { kind: 'tracking', icon: '📄', label: 'إضافة عقد للمتابعة', desc: 'تتبّع مدة العقد والتجديد' },
      { kind: 'commitment', icon: '🔁', label: 'إنشاء التزام دوري', desc: 'إن كان العقد بدفعات متكررة' },
      { kind: 'receivable', icon: '⇄', label: 'تسجيل ذمة', desc: 'إن نتج عن العقد مبلغ مستحق' },
    ]
  if (docType === 'وثيقة رسمية')
    return [{ kind: 'tracking', icon: '🪪', label: 'إضافة وثيقة للمتابعة', desc: 'تتبّع تاريخ الانتهاء والتجديد' }]
  if (docType === 'كشف حساب')
    return [{ kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'إدخال عملية من الكشف' }]
  return [
    { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'تحويل المستند إلى عملية' },
    { kind: 'tracking', icon: '🛡️', label: 'إضافة عنصر متابعة', desc: 'تتبّع زمني للمستند' },
  ]
}
