// ═══════════════════════════════════════════
//  قوالب المستندات القابلة للتصدير PDF (عرض سعر / أمر دفع / اتفاقية)
//  تبني جسم HTML ثم تُغلّفه بـ docHTML وتصدّره عبر exportPDF — أساس محرّر القوالب
// ═══════════════════════════════════════════
import { exportPDF, docHTML } from '@/helpers/export'
import { fmtNum } from '@/helpers/format'
import { escapeHTML, escapeHTMLBr } from '@/helpers/html'

export type TemplateId = 'quote' | 'payment_order' | 'agreement'

export interface TemplateMeta {
  id: TemplateId
  label: string
  icon: string
  desc: string
}

export const DOC_TEMPLATES: TemplateMeta[] = [
  { id: 'quote', label: 'عرض سعر', icon: '💰', desc: 'عرض أسعار ببنود وكميات وضريبة وإجمالي' },
  { id: 'payment_order', label: 'أمر دفع', icon: '📤', desc: 'أمر صرف مبلغ لمستفيد مع البيان والاعتماد' },
  { id: 'agreement', label: 'اتفاقية', icon: '📜', desc: 'اتفاقية بين طرفين بموضوع وبنود وقيمة ومدة' },
]

// ── أنواع بيانات كل قالب ──
export interface QuoteItem {
  desc: string
  qty: number
  price: number
}
export interface QuoteData {
  ref: string
  date: string
  client: string
  items: QuoteItem[]
  vatPercent: number
  validity: string
  notes: string
}
export interface PaymentOrderData {
  ref: string
  date: string
  payee: string
  amount: number
  purpose: string
  method: string
  project: string
  approver: string
}
export interface AgreementData {
  ref: string
  date: string
  party1: string
  party2: string
  subject: string
  value: number
  startDate: string
  endDate: string
  clauses: string
}

const money = (n: number) => `${fmtNum(n)} ر.س`

// صفّ ثنائي (تسمية/قيمة) للجداول التفصيلية
function kvRows(rows: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 0;color:#666;width:170px;vertical-align:top">${k}</td><td style="padding:9px 0;font-weight:600">${v || '—'}</td></tr>`,
    )
    .join('')}</table>`
}

// ── عرض سعر ──
export function quoteBody(d: QuoteData): string {
  const subtotal = d.items.reduce((s, it) => s + it.qty * it.price, 0)
  const vat = Math.round(subtotal * (d.vatPercent / 100))
  const total = subtotal + vat
  const itemRows = d.items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:9px 8px;border-bottom:1px solid #eee;text-align:center">${i + 1}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #eee">${escapeHTML(it.desc) || '—'}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #eee;text-align:center">${fmtNum(it.qty)}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #eee;text-align:left">${money(it.price)}</td>
        <td style="padding:9px 8px;border-bottom:1px solid #eee;text-align:left;font-weight:600">${money(it.qty * it.price)}</td>
      </tr>`,
    )
    .join('')
  return `
    ${kvRows([
      ['رقم العرض', escapeHTML(d.ref)],
      ['التاريخ', escapeHTML(d.date)],
      ['العميل / الجهة', escapeHTML(d.client)],
      ['صلاحية العرض', escapeHTML(d.validity)],
    ])}
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:18px">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px 8px;text-align:center;width:36px">#</th>
          <th style="padding:10px 8px;text-align:right">الوصف</th>
          <th style="padding:10px 8px;text-align:center;width:70px">الكمية</th>
          <th style="padding:10px 8px;text-align:left;width:110px">السعر</th>
          <th style="padding:10px 8px;text-align:left;width:120px">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:14px">
      <tr><td style="padding:6px 0;text-align:left;color:#666">المجموع الفرعي</td><td style="padding:6px 0;text-align:left;width:150px;font-weight:600">${money(subtotal)}</td></tr>
      <tr><td style="padding:6px 0;text-align:left;color:#666">الضريبة (${fmtNum(d.vatPercent)}%)</td><td style="padding:6px 0;text-align:left;font-weight:600">${money(vat)}</td></tr>
      <tr style="font-size:17px"><td style="padding:12px 0;text-align:left;font-weight:800;border-top:2px solid #2563eb">الإجمالي النهائي</td><td style="padding:12px 0;text-align:left;font-weight:800;border-top:2px solid #2563eb;color:#2563eb">${money(total)}</td></tr>
    </table>
    ${d.notes ? `<div style="margin-top:18px;padding:12px 14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#444;line-height:1.8"><b>ملاحظات وشروط:</b><br>${escapeHTMLBr(d.notes)}</div>` : ''}`
}

