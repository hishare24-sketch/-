// ═══════════════════════════════════════════
//  التحقق الذكي من العمليات المالية (منقول من legacy/App.tsx)
// ═══════════════════════════════════════════
import type { Project, Transaction, TxType } from '@/interfaces/models'
import { computeBalance } from '@/helpers/calc'
import { fmtNum } from '@/helpers/format'
import { today } from '@/helpers/date'

export interface TxWarning {
  level: 'error' | 'warning' | 'info'
  title: string
  detail: string
  consequence?: string
  fix?: string
}

interface TxInput {
  type: TxType
  amount: number
  projectId: string
  toProject?: string
  date: string
  description: string
  category?: string
  id?: string
}

export function analyzeTx(
  tx: TxInput,
  ctx: { project?: Project | null; transactions: Transaction[] },
): TxWarning[] {
  const out: TxWarning[] = []
  const amt = Number(tx.amount) || 0

  // 1. مبلغ سالب / صفري
  if (amt < 0)
    out.push({ level: 'error', title: 'مبلغ سالب', detail: 'المبلغ المُدخل سالب.', consequence: 'في موازين يُحدَّد الاتجاه بنوع العملية لا بإشارة المبلغ، فالقيمة السالبة ستشوّه التقارير.', fix: 'أدخل المبلغ موجباً واختر النوع الصحيح (مصروف/إيراد).' })
  else if (amt === 0)
    out.push({ level: 'warning', title: 'مبلغ صفري', detail: 'قيمة العملية صفر.', consequence: 'لن تؤثّر على الرصيد، وقد تكون أُدخلت بالخطأ.' })

  // 2. تحويل لنفس المشروع
  if (tx.type === 'transfer' && tx.toProject && tx.toProject === tx.projectId) {
    out.push({ level: 'error', title: 'تحويل لنفس المشروع', detail: 'المشروع المصدر والوجهة متطابقان.', consequence: 'تحويل بلا أثر فعلي، وسيُنشئ طرفين متعارضين في نفس المشروع.', fix: 'اختر مشروع وجهة مختلفاً عن المصدر.' })
  }

  // 3. مصروف يتجاوز الرصيد
  if (tx.type === 'expense' && ctx.project) {
    const bal = computeBalance(ctx.project, ctx.transactions.filter((t) => t.id !== tx.id))
    if (amt > bal) {
      out.push({
        level: 'warning',
        title: 'المصروف يتجاوز الرصيد',
        detail: `رصيد المشروع الحالي ${fmtNum(bal)} ر.س، والمصروف ${fmtNum(amt)} ر.س.`,
        consequence: `سيصبح رصيد المشروع سالباً (${fmtNum(bal - amt)} ر.س) بعد هذه العملية.`,
        fix: 'تأكّد من توفّر السيولة، أو سجّل إيراداً/تحويلاً وارداً أولاً، أو راجع المبلغ.',
      })
    }
  }

  // 4. تاريخ مستقبلي
  if (tx.date > today()) {
    out.push({ level: 'info', title: 'تاريخ مستقبلي', detail: `تاريخ العملية (${tx.date}) في المستقبل.`, consequence: 'ستظهر ضمن الفترات القادمة وقد لا تُحتسب في تقارير اليوم.' })
  }

  // 5. مبلغ غير معتاد (> 5× متوسط نفس النوع)
  if ((tx.type === 'expense' || tx.type === 'income') && ctx.project) {
    const same = ctx.transactions.filter((t) => t.projectId === tx.projectId && t.type === tx.type && t.id !== tx.id)
    if (same.length >= 3) {
      const avg = same.reduce((s, t) => s + t.amount, 0) / same.length
      if (avg > 0 && amt > avg * 5) {
        out.push({ level: 'info', title: 'مبلغ غير معتاد', detail: `المبلغ أكبر بكثير من متوسط ${tx.type === 'expense' ? 'مصروفات' : 'إيرادات'} المشروع (${fmtNum(Math.round(avg))} ر.س).`, consequence: 'قد يكون إدخالاً خاطئاً (أصفار زائدة مثلاً). تأكّد من صحة المبلغ.' })
      }
    }
  }

  // 6. وصف قصير
  if (tx.description.trim().length > 0 && tx.description.trim().length < 3) {
    out.push({ level: 'info', title: 'وصف قصير', detail: 'وصف العملية قصير جداً.', consequence: 'وصف واضح يسهّل المراجعة والتقارير لاحقاً.' })
  }

  return out
}

// الأخطاء الحاجبة التي تُعلّم العملية المحفوظة بالأحمر في القوائم
export function txErrors(tx: Transaction, ctx: { project?: Project | null; transactions: Transaction[] }): TxWarning[] {
  return analyzeTx(tx, ctx).filter(
    (w) => w.level === 'error' || (w.level === 'warning' && w.title === 'المصروف يتجاوز الرصيد'),
  )
}
