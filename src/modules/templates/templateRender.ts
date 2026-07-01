// ═══════════════════════════════════════════
//  تصيير قالب + قيم المستخدم إلى HTML (للمعاينة والتصدير PDF)
// ═══════════════════════════════════════════
import type { DocTemplate, TemplateElement } from '@/interfaces/models'
import { fmtNum } from '@/helpers/format'

// أنواع العناصر التي تتطلّب إدخالاً من المستخدم (تظهر في النموذج)
export const INPUT_TYPES = new Set<TemplateElement['type']>([
  'short_text', 'long_text', 'number', 'date', 'dropdown', 'checkbox',
])
export const TABLE_TYPES = new Set<TemplateElement['type']>(['table', 'items_table'])

export type FieldValues = Record<string, string>
export type TableRows = Record<string, string[][]>

// تهريب HTML لمنع XSS من إدخال المستخدم
export function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// آخر عمود رقمي في صفوف الجدول → مجموعه (لجدول المنتجات)
function tableTotal(rows: string[][]): number {
  return rows.reduce((sum, r) => {
    const last = Number((r[r.length - 1] ?? '').replace(/[^\d.-]/g, ''))
    return sum + (isFinite(last) ? last : 0)
  }, 0)
}

function fmtNumber(el: TemplateElement, raw: string): string {
  const n = Number(raw)
  if (!raw || !isFinite(n)) return esc(raw)
  if (el.numberFormat === 'currency') return `${fmtNum(n)} ر.س`
  if (el.numberFormat === 'percent') return `${fmtNum(n)}%`
  return fmtNum(n)
}

function textStyle(el: TemplateElement): string {
  const s: string[] = []
  if (el.fontSize) s.push(`font-size:${el.fontSize}px`)
  if (el.color) s.push(`color:${esc(el.color)}`)
  if (el.bold) s.push('font-weight:700')
  if (el.italic) s.push('font-style:italic')
  if (el.align) s.push(`text-align:${el.align}`)
  return s.join(';')
}

function renderElement(el: TemplateElement, values: FieldValues, tables: TableRows): string {
  if (el.hidden) return ''
  const val = values[el.id] ?? el.defaultValue ?? ''

  switch (el.type) {
    case 'heading':
      return `<div style="font-weight:800;font-size:${el.fontSize ?? 17}px;${textStyle(el)};margin:6px 0">${esc(el.label)}</div>`
    case 'paragraph':
      return `<p style="margin:6px 0;line-height:1.9;${textStyle(el)}">${esc(el.label)}</p>`
    case 'page_break':
      return '<div style="page-break-after:always;height:0"></div>'
    case 'image':
    case 'signature': {
      // الأولوية لصورة المستند (values) ثم صورة القالب (el.src)؛ وإلا مربّع نائب
      const img = values[el.id] || el.src || ''
      if (img)
        return `<div style="margin:8px 0;text-align:${el.align ?? 'center'}"><img src="${esc(img)}" alt="${esc(el.label)}" style="max-height:${el.type === 'image' ? 90 : 60}px;max-width:100%;object-fit:contain" /></div>`
      return `<div style="margin:8px 0;padding:18px;border:1px dashed #cbd5e1;border-radius:8px;text-align:center;color:#94a3b8;font-size:12px">${esc(el.label)}</div>`
    }
    case 'checkbox':
      return `<div style="margin:5px 0;font-size:14px"><b>${esc(el.label)}:</b> ${val === 'true' || val === 'نعم' ? '☑ نعم' : '☐ لا'}</div>`
    case 'number':
    case 'computed':
      return `<div style="margin:5px 0;font-size:14px"><b>${esc(el.label)}:</b> ${fmtNumber(el, val)}</div>`
    case 'table':
    case 'items_table': {
      const cols = el.columns ?? []
      const rows = tables[el.id] ?? []
      const head = cols.map((c) => `<th style="padding:8px;border:1px solid #e2e8f0;background:#f1f5f9;text-align:right">${esc(c)}</th>`).join('')
      const body = rows
        .map((r) => `<tr>${cols.map((_, ci) => `<td style="padding:8px;border:1px solid #e2e8f0">${esc(r[ci] ?? '')}</td>`).join('')}</tr>`)
        .join('')
      const totalRow =
        el.type === 'items_table' && rows.length
          ? `<tr><td colspan="${Math.max(1, cols.length - 1)}" style="padding:8px;border:1px solid #e2e8f0;text-align:left;font-weight:700">الإجمالي</td><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700;color:#2563eb">${fmtNum(tableTotal(rows))} ر.س</td></tr>`
          : ''
      return `<div style="margin:8px 0"><div style="font-size:13px;font-weight:700;margin-bottom:6px">${esc(el.label)}</div><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>${head}</tr></thead><tbody>${body}${totalRow}</tbody></table></div>`
    }
    default:
      // short_text / long_text / date / dropdown
      return `<div style="margin:5px 0;font-size:14px"><b>${esc(el.label)}:</b> ${esc(val) || '—'}</div>`
  }
}

// تصيير جسم المستند كاملاً (أقسام + عناصر ظاهرة)
export function renderTemplateBody(template: DocTemplate, values: FieldValues, tables: TableRows): string {
  return template.sections
    .map((sec) => {
      const els = sec.elements.filter((e) => !e.hidden)
      if (!els.length) return ''
      const inner = els.map((e) => renderElement(e, values, tables)).join('')
      const header = sec.kind === 'header' || sec.kind === 'footer'
      return `<div style="margin-bottom:16px">${
        header ? '' : `<div style="font-size:12px;font-weight:700;color:#64748b;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:8px">${esc(sec.title)}</div>`
      }${inner}</div>`
    })
    .join('')
}
