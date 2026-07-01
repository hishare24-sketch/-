// ═══════════════════════════════════════════
//  حفظ متاجر Pinia تلقائياً في IndexedDB + تمييه (hydrate) عند الإقلاع
//  المتاجر تبقى مبذورة بـ INITIAL_* ؛ تُستبدل فقط عند وجود لقطة محفوظة
// ═══════════════════════════════════════════
import type { PiniaPluginContext, Store } from 'pinia'
import { idbGet, idbSet, idbClear } from '@/helpers/persist'

// المتاجر التي تُحفظ بياناتها (البيانات + الإعدادات)
// نستثني: auth (له localStorage خاص) و shared (حالة تحميل عابرة)
const PERSIST_IDS = [
  'projects',
  'finance',
  'documents',
  'trackings',
  'requests',
  'commitments',
  'receivables',
  'assets',
  'surveys',
  'templates',
  'settings',
  'notifications',
  'audit',
] as const

// رفع الإصدار يُبطل اللقطات القديمة تلقائياً (عند تغيّر بنية البيانات)
const SCHEMA_VERSION = 1
const keyOf = (id: string) => `mz:v${SCHEMA_VERSION}:${id}`

const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {}

// إضافة Pinia: تشترك في تغيّرات المتاجر المحدّدة وتحفظها (بتأخير بسيط لتقليل الكتابات)
export function persistencePlugin({ store }: PiniaPluginContext) {
  if (!(PERSIST_IDS as readonly string[]).includes(store.$id)) return
  store.$subscribe((_mutation, state) => {
    clearTimeout(saveTimers[store.$id])
    saveTimers[store.$id] = setTimeout(() => {
      // نسخة قابلة للتسلسل (نتجاوز أي مراجع تفاعلية)
      idbSet(keyOf(store.$id), JSON.parse(JSON.stringify(state))).catch(() => {})
    }, 300)
  })
}

// تمييه المتاجر من IndexedDB قبل تركيب التطبيق (يُستدعى في main.ts بعد تفعيل Pinia)
export async function hydrateStores(): Promise<void> {
  // الاستيراد داخل الدالة لضمان تفعيل Pinia أولاً
  const [
    { useProjectsStore },
    { useFinanceStore },
    { useDocumentsStore },
    { useTrackingsStore },
    { useRequestsStore },
    { useCommitmentsStore },
    { useReceivablesStore },
    { useAssetsStore },
    { useSurveysStore },
    { useTemplatesStore },
    { useSettingsStore },
    { useNotificationsStore },
    { useAuditStore },
  ] = await Promise.all([
    import('@/stores/ProjectsStore'),
    import('@/stores/FinanceStore'),
    import('@/stores/DocumentsStore'),
    import('@/stores/TrackingsStore'),
    import('@/stores/RequestsStore'),
    import('@/stores/CommitmentsStore'),
    import('@/stores/ReceivablesStore'),
    import('@/stores/AssetsStore'),
    import('@/stores/SurveysStore'),
    import('@/stores/TemplatesStore'),
    import('@/stores/SettingsStore'),
    import('@/stores/NotificationsStore'),
    import('@/stores/AuditStore'),
  ])

  const stores: Store[] = [
    useProjectsStore(),
    useFinanceStore(),
    useDocumentsStore(),
    useTrackingsStore(),
    useRequestsStore(),
    useCommitmentsStore(),
    useReceivablesStore(),
    useAssetsStore(),
    useSurveysStore(),
    useTemplatesStore(),
    useSettingsStore(),
    useNotificationsStore(),
    useAuditStore(),
  ]

  await Promise.all(
    stores.map(async (store) => {
      try {
        const saved = await idbGet<Record<string, unknown>>(keyOf(store.$id))
        if (saved) store.$patch(saved)
      } catch {
        /* لقطة تالفة — نتجاهلها ونُبقي البذور */
      }
    }),
  )
}

// استعادة البيانات التجريبية: تفريغ المحفوظ ثم إعادة التحميل لإعادة البذر
export async function resetPersistedData(): Promise<void> {
  await idbClear()
  window.location.reload()
}
