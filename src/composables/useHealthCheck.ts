// ═══════════════════════════════════════════
//  فحص اتساق الحسابات — تدقيق منطقي شامل عبر كل الأقسام
//  كل مشكلة تحمل: سبب/لماذا/معالجة/توصية + أهداف تنقّل تصل للعنصر نفسه
// ═══════════════════════════════════════════
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useFinanceStore } from '@/stores/FinanceStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useAssetsStore } from '@/stores/AssetsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useRequestsStore } from '@/stores/RequestsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { recvPaid } from '@/helpers/calc'
import { txErrors } from '@/helpers/txAnalysis'
import { today } from '@/helpers/date'

export type HealthLevel = 'ok' | 'warning' | 'error'

// هدف تنقّل يصل للعنصر (يضبط المشروع النشط + يبرز العنصر عبر ?focus=)
export interface HealthTarget {
  label: string
  route: string
  params?: Record<string, string>
  projectId?: string
  focusId?: string
}

export interface HealthIssue {
  key: string
  level: HealthLevel
  title: string
  detail: string
  cause?: string
  why?: string
  fix?: string
  ai?: string
  targets?: HealthTarget[]
}

const cap = <T>(arr: T[], n = 12) => arr.slice(0, n)

export function runHealthCheck(): HealthIssue[] {
  const projectsStore = useProjectsStore()
  const financeStore = useFinanceStore()
  const receivablesStore = useReceivablesStore()
  const commitmentsStore = useCommitmentsStore()
  const assetsStore = useAssetsStore()
  const trackingsStore = useTrackingsStore()
  const requestsStore = useRequestsStore()
  const documentsStore = useDocumentsStore()

  const projects = projectsStore.projects
  const members = projectsStore.members
  const memberTxns = projectsStore.memberTxns
  const transactions = financeStore.transactions
  const receivables = receivablesStore.receivables
  const commitments = commitmentsStore.commitments
  const assets = assetsStore.assets
  const trackings = trackingsStore.trackings
  const requests = requestsStore.requests
  const documents = documentsStore.documents

  const projIds = new Set(projects.map((p) => p.id))
  const memberIds = new Set(members.map((m) => m.id))
  const issues: HealthIssue[] = []

  // ── 1. توازن التحويلات ──
  const transfers = transactions.filter((t) => t.type === 'transfer')
  const groups = new Map<string, typeof transfers>()
  transfers.forEach((t) => {
    if (t.linkId) {
      const g = groups.get(t.linkId) ?? []
      g.push(t)
      groups.set(t.linkId, g)
    }
  })
  const brokenTransfers: typeof transfers = []
  groups.forEach((g) => {
    const hasIn = g.some((x) => x.transferDir === 'in')
    const hasOut = g.some((x) => x.transferDir === 'out')
    if (!hasIn || !hasOut || g.length !== 2) brokenTransfers.push(g[0])
  })
  const orphanTransfers = transfers.filter((t) => !t.linkId)
  const badTransfers = [...brokenTransfers, ...orphanTransfers]
  if (!badTransfers.length) {
    issues.push({ key: 'transfers', level: 'ok', title: 'التحويلات متوازنة', detail: 'كل التحويلات بين المشاريع لها طرفان (صادر ووارد) متطابقان.', ai: 'تحويلاتك سليمة محاسبياً — كل مبلغ خرج من مشروع دخل في الآخر دون فقد أو ازدواج.' })
  } else {
    issues.push({
      key: 'transfers',
      level: 'warning',
      title: 'تحويلات غير متوازنة',
      detail: `${badTransfers.length} تحويل بلا طرف مقابل مكتمل.`,
      cause: 'تحويل بين مشروعين فقد أحد طرفيه (الصادر أو الوارد).',
      why: 'يحدث عادةً عند حذف إحدى عمليتي التحويل المرتبطتين يدوياً فيبقى الطرف الآخر معلّقاً.',
      fix: 'افتح العملية المتأثرة في السجل المالي، واحذف الطرف المتبقي ثم أعد إنشاء التحويل كاملاً.',
      ai: 'أنصح بإعادة إنشاء هذا التحويل من البداية بدل ترقيعه — يضمن ربط الطرفين تلقائياً وتوازن أرصدة المشروعين.',
      targets: cap(badTransfers).map((t) => ({ label: `عرض «${t.description}»`, route: 'ledger-page', projectId: t.projectId, focusId: t.id })),
    })
  }

  // ── 2. اتساق أرصدة الأعضاء ──
  const mismatched = members.filter((m) => Math.abs(projectsStore.computedMemberBalance(m.id) - (m.balance ?? 0)) > 1)
  if (!mismatched.length) {
    issues.push({ key: 'member-balance', level: 'ok', title: 'أرصدة الأعضاء متطابقة', detail: 'رصيد كل عضو يساوي مجموع حركات عهده المقبولة.', ai: 'أرصدة العهد لدى أعضائك دقيقة ومطابقة لحركاتهم — لا حاجة لأي تسوية.' })
  } else {
    issues.push({
      key: 'member-balance',
      level: 'warning',
      title: 'أرصدة أعضاء غير متطابقة',
      detail: `${mismatched.length} عضو رصيده المخزّن لا يطابق مجموع حركاته المقبولة: ${mismatched.map((m) => m.name).join('، ')}.`,
      cause: 'الرصيد المحفوظ للعضو يختلف عن ناتج جمع حركات عهده المقبولة.',
      why: 'قد ينتج عن تعديل يدوي على الرصيد، أو حركة عهدة عُدّلت/حُذفت بعد قبولها.',
      fix: 'افتح كل عضو وراجع سجل حركاته، ثم سجّل حركة تسوية تعيد الرصيد لمطابقة الواقع.',
      ai: 'الأسلم محاسبياً ألا تُعدّل رصيد العضو يدوياً بل تسجّل حركة «تسوية/إرجاع» أو «خصم» — هكذا يبقى الرصيد قابلاً للتتبّع. استخدم أزرار الانتقال للوصول لكل عضو.',
      targets: cap(mismatched).map((m) => ({ label: `عرض «${m.name}» في المشروع`, route: 'project-detail', params: { id: m.projectId }, projectId: m.projectId, focusId: m.id })),
    })
  }

  // ── 3. سجلات يتيمة (مشروع محذوف) ──
  const orphans: { label: string; route: string; projectId: string; focusId: string }[] = [
    ...transactions.filter((t) => !projIds.has(t.projectId)).map((t) => ({ label: `عملية: ${t.description}`, route: 'ledger-page', projectId: t.projectId, focusId: t.id })),
    ...receivables.filter((r) => !projIds.has(r.projectId)).map((r) => ({ label: `ذمة: ${r.party}`, route: 'receivables-page', projectId: r.projectId, focusId: r.id })),
    ...commitments.filter((c) => !projIds.has(c.projectId)).map((c) => ({ label: `التزام: ${c.name}`, route: 'commitments-page', projectId: c.projectId, focusId: c.id })),
    ...assets.filter((a) => !projIds.has(a.projectId)).map((a) => ({ label: `أصل: ${a.name}`, route: 'assets-page', projectId: a.projectId, focusId: a.id })),
    ...trackings.filter((t) => !projIds.has(t.projectId)).map((t) => ({ label: `متابعة: ${t.name}`, route: 'trackings-page', projectId: t.projectId, focusId: t.id })),
    ...requests.filter((r) => !projIds.has(r.projectId)).map((r) => ({ label: `طلب: ${r.title}`, route: 'requests-page', projectId: r.projectId, focusId: r.id })),
    ...documents.filter((d) => !projIds.has(d.projectId)).map((d) => ({ label: `مستند: ${d.name}`, route: 'documents-page', projectId: d.projectId, focusId: d.id })),
  ]
  if (!orphans.length) {
    issues.push({ key: 'orphans', level: 'ok', title: 'لا سجلات يتيمة', detail: 'كل العمليات والذمم والالتزامات والأصول والمتابعات والطلبات والمستندات مرتبطة بمشاريع قائمة.', ai: 'بنية بياناتك سليمة — لا توجد سجلات معلّقة بلا مشروع.' })
  } else {
    issues.push({
      key: 'orphans',
      level: 'error',
      title: 'سجلات يتيمة',
      detail: `${orphans.length} سجل مرتبط بمشروع محذوف.`,
      cause: 'سجلات تشير إلى مشروع لم يعد موجوداً.',
      why: 'حُذف المشروع دون حذف أو نقل سجلاته المرتبطة فبقيت معلّقة بلا أب.',
      fix: 'أنشئ مشروعاً بديلاً وأعد إسناد هذه السجلات إليه، أو احذفها إن لم تعد مطلوبة.',
      ai: 'أنصح بشدة بمعالجة هذا النوع أولاً — السجلات اليتيمة تشوّه التقارير والإجماليات لأنها لا تظهر تحت أي مشروع.',
      targets: cap(orphans).map((o) => ({ label: o.label, route: o.route, projectId: o.projectId, focusId: o.focusId })),
    })
  }

  // ── 4. مراجع أعضاء صحيحة (عضو محذوف) ──
  const badMemberRefs: HealthTarget[] = [
    ...transactions.filter((t) => t.memberId && !memberIds.has(t.memberId)).map((t) => ({ label: `عملية: ${t.description}`, route: 'ledger-page', projectId: t.projectId, focusId: t.id })),
    ...assets.filter((a) => a.memberId && !memberIds.has(a.memberId)).map((a) => ({ label: `أصل: ${a.name}`, route: 'assets-page', projectId: a.projectId, focusId: a.id })),
    ...receivables.filter((r) => r.memberId && !memberIds.has(r.memberId)).map((r) => ({ label: `ذمة: ${r.party}`, route: 'receivables-page', projectId: r.projectId, focusId: r.id })),
    ...memberTxns.filter((mt) => !memberIds.has(mt.memberId)).map((mt) => ({ label: `حركة عهدة يتيمة`, route: 'project-detail', params: { id: mt.projectId }, projectId: mt.projectId })),
  ]
  if (!badMemberRefs.length) {
    issues.push({ key: 'member-refs', level: 'ok', title: 'مراجع الأعضاء صحيحة', detail: 'كل عنصر مُسنَد لعضو يشير إلى عضو قائم.', ai: 'روابط الأعضاء سليمة — لا عنصر يشير إلى عضو محذوف.' })
  } else {
    issues.push({
      key: 'member-refs',
      level: 'warning',
      title: 'مراجع أعضاء مكسورة',
      detail: `${badMemberRefs.length} عنصر مُسنَد لعضو لم يعد موجوداً.`,
      cause: 'عناصر (عمليات/أصول/ذمم/حركات عهدة) تشير إلى عضو محذوف.',
      why: 'حُذف العضو دون إعادة إسناد عناصره أو تسوية عهده.',
      fix: 'افتح العنصر وأعد إسناده لعضو قائم، أو أزل الإسناد.',
      ai: 'أعد إسناد هذه العناصر لعضو حالي حتى تظهر ضمن أرصدة الأعضاء وتقاريرهم بشكل صحيح.',
      targets: cap(badMemberRefs),
    })
  }

  // ── 5. مدفوعات الذمم ──
  const overpaid = receivables.filter((r) => recvPaid(r) > r.amount + 1)
  if (!overpaid.length) {
    issues.push({ key: 'recv-overpay', level: 'ok', title: 'مدفوعات الذمم سليمة', detail: 'لا توجد ذمة سُدّد فيها أكثر من قيمتها.', ai: 'سدادات ذممك منضبطة ولا تتجاوز المبالغ الأصلية.' })
  } else {
    issues.push({
      key: 'recv-overpay',
      level: 'warning',
      title: 'ذمم مدفوعة بزيادة',
      detail: `${overpaid.length} ذمة تجاوز إجمالي سدادها قيمتها الأصلية.`,
      cause: 'مجموع الدفعات المسجّلة على الذمة أكبر من قيمتها الأصلية.',
      why: 'قد يكون نتيجة تسجيل دفعة مكررة أو إدخال مبلغ دفعة أكبر من المتبقي.',
      fix: 'افتح الذمة وراجع دفعاتها واحذف الدفعة الزائدة أو صحّح مبلغها.',
      ai: 'راجع دفعات هذه الذمة — غالباً توجد دفعة مكررة. حذفها يعيد الرصيد لصحته دون التأثير على بقية العمليات.',
      targets: cap(overpaid).map((r) => ({ label: `عرض ذمة «${r.party}»`, route: 'receivables-page', projectId: r.projectId, focusId: r.id })),
    })
  }

  // ── 6. عدّادات الالتزامات ──
  const badCounters = commitments.filter((c) => c.totalCount != null && c.paidCount > c.totalCount)
  if (!badCounters.length) {
    issues.push({ key: 'commit-counter', level: 'ok', title: 'عدّادات الالتزامات سليمة', detail: 'لا يوجد التزام تجاوزت دفعاته المسددة إجماليه.', ai: 'عدّادات أقساطك والتزاماتك دقيقة.' })
  } else {
    issues.push({
      key: 'commit-counter',
      level: 'warning',
      title: 'عدّادات التزامات خاطئة',
      detail: `${badCounters.length} التزام عدد دفعاته المسددة يتجاوز الإجمالي المحدّد.`,
      cause: 'عدد الدفعات المسددة أكبر من إجمالي عدد الدفعات المحدّد.',
      why: 'قد يكون الإجمالي أُدخل أقل من الواقع أو سُجّلت دفعات إضافية بعد الاكتمال.',
      fix: 'افتح الالتزام وعدّل إجمالي عدد الدفعات ليطابق الواقع.',
      ai: 'صحّح إجمالي عدد الدفعات — أبسط من حذف الدفعات ويحافظ على سجل السداد كاملاً.',
      targets: cap(badCounters).map((c) => ({ label: `عرض «${c.name}»`, route: 'commitments-page', projectId: c.projectId, focusId: c.id })),
    })
  }

  // ── 7. مبالغ سالبة ──
  const negatives: HealthTarget[] = [
    ...transactions.filter((t) => t.amount < 0).map((t) => ({ label: `عملية: ${t.description}`, route: 'ledger-page', projectId: t.projectId, focusId: t.id })),
    ...receivables.filter((r) => r.amount < 0).map((r) => ({ label: `ذمة: ${r.party}`, route: 'receivables-page', projectId: r.projectId, focusId: r.id })),
    ...commitments.filter((c) => c.amount < 0).map((c) => ({ label: `التزام: ${c.name}`, route: 'commitments-page', projectId: c.projectId, focusId: c.id })),
    ...assets.filter((a) => a.purchaseValue < 0).map((a) => ({ label: `أصل: ${a.name}`, route: 'assets-page', projectId: a.projectId, focusId: a.id })),
  ]
  if (!negatives.length) {
    issues.push({ key: 'negatives', level: 'ok', title: 'لا مبالغ سالبة', detail: 'كل المبالغ المسجّلة موجبة كما هو متوقّع.', ai: 'كل مبالغك موجبة — الاتجاه يُحدَّد بنوع العنصر لا بإشارة المبلغ، وهذا صحيح.' })
  } else {
    issues.push({
      key: 'negatives',
      level: 'warning',
      title: 'مبالغ سالبة',
      detail: `${negatives.length} سجل بمبلغ سالب.`,
      cause: 'سجلات تحمل مبلغاً بقيمة سالبة.',
      why: 'في موازين الاتجاه يُحدَّد بنوع العنصر (دخل/خرج)، لا بإشارة المبلغ — فالمبلغ السالب غالباً خطأ إدخال.',
      fix: 'افتح السجل وأدخل المبلغ كقيمة موجبة مع اختيار النوع الصحيح.',
      ai: 'حوّل المبلغ السالب إلى موجب واضبط النوع — يصحّح التقارير دون التأثير على الرصيد النهائي.',
      targets: cap(negatives),
    })
  }

  // ── 8. سلامة العمليات محاسبياً (كشف ذكي) ──
  const flagged = transactions.filter((t) => txErrors(t, { project: projectsStore.projectById(t.projectId), transactions }).length > 0)
  if (!flagged.length) {
    issues.push({ key: 'tx-integrity', level: 'ok', title: 'العمليات سليمة محاسبياً', detail: 'لا توجد عمليات تحمل أخطاءً حاجبة (مبلغ سالب، مصروف يتجاوز الرصيد، تحويل لنفس المشروع).', ai: 'عملياتك المالية نظيفة ولا تحتاج مراجعة عاجلة.' })
  } else {
    issues.push({
      key: 'tx-integrity',
      level: 'warning',
      title: 'عمليات تحتاج مراجعة',
      detail: `${flagged.length} عملية عليها ملاحظة محاسبية (مبلغ سالب أو مصروف يتجاوز الرصيد أو تحويل لنفس المشروع).`,
      cause: 'عمليات رصدها المدقّق الذكي كأخطاء محتملة.',
      why: 'إدخال خاطئ للمبلغ أو الاتجاه، أو مصروف دون رصيد كافٍ.',
      fix: 'افتح كل عملية من السجل المالي وطبّق التصحيح المقترح.',
      ai: 'راجع هذه العمليات أولاً — تظهر مُعلَّمة بـ ⚠️ في السجل المالي، ولكل واحدة اقتراح تصحيح جاهز.',
      targets: cap(flagged).map((t) => ({ label: `عرض «${t.description}»`, route: 'ledger-page', projectId: t.projectId, focusId: t.id })),
    })
  }

  // ── 9. ذمم متأخرة السداد ──
  const overdueRecv = receivables.filter((r) => r.status !== 'settled' && r.status !== 'cancelled' && r.status !== 'written_off' && r.dueDate && r.dueDate < today())
  if (!overdueRecv.length) {
    issues.push({ key: 'recv-overdue', level: 'ok', title: 'لا ذمم متأخرة', detail: 'لا توجد ذمة تجاوزت تاريخ استحقاقها دون سداد.', ai: 'التزاماتك التحصيلية منضبطة زمنياً.' })
  } else {
    issues.push({
      key: 'recv-overdue',
      level: 'warning',
      title: 'ذمم متأخرة السداد',
      detail: `${overdueRecv.length} ذمة تجاوزت تاريخ الاستحقاق ولم تُسدَّد بالكامل.`,
      cause: 'ذمم مفتوحة/جزئية تجاوز تاريخ استحقاقها اليوم.',
      why: 'لم تُحصَّل أو تُسدَّد في موعدها.',
      fix: 'افتح الذمة وسجّل التحصيل/السداد، أو حدّث تاريخ الاستحقاق إن أُعيدت جدولته.',
      ai: 'تابع هذه الذمم للتحصيل — التأخر يؤثّر على السيولة. يمكنك تصفية الذمم بالحالة «متأخرة» لمتابعتها.',
      targets: cap(overdueRecv).map((r) => ({ label: `عرض ذمة «${r.party}»`, route: 'receivables-page', projectId: r.projectId, focusId: r.id })),
    })
  }

  // ── 10. متابعات/ضمانات منتهية ──
  const expiredTracks = trackings.filter((t) => !t.cancelled && t.status === 'expired')
  if (!expiredTracks.length) {
    issues.push({ key: 'tracks-expired', level: 'ok', title: 'المتابعات سارية', detail: 'لا توجد متابعة/ضمان منتهٍ دون تجديد أو إلغاء.', ai: 'ضماناتك وعقودك وتراخيصك سارية ومحدّثة.' })
  } else {
    issues.push({
      key: 'tracks-expired',
      level: 'warning',
      title: 'متابعات منتهية',
      detail: `${expiredTracks.length} متابعة/ضمان تجاوز تاريخ انتهائه دون تجديد.`,
      cause: 'ضمانات/عقود/تراخيص انتهت صلاحيتها.',
      why: 'لم تُجدَّد في موعدها ولم تُلغَ.',
      fix: 'افتح المتابعة واستخدم «تجديد» لتحديد تاريخ انتهاء جديد، أو «إلغاء» إن لم تعد مطلوبة.',
      ai: 'جدّد ما زال مطلوباً منها فوراً لتفادي الغرامات أو انقطاع الخدمة، وألغِ ما انتهى فعلاً.',
      targets: cap(expiredTracks).map((t) => ({ label: `عرض «${t.name}»`, route: 'trackings-page', projectId: t.projectId, focusId: t.id })),
    })
  }

  // ── 11. إجراءات معلّقة بانتظار القرار ──
  const pendingReqs = requests.filter((r) => r.status === 'pending' || r.status === 'under_review')
  const pendingMemberTxns = memberTxns.filter((mt) => mt.status === 'pending')
  const pendingCount = pendingReqs.length + pendingMemberTxns.length
  if (!pendingCount) {
    issues.push({ key: 'pending', level: 'ok', title: 'لا إجراءات معلّقة', detail: 'لا طلبات ولا حركات عهدة تنتظر قراراً.', ai: 'كل الطلبات وحركات العهد تمّ البتّ فيها.' })
  } else {
    issues.push({
      key: 'pending',
      level: 'warning',
      title: 'إجراءات بانتظار القرار',
      detail: `${pendingReqs.length} طلب و${pendingMemberTxns.length} حركة عهدة تنتظر اعتماداً/رفضاً.`,
      cause: 'عناصر في دورة الاعتماد لم يُبتّ فيها بعد.',
      why: 'أُنشئت ولم تُراجَع بعد.',
      fix: 'افتح الطلبات وحركات العهد واتخذ القرار المناسب (اعتماد/رفض).',
      ai: 'حسم الإجراءات المعلّقة يبقي التقارير محدّثة ويمنع تراكمها — راجعها من قسم الطلبات وتبويب الأعضاء.',
      targets: cap(pendingReqs).map((r) => ({ label: `طلب: ${r.title}`, route: 'requests-page', projectId: r.projectId, focusId: r.id })),
    })
  }

  // ── 12. اتساق حالة الأصول ──
  const badAssets = assets.filter((a) => a.status === 'sold' && a.saleValue == null)
  if (!badAssets.length) {
    issues.push({ key: 'assets-state', level: 'ok', title: 'حالات الأصول متسقة', detail: 'كل أصل مُباع له قيمة بيع مسجّلة.', ai: 'دورة حياة أصولك مسجّلة بشكل صحيح.' })
  } else {
    issues.push({
      key: 'assets-state',
      level: 'warning',
      title: 'أصول مُباعة دون قيمة',
      detail: `${badAssets.length} أصل بحالة «مُباع» دون قيمة بيع مسجّلة.`,
      cause: 'أصل حالته «مُباع» لكن دون مبلغ بيع.',
      why: 'غُيّرت الحالة يدوياً دون تسجيل عملية البيع.',
      fix: 'افتح الأصل وسجّل البيع عبر إجراء «بيع» ليُقيَّد الإيراد ويُحفظ المبلغ.',
      ai: 'استخدم إجراء «بيع» بدل تغيير الحالة يدوياً — يقيّد الإيراد في المالية ويحفظ قيمة البيع للتقارير.',
      targets: cap(badAssets).map((a) => ({ label: `عرض «${a.name}»`, route: 'assets-page', projectId: a.projectId, focusId: a.id })),
    })
  }

  return issues
}
