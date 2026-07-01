import { describe, it, expect } from 'vitest'
import { escapeHTML, escapeHTMLBr } from './html'
import { quoteBody, agreementBody, paymentOrderBody } from './documents'

const XSS = '<img src=x onerror=alert(1)>'

describe('escapeHTML', () => {
  it('يهرّب الرموز الخطرة', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;')
    expect(escapeHTML(`"'&`)).toBe('&quot;&#39;&amp;')
  })
  it('يتعامل مع null/undefined بأمان', () => {
    expect(escapeHTML(null)).toBe('')
    expect(escapeHTML(undefined)).toBe('')
  })
  it('escapeHTMLBr يهرّب ثم يحوّل الأسطر', () => {
    expect(escapeHTMLBr('a\n<b>')).toBe('a<br>&lt;b&gt;')
  })
})

describe('بناة المستندات لا تسرّب HTML خام', () => {
  it('quoteBody يهرّب حقن العميل والبنود والملاحظات', () => {
    const html = quoteBody({
      ref: XSS, date: '2026-01-01', client: XSS,
      items: [{ desc: XSS, qty: 1, price: 10 }],
      vatPercent: 15, validity: '30 يوم', notes: XSS,
    })
    expect(html).not.toContain('<img src=x onerror')
    expect(html).toContain('&lt;img src=x onerror')
  })
  it('agreementBody يهرّب الأطراف والبنود', () => {
    const html = agreementBody({
      ref: 'r', date: 'd', party1: XSS, party2: XSS, subject: XSS,
      value: 0, startDate: '', endDate: '', clauses: `${XSS}\nبند ثانٍ`,
    })
    expect(html).not.toContain('<img src=x onerror')
  })
  it('paymentOrderBody يهرّب المستفيد والبيان', () => {
    const html = paymentOrderBody({
      ref: 'r', date: 'd', payee: XSS, amount: 100,
      purpose: XSS, method: 'نقدي', project: XSS, approver: XSS,
    })
    expect(html).not.toContain('<img src=x onerror')
  })
})