// ── أمر دفع ──
export function paymentOrderBody(d: PaymentOrderData): string {
  return `
    ${kvRows([
      ['رقم الأمر', escapeHTML(d.ref)],
      ['التاريخ', escapeHTML(d.date)],
      ['المستفيد', escapeHTML(d.payee)],
      ['المشروع', escapeHTML(d.project)],
      ['بيان الدفع', escapeHTML(d.purpose)],
      ['طريقة الدفع', escapeHTML(d.method)],
    ])}
    <table style="width:100%;border-collapse:collapse;font-size:18px;margin-top:16px">
      <tr><td style="padding:14px 0;font-weight:800;border-top:2px solid #2563eb;border-bottom:2px solid #2563eb">المبلغ المطلوب صرفه</td><td style="padding:14px 0;font-weight:800;border-top:2px solid #2563eb;border-bottom:2px solid #2563eb;text-align:left;color:#2563eb">${money(d.amount)}</td></tr>
    </table>
    <table style="width:100%;margin-top:56px;font-size:13px">
      <tr>
        <td style="text-align:center;color:#666">
          المُعِدّ<br><br>........................
        </td>
        <td style="text-align:center;color:#666">
          المُعتمِد: ${escapeHTML(d.approver) || '—'}<br><br>........................
        </td>
        <td style="text-align:center;color:#666">
          المستلم<br><br>........................
        </td>
      </tr>
    </table>`
}

// ── اتفاقية ──
export function agreementBody(d: AgreementData): string {
  const clauseList = d.clauses
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean)
  const clausesHtml = clauseList.length
    ? `<ol style="margin:0;padding-inline-start:20px;font-size:13px;line-height:2;color:#333">${clauseList.map((c) => `<li>${escapeHTML(c)}</li>`).join('')}</ol>`
    : '<div style="color:#999;font-size:13px">— لا توجد بنود —</div>'
  return `
    <div style="font-size:15px;font-weight:700;margin-bottom:14px">${escapeHTML(d.subject) || 'اتفاقية'}</div>
    ${kvRows([
      ['رقم الاتفاقية', escapeHTML(d.ref)],
      ['التاريخ', escapeHTML(d.date)],
      ['الطرف الأول', escapeHTML(d.party1)],
      ['الطرف الثاني', escapeHTML(d.party2)],
      ['القيمة / المقابل', d.value ? money(d.value) : '—'],
      ['المدة', d.startDate || d.endDate ? `${escapeHTML(d.startDate) || '—'} ← ${escapeHTML(d.endDate) || '—'}` : '—'],
    ])}
    <div style="margin-top:18px;font-weight:700;font-size:14px;margin-bottom:8px">بنود الاتفاقية</div>
    ${clausesHtml}
    <table style="width:100%;margin-top:56px;font-size:13px">
      <tr>
        <td style="text-align:center;color:#666">الطرف الأول<br>${escapeHTML(d.party1)}<br><br>........................</td>
        <td style="text-align:center;color:#666">الطرف الثاني<br>${escapeHTML(d.party2)}<br><br>........................</td>
      </tr>
    </table>`
}

// ── تصدير موحّد حسب القالب ──
export function exportTemplatePDF(
  id: TemplateId,
  data: QuoteData | PaymentOrderData | AgreementData,
  brand?: string,
): Promise<void> {
  let title = ''
  let subtitle = ''
  let body = ''
  let fileName = ''

  if (id === 'quote') {
    const d = data as QuoteData
    title = 'عرض سعر'
    subtitle = d.client
    body = quoteBody(d)
    fileName = `عرض_سعر_${d.client || d.ref}`
  } else if (id === 'payment_order') {
    const d = data as PaymentOrderData
    title = 'أمر دفع'
    subtitle = d.payee
    body = paymentOrderBody(d)
    fileName = `أمر_دفع_${d.payee || d.ref}`
  } else {
    const d = data as AgreementData
    title = 'اتفاقية'
    subtitle = d.subject
    body = agreementBody(d)
    fileName = `اتفاقية_${d.subject || d.ref}`
  }

  return exportPDF(fileName, docHTML({ title, subtitle, body, brand }))
}
