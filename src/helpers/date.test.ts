import { describe, it, expect } from 'vitest'
import { today, nowStamp, daysBetween, statusFromDays, advanceDate } from './date'

describe('date helpers', () => {
  it('today يُرجع تاريخاً بصيغة YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('nowStamp يُرجع تاريخاً ووقتاً بصيغة YYYY-MM-DD HH:MM', () => {
    expect(nowStamp()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
  })

  describe('daysBetween', () => {
    it('يُرجع ~0 لتاريخ اليوم', () => {
      expect(Math.abs(daysBetween(today()))).toBeLessThanOrEqual(1)
    })

    it('يُرجع قيمة موجبة لتاريخ مستقبلي', () => {
      const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
      expect(daysBetween(future)).toBeGreaterThan(5)
    })

    it('يُرجع قيمة سالبة لتاريخ ماضٍ', () => {
      const past = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10)
      expect(daysBetween(past)).toBeLessThan(-5)
    })
  })

  describe('statusFromDays', () => {
    it('منتهٍ إذا كانت الأيام سالبة', () => {
      expect(statusFromDays(-1)).toBe('expired')
    })
    it('يقترب من الانتهاء عند 30 يوماً أو أقل', () => {
      expect(statusFromDays(0)).toBe('expiring')
      expect(statusFromDays(15)).toBe('expiring')
      expect(statusFromDays(30)).toBe('expiring')
    })
    it('نشط لأكثر من 30 يوماً', () => {
      expect(statusFromDays(31)).toBe('active')
      expect(statusFromDays(365)).toBe('active')
    })
  })

  describe('advanceDate', () => {
    it('أسبوعي يضيف 7 أيام', () => {
      expect(advanceDate('2026-01-01', 'weekly')).toBe('2026-01-08')
    })
    it('شهري يضيف شهراً', () => {
      expect(advanceDate('2026-01-15', 'monthly')).toBe('2026-02-15')
    })
    it('ربع سنوي يضيف 3 أشهر', () => {
      expect(advanceDate('2026-01-15', 'quarterly')).toBe('2026-04-15')
    })
    it('سنوي يضيف سنة', () => {
      expect(advanceDate('2026-01-15', 'yearly')).toBe('2027-01-15')
    })
    it('يتعامل مع نهاية الشهر/تجاوز السنة', () => {
      expect(advanceDate('2026-12-15', 'monthly')).toBe('2027-01-15')
    })
  })
})
