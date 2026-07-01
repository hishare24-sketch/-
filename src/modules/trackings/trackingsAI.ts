import type { Tracking } from '@/interfaces/models'

// ── مساعد المتابعة الذكي (دورة ذكاء اصطناعي تفاعلية موازية لـ docAI) ──
// يحلّل المتابعة ويقترح تاريخ تجديد وإجراءات ذكية تربطها بباقي الأقسام (مالية/التزامات)

export type TrackingActionKind = 'renew' | 'expense' | 'commitment' | 'link'

export interface TrackingSuggestion {
  kind: TrackingActionKind
  icon: string
  label: string
  desc: string
}

export interface TrackingInsight {
  risk: 'high' | 'medium' | 'low'
  headline: string
  points: string[]
  suggestedRenewalDate: string
  suggestedActions: TrackingSuggestion[]
}

// دورية التجديد الاعتيادية حسب نوع المتابعة (بالأشهر)
const RENEW_MONTHS: Record<string, number> = {
  اشتراك: 1,
  تأمين: 12,
  ترخيص: 12,
  عقد: 12,
  ضمان: 12,
  وثيقة: 24,
}

// الأنواع المتكرّرة التي يُنطقي تحويلها لالتزام دوري
const RECURRING_TYPES = new Set(['اشتراك', 'تأمين', 'عقد'])

function addMonths(iso: string, months: number): string {
  const d = new Date(iso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function analyzeTracking(t: Tracking): TrackingInsight {
  const months = RENEW_MONTHS[t.type] ?? 12
  // نبني تاريخ التجديد من تاريخ الانتهاء إن كان مستقبلاً، وإلا من اليوم
  const base = t.daysLeft >= 0 ? t.expiryDate : new Date().toISOString().slice(0, 10)
  const suggestedRenewalDate = addMonths(base, months)

  const risk: TrackingInsight['risk'] =
    t.status === 'expired' ? 'high' : t.status === 'expiring' ? 'medium' : 'low'

  const headline =
    risk === 'high'
      ? `⚠️ «${t.name}» منتهٍ منذ ${Math.abs(t.daysLeft)} يوم — يُنصح بالتجديد فوراً`
      : risk === 'medium'
        ? `⏳ «${t.name}» يوشك على الانتهاء (${t.daysLeft} يوم) — جهّز التجديد`
        : `✅ «${t.name}» ساري — يتبقّى ${t.daysLeft} يوم`

  const points: string[] = []
  points.push(`الدورة الاعتيادية لهذا النوع: كل ${months === 12 ? 'سنة' : months === 1 ? 'شهر' : `${months} شهر`}`)
  points.push(`تاريخ تجديد مقترح: ${suggestedRenewalDate}`)
  if (t.renewedCount) points.push(`سبق تجديدها ${t.renewedCount} مرة`)
  if (t.cost != null && t.cost > 0) points.push(`تكلفة التجديد المقدّرة: ${t.cost.toLocaleString('ar-SA')} ر.س`)
  if (!t.attachments?.length) points.push('لا توجد مرفقات — يُنصح بإرفاق الوثيقة/الفاتورة')

  const suggestedActions: TrackingSuggestion[] = [
    { kind: 'renew', icon: '🔄', label: 'تجديد للتاريخ المقترح', desc: suggestedRenewalDate },
  ]
  if (t.cost != null && t.cost > 0) {
    suggestedActions.push({ kind: 'expense', icon: '💸', label: 'تسجيل رسوم التجديد كمصروف', desc: `${t.cost.toLocaleString('ar-SA')} ر.س في المالية` })
  }
  if (RECURRING_TYPES.has(t.type) && t.cost != null && t.cost > 0) {
    suggestedActions.push({ kind: 'commitment', icon: '🔁', label: 'تحويل لالتزام دوري', desc: 'أتمتة التذكير والدفع المتكرّر' })
  }
  suggestedActions.push({ kind: 'link', icon: '📎', label: 'ربط بمستند', desc: 'أرفق الوثيقة الرسمية للمتابعة' })

  return { risk, headline, points, suggestedRenewalDate, suggestedActions }
}
