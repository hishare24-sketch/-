// ═══════════════════════════════════════════
//  تهريب HTML — مصدر واحد لمنع XSS في كل بناة الـHTML (تصدير/قوالب/مستندات)
// ═══════════════════════════════════════════

// تهريب النص لإدراجه بأمان داخل محتوى أو قيمة سمة HTML
export function escapeHTML(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// تهريب ثم تحويل الأسطر الجديدة إلى <br> (لحقول النص متعدّد الأسطر)
export function escapeHTMLBr(s: unknown): string {
  return escapeHTML(s).replace(/\n/g, '<br>')
}
