// ═══════════════════════════════════════════
//  الثوابت العامة (خيارات الأنواع لكل موديول) — منقولة من legacy/App.tsx
// ═══════════════════════════════════════════
import type {
  MemberRole,
  TxType,
  AssetCategory,
  Asset,
  MaintenanceType,
  ReceivableStatus,
  RequestStatus,
  MemberTxnType,
  CommitmentFreq,
  CommitmentKind,
  UserPrefs,
  CustomLists,
  HelpTexts,
} from '@/interfaces/models'

export const PROJECT_ICONS = ['🏢', '🏠', '🍽️', '🏪', '🚗', '💼', '🏭', '⚙️', '📦', '🌿']

export const DEFAULT_PROJECT_TYPES = [
  'شركة', 'مؤسسة', 'مشروع منزلي', 'مشروع أسري', 'متجر إلكتروني', 'مطعم', 'أخرى',
]

export const PROJECT_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

// لوحات الثيم الجاهزة (منقولة من legacy/App.tsx)
export const THEME_PRESETS: { id: string; name: string; primary: string; swatch: [string, string] }[] = [
  { id: 'blue', name: 'الأزرق (افتراضي)', primary: '#2563eb', swatch: ['#2563eb', '#1d4ed8'] },
  { id: 'emerald', name: 'الزمردي', primary: '#059669', swatch: ['#059669', '#047857'] },
  { id: 'violet', name: 'البنفسجي', primary: '#7c3aed', swatch: ['#7c3aed', '#6d28d9'] },
  { id: 'rose', name: 'الوردي', primary: '#e11d48', swatch: ['#e11d48', '#be123c'] },
  { id: 'amber', name: 'الكهرماني', primary: '#d97706', swatch: ['#d97706', '#b45309'] },
  { id: 'slate', name: 'الرمادي', primary: '#475569', swatch: ['#475569', '#334155'] },
]

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

// حقول إضافية حسب نوع المتابعة (تُخزَّن في tracking.specs)
export const TRACKING_FIELD_SCHEMAS: Record<string, { key: string; label: string; placeholder?: string }[]> = {
  ضمان: [
    { key: 'seller', label: 'البائع / الجهة' },
    { key: 'serial', label: 'الرقم التسلسلي' },
  ],
  عقد: [
    { key: 'party', label: 'الطرف الآخر' },
    { key: 'contractNo', label: 'رقم العقد' },
  ],
  ترخيص: [
    { key: 'authority', label: 'الجهة المُصدِرة' },
    { key: 'licenseNo', label: 'رقم الترخيص' },
  ],
  اشتراك: [
    { key: 'provider', label: 'مزوّد الخدمة' },
    { key: 'plan', label: 'الباقة' },
  ],
  تأمين: [
    { key: 'policyNo', label: 'رقم البوليصة' },
    { key: 'insurer', label: 'شركة التأمين' },
    { key: 'coverage', label: 'مبلغ التغطية' },
  ],
  وثيقة: [
    { key: 'docNo', label: 'رقم الوثيقة' },
    { key: 'authority', label: 'الجهة المُصدِرة' },
  ],
}

export const REQUEST_TYPES = ['مصروف', 'تحويل', 'عهدة', 'صيانة', 'شراء']

