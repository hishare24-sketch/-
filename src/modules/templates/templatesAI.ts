// ═══════════════════════════════════════════
//  ذكاء مولّد القوالب (محاكاة — واجهة موحّدة جاهزة للاستبدال بخادم)
//  4 ميزات: مصمّم ألوان · كاتب نصوص · مولّد قوالب بوصف · مدقّق قوالب
// ═══════════════════════════════════════════
import type { DocTemplate, TemplateDocType, TemplateSection } from '@/interfaces/models'
import { professionalSections, docTypeMeta } from './constants'

// ── 1. مصمّم الألوان الذكي ──
export interface Palette {
  name: string
  accent: string
  colors: string[]
}

const PALETTES: { keys: string[]; palette: Palette }[] = [
  { keys: ['مؤسسي', 'رسمي', 'هادئ', 'احترافي', 'كلاسيكي'], palette: { name: 'مؤسسي هادئ', accent: '#2563eb', colors: ['#2563eb', '#1e40af', '#64748b', '#e2e8f0'] } },
  { keys: ['فاخر', 'راقٍ', 'راقي', 'ذهبي', 'أنيق'], palette: { name: 'فخامة ذهبية', accent: '#b45309', colors: ['#b45309', '#1f2937', '#d4af37', '#f5f5f4'] } },
  { keys: ['حيوي', 'عصري', 'شبابي', 'نشيط', 'تقني'], palette: { name: 'عصري حيوي', accent: '#0891b2', colors: ['#0891b2', '#059669', '#22d3ee', '#ecfeff'] } },
  { keys: ['دافئ', 'ودّي', 'ودي', 'مرحّب', 'برتقالي'], palette: { name: 'دفء ودّي', accent: '#d97706', colors: ['#d97706', '#ea580c', '#fbbf24', '#fff7ed'] } },
  { keys: ['ناعم', 'أنثوي', 'بنفسجي', 'إبداعي', 'فني'], palette: { name: 'نعومة إبداعية', accent: '#7c3aed', colors: ['#7c3aed', '#db2777', '#a78bfa', '#faf5ff'] } },
  { keys: ['طبيعي', 'أخضر', 'بيئي', 'صحي'], palette: { name: 'طبيعة خضراء', accent: '#059669', colors: ['#059669', '#065f46', '#34d399', '#ecfdf5'] } },
]

// يقترح لوحات ألوان حسب وصف نصّي بسيط (يُرتّب المطابق أولاً)
export function suggestPalettes(description: string): Palette[] {
  const d = (description || '').trim()
  if (!d) return PALETTES.slice(0, 3).map((p) => p.palette)
  const scored = PALETTES.map((p) => ({
    palette: p.palette,
    score: p.keys.reduce((s, k) => s + (d.includes(k) ? 1 : 0), 0),
  }))
  const matched = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score)
  return (matched.length ? matched : scored).slice(0, 3).map((s) => s.palette)
}

// ── 2. كاتب النصوص الذكي ──
export type TextTone = 'رسمية' | 'ودية' | 'قانونية' | 'تسويقية'
export const TEXT_TONES: TextTone[] = ['رسمية', 'ودية', 'قانونية', 'تسويقية']

// يعيد صياغة نص بأسلوب النبرة المطلوبة (محاكاة تحويلية بسيطة)
export function improveText(text: string, tone: TextTone): string {
  const base = (text || '').trim().replace(/\s+/g, ' ')
  if (!base) return base
  const withPeriod = /[.!؟]$/.test(base) ? base : base + '.'
  switch (tone) {
    case 'رسمية':
      return `نفيدكم بأنه ${withPeriod} وتفضّلوا بقبول فائق الاحترام والتقدير.`
    case 'ودية':
      return `يسعدنا أن نشارككم: ${withPeriod} ونتطلّع دائماً لخدمتكم بكل سرور 🌟`
    case 'قانونية':
      return `يُقرّ الطرفان بموجب هذا البند بما يلي: ${withPeriod} ويُعدّ هذا النص ملزماً للطرفين وفق الأنظمة المرعية.`
    case 'تسويقية':
      return `🌟 ${withPeriod} اغتنم الفرصة الآن — جودة تفوق التوقعات وأسعار لا تُقاوم!`
  }
}

