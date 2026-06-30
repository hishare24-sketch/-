// ═══════════════════════════════════════════
//  الثوابت العامة (خيارات الأنواع لكل موديول) — منقولة من legacy/App.tsx
// ═══════════════════════════════════════════
import type {
  MemberRole,
  TxType,
  AssetCategory,
  Asset,
  MemberTxnType,
  CommitmentFreq,
  UserPrefs,
  CustomLists,
  HelpTexts,
} from '@/interfaces/models'

export const PROJECT_ICONS = ['🏢', '🏠', '🍽️', '🏪', '🚗', '💼', '🏭', '⚙️', '📦', '🌿']

export const DEFAULT_PROJECT_TYPES = [
  'شركة', 'مؤسسة', 'مشروع منزلي', 'مشروع أسري', 'متجر إلكتروني', 'مطعم', 'أخرى',
]

export const PROJECT_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

// الأدوار والصلاحيات
export const ROLES: { id: MemberRole; label: string; desc: string; color: string }[] = [
  { id: 'owner', label: 'مالك المشروع', desc: 'تحكم كامل بكل شيء', color: '#7c3aed' },
  { id: 'manager', label: 'مدير مالي', desc: 'إدارة المالية والموافقات', color: '#0891b2' },
  { id: 'member', label: 'عضو', desc: 'إضافة عمليات ومستندات', color: '#059669' },
  { id: 'viewer', label: 'مشاهد', desc: 'عرض فقط دون تعديل', color: '#6b7280' },
]

export const PERMISSIONS: { id: string; label: string }[] = [
  { id: 'finance_view', label: 'عرض المالية' },
  { id: 'finance_edit', label: 'إدارة العمليات المالية' },
  { id: 'docs_manage', label: 'إدارة المستندات' },
  { id: 'tracking_manage', label: 'إدارة المتابعات' },
  { id: 'requests_approve', label: 'اعتماد الطلبات' },
  { id: 'members_manage', label: 'إدارة الأعضاء' },
  { id: 'project_edit', label: 'تعديل المشروع' },
  { id: 'project_delete', label: 'حذف المشروع' },
  { id: 'member_txn', label: 'حركات رصيد الأعضاء' },
  { id: 'audit_view', label: 'عرض سجل العمليات' },
  { id: 'reports_export', label: 'تصدير التقارير' },
]

export const ROLE_PERMS: Record<MemberRole, string[]> = {
  owner: PERMISSIONS.map((p) => p.id),
  manager: [
    'finance_view', 'finance_edit', 'docs_manage', 'tracking_manage', 'requests_approve',
    'member_txn', 'audit_view', 'reports_export', 'project_edit',
  ],
  member: ['finance_view', 'finance_edit', 'docs_manage', 'tracking_manage'],
  viewer: ['finance_view'],
}

// المستخدم الحالي (محاكاة حتى تتوفر مصادقة backend)
export const CURRENT_USER = 'محمد العمري'

export const DEFAULT_PREFS: UserPrefs = {
  showStats: true,
  showCharts: true,
  defaultPeriod: '1m',
  compactCards: false,
  showQuickActions: true,
  confirmDelete: true,
  statsAutoScroll: false,
  statsScrollSeconds: 4,
  statsLayout: 'horizontal',
}

export const TX_TYPES: { id: TxType; label: string; icon: string }[] = [
  { id: 'income', label: 'إيراد', icon: '📈' },
  { id: 'expense', label: 'مصروف', icon: '📉' },
  { id: 'transfer', label: 'تحويل', icon: '🔄' },
]

export const DEFAULT_TX_CATEGORIES = [
  'مبيعات', 'رواتب', 'إيجار', 'فواتير', 'قسط', 'صيانة', 'تسويق', 'أخرى',
]

export const TRACKING_TYPES = [
  { id: 'ضمان', icon: '🛡️' },
  { id: 'عقد', icon: '📄' },
  { id: 'ترخيص', icon: '🏛️' },
  { id: 'اشتراك', icon: '💻' },
  { id: 'تأمين', icon: '🚗' },
  { id: 'وثيقة', icon: '🪪' },
]

