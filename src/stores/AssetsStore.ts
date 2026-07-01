import { defineStore } from 'pinia'
import type { Asset, AssetEventKind, AssetPeriodic, AssetStatus, AssetWarranty, MaintenanceEntry } from '@/interfaces/models'
import { INITIAL_ASSETS } from '@/data/seed'
import { uid } from '@/helpers/id'
import { fmt } from '@/helpers/format'
import { today, daysBetween, statusFromDays } from '@/helpers/date'
import { ASSET_STATUS } from '@/constants'
import { currentUserName } from '@/helpers/currentUser'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useAuditStore } from '@/stores/AuditStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useProjectsStore } from '@/stores/ProjectsStore'

export type AssetPayload = Omit<Asset, 'id'>

// متجر الأصول الملموسة — الصيانة/الإصلاح بتكلفة تُسجَّل كمصروف فعلي، وكل حدث يُوثَّق
export const useAssetsStore = defineStore('assets', {
  state: () => ({
    assets: [...INITIAL_ASSETS] as Asset[],
  }),

  getters: {
    byProject: (s) => (projectId: string) => s.assets.filter((a) => a.projectId === projectId),
  },

  actions: {
    // تسجيل حدث في سجل الأصل
    _event(a: Asset, kind: AssetEventKind, text: string) {
      if (!a.events) a.events = []
      a.events.unshift({ id: uid('ev'), date: today(), kind, text, createdBy: currentUserName() })
    },

    addAsset(payload: AssetPayload) {
      this.assets.unshift({ ...payload, id: uid('as'), events: [] })
      useAuditStore().log('إنشاء', 'أصل', `${payload.name} — ${fmt(payload.purchaseValue)}`)
    },

    // تعديل بيانات الأصل (يحافظ على السجل والصيانة)
    updateAsset(id: string, patch: Partial<Asset>) {
      const i = this.assets.findIndex((a) => a.id === id)
      if (i === -1) return
      this.assets[i] = { ...this.assets[i], ...patch, id }
      useAuditStore().log('تعديل', 'أصل', this.assets[i].name)
    },

    deleteAsset(id: string) {
      this.assets = this.assets.filter((a) => a.id !== id)
    },

    // صيانة/إصلاح/عطل/فحص/دورية → تُسجّل مصروفاً إن كان لها تكلفة + تحدّث العداد/الحالة
    addMaintenance(assetId: string, m: Omit<MaintenanceEntry, 'id'>): string | null {
      const a = this.assets.find((x) => x.id === assetId)
      if (!a) return null
      const mnId = uid('mn')
      a.maintenance.push({ ...m, id: mnId })
      if (m.meter != null) a.usageMeter = m.meter
      if (m.type === 'عطل') a.status = 'maintenance'

      if (m.cost > 0) {
        useFinanceStore().saveTransaction({
          projectId: a.projectId,
          type: 'expense',
          description: `${m.type} - ${a.name}${m.note ? ` (${m.note})` : ''}`,
          amount: m.cost,
          category: 'صيانة',
          date: m.date,
          hasDoc: false,
          note: 'صيانة أصل',
          createdBy: currentUserName(),
        })
      }
      // جدولة الدورة التالية عند تسجيل صيانة دورية
      if (m.type === 'دورية' && a.periodic) a.periodic.nextDue = this._nextDue(m.date, a.periodic)
      useAuditStore().log('تسجيل', 'صيانة أصل', `${a.name} — ${m.type} ${fmt(m.cost)}`)
      return mnId
    },

    // تحديث قراءة العداد
    updateMeter(id: string, meter: number, unit?: string) {
      const a = this.assets.find((x) => x.id === id)
      if (!a) return
      a.usageMeter = meter
      if (unit) a.usageUnit = unit
      this._event(a, 'meter', `تحديث العداد إلى ${meter.toLocaleString('ar')} ${a.usageUnit ?? ''}`)
    },

    // نقل المسؤول/الحائز
    transferHolder(id: string, memberId: string) {
      const a = this.assets.find((x) => x.id === id)
      if (!a) return
      const name = memberId ? useProjectsStore().memberById(memberId)?.name ?? '—' : 'بدون'
      a.memberId = memberId || undefined
      this._event(a, 'transfer', `نقل العهدة إلى: ${name}`)
      useAuditStore().log('نقل', 'أصل', `${a.name} → ${name}`)
    },

    // تغيير الحالة يدوياً
    setStatus(id: string, status: AssetStatus, note?: string) {
      const a = this.assets.find((x) => x.id === id)
      if (!a) return
      a.status = status
      this._event(a, 'status', `تغيير الحالة إلى «${ASSET_STATUS[status].label}»${note ? ` — ${note}` : ''}`)
    },

    // بيع الأصل → حالة مُباع + إيراد فعلي
    sellAsset(id: string, amount: number, date: string) {
      const a = this.assets.find((x) => x.id === id)
      if (!a) return
      a.status = 'sold'
      a.saleValue = amount
      a.saleDate = date
      if (amount > 0) {
        useFinanceStore().saveTransaction({
          projectId: a.projectId,
          type: 'income',
          description: `بيع أصل - ${a.name}`,
          amount,
          category: 'بيع أصول',
          date,
          hasDoc: false,
          note: 'بيع أصل',
          createdBy: currentUserName(),
        })
      }
      this._event(a, 'sale', `بيع الأصل بمبلغ ${fmt(amount)}`)
      useAuditStore().log('بيع', 'أصل', `${a.name} — ${fmt(amount)}`)
    },

    // جدولة صيانة دورية
    setPeriodic(id: string, config: AssetPeriodic | null) {
      const a = this.assets.find((x) => x.id === id)
      if (!a) return
      a.periodic = config ?? undefined
      this._event(a, 'periodic', config ? `جدولة صيانة دورية كل ${config.every} ${config.unit}` : 'إلغاء الصيانة الدورية')
    },

    _nextDue(from: string, p: AssetPeriodic): string {
      const d = new Date(from)
      if (p.unit === 'يوم') d.setDate(d.getDate() + p.every)
      else if (p.unit === 'أسبوع') d.setDate(d.getDate() + p.every * 7)
      else if (p.unit === 'شهر') d.setMonth(d.getMonth() + p.every)
      else d.setFullYear(d.getFullYear() + p.every)
      return d.toISOString().slice(0, 10)
    },

    // ── الضمانات الفرعية داخل الأصل ──
    // إضافة ضمان فرعي (لمكوّن/إصلاح/صيانة...) — قابل للتتبّع والتذكير
    addWarranty(assetId: string, w: Omit<AssetWarranty, 'id'>): string | null {
      const a = this.assets.find((x) => x.id === assetId)
      if (!a) return null
      if (!a.warranties) a.warranties = []
      const id = uid('wr')
      a.warranties.unshift({ ...w, id })
      this._event(a, 'warranty', `إضافة ضمان فرعي: ${w.name}`)
      useAuditStore().log('إضافة', 'ضمان أصل', `${a.name} — ${w.name}`)
      return id
    },

    updateWarranty(assetId: string, warrantyId: string, patch: Partial<AssetWarranty>) {
      const a = this.assets.find((x) => x.id === assetId)
      const w = a?.warranties?.find((x) => x.id === warrantyId)
      if (!a || !w) return
      Object.assign(w, patch)
      this._event(a, 'warranty', `تعديل ضمان فرعي: ${w.name}`)
    },

    removeWarranty(assetId: string, warrantyId: string) {
      const a = this.assets.find((x) => x.id === assetId)
      if (!a || !a.warranties) return
      const w = a.warranties.find((x) => x.id === warrantyId)
      if (w?.trackingId) useTrackingsStore().deleteTracking(w.trackingId)
      a.warranties = a.warranties.filter((x) => x.id !== warrantyId)
      if (w) this._event(a, 'warranty', `حذف ضمان فرعي: ${w.name}`)
    },

    // ربط ضمان فرعي بالمتابعات (يظهر في التذكيرات ولوحة التحكم والإشعارات)
    linkSubWarranty(assetId: string, warrantyId: string): boolean {
      const a = this.assets.find((x) => x.id === assetId)
      const w = a?.warranties?.find((x) => x.id === warrantyId)
      if (!a || !w || w.trackingId) return false
      const days = daysBetween(w.endDate)
      const trackingId = uid('tr')
      useTrackingsStore().addTracking({
        id: trackingId,
        name: `ضمان ${w.name} — ${a.name}`,
        type: 'ضمان',
        icon: '🛡️',
        status: statusFromDays(days),
        daysLeft: days,
        expiryDate: w.endDate,
        projectId: a.projectId,
        note: `ضمان فرعي للأصل: ${a.name}${w.provider ? ` · ${w.provider}` : ''}`,
        createdBy: currentUserName(),
      })
      w.trackingId = trackingId
      this._event(a, 'warranty', `ربط ضمان «${w.name}» بالمتابعات`)
      return true
    },

    // ربط الضمان كمتابعة (تظهر في التذكيرات) والإشارة إليها
    linkWarranty(id: string): boolean {
      const a = this.assets.find((x) => x.id === id)
      if (!a || !a.warrantyEnd) return false
      const days = daysBetween(a.warrantyEnd)
      const trackingId = uid('tr')
      useTrackingsStore().addTracking({
        id: trackingId,
        name: `ضمان ${a.name}`,
        type: 'ضمان',
        icon: '🛡️',
        status: statusFromDays(days),
        daysLeft: days,
        expiryDate: a.warrantyEnd,
        projectId: a.projectId,
        note: `ضمان أصل: ${a.name}`,
        createdBy: currentUserName(),
      })
      a.trackingId = trackingId
      this._event(a, 'warranty', 'ربط الضمان بالمتابعات')
      return true
    },
  },
})