// حالات الطلب (دورة الاعتماد: معلّق → مراجعة → اعتماد/رفض، + إلغاء)
export const REQUEST_STATUS: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'معلّق', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
  under_review: { label: 'قيد المراجعة', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  approved: { label: 'معتمد', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  rejected: { label: 'مرفوض', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
  cancelled: { label: 'ملغى', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
}

// حقول إضافية حسب نوع الطلب (تُخزَّن في request.specs)
export const REQUEST_FIELD_SCHEMAS: Record<string, { key: string; label: string; placeholder?: string }[]> = {
  تحويل: [{ key: 'toProject', label: 'الجهة/المشروع الوجهة' }],
  شراء: [
    { key: 'supplier', label: 'المورّد المقترح' },
    { key: 'quantity', label: 'الكمية' },
  ],
  صيانة: [{ key: 'asset', label: 'الأصل/المعدّة المعنية' }],
  عهدة: [{ key: 'purpose', label: 'الغرض من العهدة' }],
  مصروف: [{ key: 'category', label: 'بند المصروف' }],
}

export const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string }[] = [
  { id: 'vehicle', label: 'مركبة', icon: '🚗' },
  { id: 'device', label: 'جهاز', icon: '💻' },
  { id: 'equipment', label: 'معدّة', icon: '⚙️' },
  { id: 'furniture', label: 'أثاث', icon: '🪑' },
  { id: 'property', label: 'عقار', icon: '🏢' },
  { id: 'other', label: 'أخرى', icon: '📦' },
]

export const ASSET_STATUS: Record<Asset['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'نشط', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  idle: { label: 'متوقّف', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  maintenance: { label: 'تحت الصيانة', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
  damaged: { label: 'تالف/فاقد', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
  retired: { label: 'مستبعَد', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
  sold: { label: 'مُباع', color: 'var(--purple-text)', bg: 'var(--purple-bg)' },
}

// حقول إضافية حسب طبيعة الأصل (تُخزَّن في asset.specs)
export const ASSET_FIELD_SCHEMAS: Record<AssetCategory, { key: string; label: string; placeholder?: string }[]> = {
  vehicle: [
    { key: 'plate', label: 'رقم اللوحة', placeholder: 'أ ب ج 1234' },
    { key: 'model', label: 'الطراز / سنة الصنع', placeholder: 'تويوتا هايلكس 2024' },
    { key: 'vin', label: 'رقم الهيكل (VIN)' },
    { key: 'fuel', label: 'نوع الوقود', placeholder: 'بنزين / ديزل' },
  ],
  device: [
    { key: 'model', label: 'الموديل', placeholder: 'Dell PowerEdge' },
    { key: 'specs', label: 'المواصفات', placeholder: 'المعالج / الذاكرة...' },
  ],
  equipment: [
    { key: 'model', label: 'الطراز' },
    { key: 'location', label: 'الموقع', placeholder: 'المستودع / الورشة' },
  ],
  furniture: [
    { key: 'quantity', label: 'الكمية' },
    { key: 'location', label: 'الموقع / الغرفة' },
    { key: 'material', label: 'الخامة', placeholder: 'خشب / معدن' },
  ],
  property: [
    { key: 'area', label: 'المساحة (م²)' },
    { key: 'deed', label: 'رقم الصك' },
    { key: 'address', label: 'الموقع / العنوان' },
    { key: 'meterNo', label: 'رقم عداد الخدمات' },
  ],
  other: [],
}

// وحدة العداد الافتراضية حسب الطبيعة
export const ASSET_METER_UNIT: Partial<Record<AssetCategory, string>> = {
  vehicle: 'كم',
  equipment: 'ساعة',
}

// أنواع سجلّات الصيانة
export const MAINT_TYPES: { v: MaintenanceType; icon: string }[] = [
  { v: 'صيانة', icon: '🔧' },
  { v: 'إصلاح', icon: '🛠️' },
  { v: 'عطل', icon: '⚠️' },
  { v: 'فحص', icon: '🔍' },
  { v: 'دورية', icon: '🔁' },
]

// حالات الذمم (تغطي دورة الحساب: مفتوحة → جزئية → مسددة، + نزاع/إعدام/إلغاء)
export const RECEIVABLE_STATUS: Record<ReceivableStatus, { label: string; color: string; bg: string }> = {
  open: { label: 'مفتوحة', color: 'var(--info-text)', bg: 'var(--info-bg)' },
  partial: { label: 'جزئية', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
  settled: { label: 'مسددة', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
  disputed: { label: 'متنازع عليها', color: 'var(--warn-text)', bg: 'var(--warn-bg)' },
  written_off: { label: 'معدومة', color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
  cancelled: { label: 'ملغاة', color: 'var(--text-muted)', bg: 'var(--surface-2)' },
}

// شروط السداد المعتادة
export const RECEIVABLE_TERMS = ['فوري', 'خلال 15 يوم', 'خلال 30 يوم', 'خلال 45 يوم', 'خلال 60 يوم']

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

export const COMMITMENT_KINDS: { id: CommitmentKind; label: string; icon: string }[] = [
  { id: 'installment', label: 'قسط', icon: '🏦' },
  { id: 'obligation', label: 'التزام دوري', icon: '🔁' },
  { id: 'subscription', label: 'اشتراك', icon: '💳' },
]

// حقول إضافية حسب نوع الالتزام (تُخزَّن في commitment.specs)
export const COMMITMENT_FIELD_SCHEMAS: Record<CommitmentKind, { key: string; label: string; placeholder?: string }[]> = {
  installment: [
    { key: 'lender', label: 'الجهة المموّلة', placeholder: 'بنك / شركة تمويل' },
    { key: 'interestRate', label: 'نسبة الفائدة/الرسوم %' },
    { key: 'contractNo', label: 'رقم العقد' },
  ],
  obligation: [
    { key: 'authority', label: 'الجهة' },
    { key: 'reference', label: 'المرجع' },
  ],
  subscription: [
    { key: 'provider', label: 'مزوّد الخدمة', placeholder: 'Adobe / Google' },
    { key: 'plan', label: 'الباقة' },
    { key: 'autoRenew', label: 'تجديد تلقائي (نعم/لا)' },
  ],
}

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

// باقات الاشتراك (مجانية + 3 مدفوعة) — الأسعار بالريال السعودي
export interface PricingPlan {
  id: string
  name: string
  tagline: string
  monthly: number
  yearly: number // = شهري × 10 (شهران مجاناً)
  color: string
  tag?: string
  features: string[]
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'المجانية',
    tagline: 'للبدء وتجربة النظام',
    monthly: 0,
    yearly: 0,
    color: '#6b7280',
    features: [
      'مشروع واحد',
      'حتى 3 أعضاء',
      'الإدارة المالية الأساسية',
      'حتى 50 عملية شهرياً',
      'المتابعات والمستندات (محدودة)',
      'دعم مجتمعي',
    ],
  },
  {
    id: 'basic',
    name: 'الأساسية',
    tagline: 'للمشاريع الصغيرة والأفراد',
    monthly: 49,
    yearly: 490,
    color: '#0891b2',
    features: [
      'حتى 3 مشاريع',
      'حتى 10 أعضاء',
      'كل الموديولات الأساسية',
      'الذمم والالتزامات والأصول',
      'تصدير Excel',
      'سجل العمليات',
      'دعم عبر البريد',
    ],
  },
  {
    id: 'pro',
    name: 'الاحترافية',
    tagline: 'للشركات النامية',
    monthly: 99,
    yearly: 990,
    color: '#2563eb',
    tag: 'الأكثر شيوعاً',
    features: [
      'مشاريع غير محدودة',
      'حتى 25 عضواً',
      'الاستبيانات الاحترافية',
      'تحليل المستندات بالذكاء الاصطناعي',
      'تصدير Excel و PDF',
      'سجل تدقيق كامل',
      'تخصيص الثيم والألوان',
      'دعم ذو أولوية',
    ],
  },
  {
    id: 'business',
    name: 'الأعمال',
    tagline: 'للمؤسسات والفرق الكبيرة',
    monthly: 199,
    yearly: 1990,
    color: '#7c3aed',
    features: [
      'كل ميزات الاحترافية',
      'أعضاء غير محدودين',
      'صلاحيات وأدوار متقدمة',
      'تكاملات خارجية (API / Webhook)',
      'روابط مشاركة عامة',
      'مدير حساب مخصّص',
      'نسخ احتياطي تلقائي',
      'دعم 24/7',
    ],
  },
]

// قائمة كل الشاشات (لاختيار الشاشة عند إضافة شرح)
export const SCREENS: { id: string; label: string }[] = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'tasks', label: 'الإجراءات المطلوبة' },
  { id: 'projects', label: 'المشاريع' },
  { id: 'members', label: 'الأعضاء والصلاحيات' },
  { id: 'finance', label: 'المالية' },
  { id: 'ledger', label: 'السجل المالي' },
  { id: 'receivables', label: 'الذمم' },
  { id: 'commitments', label: 'الالتزامات' },
  { id: 'assets', label: 'الأصول' },
  { id: 'trackings', label: 'المتابعات' },
  { id: 'requests', label: 'الطلبات' },
  { id: 'documents', label: 'المستندات' },
  { id: 'surveys', label: 'الاستبيانات' },
  { id: 'notifications', label: 'الإشعارات' },
  { id: 'audit', label: 'سجل العمليات' },
  { id: 'settings', label: 'الإعدادات' },
]

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
  assets: { show: true, title: 'الأصول', body: 'سجل الأصول الملموسة (مركبات، أجهزة، معدات، عقارات). لكل أصل قيمة شراء وضمان وسجل صيانة. تسجيل صيانة بتكلفة يُنشئ مصروفاً فعلياً في المالية تلقائياً.' },
  surveys: { show: true, title: 'الاستبيانات', body: 'أنشئ استبيانات من قوالب جاهزة أو من الصفر بأنواع أسئلة متعددة، أضِف المستبينين (من الأعضاء أو Excel أو رابط عام)، واستعرض النتائج وحلّلها وصدّرها.' },
  tasks: { show: true, title: 'الإجراءات المطلوبة', body: 'مركز موحّد لكل ما ينتظر تصرّفك عبر المشاريع: طلبات معلقة، حركات عهد، ذمم والتزامات مستحقة قريباً، ومتابعات عاجلة — مع إمكانية اتخاذ الإجراء مباشرةً.' },
  notifications: { show: true, title: 'الإشعارات', body: 'تنبيهات النظام حول الاستحقاقات والموافقات والأحداث المهمة. النقر على أي إشعار ينقلك للقسم المرتبط به.' },
  audit: { show: true, title: 'سجل العمليات', body: 'سجل زمني بكل الأحداث المهمة (إنشاء، تعديل، حذف، اعتماد...) مع المستخدم والوقت — لأغراض التدقيق والمراجعة.' },
  settings: { show: true, title: 'الإعدادات', body: 'التحكم بتفضيلات العرض، القوائم المخصّصة، ألوان الثيم والوضع الليلي، شروحات الأقسام، والتكاملات.' },
}