export const REQUEST_TYPES = ['مصروف', 'تحويل', 'عهدة', 'صيانة', 'شراء']

export const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string }[] = [
  { id: 'vehicle', label: 'مركبة', icon: '🚗' },
  { id: 'device', label: 'جهاز', icon: '💻' },
  { id: 'equipment', label: 'معدّة', icon: '⚙️' },
  { id: 'furniture', label: 'أثاث', icon: '🪑' },
  { id: 'property', label: 'عقار', icon: '🏢' },
  { id: 'other', label: 'أخرى', icon: '📦' },
]

export const ASSET_STATUS: Record<Asset['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'نشط', color: '#059669', bg: '#ecfdf5' },
  maintenance: { label: 'تحت الصيانة', color: '#d97706', bg: '#fffbeb' },
  retired: { label: 'مستبعَد', color: '#64748b', bg: '#f1f5f9' },
}

export const DEFAULT_DOC_TYPES = ['فاتورة', 'عقد', 'كشف حساب', 'وثيقة رسمية', 'ملف عام']
export const DEFAULT_PARTY_TYPES = ['عميل', 'مورد', 'بنك', 'جهة حكومية', 'شريك', 'أخرى']

export const DEFAULT_LISTS: CustomLists = {
  txCategories: DEFAULT_TX_CATEGORIES,
  projectTypes: DEFAULT_PROJECT_TYPES,
  docTypes: DEFAULT_DOC_TYPES,
  partyTypes: DEFAULT_PARTY_TYPES,
}

export const MEMBER_TXN_TYPES: {
  id: MemberTxnType
  label: string
  icon: string
  direction: 'to_member' | 'from_member'
  desc: string
}[] = [
  { id: 'custody', label: 'صرف عهدة', icon: '📤', direction: 'to_member', desc: 'صرف مبلغ كعهدة للعضو' },
  { id: 'expense', label: 'مصروف للعضو', icon: '💸', direction: 'to_member', desc: 'تعويض مصروف تكبّده العضو' },
  { id: 'bonus', label: 'مكافأة/حافز', icon: '🎁', direction: 'to_member', desc: 'مكافأة أو حافز يُمنح للعضو' },
  { id: 'advance', label: 'سلفة', icon: '🏦', direction: 'to_member', desc: 'سلفة (دَين على العضو يُسترجع لاحقاً)' },
  { id: 'salary', label: 'راتب/أجر', icon: '💰', direction: 'to_member', desc: 'صرف راتب أو أجر للعضو' },
  { id: 'supply', label: 'توريد/تحصيل', icon: '📥', direction: 'from_member', desc: 'مبلغ يورّده العضو للمشروع (تحصيل مندوب)' },
  { id: 'settlement', label: 'تسوية/إرجاع', icon: '↩️', direction: 'from_member', desc: 'استرجاع مبلغ من العضو' },
  { id: 'deduction', label: 'خصم/تصفية', icon: '➖', direction: 'from_member', desc: 'خصم من رصيد العضو' },
]

export const FREQ_DAYS: Record<CommitmentFreq, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  yearly: 365,
}
export const FREQ_LABEL: Record<CommitmentFreq, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  yearly: 'سنوي',
}

