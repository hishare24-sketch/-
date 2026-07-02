// ═══════════════════════════════════════════
//  تصدير Excel و PDF (تُحمّل المكتبات عند الطلب من CDN) — منقولة من legacy/App.tsx
// ═══════════════════════════════════════════

import { escapeHTML } from '@/helpers/html'

// ── Excel (ملفات .xlsx حقيقية عبر SheetJS) ──
let _xlsxPromise: Promise<any> | null = null
export function loadXLSX(): Promise<any> {
  if ((window as any).XLSX) return Promise.resolve((window as any).XLSX)
  if (_xlsxPromise) return _xlsxPromise
  _xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
    s.onload = () => resolve((window as any).XLSX)
    s.onerror = () => reject(new Error('تعذّر تحميل مكتبة Excel'))
    document.head.appendChild(s)
  })
  return _xlsxPromise
}

// استيراد أول ورقة من ملف .xlsx كمصفوفة كائنات
export async function importXLSX(file: File): Promise<Record<string, any>[]> {
  const XLSX = await loadXLSX()
  const data = await file.arrayBuffer()
  // codepage 65001 = UTF-8 (يحافظ على العربية في ملفات CSV؛ يُتجاهل مع xlsx)
  const wb = XLSX.read(data, { type: 'array', codepage: 65001 })
  const firstSheet = wb.SheetNames[0]
  if (!firstSheet) return []
  return XLSX.utils.sheet_to_json(wb.Sheets[firstSheet]) as Record<string, any>[]
}

// تصدير ورقة أو أكثر إلى ملف .xlsx واحد
export async function exportXLSX(
  fileName: string,
  sheets: { name: string; rows: Record<string, any>[] }[],
): Promise<void> {
  const XLSX = await loadXLSX()
  const wb = XLSX.utils.book_new()
  sheets.forEach((sh) => {
    const ws = XLSX.utils.json_to_sheet(sh.rows.length ? sh.rows : [{ '—': 'لا توجد بيانات' }])
    XLSX.utils.book_append_sheet(wb, ws, sh.name.slice(0, 31))
  })
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx')
}

// ── PDF (عبر html2pdf مع دعم RTL العربي) ──
let _pdfPromise: Promise<any> | null = null
export function loadPDF(): Promise<any> {
  if ((window as any).html2pdf) return Promise.resolve((window as any).html2pdf)
  if (_pdfPromise) return _pdfPromise
  _pdfPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    s.onload = () => resolve((window as any).html2pdf)
    s.onerror = () => reject(new Error('تعذّر تحميل مكتبة PDF'))
    document.head.appendChild(s)
  })
  return _pdfPromise
}

// تحويل سلسلة HTML إلى ملف PDF قابل للتنزيل
export async function exportPDF(fileName: string, innerHTML: string): Promise<void> {
  const html2pdf = await loadPDF()
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'direction:rtl;font-family:Tahoma,Arial,sans-serif;padding:32px;color:#111;background:#fff;width:794px;box-sizing:border-box'
  wrap.innerHTML = innerHTML
  document.body.appendChild(wrap)
  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: fileName.endsWith('.pdf') ? fileName : fileName + '.pdf',
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
      })
      .from(wrap)
      .save()
  } finally {
    document.body.removeChild(wrap)
  }
}

// هوية المستندات القابلة للتخصيص (محرّر القوالب) — تُطبّق على كل مخرجات PDF
export interface DocBranding {
  brand: string
  tagline: string
  accent: string
  footer: string
  logo: string
}

const DEFAULT_BRANDING: DocBranding = {
  brand: 'موازين',
  tagline: 'نظام الإدارة المالية والتشغيلية',
  accent: '#2563eb',
  footer: '',
  logo: '',
}

let _branding: DocBranding = { ...DEFAULT_BRANDING }

// يحدّثها SettingsStore.applyBranding() لتصبح الهوية عامة لكل المستندات
export function setDocBranding(patch: Partial<DocBranding>): void {
  _branding = { ..._branding, ...patch }
}
export function getDefaultBranding(): DocBranding {
  return { ...DEFAULT_BRANDING }
}

// قالب المستند المشترك: ترويسة بالشعار والعنوان + تذييل (يقبل تجاوزات لكل مستند)
export function docHTML(opts: {
  title: string
  subtitle?: string
  body: string
  brand?: string
  tagline?: string
  accent?: string
  footer?: string
  logo?: string
}): string {
  // تُهرَّب كل الحقول القابلة للتحكم من المستخدم؛ opts.body وحده HTML موثوق يبنيه المُنادي
  const brand = escapeHTML(opts.brand ?? _branding.brand)
  const tagline = escapeHTML(opts.tagline ?? _branding.tagline)
  const accent = escapeHTML(opts.accent ?? _branding.accent)
  const footer = escapeHTML(opts.footer ?? _branding.footer)
  const logo = escapeHTML(opts.logo ?? _branding.logo)
  const title = escapeHTML(opts.title)
  const subtitle = escapeHTML(opts.subtitle)
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:16px;margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:10px">
        ${logo ? `<div style="font-size:30px">${logo}</div>` : ''}
        <div>
          <div style="font-size:26px;font-weight:800;color:${accent}">${brand}</div>
          ${tagline ? `<div style="font-size:12px;color:#666;margin-top:2px">${tagline}</div>` : ''}
        </div>
      </div>
      <div style="text-align:left">
        <div style="font-size:20px;font-weight:700">${title}</div>
        ${subtitle ? `<div style="font-size:12px;color:#666;margin-top:3px">${subtitle}</div>` : ''}
        <div style="font-size:11px;color:#999;margin-top:3px">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    </div>
    ${opts.body}
    <div style="margin-top:40px;padding-top:14px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center">
      ${footer ? `${footer}<br>` : ''}صُدّر هذا المستند من نظام ${brand} · ${new Date().toLocaleString('ar-SA')}
    </div>`
}
