import { describe, it, expect } from 'vitest'
import { fmt, fmtNum } from './format'

describe('format helpers', () => {
  it('fmt يُلحِق رمز العملة', () => {
    expect(fmt(0)).toContain('ر.س')
    expect(fmt(1000)).toContain('ر.س')
  })

  it('fmt يعرض القيمة الرقمية', () => {
    // ar-SA قد يستخدم أرقاماً عربية-هندية؛ نتأكد أن الناتج غير فارغ وينتهي بالعملة
    const out = fmt(1500)
    expect(out.endsWith('ر.س')).toBe(true)
    expect(out.trim().length).toBeGreaterThan('ر.س'.length)
  })

  it('fmtNum لا يُلحِق العملة', () => {
    expect(fmtNum(1000)).not.toContain('ر.س')
  })

  it('يتعامل مع القيم السالبة', () => {
    const out = fmt(-500)
    expect(out).toContain('ر.س')
  })

  it('fmt و fmtNum يتفقان على الجزء الرقمي', () => {
    const n = 12345
    expect(fmt(n).startsWith(fmtNum(n))).toBe(true)
  })
})