export const DEFAULT_HELP: HelpTexts = {
  dashboard: { show: true, title: 'لوحة التحكم', body: 'نقطة البداية لكل مشروع. تعرض ملخصاً حياً للوضع المالي (الرصيد، الإيرادات، المصروفات، الصافي) خلال فترة تختارها، إضافةً للطلبات المعلّقة والمتابعات العاجلة. الأرقام تُحسب تلقائياً من العمليات الفعلية — كل عملية تضيفها في أي قسم تنعكس هنا فوراً.' },
  projects: { show: true, title: 'المشاريع', body: 'المشروع هو الوحدة التنظيمية الأساسية في موازين. كل عملية ومستند وذمة والتزام وعضو يرتبط بمشروع. هذا يتيح فصل الحسابات (شركة، منزل، متجر...) وإدارة الصلاحيات والتقارير لكل مشروع على حدة. ابدأ بإنشاء مشروع، ثم أضف إليه باقي العناصر.' },
  finance: { show: true, title: 'الإدارة المالية', body: 'المحرّك المالي للمشروع. تُدار هنا الإيرادات (أموال داخلة)، المصروفات (أموال خارجة)، والتحويلات بين المشاريع. كل عملية تُحدّث رصيد المشروع تلقائياً. العمليات الناتجة عن الذمم والالتزامات والعهد تظهر هنا أيضاً لتكوين صورة مالية موحّدة.' },
  ledger: { show: true, title: 'السجل المالي', body: 'عرض موحّد لكل التدفقات النقدية عبر جميع المشاريع والأعضاء في مكان واحد. يساعدك على رؤية الصورة الكاملة وتحليل أين تذهب الأموال ومن أين تأتي، دون الحاجة للتنقل بين المشاريع.' },
  receivables: { show: true, title: 'الذمم', body: 'الذمم هي التزامات مالية مستقبلية مع طرف (عميل، مورد، أو عضو). الذمة المدينة = مبلغ لك على الغير، والدائنة = مبلغ عليك للغير.\n\nالمنطق المهم: الذمة لا تُحرّك رصيدك عند إنشائها (لأن المال لم يُقبض/يُدفع بعد). عند تسجيل تحصيل أو سداد (كلي أو جزئي)، تتحول تلقائياً لعملية مالية فعلية تظهر في الإدارة المالية وتُحدّث الرصيد.' },
  commitments: { show: true, title: 'الالتزامات الدورية', body: 'الأقساط والالتزامات المتكررة والاشتراكات — أي مبلغ يتكرر بجدول زمني (شهري، ربع سنوي، سنوي...).\n\nكل التزام له استحقاق قادم. عند تسجيل دفعة، تتحول لعملية مالية فعلية ويتقدّم تاريخ الاستحقاق للموعد التالي تلقائياً. البطاقات العلوية تعرض الأثر الشهري التقديري (مُوحّداً) لمساعدتك على التخطيط للتدفق النقدي.' },
  documents: { show: true, title: 'المستندات', body: 'بوابة إدخال البيانات. المستند (فاتورة، عقد، وثيقة) ليس مجرد ملف يُحفظ، بل مصدر بيانات يمكن تحويله إلى عملية مالية أو متابعة. ارفع المستند، وسيساعدك النظام على ربطه بالمشروع المناسب واستخراج إجراءات منه.' },
  trackings: { show: true, title: 'المتابعات والضمانات', body: 'إدارة كل ما يحتاج متابعة زمنية: الضمانات، العقود، التراخيص، الوثائق الرسمية، والاشتراكات. لكل عنصر تاريخ انتهاء، والنظام ينبّهك قبل الاستحقاق حتى لا يفوتك تجديد أو ينتهي ضمان دون علمك.' },
  requests: { show: true, title: 'الطلبات والموافقات', body: 'محرّك سير العمل والحوكمة. تُنشأ الطلبات (صرف، تحويل، تعزيز عهدة...) وتمرّ بدورة اعتماد: إنشاء ← مراجعة ← اعتماد/رفض. عند اعتماد طلب مالي، يتحول تلقائياً إلى عملية مالية فعلية. هذا يطبّق الرقابة قبل الصرف.' },
  members: { show: true, title: 'الأعضاء والصلاحيات', body: 'طبقة التحكم في الوصول. لكل عضو دور (مالك، مدير، عضو، مشاهد) وصلاحيات محددة. كما يُدار رصيد العضو عبر حركات العهد (صرف عهدة، تسوية، خصم) بنظام قبول/رفض. هذا منفصل عن الذمم لتجنّب ازدواج الحسابات.' },
}
