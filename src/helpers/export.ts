// ═══════════════════════════════════════════
//  تصدير Excel و PDF (تُحمّل المكتبات عند الطلب من CDN) — منقولة من legacy/App.tsx
// ═══════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

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

// قالب المستند المشترك: ترويسة بالشعار والعنوان + تذييل
export function docHTML(opts: { title: string; subtitle?: string; body: string; brand?: string }): string {
  const brand = opts.brand || 'موازين'
  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:16px;margin-bottom:24px">
      <div>
        <div style="font-size:26px;font-weight:800;color:#2563eb">${brand}</div>
        <div style="font-size:12px;color:#666;margin-top:2px">نظام الإدارة المالية والتشغيلية</div>
      </div>
      <div style="text-align:left">
        <div style="font-size:20px;font-weight:700">${opts.title}</div>
        ${opts.subtitle ? `<div style="font-size:12px;color:#666;margin-top:3px">${opts.subtitle}</div>` : ''}
        <div style="font-size:11px;color:#999;margin-top:3px">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</div>
      </div>
    </div>
    ${opts.body}
    <div style="margin-top:40px;padding-top:14px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center">
      صُدّر هذا المستند من نظام موازين · ${new Date().toLocaleString('ar-SA')}
    </div>`
}