// ── 3. مولّد القوالب الذكي (بوصف نصّي) ──
const TYPE_KEYWORDS: { type: TemplateDocType; keys: string[] }[] = [
  { type: 'invoice', keys: ['فاتورة', 'فواتير', 'مبيعات', 'ضريبية'] },
  { type: 'quote', keys: ['عرض سعر', 'عرض أسعار', 'تسعير', 'quotation'] },
  { type: 'agreement', keys: ['عقد', 'اتفاقية', 'اتفاق', 'تعاقد'] },
  { type: 'payment_order', keys: ['أمر دفع', 'أمر صرف', 'صرف', 'دفع', 'تحويل'] },
  { type: 'official', keys: ['خطاب', 'تعميم', 'قرار', 'رسمي', 'محضر', 'طلب'] },
]

export interface GeneratedTemplate {
  name: string
  docType: TemplateDocType
  sections: TemplateSection[]
}

export function generateTemplateFromDescription(description: string): GeneratedTemplate {
  const d = (description || '').trim()
  // اكتشاف نوع المستند من الوصف (افتراضي: عرض سعر)
  const match = TYPE_KEYWORDS.find((t) => t.keys.some((k) => d.includes(k)))
  const docType: TemplateDocType = match?.type ?? 'quote'
  const label = docTypeMeta(docType)?.label ?? docType
  const name = d ? `${label} — ${d.slice(0, 40)}` : `نموذج ذكي — ${label}`
  return { name, docType, sections: professionalSections(docType) }
}

// ── 4. المدقّق الذكي (قبل الحفظ) ──
export interface TemplateIssue {
  level: 'ok' | 'warning' | 'info'
  title: string
  detail?: string
}

export function validateTemplate(t: DocTemplate): TemplateIssue[] {
  const out: TemplateIssue[] = []
  const allEls = t.sections.flatMap((s) => s.elements)

  // شعار
  if (!allEls.some((e) => e.type === 'image')) {
    out.push({ level: 'warning', title: 'لا يوجد شعار', detail: 'أضف عنصر صورة (شعار) في الترويسة لتعزيز الهوية.' })
  }
  // عنوان رئيسي
  if (!allEls.some((e) => e.type === 'heading')) {
    out.push({ level: 'warning', title: 'لا يوجد عنوان رئيسي', detail: 'أضف عنواناً يوضّح نوع المستند.' })
  }
  // أقسام فارغة
  const empty = t.sections.filter((s) => s.elements.length === 0)
  if (empty.length) {
    out.push({ level: 'warning', title: `${empty.length} قسم فارغ`, detail: `أقسام بلا عناصر: ${empty.map((s) => s.title).join('، ')}` })
  }
  // توقيع
  if (!allEls.some((e) => e.type === 'signature')) {
    out.push({ level: 'info', title: 'لا يوجد توقيع', detail: 'قد تحتاج إضافة عنصر توقيع في التذييل.' })
  }
  // تسميات مكرّرة داخل القسم نفسه
  for (const s of t.sections) {
    const labels = s.elements.map((e) => e.label.trim()).filter(Boolean)
    const dup = labels.find((l, i) => labels.indexOf(l) !== i)
    if (dup) {
      out.push({ level: 'info', title: `تسمية مكرّرة في «${s.title}»`, detail: `العنصر «${dup}» متكرّر داخل القسم نفسه.` })
      break
    }
  }
  // حقول إلزامية
  if (!allEls.some((e) => e.required)) {
    out.push({ level: 'info', title: 'لا حقول إلزامية', detail: 'حدّد الحقول الأساسية كإلزامية لضمان اكتمال المستند.' })
  }

  if (!out.length) out.push({ level: 'ok', title: 'القالب مكتمل', detail: 'لم يُرصد أي نقص — القالب جاهز للاستخدام.' })
  return out
}
