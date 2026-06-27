import * as React from 'react';
import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════
type Page = 'overview' | 'tasks' | 'dashboard' | 'projects' | 'projectDetail' | 'finance' | 'ledger' | 'reports' | 'receivables' | 'commitments' | 'documents' | 'trackings' | 'assets' | 'requests' | 'notifications' | 'settings' | 'integrations' | 'subscription' | 'memberDetail' | 'audit' | 'customize' | 'colorCustomize' | 'surveys';
type TxType = 'income' | 'expense' | 'transfer';
type TrackingStatus = 'active' | 'expiring' | 'expired';
// unified attachment (image/file) — preview kept in-session, real upload later via backend
type Attachment = { id: string; name: string; kind: 'image' | 'file'; size: string; preview?: string; fileType?: string; uploadDate?: string };
type RequestStatus = 'pending' | 'approved' | 'rejected';

type Project = { id: string; name: string; icon: string; balance: number; color: string; type?: string; description?: string; image?: string; gallery?: string[] };
type Member = { id: string; projectId: string; name: string; email: string; role: MemberRole; permissions: string[]; balance?: number; status?: 'active' | 'invited'; image?: string };
type MemberRole = 'owner' | 'manager' | 'member' | 'viewer';
// member custody / settlement movements (طلب → قبول/رفض)
type MemberTxnType = 'custody' | 'settlement' | 'expense' | 'deduction' | 'supply' | 'bonus' | 'advance' | 'salary';
type MemberTxnStatus = 'pending' | 'accepted' | 'rejected';
type MemberTxn = {
  id: string; projectId: string; memberId: string; type: MemberTxnType;
  amount: number; note?: string; date: string; status: MemberTxnStatus;
  direction: 'to_member' | 'from_member'; // money flow relative to member
  attachments?: Attachment[]; createdBy?: string;
};
// receivables/payables (الذمم): future obligations that turn into real cash flow on settlement
type ReceivableKind = 'receivable' | 'payable'; // مدينة (لك) | دائنة (عليك)
type ReceivableStatus = 'open' | 'partial' | 'settled';
type ReceivablePayment = { id: string; amount: number; date: string; note?: string; createdBy?: string };
type Receivable = {
  id: string; projectId: string; kind: ReceivableKind;
  party: string;            // اسم الطرف (نص حر) — عميل/مورد/جهة
  memberId?: string;        // أو ربط بعضو داخلي (مندوب/شريك)
  amount: number;           // المبلغ الأصلي
  dueDate?: string;         // تاريخ الاستحقاق
  date: string;             // تاريخ الإنشاء
  status: ReceivableStatus;
  payments: ReceivablePayment[]; // دفعات السداد/التحصيل (جزئي أو كلي)
  note?: string; attachments?: Attachment[]; createdBy?: string;
};
// recurring commitments (الالتزامات الدورية): installments, recurring obligations, subscriptions
type CommitmentKind = 'installment' | 'obligation' | 'subscription'; // قسط | التزام دوري | اشتراك
type CommitmentFreq = 'monthly' | 'quarterly' | 'yearly' | 'weekly';
type CommitmentDir = 'out' | 'in'; // صادر (ندفع) | وارد (نستلم)
type CommitmentPayment = { id: string; amount: number; date: string; dueLabel: string; createdBy?: string };
type Commitment = {
  id: string; projectId: string; kind: CommitmentKind; direction: CommitmentDir;
  name: string; party?: string; memberId?: string;
  amount: number;                // مبلغ الدفعة الواحدة
  freq: CommitmentFreq;          // التكرار
  startDate: string;             // تاريخ البداية / أول استحقاق
  totalCount?: number;           // عدد الدفعات الكلي (للأقساط) — undefined = مفتوح/مستمر
  paidCount: number;             // عدد الدفعات المسددة
  nextDue: string;               // تاريخ الاستحقاق القادم
  active: boolean;               // نشط أو موقوف
  payments: CommitmentPayment[];
  note?: string; attachments?: Attachment[]; createdBy?: string;
};
// tangible assets (الأصول الملموسة) — independent lifecycle: purchase, warranty, maintenance, usage
type AssetCategory = 'vehicle' | 'device' | 'equipment' | 'furniture' | 'property' | 'other';
type MaintenanceEntry = { id: string; date: string; type: 'صيانة' | 'عطل' | 'فحص'; cost: number; note: string; createdBy?: string; attachments?: Attachment[] };
type Asset = {
  id: string; projectId: string; name: string; category: AssetCategory;
  purchaseDate: string; purchaseValue: number; supplier?: string;
  warrantyEnd?: string;            // انتهاء الضمان
  serial?: string;                 // الرقم التسلسلي / اللوحة
  usageMeter?: number;             // عداد الاستخدام (كم/ساعات)
  usageUnit?: string;              // وحدة العداد (كم، ساعة)
  status: 'active' | 'maintenance' | 'retired';  // نشط / تحت الصيانة / مستبعَد
  memberId?: string;               // المسؤول/الحائز
  maintenance: MaintenanceEntry[]; // سجل الصيانة والأعطال
  note?: string; attachments?: Attachment[]; createdBy?: string;
};
type Transaction = { id: string; projectId: string; type: TxType; description: string; amount: number; category: string; date: string; hasDoc: boolean; note?: string; toProject?: string; transferDir?: 'out' | 'in'; linkId?: string; source?: string; memberId?: string; attachments?: Attachment[]; createdBy?: string };
type Tracking = { id: string; name: string; type: string; icon: string; status: TrackingStatus; daysLeft: number; expiryDate: string; projectId: string; note?: string; memberId?: string; attachments?: Attachment[]; createdBy?: string };
type RequestItem = { id: string; title: string; amount: number; requestedBy: string; status: RequestStatus; date: string; type: string; projectId: string; note?: string; memberId?: string; attachments?: Attachment[]; createdBy?: string };
type DocItem = { id: string; name: string; type: string; date: string; size: string; status: string; projectId: string; aiRead: boolean; attachments?: Attachment[]; createdBy?: string };
// ── surveys ──
type SurveyQuestion = { id: string; text: string; kind: 'single' | 'multi' | 'rating' | 'text'; options?: string[] };
type SurveyResponse = { id: string; answers: Record<string, string | string[] | number>; submittedAt: string; respondent?: string };
type Survey = {
  id: string; title: string; description?: string; surveyType: string;
  projectId?: string; questions: SurveyQuestion[]; responses: SurveyResponse[];
  status: 'draft' | 'active' | 'closed'; createdAt: string; maxResponses?: number; closeDate?: string;
};
type Notif = { id: string; type: string; title: string; body: string; time: string; read: boolean; link?: Page; projectId?: string; section?: string; memberId?: string; itemId?: string; ts?: string };
// audit log entry — records every important event in the app
type AuditEntry = { id: string; action: string; entity: string; detail: string; user: string; ts: string };

// ═══════════════════════════════════════════
//  CONSTANTS (type options per module)
// ═══════════════════════════════════════════
const PROJECT_ICONS = ['🏢', '🏠', '🍽️', '🏪', '🚗', '💼', '🏭', '⚙️', '📦', '🌿'];
const DEFAULT_PROJECT_TYPES = ['شركة', 'مؤسسة', 'مشروع منزلي', 'مشروع أسري', 'متجر إلكتروني', 'مطعم', 'أخرى'];

// roles & permissions (نوع التمكين والصلاحيات)
const ROLES: { id: MemberRole; label: string; desc: string; color: string }[] = [
  { id: 'owner',   label: 'مالك المشروع', desc: 'تحكم كامل بكل شيء', color: 'var(--purple-text)' },
  { id: 'manager', label: 'مدير مالي',    desc: 'إدارة المالية والموافقات', color: 'var(--info-text)' },
  { id: 'member',  label: 'عضو',          desc: 'إضافة عمليات ومستندات', color: '#059669' },
  { id: 'viewer',  label: 'مشاهد',        desc: 'عرض فقط دون تعديل', color: 'var(--text-3)' },
];
const PERMISSIONS: { id: string; label: string }[] = [
  { id: 'finance_view',   label: 'عرض المالية' },
  { id: 'finance_edit',   label: 'إدارة العمليات المالية' },
  { id: 'docs_manage',    label: 'إدارة المستندات' },
  { id: 'tracking_manage',label: 'إدارة المتابعات' },
  { id: 'requests_approve',label: 'اعتماد الطلبات' },
  { id: 'members_manage', label: 'إدارة الأعضاء' },
  { id: 'project_edit',   label: 'تعديل المشروع' },
  { id: 'project_delete', label: 'حذف المشروع' },
  { id: 'member_txn',     label: 'حركات رصيد الأعضاء' },
  { id: 'audit_view',     label: 'عرض سجل العمليات' },
  { id: 'reports_export', label: 'تصدير التقارير' },
];
// default permissions per role
const ROLE_PERMS: Record<MemberRole, string[]> = {
  owner:   PERMISSIONS.map(p => p.id),
  manager: ['finance_view', 'finance_edit', 'docs_manage', 'tracking_manage', 'requests_approve', 'member_txn', 'audit_view', 'reports_export', 'project_edit'],
  member:  ['finance_view', 'finance_edit', 'docs_manage', 'tracking_manage'],
  viewer:  ['finance_view'],
};
// current logged-in user (simulated until backend auth)
const CURRENT_USER = 'محمد العمري';

// per-subscriber preferences controlling display across all sections
type UserPrefs = {
  showStats: boolean;
  showCharts: boolean;
  defaultPeriod: string;
  compactCards: boolean;
  showQuickActions: boolean;
  confirmDelete: boolean;
  statsAutoScroll: boolean;
  statsScrollSeconds: number;
  statsLayout: 'horizontal' | 'vertical';
};
const DEFAULT_PREFS: UserPrefs = { showStats: true, showCharts: true, defaultPeriod: '1m', compactCards: false, showQuickActions: true, confirmDelete: true, statsAutoScroll: false, statsScrollSeconds: 4, statsLayout: 'horizontal' };
const PROJECT_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

const TX_TYPES: { id: TxType; label: string; icon: string }[] = [
  { id: 'income', label: 'إيراد', icon: '📈' },
  { id: 'expense', label: 'مصروف', icon: '📉' },
  { id: 'transfer', label: 'تحويل', icon: '🔄' },
];
const DEFAULT_TX_CATEGORIES = ['مبيعات', 'رواتب', 'إيجار', 'فواتير', 'قسط', 'صيانة', 'تسويق', 'أخرى'];

const TRACKING_TYPES = [
  { id: 'ضمان', icon: '🛡️' },
  { id: 'عقد', icon: '📄' },
  { id: 'ترخيص', icon: '🏛️' },
  { id: 'اشتراك', icon: '💻' },
  { id: 'تأمين', icon: '🚗' },
  { id: 'وثيقة', icon: '🪪' },
];

const REQUEST_TYPES = ['مصروف', 'تحويل', 'عهدة', 'صيانة', 'شراء'];

const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string }[] = [
  { id: 'vehicle', label: 'مركبة', icon: '🚗' },
  { id: 'device', label: 'جهاز', icon: '💻' },
  { id: 'equipment', label: 'معدّة', icon: '⚙️' },
  { id: 'furniture', label: 'أثاث', icon: '🪑' },
  { id: 'property', label: 'عقار', icon: '🏢' },
  { id: 'other', label: 'أخرى', icon: '📦' },
];
const ASSET_STATUS: Record<Asset['status'], { label: string; color: string; bg: string }> = {
  active: { label: 'نشط', color: 'var(--ok-text)', bg: 'var(--ok-bg-2)' },
  maintenance: { label: 'تحت الصيانة', color: 'var(--warn-text-2)', bg: 'var(--warn-bg-2)' },
  retired: { label: 'مستبعَد', color: '#64748b', bg: '#f1f5f9' },
};
const assetMaintCost = (a: Asset) => a.maintenance.reduce((s, m) => s + m.cost, 0);

const DEFAULT_DOC_TYPES = ['فاتورة', 'عقد', 'كشف حساب', 'وثيقة رسمية', 'ملف عام'];
const DEFAULT_PARTY_TYPES = ['عميل', 'مورد', 'بنك', 'جهة حكومية', 'شريك', 'أخرى'];

// user-customizable lists (managed from the التخصيص page)
type CustomLists = {
  txCategories: string[];
  projectTypes: string[];
  docTypes: string[];
  partyTypes: string[];
};
const DEFAULT_LISTS: CustomLists = {
  txCategories: DEFAULT_TX_CATEGORIES,
  projectTypes: DEFAULT_PROJECT_TYPES,
  docTypes: DEFAULT_DOC_TYPES,
  partyTypes: DEFAULT_PARTY_TYPES,
};

// ── survey templates (5 ready-made types) ──
const SURVEY_TEMPLATES: { id: string; name: string; icon: string; desc: string; questions: Omit<SurveyQuestion, 'id'>[] }[] = [
  {
    id: 'customer', name: 'رضا العملاء', icon: '😊', desc: 'قياس رضا العملاء عن الخدمة',
    questions: [
      { text: 'ما مدى رضاك العام عن خدمتنا؟', kind: 'rating' },
      { text: 'كيف تقيّم سرعة الاستجابة؟', kind: 'single', options: ['ممتازة', 'جيدة', 'مقبولة', 'ضعيفة'] },
      { text: 'هل تنصح بنا أصدقاءك؟', kind: 'single', options: ['نعم بالتأكيد', 'ربما', 'لا'] },
      { text: 'ملاحظات أو اقتراحات للتحسين', kind: 'text' },
    ],
  },
  {
    id: 'supplier', name: 'تقييم الموردين', icon: '🏭', desc: 'تقييم أداء الموردين والشركاء',
    questions: [
      { text: 'جودة المنتجات/الخدمات المقدّمة', kind: 'rating' },
      { text: 'الالتزام بمواعيد التسليم', kind: 'single', options: ['دائماً', 'غالباً', 'أحياناً', 'نادراً'] },
      { text: 'أي جوانب تحتاج تحسيناً؟', kind: 'multi', options: ['السعر', 'الجودة', 'التواصل', 'التسليم', 'الدعم'] },
      { text: 'ملاحظات إضافية', kind: 'text' },
    ],
  },
  {
    id: 'employee', name: 'استبيان الموظفين', icon: '👥', desc: 'قياس رضا وتفاعل الموظفين',
    questions: [
      { text: 'مدى رضاك عن بيئة العمل', kind: 'rating' },
      { text: 'هل تشعر بالتقدير في عملك؟', kind: 'single', options: ['دائماً', 'أحياناً', 'نادراً'] },
      { text: 'ما الذي يحفّزك أكثر؟', kind: 'multi', options: ['الراتب', 'التطوّر المهني', 'بيئة العمل', 'المرونة', 'التقدير'] },
      { text: 'اقتراحاتك لتحسين بيئة العمل', kind: 'text' },
    ],
  },
  {
    id: 'project', name: 'رأي حول مشروع/خدمة', icon: '💡', desc: 'جمع الآراء حول مشروع أو خدمة',
    questions: [
      { text: 'ما تقييمك العام للمشروع؟', kind: 'rating' },
      { text: 'ما أكثر ما أعجبك؟', kind: 'text' },
      { text: 'ما الذي يمكن تحسينه؟', kind: 'text' },
    ],
  },
  {
    id: 'rfq', name: 'طلب عروض أسعار', icon: '💰', desc: 'جمع عروض الأسعار من المورّدين',
    questions: [
      { text: 'اسم الشركة/المورّد', kind: 'text' },
      { text: 'السعر المقترح (ر.س)', kind: 'text' },
      { text: 'مدة التنفيذ المتوقّعة', kind: 'single', options: ['أسبوع', 'أسبوعان', 'شهر', 'أكثر من شهر'] },
      { text: 'ما الذي يشمله العرض؟', kind: 'text' },
    ],
  },
];

const INITIAL_SURVEYS: Survey[] = [
  {
    id: 'sv1', title: 'استبيان رضا عملاء يونيو', surveyType: 'customer', projectId: 'p1',
    status: 'active', createdAt: '2025-06-15', maxResponses: 100,
    questions: [
      { id: 'q1', text: 'ما مدى رضاك العام عن خدمتنا؟', kind: 'rating' },
      { id: 'q2', text: 'كيف تقيّم سرعة الاستجابة؟', kind: 'single', options: ['ممتازة', 'جيدة', 'مقبولة', 'ضعيفة'] },
      { id: 'q3', text: 'ملاحظات أو اقتراحات', kind: 'text' },
    ],
    responses: [
      { id: 'r1', answers: { q1: 5, q2: 'ممتازة', q3: 'خدمة رائعة' }, submittedAt: '2025-06-16', respondent: 'عميل 1' },
      { id: 'r2', answers: { q1: 4, q2: 'جيدة', q3: '' }, submittedAt: '2025-06-17', respondent: 'عميل 2' },
      { id: 'r3', answers: { q1: 5, q2: 'ممتازة', q3: 'سريعون جداً' }, submittedAt: '2025-06-18', respondent: 'عميل 3' },
    ],
  },
];


// ── contextual help (شرح نموذج العمل لكل قسم) ──
// editable + toggleable from the التخصيص page
type HelpKey = 'dashboard' | 'projects' | 'finance' | 'ledger' | 'receivables' | 'commitments' | 'documents' | 'trackings' | 'requests' | 'members';
type HelpEntry = { title: string; body: string; show: boolean };
type HelpTexts = Record<HelpKey, HelpEntry>;
const DEFAULT_HELP: HelpTexts = {
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
};

// ═══════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════
const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'شركة النخيل', icon: '🏢', balance: 284500, color: 'var(--info-text)', type: 'شركة', description: 'شركة تجارية متخصصة في التوريدات' },
  { id: 'p2', name: 'مشروع المنزل', icon: '🏠', balance: 52300, color: '#059669', type: 'مشروع منزلي', description: 'إدارة مصاريف والتزامات المنزل' },
  { id: 'p3', name: 'مطعم الديوانية', icon: '🍽️', balance: 118900, color: '#d97706', type: 'مطعم', description: 'مطعم وجبات شعبية' },
  { id: 'p4', name: 'متجر أناقة', icon: '🛍️', balance: 76400, color: 'var(--purple-text)', type: 'متجر إلكتروني', description: 'متجر إلكتروني للأزياء والإكسسوارات' },
  { id: 'p5', name: 'عيادة الشفاء', icon: '🏥', balance: 203100, color: '#0891b2', type: 'عيادة', description: 'عيادة طبية متعددة التخصصات' },
  { id: 'p6', name: 'ميزانية العائلة', icon: '👨‍👩‍👧', balance: 31800, color: '#db2777', type: 'مشروع أسري', description: 'إدارة الالتزامات والمصاريف العائلية' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // شركة النخيل
  { id: 't1', projectId: 'p1', type: 'income', description: 'إيراد مبيعات يونيو', amount: 48000, category: 'مبيعات', date: '2025-06-18', hasDoc: true, source: 'عميل: مجموعة الرواد', createdBy: 'محمد العمري' },
  { id: 'tErr1', projectId: 'p1', type: 'expense', description: 'فاتورة صيانة (مبلغ سالب بالخطأ)', amount: -3500, category: 'صيانة', date: '2025-06-20', hasDoc: false, source: 'ورشة الأمانة', createdBy: 'محمد العمري' },
  { id: 'tErr2', projectId: 'p1', type: 'expense', description: 'دفعة مورد (مبلغ غير معتاد؟)', amount: 9800000, category: 'مشتريات', date: '2025-06-21', hasDoc: false, source: 'مورد: التقنية الحديثة', createdBy: 'محمد العمري' },
  { id: 't2', projectId: 'p1', type: 'expense', description: 'رواتب الموظفين', amount: 21000, category: 'رواتب', date: '2025-06-15', hasDoc: true, createdBy: 'سارة المحمد' },
  { id: 't3', projectId: 'p1', type: 'expense', description: 'إيجار المكتب', amount: 8500, category: 'إيجار', date: '2025-06-01', hasDoc: false, createdBy: 'محمد العمري' },
  { id: 't4', projectId: 'p1', type: 'income', description: 'عمولة مشروع', amount: 12000, category: 'مبيعات', date: '2025-05-10', hasDoc: true, source: 'شركة البناء الحديث', createdBy: 'محمد العمري' },
  { id: 't5', projectId: 'p1', type: 'expense', description: 'فاتورة كهرباء', amount: 1800, category: 'فواتير', date: '2025-06-05', hasDoc: true, createdBy: 'أحمد العلي' },
  { id: 't6', projectId: 'p1', type: 'expense', description: 'حملة تسويق رقمي', amount: 6500, category: 'تسويق', date: '2025-05-28', hasDoc: false, createdBy: 'سارة المحمد' },
  // المنزل
  { id: 't7', projectId: 'p2', type: 'expense', description: 'قسط السيارة', amount: 2200, category: 'قسط', date: '2025-06-20', hasDoc: false, createdBy: 'محمد العمري' },
  { id: 't8', projectId: 'p2', type: 'expense', description: 'فاتورة المياه والكهرباء', amount: 740, category: 'فواتير', date: '2025-06-08', hasDoc: true, createdBy: 'محمد العمري' },
  { id: 't9', projectId: 'p2', type: 'income', description: 'الراتب الشهري', amount: 18000, category: 'مبيعات', date: '2025-06-01', hasDoc: false, createdBy: 'محمد العمري' },
  // مطعم
  { id: 't10', projectId: 'p3', type: 'income', description: 'مبيعات الأسبوع', amount: 32000, category: 'مبيعات', date: '2025-06-19', hasDoc: false, createdBy: 'محمد الزيد' },
  { id: 't11', projectId: 'p3', type: 'expense', description: 'شراء مواد خام', amount: 14500, category: 'أخرى', date: '2025-06-17', hasDoc: true, source: 'سوق الخضار المركزي', createdBy: 'محمد الزيد' },
  { id: 't12', projectId: 'p3', type: 'expense', description: 'رواتب العمالة', amount: 9000, category: 'رواتب', date: '2025-06-15', hasDoc: false, createdBy: 'محمد الزيد' },
  // متجر أناقة
  { id: 't13', projectId: 'p4', type: 'income', description: 'مبيعات المتجر الإلكتروني', amount: 27600, category: 'مبيعات', date: '2025-06-21', hasDoc: true, source: 'منصة سلة', createdBy: 'نورة القحطاني' },
  { id: 't14', projectId: 'p4', type: 'expense', description: 'رسوم الشحن', amount: 3400, category: 'أخرى', date: '2025-06-20', hasDoc: false, createdBy: 'نورة القحطاني' },
  { id: 't15', projectId: 'p4', type: 'expense', description: 'اشتراك المنصة الشهري', amount: 1200, category: 'فواتير', date: '2025-06-10', hasDoc: true, createdBy: 'فهد الدوسري' },
  // عيادة
  { id: 't16', projectId: 'p5', type: 'income', description: 'إيرادات الكشوفات', amount: 56000, category: 'مبيعات', date: '2025-06-22', hasDoc: true, source: 'مرضى + تأمين', createdBy: 'د. ليلى الحربي' },
  { id: 't17', projectId: 'p5', type: 'expense', description: 'مستلزمات طبية', amount: 18900, category: 'أخرى', date: '2025-06-18', hasDoc: true, source: 'شركة المعدات الطبية', createdBy: 'د. ليلى الحربي' },
  { id: 't18', projectId: 'p5', type: 'expense', description: 'رواتب الكادر الطبي', amount: 42000, category: 'رواتب', date: '2025-06-15', hasDoc: false, createdBy: 'عبدالله الشمري' },
  // العائلة
  { id: 't19', projectId: 'p6', type: 'expense', description: 'مصاريف المدارس', amount: 4800, category: 'أخرى', date: '2025-06-12', hasDoc: true, createdBy: 'محمد العمري' },
  { id: 't20', projectId: 'p6', type: 'expense', description: 'تسوق البقالة الشهري', amount: 2300, category: 'أخرى', date: '2025-06-09', hasDoc: false, createdBy: 'منى العمري' },
  { id: 't21', projectId: 'p2', type: 'expense', description: 'فاتورة الكهرباء', amount: 680, category: 'فواتير', date: '2025-06-05', hasDoc: true, source: 'شركة الكهرباء', createdBy: 'محمد العمري' },
  { id: 't22', projectId: 'p2', type: 'expense', description: 'صيانة التكييف', amount: 450, category: 'صيانة', date: '2025-06-12', hasDoc: true, source: 'مؤسسة التبريد', createdBy: 'محمد العمري' },
  { id: 't23', projectId: 'p2', type: 'expense', description: 'أثاث غرفة المعيشة', amount: 5800, category: 'أثاث', date: '2025-05-28', hasDoc: true, source: 'معرض الديار', createdBy: 'محمد العمري' },
  { id: 't24', projectId: 'p2', type: 'income', description: 'دخل إيجار شقة', amount: 3500, category: 'إيجار', date: '2025-06-01', hasDoc: false, source: 'مستأجر', createdBy: 'محمد العمري' },
  { id: 't25', projectId: 'p2', type: 'expense', description: 'فاتورة الإنترنت', amount: 320, category: 'فواتير', date: '2025-06-08', hasDoc: false, source: 'مزوّد الخدمة', createdBy: 'محمد العمري' },
  { id: 't26', projectId: 'p6', type: 'income', description: 'راتب الشهر', amount: 18000, category: 'راتب', date: '2025-06-01', hasDoc: false, createdBy: 'منى العمري' },
  { id: 't27', projectId: 'p6', type: 'expense', description: 'قسط المدرسة', amount: 4200, category: 'تعليم', date: '2025-06-03', hasDoc: true, source: 'مدرسة النموذج', createdBy: 'منى العمري' },
  { id: 't28', projectId: 'p6', type: 'expense', description: 'وقود السيارة', amount: 600, category: 'مواصلات', date: '2025-06-15', hasDoc: false, createdBy: 'منى العمري' },
  { id: 't29', projectId: 'p6', type: 'expense', description: 'فاتورة الجوال', amount: 280, category: 'فواتير', date: '2025-06-10', hasDoc: false, createdBy: 'منى العمري' },
  { id: 't30', projectId: 'p6', type: 'expense', description: 'مطعم عائلي', amount: 520, category: 'ترفيه', date: '2025-06-20', hasDoc: false, createdBy: 'منى العمري' },
];

const INITIAL_TRACKINGS: Tracking[] = [
  { id: 'tr1', name: 'ضمان ثلاجة المطبخ', type: 'ضمان', icon: '🧊', status: 'expiring', daysLeft: 12, expiryDate: '2025-07-06', projectId: 'p1', createdBy: 'سارة المحمد' },
  { id: 'tr2', name: 'عقد إيجار المكتب', type: 'عقد', icon: '📄', status: 'active', daysLeft: 180, expiryDate: '2025-12-31', projectId: 'p1', createdBy: 'محمد العمري' },
  { id: 'tr3', name: 'رخصة السجل التجاري', type: 'ترخيص', icon: '🏛️', status: 'expiring', daysLeft: 25, expiryDate: '2025-07-19', projectId: 'p1', createdBy: 'محمد العمري' },
  { id: 'tr4', name: 'تأمين السيارة', type: 'تأمين', icon: '🚗', status: 'expired', daysLeft: -5, expiryDate: '2025-06-19', projectId: 'p2', createdBy: 'محمد العمري' },
  { id: 'tr5', name: 'اشتراك Adobe', type: 'اشتراك', icon: '💻', status: 'active', daysLeft: 45, expiryDate: '2025-08-08', projectId: 'p1', createdBy: 'أحمد العلي' },
  { id: 'tr6', name: 'ضمان مكيف الاستقبال', type: 'ضمان', icon: '❄️', status: 'active', daysLeft: 240, expiryDate: '2026-02-20', projectId: 'p3', createdBy: 'محمد الزيد' },
  { id: 'tr7', name: 'عقد توريد الأقمشة', type: 'عقد', icon: '🧵', status: 'active', daysLeft: 90, expiryDate: '2025-09-24', projectId: 'p4', createdBy: 'نورة القحطاني' },
  { id: 'tr8', name: 'ترخيص وزارة الصحة', type: 'ترخيص', icon: '⚕️', status: 'expiring', daysLeft: 30, expiryDate: '2025-07-24', projectId: 'p5', createdBy: 'د. ليلى الحربي' },
  { id: 'tr9', name: 'اشتراك نظام الحجوزات', type: 'اشتراك', icon: '📅', status: 'active', daysLeft: 120, expiryDate: '2025-10-24', projectId: 'p5', createdBy: 'عبدالله الشمري' },
  { id: 'tr10', name: 'ضمان أجهزة المتجر', type: 'ضمان', icon: '📦', status: 'expiring', daysLeft: 18, expiryDate: '2025-07-12', projectId: 'p4', createdBy: 'فهد الدوسري' },
];

const INITIAL_ASSETS: Asset[] = [
  { id: 'as1', projectId: 'p1', name: 'سيارة تويوتا هايلكس', category: 'vehicle', purchaseDate: '2024-03-15', purchaseValue: 135000, supplier: 'الوكالة', warrantyEnd: '2027-03-15', serial: 'أ ب ج 1234', usageMeter: 28500, usageUnit: 'كم', status: 'active', memberId: 'm2', maintenance: [
    { id: 'mn1', date: '2024-09-10', type: 'صيانة', cost: 850, note: 'تغيير زيت وفلاتر', createdBy: 'محمد العمري' },
    { id: 'mn2', date: '2025-03-05', type: 'صيانة', cost: 1200, note: 'صيانة دورية 25 ألف', createdBy: 'محمد العمري' },
  ], note: 'سيارة الإدارة', createdBy: 'محمد العمري' },
  { id: 'as2', projectId: 'p1', name: 'خادم Dell PowerEdge', category: 'device', purchaseDate: '2024-06-01', purchaseValue: 22000, supplier: 'شركة التقنية', warrantyEnd: '2025-07-20', serial: 'SVR-9921', status: 'active', maintenance: [], note: 'خادم الاستضافة الداخلي', createdBy: 'أحمد العلي' },
  { id: 'as3', projectId: 'p5', name: 'جهاز أشعة', category: 'equipment', purchaseDate: '2023-11-20', purchaseValue: 280000, supplier: 'مورد طبي', warrantyEnd: '2026-11-20', serial: 'XR-450', usageMeter: 1840, usageUnit: 'فحص', status: 'maintenance', maintenance: [
    { id: 'mn3', date: '2025-06-10', type: 'عطل', cost: 4500, note: 'عطل في وحدة التحكم — قيد الإصلاح', createdBy: 'د. ليلى الحربي' },
  ], createdBy: 'د. ليلى الحربي' },
  { id: 'as4', projectId: 'p4', name: 'أجهزة كاشير (3)', category: 'device', purchaseDate: '2024-01-10', purchaseValue: 18000, supplier: 'سلة', warrantyEnd: '2025-07-08', usageUnit: '', status: 'active', maintenance: [], createdBy: 'فهد الدوسري' },
  { id: 'as5', projectId: 'p2', name: 'مكيفات مركزية', category: 'equipment', purchaseDate: '2023-05-01', purchaseValue: 45000, supplier: 'مقاول التكييف', status: 'active', maintenance: [
    { id: 'mn4', date: '2025-05-15', type: 'فحص', cost: 600, note: 'فحص وتنظيف موسمي', createdBy: 'محمد العمري' },
  ], createdBy: 'محمد العمري' },
];

const INITIAL_REQUESTS: RequestItem[] = [
  { id: 'r1', title: 'طلب صرف مصروفات السفر', amount: 3200, requestedBy: 'أحمد العلي', status: 'pending', date: '2025-06-20', type: 'مصروف', projectId: 'p1', createdBy: 'أحمد العلي' },
  { id: 'r2', title: 'تعزيز عهدة الصندوق', amount: 5000, requestedBy: 'سارة المحمد', status: 'pending', date: '2025-06-19', type: 'عهدة', projectId: 'p1', createdBy: 'سارة المحمد' },
  { id: 'r3', title: 'شراء معدات مكتبية', amount: 8700, requestedBy: 'خالد السعد', status: 'approved', date: '2025-06-15', type: 'شراء', projectId: 'p1', createdBy: 'خالد السعد' },
  { id: 'r4', title: 'صيانة أجهزة المطبخ', amount: 1500, requestedBy: 'محمد الزيد', status: 'rejected', date: '2025-06-12', type: 'صيانة', projectId: 'p3', createdBy: 'محمد الزيد' },
  { id: 'r5', title: 'شراء مخزون جديد', amount: 12000, requestedBy: 'نورة القحطاني', status: 'pending', date: '2025-06-21', type: 'شراء', projectId: 'p4', createdBy: 'نورة القحطاني' },
  { id: 'r6', title: 'تعويض مستلزمات طبية', amount: 6300, requestedBy: 'د. ليلى الحربي', status: 'approved', date: '2025-06-18', type: 'مصروف', projectId: 'p5', createdBy: 'د. ليلى الحربي' },
  { id: 'r7', title: 'طلب إجازة مدفوعة', amount: 0, requestedBy: 'عبدالله الشمري', status: 'pending', date: '2025-06-22', type: 'أخرى', projectId: 'p5', createdBy: 'عبدالله الشمري' },
  { id: 'r8', title: 'صرف بدل مواصلات', amount: 800, requestedBy: 'فهد الدوسري', status: 'approved', date: '2025-06-14', type: 'مصروف', projectId: 'p4', createdBy: 'فهد الدوسري' },
];

const INITIAL_DOCUMENTS: DocItem[] = [
  { id: 'd1', name: 'فاتورة مورد يونيو', type: 'فاتورة', date: '2025-06-18', size: '245 KB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd2', name: 'عقد الإيجار السنوي', type: 'عقد', date: '2025-01-01', size: '1.2 MB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd3', name: 'كشف حساب البنك', type: 'كشف حساب', date: '2025-06-01', size: '380 KB', status: 'pending', projectId: 'p1', aiRead: false, createdBy: 'سارة المحمد' },
  { id: 'd4', name: 'رخصة البلدية', type: 'وثيقة رسمية', date: '2024-07-15', size: '890 KB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd5', name: 'فاتورة مواد خام', type: 'فاتورة', date: '2025-06-17', size: '198 KB', status: 'processed', projectId: 'p3', aiRead: true, createdBy: 'محمد الزيد' },
  { id: 'd6', name: 'عقد توريد الأقمشة', type: 'عقد', date: '2025-06-24', size: '760 KB', status: 'pending', projectId: 'p4', aiRead: false, createdBy: 'نورة القحطاني' },
  { id: 'd7', name: 'ترخيص وزارة الصحة', type: 'وثيقة رسمية', date: '2024-07-24', size: '1.1 MB', status: 'processed', projectId: 'p5', aiRead: true, createdBy: 'د. ليلى الحربي' },
  { id: 'd8', name: 'كشف حساب العيادة', type: 'كشف حساب', date: '2025-06-22', size: '420 KB', status: 'processed', projectId: 'p5', aiRead: true, createdBy: 'عبدالله الشمري' },
  { id: 'd9', name: 'فاتورة المدارس', type: 'فاتورة', date: '2025-06-12', size: '156 KB', status: 'pending', projectId: 'p6', aiRead: false, createdBy: 'محمد العمري' },
];

const INITIAL_NOTIFS: Notif[] = [
  { id: 'n1', type: 'danger', title: 'تأمين السيارة منتهي', body: 'انتهى تأمين السيارة منذ 5 أيام. يرجى التجديد عبر قسم المتابعات والضمانات.', time: 'قبل ساعة', read: false, link: 'trackings', projectId: 'p1', section: 'trackings', itemId: 'tr4', ts: '2025-06-26 08:30' },
  { id: 'n2', type: 'warning', title: 'ضمان يوشك على الانتهاء', body: 'ضمان ثلاجة المطبخ ينتهي خلال 12 يوم. الطرف: مؤسسة الإلكترونيات الحديثة.', time: 'قبل 3 ساعات', read: false, link: 'trackings', projectId: 'p1', section: 'trackings', itemId: 'tr1', ts: '2025-06-26 06:15' },
  { id: 'n3', type: 'info', title: 'طلب جديد بانتظار موافقتك', body: 'طلب صرف مصروفات السفر بمبلغ 3,200 ر.س — مقدّم الطلب: أحمد العلي.', time: 'أمس', read: false, link: 'requests', projectId: 'p2', section: 'requests', ts: '2025-06-25 14:00' },
  { id: 'n4', type: 'success', title: 'تمت معالجة مستند', body: 'تمت قراءة فاتورة مورد يونيو بنجاح بواسطة محمد العمري.', time: 'أمس', read: true, link: 'documents', projectId: 'p1', section: 'documents', ts: '2025-06-25 10:20' },
  { id: 'n5', type: 'warning', title: 'عقد إيجار المكتب يقترب من الانتهاء', body: 'عقد إيجار المكتب ينتهي خلال 24 يوم. يُنصح بمراجعة شروط التجديد مبكراً.', time: 'أمس', read: false, link: 'trackings', projectId: 'p1', section: 'trackings', itemId: 'tr2', ts: '2025-06-25 09:10' },
  { id: 'n6', type: 'danger', title: 'رخصة السجل التجاري منتهية', body: 'رخصة السجل التجاري تجاوزت تاريخ الانتهاء. التجديد مطلوب لتفادي الغرامات.', time: 'قبل يومين', read: false, link: 'trackings', projectId: 'p1', section: 'trackings', itemId: 'tr3', ts: '2025-06-24 11:45' },
  { id: 'n7', type: 'info', title: 'استحقاق دفعة التزام', body: 'قسط تمويل المعدات بمبلغ 4,500 ر.س يُستحق خلال 3 أيام.', time: 'قبل يومين', read: false, link: 'commitments', projectId: 'p4', section: 'commitments', ts: '2025-06-24 08:00' },
  { id: 'n8', type: 'warning', title: 'ذمة مستحقة القبض تأخرت', body: 'ذمة بمبلغ 12,000 ر.س على عميل (مجموعة الرواد) تجاوزت تاريخ الاستحقاق.', time: 'قبل 3 أيام', read: true, link: 'receivables', projectId: 'p1', section: 'receivables', ts: '2025-06-23 13:30' },
  { id: 'n9', type: 'success', title: 'تمت الموافقة على طلب', body: 'تمت الموافقة على طلب تعزيز عهدة الصندوق بمبلغ 5,000 ر.س.', time: 'قبل 3 أيام', read: true, link: 'requests', projectId: 'p1', section: 'requests', ts: '2025-06-23 10:00' },
  { id: 'n10', type: 'info', title: 'اشتراك Adobe يُجدّد تلقائياً', body: 'اشتراك Adobe Creative Cloud سيُجدّد خلال 8 أيام بمبلغ 240 ر.س شهرياً.', time: 'قبل 4 أيام', read: true, link: 'trackings', projectId: 'p1', section: 'trackings', itemId: 'tr5', ts: '2025-06-22 16:20' },
  { id: 'n11', type: 'warning', title: 'موعد صيانة أصل', body: 'سيارة المشروع (تويوتا هايلكس) تستحق صيانة دورية حسب عداد الاستخدام.', time: 'قبل 5 أيام', read: true, link: 'assets', projectId: 'p1', section: 'assets', ts: '2025-06-21 09:30' },
  { id: 'n12', type: 'danger', title: 'عملية بمبلغ غير صحيح', body: 'رُصدت عملية بمبلغ سالب في الإدارة المالية. يُرجى مراجعتها وتصحيحها.', time: 'قبل 5 أيام', read: false, link: 'finance', projectId: 'p1', section: 'finance', itemId: 'tErr1', ts: '2025-06-21 08:15' },
];

const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'a1', action: 'تسجيل دخول', entity: 'النظام', detail: 'تسجيل دخول ناجح', user: 'محمد العمري', ts: '2025-06-26 09:12' },
  { id: 'a2', action: 'إنشاء', entity: 'عملية مالية', detail: 'إيراد مبيعات — 12,000 ر.س', user: 'محمد العمري', ts: '2025-06-26 09:20' },
  { id: 'a3', action: 'اعتماد', entity: 'طلب', detail: 'اعتماد طلب صرف مصروفات السفر', user: 'سارة المحمد', ts: '2025-06-25 16:40' },
];

const INITIAL_MEMBERS: Member[] = [
  // شركة النخيل
  { id: 'm1', projectId: 'p1', name: 'محمد العمري', email: 'mohammed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm2', projectId: 'p1', name: 'سارة المحمد', email: 'sara@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 5000, status: 'active' },
  { id: 'm3', projectId: 'p1', name: 'أحمد العلي', email: 'ahmad@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 1200, status: 'active' },
  { id: 'm4', projectId: 'p1', name: 'خالد السعد', email: 'khalid@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 0, status: 'active' },
  { id: 'm5', projectId: 'p1', name: 'ريم الناصر', email: 'reem@example.com', role: 'viewer', permissions: ROLE_PERMS.viewer, balance: 0, status: 'active' },
  // مطعم الديوانية
  { id: 'm6', projectId: 'p3', name: 'محمد الزيد', email: 'mz@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 800, status: 'active' },
  { id: 'm7', projectId: 'p3', name: 'يوسف الحمدان', email: 'yousef@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 300, status: 'active' },
  // متجر أناقة
  { id: 'm8', projectId: 'p4', name: 'نورة القحطاني', email: 'noura@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm9', projectId: 'p4', name: 'فهد الدوسري', email: 'fahad@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 1500, status: 'active' },
  // عيادة الشفاء
  { id: 'm10', projectId: 'p5', name: 'د. ليلى الحربي', email: 'laila@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm11', projectId: 'p5', name: 'عبدالله الشمري', email: 'abdullah@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 2400, status: 'active' },
  { id: 'm12', projectId: 'p5', name: 'هند المطيري', email: 'hind@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 600, status: 'active' },
  // العائلة
  { id: 'm13', projectId: 'p6', name: 'محمد العمري', email: 'mohammed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm14', projectId: 'p6', name: 'منى العمري', email: 'mona@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 0, status: 'active' },
];

const MEMBER_TXN_TYPES: { id: MemberTxnType; label: string; icon: string; direction: 'to_member' | 'from_member'; desc: string }[] = [
  { id: 'custody',    label: 'صرف عهدة',     icon: '📤', direction: 'to_member',   desc: 'صرف مبلغ كعهدة للعضو' },
  { id: 'expense',    label: 'مصروف للعضو',  icon: '💸', direction: 'to_member',   desc: 'تعويض مصروف تكبّده العضو' },
  { id: 'bonus',      label: 'مكافأة/حافز',  icon: '🎁', direction: 'to_member',   desc: 'مكافأة أو حافز يُمنح للعضو' },
  { id: 'advance',    label: 'سلفة',         icon: '🏦', direction: 'to_member',   desc: 'سلفة (دَين على العضو يُسترجع لاحقاً)' },
  { id: 'salary',     label: 'راتب/أجر',     icon: '💰', direction: 'to_member',   desc: 'صرف راتب أو أجر للعضو' },
  { id: 'supply',     label: 'توريد/تحصيل',  icon: '📥', direction: 'from_member', desc: 'مبلغ يورّده العضو للمشروع (تحصيل مندوب)' },
  { id: 'settlement', label: 'تسوية/إرجاع',  icon: '↩️', direction: 'from_member', desc: 'استرجاع مبلغ من العضو' },
  { id: 'deduction',  label: 'خصم/تصفية',   icon: '➖', direction: 'from_member', desc: 'خصم من رصيد العضو' },
];

const INITIAL_MEMBER_TXNS: MemberTxn[] = [
  { id: 'mt1', projectId: 'p1', memberId: 'm2', type: 'custody', amount: 5000, note: 'عهدة مصاريف تشغيلية', date: '2025-06-15', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt2', projectId: 'p1', memberId: 'm3', type: 'custody', amount: 1200, note: 'عهدة نثرية', date: '2025-06-18', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt3', projectId: 'p1', memberId: 'm3', type: 'custody', amount: 2000, note: 'عهدة إضافية بانتظار القبول', date: '2025-06-22', status: 'pending', direction: 'to_member', createdBy: 'سارة المحمد' },
  { id: 'mt4', projectId: 'p1', memberId: 'm4', type: 'expense', amount: 950, note: 'تعويض مصروف وقود', date: '2025-06-20', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt5', projectId: 'p1', memberId: 'm2', type: 'settlement', amount: 1800, note: 'إرجاع جزء من العهدة', date: '2025-06-23', status: 'pending', direction: 'from_member', createdBy: 'سارة المحمد' },
  { id: 'mt6', projectId: 'p3', memberId: 'm6', type: 'custody', amount: 800, note: 'عهدة مشتريات يومية', date: '2025-06-19', status: 'accepted', direction: 'to_member', createdBy: 'محمد الزيد' },
  { id: 'mt7', projectId: 'p4', memberId: 'm9', type: 'custody', amount: 1500, note: 'عهدة تغليف وشحن', date: '2025-06-21', status: 'accepted', direction: 'to_member', createdBy: 'نورة القحطاني' },
  { id: 'mt8', projectId: 'p5', memberId: 'm11', type: 'custody', amount: 2400, note: 'عهدة مستلزمات', date: '2025-06-18', status: 'accepted', direction: 'to_member', createdBy: 'د. ليلى الحربي' },
  { id: 'mt9', projectId: 'p5', memberId: 'm12', type: 'expense', amount: 600, note: 'تعويض مواصلات', date: '2025-06-22', status: 'pending', direction: 'to_member', createdBy: 'عبدالله الشمري' },
];

const INITIAL_RECEIVABLES: Receivable[] = [
  // ذمم مدينة (لنا)
  { id: 'rc1', projectId: 'p1', kind: 'receivable', party: 'مجموعة الرواد', amount: 18000, dueDate: '2025-07-15', date: '2025-06-10', status: 'partial', payments: [{ id: 'pm1', amount: 8000, date: '2025-06-20', note: 'دفعة أولى', createdBy: 'محمد العمري' }], note: 'فاتورة مبيعات آجلة', createdBy: 'محمد العمري' },
  { id: 'rc2', projectId: 'p1', kind: 'receivable', memberId: 'm3', party: 'أحمد العلي (مندوب مبيعات)', amount: 4500, dueDate: '2025-07-01', date: '2025-06-18', status: 'open', payments: [], note: 'مبالغ حصّلها المندوب ولم تورّد بعد', createdBy: 'سارة المحمد' },
  { id: 'rc3', projectId: 'p4', kind: 'receivable', party: 'عميل التجزئة - طلب #482', amount: 3200, dueDate: '2025-07-05', date: '2025-06-21', status: 'open', payments: [], note: 'طلب بالأجل', createdBy: 'نورة القحطاني' },
  // ذمم دائنة (علينا)
  { id: 'rc4', projectId: 'p1', kind: 'payable', party: 'مورد المعدات المكتبية', amount: 9500, dueDate: '2025-07-10', date: '2025-06-12', status: 'open', payments: [], note: 'فاتورة توريد آجلة', createdBy: 'محمد العمري' },
  { id: 'rc5', projectId: 'p3', kind: 'payable', party: 'سوق الخضار المركزي', amount: 6200, dueDate: '2025-06-30', date: '2025-06-17', status: 'partial', payments: [{ id: 'pm2', amount: 3000, date: '2025-06-22', createdBy: 'محمد الزيد' }], note: 'مستحقات مواد خام', createdBy: 'محمد الزيد' },
  { id: 'rc6', projectId: 'p5', kind: 'payable', memberId: 'm11', party: 'عبدالله الشمري (مندوب مشتريات)', amount: 2400, dueDate: '2025-07-08', date: '2025-06-18', status: 'open', payments: [], note: 'مبالغ صرفها المندوب تُستحق له', createdBy: 'د. ليلى الحربي' },
];

const INITIAL_COMMITMENTS: Commitment[] = [
  // أقساط
  { id: 'cm1', projectId: 'p2', kind: 'installment', direction: 'out', name: 'قسط السيارة', party: 'بنك التمويل', amount: 2200, freq: 'monthly', startDate: '2025-01-05', totalCount: 36, paidCount: 5, nextDue: '2025-07-05', active: true, payments: [], note: 'قسط شهري لمدة 3 سنوات', createdBy: 'محمد العمري' },
  { id: 'cm2', projectId: 'p1', kind: 'installment', direction: 'out', name: 'قسط معدات الإنتاج', party: 'شركة المعدات', amount: 4500, freq: 'monthly', startDate: '2025-03-10', totalCount: 12, paidCount: 3, nextDue: '2025-07-10', active: true, payments: [], createdBy: 'محمد العمري' },
  // التزامات دورية
  { id: 'cm3', projectId: 'p1', kind: 'obligation', direction: 'out', name: 'إيجار المكتب', party: 'مالك العقار', amount: 8500, freq: 'monthly', startDate: '2025-01-01', paidCount: 5, nextDue: '2025-07-01', active: true, payments: [], note: 'إيجار شهري', createdBy: 'محمد العمري' },
  { id: 'cm4', projectId: 'p5', kind: 'obligation', direction: 'out', name: 'رواتب الكادر الطبي', party: 'الموظفون', amount: 42000, freq: 'monthly', startDate: '2025-01-28', paidCount: 5, nextDue: '2025-06-28', active: true, payments: [], createdBy: 'د. ليلى الحربي' },
  { id: 'cm5', projectId: 'p4', kind: 'obligation', direction: 'in', name: 'عقد توريد شهري', party: 'عميل الجملة', amount: 12000, freq: 'monthly', startDate: '2025-02-15', paidCount: 4, nextDue: '2025-07-15', active: true, payments: [], note: 'دخل دوري من عقد', createdBy: 'نورة القحطاني' },
  // اشتراكات
  { id: 'cm6', projectId: 'p1', kind: 'subscription', direction: 'out', name: 'اشتراك Adobe', party: 'Adobe', amount: 240, freq: 'monthly', startDate: '2025-01-08', paidCount: 5, nextDue: '2025-07-08', active: true, payments: [], createdBy: 'أحمد العلي' },
  { id: 'cm7', projectId: 'p4', kind: 'subscription', direction: 'out', name: 'اشتراك منصة سلة', party: 'سلة', amount: 1200, freq: 'monthly', startDate: '2025-01-10', paidCount: 5, nextDue: '2025-07-10', active: true, payments: [], createdBy: 'فهد الدوسري' },
  { id: 'cm8', projectId: 'p5', kind: 'subscription', direction: 'out', name: 'نظام الحجوزات', party: 'مزوّد النظام', amount: 800, freq: 'yearly', startDate: '2024-10-24', paidCount: 1, nextDue: '2025-10-24', active: true, payments: [], createdBy: 'عبدالله الشمري' },
];

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════
const fmt = (n: number) => n.toLocaleString('ar-SA') + ' ر.س';
const fmtNum = (n: number) => n.toLocaleString('ar-SA');
// remaining balance on a receivable (original − payments)
const recvPaid = (r: Receivable) => r.payments.reduce((s, p) => s + p.amount, 0);
const recvRemaining = (r: Receivable) => Math.max(0, r.amount - recvPaid(r));
// commitment helpers: advance a due date by frequency
const FREQ_DAYS: Record<CommitmentFreq, number> = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 };
const FREQ_LABEL: Record<CommitmentFreq, string> = { weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي', yearly: 'سنوي' };
const advanceDate = (iso: string, freq: CommitmentFreq): string => {
  const d = new Date(iso);
  if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (freq === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};
const commitmentDone = (c: Commitment) => c.totalCount != null && c.paidCount >= c.totalCount;
const today = () => new Date().toISOString().slice(0, 10);
const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);
const daysBetween = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
const statusFromDays = (d: number): TrackingStatus => d < 0 ? 'expired' : d <= 30 ? 'expiring' : 'active';

// ── localStorage-backed state (replaceable by a real DB later) ──
// data version: bump this whenever seed/initial data changes,
// so stale localStorage from older versions is cleared automatically (one-time).
// user-customizable theme colors (override CSS vars at runtime). null = use theme default.
type CustomTheme = { primary?: string; bg?: string; surface?: string; text?: string; border?: string };
const DEFAULT_CUSTOM_THEME: CustomTheme = {};
const THEME_PRESETS: { id: string; name: string; primary: string; swatch: string[] }[] = [
  { id: 'blue', name: 'الأزرق (افتراضي)', primary: '#2563eb', swatch: ['#2563eb', '#1d4ed8'] },
  { id: 'emerald', name: 'الزمردي', primary: '#059669', swatch: ['#059669', '#047857'] },
  { id: 'violet', name: 'البنفسجي', primary: '#7c3aed', swatch: ['#7c3aed', '#6d28d9'] },
  { id: 'rose', name: 'الوردي', primary: '#e11d48', swatch: ['#e11d48', '#be123c'] },
  { id: 'amber', name: 'الكهرماني', primary: '#d97706', swatch: ['#d97706', '#b45309'] },
  { id: 'slate', name: 'الرمادي', primary: '#475569', swatch: ['#475569', '#334155'] },
];
const DATA_VERSION = '7';
(() => {
  try {
    const stored = localStorage.getItem('mz_data_version');
    if (stored !== DATA_VERSION) {
      // clear all app keys so new seed data loads, then record the new version
      Object.keys(localStorage).filter(k => k.startsWith('mz_') && k !== 'mz_theme' && k !== 'mz_authed').forEach(k => localStorage.removeItem(k));
      localStorage.setItem('mz_data_version', DATA_VERSION);
    }
  } catch { /* ignore */ }
})();

// ═══════════════════════════════════════════════════════════════
//  DATA LAYER (طبقة البيانات الموحّدة)
//  ───────────────────────────────────────────────────────────────
//  كل حالة دائمة في موازين تمرّ عبر usePersist. هذه هي نقطة التبديل
//  الوحيدة عند الانتقال للباك إند: استبدل قراءة/كتابة localStorage
//  بنداءات API (fetch/Supabase) داخل هذا الخطّاف فقط — دون لمس بقية
//  التطبيق. كل setX في الأقسام سيعمل كما هو.
//
//  مثال الترقية المستقبلية:
//    init  → await api.get(`/state/${key}`)
//    write → await api.put(`/state/${key}`, val)  (مع debounce)
//
//  المفاتيح الحالية (mz_*): theme, authed, plan, projects, transactions,
//  trackings, assets, requests, documents, notifs, members, member_txns,
//  receivables, commitments, prefs, audit, lists, help, data_version
// ═══════════════════════════════════════════════════════════════
function usePersist<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = dataLayer.read(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { dataLayer.write(key, JSON.stringify(val)); } catch { /* ignore quota errors */ }
  }, [key, val]);
  return [val, setVal];
}

// single abstraction over storage — swap this object's body for an API client later
const dataLayer = {
  read: (key: string): string | null => localStorage.getItem(key),
  write: (key: string, value: string): void => localStorage.setItem(key, value),
  remove: (key: string): void => localStorage.removeItem(key),
};

// ── computed balance: opening + income − expense ± transfers ──
// detect mobile viewport (responsive layout switch)
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// shared deep-link highlight: scrolls to the matching element and flashes it
function useHighlight(highlightId: string | null) {
  useEffect(() => {
    if (!highlightId) return;
    let attempts = 0;
    let timer: number;
    const tryFind = () => {
      const el = document.querySelector(`[data-hl="${highlightId}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('mz-flash');
        window.setTimeout(() => el.classList.remove('mz-flash'), 2200);
        return;
      }
      // element not mounted yet (page still rendering) — retry a few times
      attempts++;
      if (attempts < 15) timer = window.setTimeout(tryFind, 120);
    };
    timer = window.setTimeout(tryFind, 120);
    return () => window.clearTimeout(timer);
  }, [highlightId]);
}

function computeBalance(project: Project, transactions: Transaction[]): number {
  let bal = project.balance; // opening balance
  for (const t of transactions) {
    if (t.projectId !== project.id) continue;
    if (t.type === 'income') bal += t.amount;
    else if (t.type === 'expense') bal -= t.amount;
    else if (t.type === 'transfer') bal += (t.transferDir === 'in' ? t.amount : -t.amount);
  }
  return bal;
}

// ═══════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════
// Avatar for a project: shows uploaded image if present, else the emoji icon on a colored chip
function ProjectAvatar({ project, size = 32 }: { project: { icon: string; color: string; image?: string }; size?: number }) {
  if (project.image) {
    return <img src={project.image} alt="" style={{ width: size, height: size, borderRadius: size * 0.28, objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, background: (project.color || '#2563eb') + '22', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>{project.icon}</span>
  );
}
// Avatar for a member: shows uploaded photo if present, else the first letter on a colored circle
function MemberAvatar({ member, size = 40, color }: { member: { name: string; image?: string }; size?: number; color?: string }) {
  const c = color || '#2563eb';
  if (member.image) {
    return <img src={member.image} alt="" style={{ width: size, height: size, borderRadius: 99, objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: 99, background: c + '20', color: c, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>{member.name.charAt(0)}</span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: 'نشط',              bg: 'var(--ok-bg-2)', color: 'var(--ok-text)' },
    expiring:  { label: 'يوشك على الانتهاء', bg: '#fef9c3', color: 'var(--warn-text-2)' },
    expired:   { label: 'منتهي',            bg: 'var(--danger-bg-2)', color: 'var(--danger-text)' },
    pending:   { label: 'معلق',             bg: '#fef9c3', color: 'var(--warn-text-2)' },
    approved:  { label: 'معتمد',            bg: 'var(--ok-bg-2)', color: 'var(--ok-text)' },
    rejected:  { label: 'مرفوض',           bg: 'var(--danger-bg-2)', color: 'var(--danger-text)' },
    processed: { label: 'تمت المعالجة',    bg: '#dbeafe', color: 'var(--info-text)' },
  };
  const s = map[status] || { label: status, bg: 'var(--surface-3)', color: 'var(--text-3)' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function Card({ children, style = {}, dataHl }: { children: React.ReactNode; style?: React.CSSProperties; dataHl?: string }) {
  return (
    <div data-hl={dataHl} style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 20, ...style }}>
      {children}
    </div>
  );
}

// contextual help icon + popup (شرح القسم)
function HelpButton({ entry }: { entry?: HelpEntry }) {
  const [open, setOpen] = useState(false);
  if (!entry || !entry.show) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} title="ما هذا القسم؟" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 24, height: 24, borderRadius: 99, border: '1px solid var(--border)',
        background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer',
        fontSize: 13, fontWeight: 700, flexShrink: 0, lineHeight: 1,
      }}>ⓘ</button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'mzFade .2s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 18, maxWidth: 440, width: '100%', maxHeight: '80vh', boxShadow: '0 12px 48px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{entry.title}</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', fontSize: 15, color: 'var(--text-3)' }}>✕</button>
            </div>
            <div style={{ padding: 20, fontSize: 13.5, lineHeight: 2, color: 'var(--text-2)', whiteSpace: 'pre-line', overflowY: 'auto', maxHeight: '60vh' }}>{entry.body}</div>
          </div>
        </div>
      )}
    </>
  );
}

function PageHeader({ title, subtitle, action, help }: { title: string; subtitle?: string; action?: React.ReactNode; help?: HelpEntry }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{title}</h1>
          <HelpButton entry={help} />
        </div>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Btn({ children, variant = 'primary', onClick, size = 'md', style = {}, disabled = false }: {
  children: React.ReactNode; variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
  onClick?: () => void; size?: 'sm' | 'md'; style?: React.CSSProperties; disabled?: boolean;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    fontFamily: 'inherit', fontWeight: 500, borderRadius: 10, transition: 'opacity .15s',
    padding: size === 'sm' ? '6px 14px' : '9px 18px',
    fontSize: size === 'sm' ? 13 : 14,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent, #2563eb)', color: '#fff' },
    outline: { background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' },
    ghost:   { background: 'transparent', color: 'var(--text-3)' },
    danger:  { background: 'var(--danger-bg-2)', color: 'var(--danger-text)' },
    success: { background: 'var(--ok-bg-2)', color: 'var(--ok-text)' },
  };
  return <button disabled={disabled} style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>{children}</button>;
}

// reusable empty state with optional call-to-action
function EmptyState({ icon, title, hint, actionLabel, onAction }: {
  icon: string; title: string; hint?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{title}</div>
      {hint && <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: actionLabel ? 20 : 0, lineHeight: 1.7, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{hint}</div>}
      {actionLabel && onAction && <Btn onClick={onAction}>{actionLabel}</Btn>}
    </Card>
  );
}

// ─── Bottom Sheet (mobile-first modal) ───
function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const dragRef = React.useRef<{ startY: number; dragging: boolean }>({ startY: 0, dragging: false });
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // reset position + scroll to top whenever a sheet opens (user always starts from the top of content)
  useEffect(() => {
    if (open) {
      setDragY(0);
      requestAnimationFrame(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; });
    }
  }, [open]);
  if (!open) return null;

  const onStart = (clientY: number) => { dragRef.current = { startY: clientY, dragging: true }; setDragY(0); };
  const onMove = (clientY: number) => {
    if (!dragRef.current.dragging) return;
    const delta = clientY - dragRef.current.startY;
    // only allow downward drag; apply mild resistance for a natural feel
    if (delta > 0) setDragY(delta < 200 ? delta : 200 + (delta - 200) * 0.3);
  };
  const onEnd = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragY > 110) onClose(); else setDragY(0);
  };

  // shared drag handlers for the whole header area (grabber + title row)
  const dragHandlers = {
    onTouchStart: (e: React.TouchEvent) => onStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => onMove(e.touches[0].clientY),
    onTouchEnd: onEnd,
    onMouseDown: (e: React.MouseEvent) => {
      onStart(e.clientY);
      const mm = (ev: MouseEvent) => onMove(ev.clientY);
      const mu = () => { onEnd(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
      window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    },
  };

  const closing = dragY > 110;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: `rgba(15,17,23,${Math.max(0.15, 0.45 - dragY / 600)})`, zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'mzFade .2s ease', transition: dragRef.current.dragging ? 'none' : 'background .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', width: '100%', maxWidth: 560, maxHeight: '92vh', minHeight: 200,
          borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column',
          animation: dragY === 0 && !dragRef.current.dragging ? 'mzSlideUp .3s cubic-bezier(.16,1,.3,1)' : 'none',
          transform: `translateY(${dragY}px)`, transition: dragRef.current.dragging ? 'none' : 'transform .28s cubic-bezier(.16,1,.3,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,.18)',
        }}
      >
        {/* drag zone: grabber + header together (easy to grab on mobile) */}
        <div {...dragHandlers} style={{ touchAction: 'none', cursor: 'grab', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <div style={{ width: closing ? 56 : 44, height: 5, borderRadius: 99, background: closing ? 'var(--text-3)' : 'var(--border)', transition: 'all .15s ease' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{title}</div>
            <button onClick={onClose} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 99, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--text-3)', flexShrink: 0 }}>✕</button>
          </div>
        </div>
        {/* body — always starts scrolled to top */}
        <div ref={bodyRef} style={{ padding: 20, overflowY: 'auto', flex: 1, overscrollBehavior: 'contain' }}>{children}</div>
        {/* footer */}
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Form field primitives ───
function Field({ label, children, style = {} }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
  fontFamily: 'inherit', fontSize: 14, color: 'var(--text)', background: 'var(--surface)', boxSizing: 'border-box',
};

function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inputStyle} />;
}

function NumInput({ value, onChange, placeholder }: { value: number | ''; onChange: (v: number | '') => void; placeholder?: string }) {
  return <input type="number" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))} style={inputStyle} />;
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />;
}

// chip-style type picker
function TypePicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { v: string; l: string; icon?: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = value === o.v;
        return (
          <button key={o.v} onClick={() => onChange(o.v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
            border: `1.5px solid ${active ? '#2563eb' : 'var(--border)'}`, background: active ? 'var(--info-bg)' : 'var(--surface)',
            color: active ? '#1d4ed8' : '#6b7280', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            {o.icon && <span>{o.icon}</span>}{o.l}
          </button>
        );
      })}
    </div>
  );
}
// ═══════════════════════════════════════════
//  UNIFIED ATTACHMENTS (camera / gallery / files + preview)
// ═══════════════════════════════════════════
function AttachmentPicker({ value, onChange }: { value: Attachment[]; onChange: (a: Attachment[]) => void }) {
  const camRef = React.useRef<HTMLInputElement>(null);
  const galRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const humanSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

  const addFiles = (files: FileList | null, kind: 'image' | 'file') => {
    if (!files) return;
    const arr = Array.from(files);
    let pending = arr.length;
    const next: Attachment[] = [];
    arr.forEach(f => {
      const att: Attachment = { id: uid('att'), name: f.name, kind: f.type.startsWith('image') ? 'image' : kind, size: humanSize(f.size), fileType: f.type || f.name.split('.').pop(), uploadDate: today() };
      // generate a small preview for images (kept in-session)
      if (att.kind === 'image') {
        const reader = new FileReader();
        reader.onload = () => { att.preview = reader.result as string; next.push(att); pending--; if (pending === 0) onChange([...value, ...next]); };
        reader.onerror = () => { next.push(att); pending--; if (pending === 0) onChange([...value, ...next]); };
        reader.readAsDataURL(f);
      } else {
        next.push(att); pending--; if (pending === 0) onChange([...value, ...next]);
      }
    });
  };

  const remove = (id: string) => onChange(value.filter(a => a.id !== id));

  const btn = (icon: string, label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 8px', borderRadius: 12,
      border: '1.5px dashed var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
    </button>
  );

  return (
    <div>
      {/* hidden native inputs — open camera / gallery / files */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { addFiles(e.target.files, 'image'); e.target.value = ''; }} />
      <input ref={galRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files, 'image'); e.target.value = ''; }} />
      <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files, 'file'); e.target.value = ''; }} />

      <div style={{ display: 'flex', gap: 8, marginBottom: value.length ? 12 : 0 }}>
        {btn('📷', 'كاميرا', () => camRef.current?.click())}
        {btn('🖼️', 'معرض', () => galRef.current?.click())}
        {btn('📎', 'ملفات', () => fileRef.current?.click())}
      </div>

      {/* preview thumbnails / file chips */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {value.map(a => (
            <div key={a.id} style={{ position: 'relative', width: 72 }}>
              <div style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                {a.kind === 'image' && a.preview
                  ? <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26 }}>{a.kind === 'image' ? '🖼️' : '📄'}</span>}
              </div>
              <button type="button" onClick={() => remove(a.id)} style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: 99, background: '#ef4444', color: '#fff', border: '2px solid var(--surface)', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <div style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'center', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>📌 يُحفظ شكلياً في هذه النسخة — الرفع الفعلي للسحابة يأتي مع الـ Backend.</div>
    </div>
  );
}

// single-image picker → returns Base64 string (for project main image / member photo)
function ImagePicker({ value, onChange, shape = 'circle', size = 84 }: { value?: string; onChange: (img: string | undefined) => void; shape?: 'circle' | 'rounded'; size?: number }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pick = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(f);
  };
  const radius = shape === 'circle' ? 99 : 16;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div onClick={() => inputRef.current?.click()} style={{ width: size, height: size, borderRadius: radius, background: 'var(--surface-3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        {value ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: size * 0.34, color: 'var(--text-3)' }}>📷</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Btn size="sm" variant="outline" onClick={() => inputRef.current?.click()}>{value ? 'تغيير الصورة' : 'رفع صورة'}</Btn>
        {value && <Btn size="sm" variant="ghost" onClick={() => onChange(undefined)}>إزالة</Btn>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); e.currentTarget.value = ''; }} />
    </div>
  );
}

// multi-image gallery picker → returns Base64[] (for project extra images, capped)
function ImageGalleryPicker({ value, onChange, max = 3 }: { value: string[]; onChange: (imgs: string[]) => void; max?: number }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const add = (files: FileList) => {
    const slots = max - value.length;
    const picked = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, slots);
    Promise.all(picked.map(f => new Promise<string>(res => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); })))
      .then(imgs => onChange([...value, ...imgs]));
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {value.map((img, i) => (
          <div key={i} style={{ position: 'relative', width: 70, height: 70 }}>
            <img src={img} alt="" style={{ width: 70, height: 70, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 99, background: '#dc2626', color: '#fff', border: '2px solid var(--surface)', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
        {value.length < max && (
          <div onClick={() => inputRef.current?.click()} style={{ width: 70, height: 70, borderRadius: 10, background: 'var(--surface-3)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <span style={{ fontSize: 22, color: 'var(--text-3)' }}>＋</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{value.length}/{max} صور</div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files) add(e.target.files); e.currentTarget.value = ''; }} />
    </div>
  );
}

// read-only attachments display (in view sheets)
// infer a file-type icon from extension / fileType
function fileIcon(a: Attachment): string {
  const n = (a.fileType || a.name || '').toLowerCase();
  if (a.kind === 'image' || /\.(png|jpg|jpeg|gif|webp)$/.test(n) || n.includes('image')) return '🖼️';
  if (/\.pdf$/.test(n) || n.includes('pdf')) return '📕';
  if (/\.(xlsx|xls|csv)$/.test(n) || n.includes('sheet') || n.includes('excel')) return '📊';
  if (/\.(docx?|txt)$/.test(n) || n.includes('word')) return '📄';
  return '📎';
}
function AttachmentView({ items }: { items?: Attachment[] }) {
  const [idx, setIdx] = useState<number | null>(null); // index of item open in large preview
  if (!items || items.length === 0) return null;
  const download = (a: Attachment) => {
    if (a.preview) {
      const link = document.createElement('a');
      link.href = a.preview; link.download = a.name;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } else {
      alert(`سيتم تنزيل «${a.name}» عند ربط التخزين السحابي (Backend).`);
    }
  };
  const open = idx !== null ? items[idx] : null;
  const go = (dir: number) => { if (idx === null) return; setIdx((idx + dir + items.length) % items.length); };

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((a, i) => (
          <div key={a.id} style={{ width: 76 }}>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setIdx(i)}
                style={{ width: 76, height: 76, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', cursor: 'pointer' }}>
                {a.kind === 'image' && a.preview
                  ? <img src={a.preview} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26 }}>{fileIcon(a)}</span>}
              </div>
              <button onClick={(e) => { e.stopPropagation(); download(a); }} title="تنزيل" style={{ position: 'absolute', bottom: 3, left: 3, width: 22, height: 22, borderRadius: 7, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬇</button>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', textAlign: 'center', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
          </div>
        ))}
      </div>

      {/* large preview popup with left/right navigation */}
      {open && (
        <div onClick={() => setIdx(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'mzFade .2s ease', padding: 20 }}>
          {/* close */}
          <button onClick={(e) => { e.stopPropagation(); setIdx(null); }} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 99, width: 40, height: 40, cursor: 'pointer', fontSize: 18 }}>✕</button>
          {/* counter */}
          <div style={{ position: 'absolute', top: 22, color: '#fff', fontSize: 13, opacity: .85 }}>{idx! + 1} / {items.length}</div>

          {/* nav arrows (only if >1) */}
          {items.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 99, width: 48, height: 48, cursor: 'pointer', fontSize: 24 }}>›</button>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', color: '#fff', border: 'none', borderRadius: 99, width: 48, height: 48, cursor: 'pointer', fontSize: 24 }}>‹</button>
            </>
          )}

          {/* content */}
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '92%', maxHeight: '78%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {open.kind === 'image' && open.preview
              ? <img src={open.preview} alt={open.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }} />
              : (
                <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '40px 32px', textAlign: 'center', minWidth: 240 }}>
                  <div style={{ fontSize: 60, marginBottom: 12 }}>{fileIcon(open)}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{open.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>معاينة هذا النوع تتوفّر عند ربط التخزين السحابي</div>
                  <Btn size="sm" style={{ marginTop: 16 }} onClick={() => download(open)}>⬇ تنزيل الملف</Btn>
                </div>
              )}
          </div>

          {/* meta bar: name + size + date */}
          <div onClick={e => e.stopPropagation()} style={{ marginTop: 18, background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '10px 18px', color: '#fff', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '92%' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{fileIcon(open)} {open.name}</span>
            <span style={{ fontSize: 12, opacity: .8 }}>📦 {open.size}</span>
            {open.uploadDate && <span style={{ fontSize: 12, opacity: .8 }}>📅 {open.uploadDate}</span>}
            <button onClick={() => download(open)} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ تنزيل</button>
          </div>
        </div>
      )}
    </div>
  );
}
// compact attachment indicator for list rows: first attachment thumbnail/icon + total count.
// clicking opens the full AttachmentView gallery (via a small popup).
function AttachmentThumb({ items }: { items?: Attachment[] }) {
  const [openGallery, setOpenGallery] = useState(false);
  if (!items || items.length === 0) return null;
  const first = items[0];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <button onClick={(e) => { e.stopPropagation(); setOpenGallery(true); }} title={`${items.length} مرفقات`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 8px 3px 4px', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ width: 24, height: 24, borderRadius: 6, overflow: 'hidden', background: 'var(--surface)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {first.kind === 'image' && first.preview
            ? <img src={first.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13 }}>{fileIcon(first)}</span>}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{items.length} {items.length === 1 ? 'مرفق' : 'مرفقات'}</span>
      </button>
      {openGallery && (
        <div onClick={(e) => { e.stopPropagation(); setOpenGallery(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'mzFade .2s ease', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, padding: 20, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>المرفقات ({items.length})</span>
              <button onClick={() => setOpenGallery(false)} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', fontSize: 15, color: 'var(--text-3)' }}>✕</button>
            </div>
            <AttachmentView items={items} />
          </div>
        </div>
      )}
    </span>
  );
}
// donut chart from segments (uses conic-gradient)
function Donut({ segments, size = 120, label }: { segments: { value: number; color: string; label: string }[]; size?: number; label?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments.map(seg => {
    const start = (acc / total) * 360; acc += seg.value;
    const end = (acc / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(', ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <div style={{ width: size, height: size, borderRadius: '50%', background: total === 1 && segments.every(s => s.value === 0) ? 'var(--surface-3)' : `conic-gradient(${stops})` }} />
        <div style={{ position: 'absolute', inset: '22%', borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{total === 1 && segments.every(s => s.value === 0) ? 0 : total}</div>
          {label && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{label}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 120 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-2)', flex: 1 }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// horizontal labeled bars
function StatBars({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bars.map(b => (
        <div key={b.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-2)' }}>{b.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{b.value}</span>
          </div>
          <div style={{ height: 10, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(b.value / max) * 100}%`, background: b.color, borderRadius: 99, transition: 'width .4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// small stat number cards row
function StatCards({ cards, prefs, extras }: { cards: { label: string; value: string | number; color: string; bg: string; icon?: string }[]; prefs?: UserPrefs; extras?: { key: string; node: React.ReactNode }[] }) {
  const isMobile = useIsMobile();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // prefer passed prefs; otherwise read the shared prefs from storage so the setting works everywhere
  const storedPrefs = (() => {
    if (prefs) return prefs;
    try { const raw = dataLayer.read('mz_prefs'); return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } as UserPrefs : DEFAULT_PREFS; } catch { return DEFAULT_PREFS; }
  })();
  const autoScroll = storedPrefs.statsAutoScroll ?? false;
  const seconds = storedPrefs.statsScrollSeconds ?? 4;
  const layout = storedPrefs.statsLayout ?? 'horizontal';
  const horizontal = layout === 'horizontal';
  const extrasList = extras ?? [];

  // measure actual card offsets (accurate, RTL-safe) instead of estimating from scrollWidth
  const scrollToIndex = (i: number, smooth = true) => {
    const el = trackRef.current;
    if (!el || !el.children[i]) return;
    const child = el.children[i] as HTMLElement;
    el.scrollTo({ left: child.offsetLeft - (el.offsetWidth - child.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  // detect the centered card from real positions
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.offsetWidth / 2;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const c = el.children[i] as HTMLElement;
      const cc = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(cc - center);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setActive(best);
  };

  // auto-scroll loop (horizontal + enabled)
  const slideCount = cards.length + (extras?.length ?? 0);
  useEffect(() => {
    if (!horizontal || !autoScroll || slideCount <= 1) return;
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % slideCount;
      scrollToIndex(idx);
    }, Math.max(2, seconds) * 1000);
    return () => clearInterval(timer);
  }, [horizontal, autoScroll, seconds, slideCount]);

  // VERTICAL layout: responsive grid (original)
  if (!horizontal) {
    return (
      <div className="mz-statgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12, marginBottom: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: 14 }}>
            {c.icon && <div style={{ fontSize: 16, marginBottom: 3 }}>{c.icon}</div>}
            <div style={{ fontSize: 19, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>
    );
  }

  // HORIZONTAL layout: carousel with snap + pagination dots (mobile = peek next card, desktop = wider cards)
  const cardBasis = isMobile ? '0 0 78%' : '0 0 220px';
  const chartBasis = isMobile ? '0 0 88%' : '0 0 320px';
  const totalSlides = cards.length + extrasList.length;
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="mz-hide-scroll"
        style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', alignItems: 'stretch' }}
      >
        {cards.map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: 16, scrollSnapAlign: 'center', flex: cardBasis, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {c.icon && <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>}
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
        {extrasList.map(ex => (
          <div key={ex.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, scrollSnapAlign: 'center', flex: chartBasis, minWidth: 0 }}>
            {ex.node}
          </div>
        ))}
      </div>
      {totalSlides > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              style={{ width: active === i ? 20 : 7, height: 7, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, background: active === i ? '#2563eb' : 'var(--border)', transition: 'all .25s ease' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// reusable unified filter bar: search + dropdown selects + clear
type FilterDef = { key: string; placeholder: string; options: { v: string; l: string }[] };
function FilterBar({ search, onSearch, filters, values, onChange, onClear, searchPlaceholder = '🔍 بحث...' }: {
  search: string; onSearch: (v: string) => void;
  filters: FilterDef[]; values: Record<string, string>; onChange: (key: string, v: string) => void;
  onClear: () => void; searchPlaceholder?: string;
}) {
  const sel: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' };
  const active = search !== '' || filters.some(f => values[f.key] && values[f.key] !== 'all');
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <input value={search} onChange={e => onSearch(e.target.value)} placeholder={searchPlaceholder} style={{ ...sel, flex: 1, minWidth: 150 }} />
        {filters.map(f => (
          <select key={f.key} value={values[f.key] ?? 'all'} onChange={e => onChange(f.key, e.target.value)} style={sel}>
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        {active && <button onClick={onClear} style={{ ...sel, color: 'var(--text-3)' }}>مسح الفلترة</button>}
      </div>
    </Card>
  );
}
// ═══════════════════════════════════════════
//  SIDEBAR
// ═══════════════════════════════════════════
const NAV = [
  { id: 'overview',      icon: '⬢',  label: 'النظرة الشاملة' },
  { id: 'tasks',         icon: '✓',  label: 'الإجراءات المطلوبة' },
  { id: 'dashboard',     icon: '◉',  label: 'لوحة المشروع' },
  { id: 'projects',      icon: '⬡',  label: 'المشاريع' },
  { id: 'finance',       icon: '◈',  label: 'الإدارة المالية' },
  { id: 'ledger',        icon: '⛃',  label: 'السجل المالي' },
  { id: 'reports',       icon: '◳',  label: 'التقارير والتحليلات' },
  { id: 'receivables',   icon: '⇄',  label: 'الذمم' },
  { id: 'commitments',   icon: '↻',  label: 'الالتزامات الدورية' },
  { id: 'documents',     icon: '◻',  label: 'المستندات' },
  { id: 'trackings',     icon: '◷',  label: 'المتابعات والضمانات' },
  { id: 'assets',        icon: '⬚',  label: 'الأصول' },
  { id: 'requests',      icon: '◫',  label: 'الطلبات والموافقات' },
  { id: 'surveys',       icon: '◰',  label: 'الاستبيانات' },
  { id: 'notifications', icon: '◌',  label: 'الإشعارات' },
  { id: 'audit',         icon: '⊟',  label: 'سجل العمليات' },
  { id: 'customize',     icon: '⚙',  label: 'التخصيص' },
  { id: 'settings',      icon: '◎',  label: 'الإعدادات' },
];

function Sidebar({ page, onNav, projects, projectId, onProject, unread, isMobile, open, onClose, theme, onToggleTheme, projectsOpen, onToggleProjects }: {
  page: Page; onNav: (p: Page) => void; projects: Project[];
  projectId: string; onProject: (id: string) => void; unread: number;
  isMobile: boolean; open: boolean; onClose: () => void;
  theme: 'light' | 'dark'; onToggleTheme: () => void;
  projectsOpen: boolean; onToggleProjects: () => void;
}) {
  // on mobile, sidebar is an overlay drawer; hidden unless open
  if (isMobile && !open) return null;

  const aside = (
    <aside style={{
      width: 240, background: 'var(--sidebar)', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0,
      ...(isMobile ? { position: 'fixed', top: 0, right: 0, zIndex: 1100, animation: 'mzSlideRight .25s ease' } : {}),
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--sidebar-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: 'serif' }}>م</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>موازين</div>
            <div style={{ color: 'var(--text-3)', fontSize: 11 }}>المنصة المالية الذكية</div>
          </div>
        </div>
        {isMobile && <button onClick={onClose} style={{ background: 'var(--sidebar-2)', border: 'none', color: 'var(--text-3)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16 }}>✕</button>}
      </div>

      {/* Project switcher — accordion */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--sidebar-2)' }}>
        <button onClick={onToggleProjects} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px',
          borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#9ca3af', fontSize: 15 }}>⬡</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>المشاريع</span>
            <span style={{ color: 'var(--text-3)', fontSize: 11, background: 'var(--sidebar-2)', borderRadius: 99, padding: '0 7px', fontWeight: 600 }}>{projects.length}</span>
          </span>
          <span style={{ color: '#6b7280', fontSize: 11, transform: projectsOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .2s ease' }}>▼</span>
        </button>
        {projectsOpen && (
          <div style={{ marginTop: 4, animation: 'mzFade .2s ease' }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => { onProject(p.id); if (isMobile) onClose(); }} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'right', transition: 'background .15s',
                background: projectId === p.id ? '#1e2230' : 'transparent', marginBottom: 2,
              }}>
                <ProjectAvatar project={p} size={26} />
                <span style={{ color: projectId === p.id ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', flex: 1, textAlign: 'right' }}>{p.name}</span>
                {projectId === p.id && <span style={{ width: 6, height: 6, borderRadius: 99, background: '#3b82f6', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = page === item.id;
          const hasNotif = item.id === 'notifications' && unread > 0;
          return (
            <button key={item.id} onClick={() => { onNav(item.id as Page); if (isMobile) onClose(); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'right', marginBottom: 2,
              background: active ? '#2563eb' : 'transparent', transition: 'background .15s', fontFamily: 'inherit',
            }}>
              <span style={{ color: active ? '#fff' : '#6b7280', fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ color: active ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'right' }}>{item.label}</span>
              {hasNotif && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: 11, width: 18, height: 18, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--sidebar-2)' }}>
        <button onClick={onToggleTheme} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '9px 12px',
          borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--sidebar-2)', marginBottom: 12, fontFamily: 'inherit',
        }}>
          <span style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500 }}>{theme === 'dark' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري'}</span>
          <span style={{ width: 40, height: 22, borderRadius: 99, background: theme === 'dark' ? '#2563eb' : '#cbd5e1', position: 'relative', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 2, [theme === 'dark' ? 'left' : 'right']: 2, width: 18, height: 18, borderRadius: 99, background: '#fff' } as React.CSSProperties} />
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>م</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>محمد العمري</div>
            <div style={{ color: 'var(--text-3)', fontSize: 11 }}>مالك المشروع</div>
          </div>
        </div>
      </div>
    </aside>
  );

  // desktop: plain sidebar. mobile: drawer + dimmed backdrop
  if (!isMobile) return aside;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.5)', zIndex: 1099, animation: 'mzFade .2s ease' }} />
      {aside}
    </>
  );
}
// ═══════════════════════════════════════════
//  FLOATING ACTION CENTER (animated, sticky)
// ═══════════════════════════════════════════
function ActionCenter({ unread, onAction, onNav }: {
  unread: number;
  onAction: (a: 'tx' | 'doc' | 'tracking' | 'request' | 'project') => void;
  onNav: (p: Page) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { id: 'tx' as const,       icon: '💸', label: 'عملية مالية', bg: '#2563eb' },
    { id: 'doc' as const,      icon: '📄', label: 'رفع مستند',   bg: '#7c3aed' },
    { id: 'tracking' as const, icon: '🛡️', label: 'متابعة',       bg: '#0891b2' },
    { id: 'request' as const,  icon: '📝', label: 'طلب جديد',    bg: '#d97706' },
    { id: 'project' as const,  icon: '⬡',  label: 'مشروع',        bg: '#059669' },
  ];

  return (
    <>
      {/* backdrop when open */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.35)', zIndex: 900, animation: 'mzFade .2s ease' }} />
      )}

      <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 901, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        {/* action items */}
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            {actions.map((a, i) => (
              <button key={a.id} onClick={() => { setOpen(false); onAction(a.id); }} style={{
                display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer',
                background: 'var(--surface)', borderRadius: 99, padding: '8px 16px 8px 8px', boxShadow: '0 4px 18px rgba(0,0,0,.16)',
                fontFamily: 'inherit', animation: `mzPop .28s cubic-bezier(.16,1,.3,1) ${i * 0.04}s both`,
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 99, background: a.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{a.label}</span>
              </button>
            ))}
            {/* quick notifications shortcut */}
            <button onClick={() => { setOpen(false); onNav('notifications'); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer',
              background: 'var(--surface)', borderRadius: 99, padding: '8px 16px 8px 8px', boxShadow: '0 4px 18px rgba(0,0,0,.16)',
              fontFamily: 'inherit', animation: `mzPop .28s cubic-bezier(.16,1,.3,1) ${actions.length * 0.04}s both`,
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 99, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔔</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>الإشعارات{unread > 0 ? ` (${unread})` : ''}</span>
            </button>
          </div>
        )}

        {/* main FAB */}
        <button onClick={() => setOpen(o => !o)} style={{
          width: 60, height: 60, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative',
          background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)', color: '#fff', fontSize: 26,
          boxShadow: '0 6px 22px rgba(37,99,235,.45)', transition: 'transform .25s cubic-bezier(.16,1,.3,1)',
          transform: open ? 'rotate(135deg) scale(1.05)' : 'rotate(0) scale(1)',
          animation: open ? 'none' : 'mzPulse 2.4s ease-in-out infinite',
        }}>
          +
          {!open && unread > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2, minWidth: 22, height: 22, padding: '0 5px',
              borderRadius: 99, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
            }}>{unread}</span>
          )}
        </button>
      </div>
    </>
  );
}
// ═══════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//  TASKS (الإجراءات المطلوبة — To-Do مركزية)
// ═══════════════════════════════════════════
function Tasks({ projects, requests, receivables, commitments, trackings, memberTxns, members, onDecideRequest, onPayReceivable, onPayCommitment, onDecideMemberTxn, onNav }: {
  projects: Project[]; requests: RequestItem[]; receivables: Receivable[]; commitments: Commitment[];
  trackings: Tracking[]; memberTxns: MemberTxn[]; members: Member[];
  onDecideRequest: (id: string, status: RequestStatus) => void;
  onPayReceivable: (id: string, amount: number, note: string) => void;
  onPayCommitment: (id: string) => void;
  onDecideMemberTxn: (id: string, status: MemberTxnStatus) => void;
  onNav: (p: Page) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'requests' | 'memberTxns' | 'receivables' | 'commitments' | 'trackings'>('all');
  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const memberName = (id?: string) => members.find(m => m.id === id)?.name ?? '';

  const pendingReqs = requests.filter(r => r.status === 'pending');
  const pendingMTxns = memberTxns.filter(m => m.status === 'pending');
  const dueRecv = receivables.filter(r => r.status !== 'settled' && r.dueDate && r.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const dueComms = commitments.filter(c => c.active && !commitmentDone(c) && c.nextDue <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const urgentTracks = trackings.filter(t => t.status === 'expiring' || t.status === 'expired');

  const totalCount = pendingReqs.length + pendingMTxns.length + dueRecv.length + dueComms.length + urgentTracks.length;

  const show = (key: typeof filter) => filter === 'all' || filter === key;
  const sectionVisible = {
    requests: show('requests') && pendingReqs.length > 0,
    memberTxns: show('memberTxns') && pendingMTxns.length > 0,
    receivables: show('receivables') && dueRecv.length > 0,
    commitments: show('commitments') && dueComms.length > 0,
    trackings: show('trackings') && urgentTracks.length > 0,
  };
  const anyVisible = Object.values(sectionVisible).some(Boolean);

  const filterTabs: [typeof filter, string, number][] = [
    ['all', 'الكل', totalCount],
    ['requests', 'طلبات', pendingReqs.length],
    ['memberTxns', 'عهد', pendingMTxns.length],
    ['receivables', 'ذمم', dueRecv.length],
    ['commitments', 'التزامات', dueComms.length],
    ['trackings', 'متابعات', urgentTracks.length],
  ];

  const sectionHead = (icon: string, title: string, count: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</span>
      <span style={{ fontSize: 11, background: color, color: '#fff', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>{count}</span>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader title="الإجراءات المطلوبة" subtitle={totalCount > 0 ? `${totalCount} بند ينتظر تصرّفك عبر كل المشاريع` : 'كل شيء منجز'} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filterTabs.map(([v, l, n]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 500,
            border: filter === v ? '1px solid #2563eb' : '1px solid var(--border)',
            background: filter === v ? 'var(--info-bg)' : 'var(--surface)', color: filter === v ? '#1d4ed8' : 'var(--text-2)',
          }}>
            {l}{n > 0 && <span style={{ fontSize: 10.5, background: filter === v ? '#2563eb' : 'var(--surface-3)', color: filter === v ? '#fff' : 'var(--text-3)', borderRadius: 99, padding: '0 6px', fontWeight: 700 }}>{n}</span>}
          </button>
        ))}
      </div>

      {(totalCount === 0 || !anyVisible) && (
        <Card style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-2)', marginBottom: 4 }}>{totalCount === 0 ? 'لا توجد إجراءات مطلوبة' : 'لا بنود في هذا التصنيف'}</div>
          <div style={{ fontSize: 13 }}>{totalCount === 0 ? 'أنت على اطّلاع بكل شيء. سيظهر هنا كل ما يحتاج قراراً أو تنفيذاً.' : 'جرّب تصنيفاً آخر أو اعرض الكل.'}</div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sectionVisible.requests && (
          <div>
            {sectionHead('◫', 'طلبات تنتظر قرارك', pendingReqs.length, '#a16207')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingReqs.map(r => (
                <Card key={r.id} style={{ padding: 14, borderRight: '3px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{r.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{projName(r.projectId)} · {r.requestedBy} · {r.type}{r.amount ? ` · ${fmt(r.amount)}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => onDecideRequest(r.id, 'approved')} style={actBtn('#15803d')}>✓ اعتماد</button>
                      <button onClick={() => onDecideRequest(r.id, 'rejected')} style={actBtn('#b91c1c', true)}>✕ رفض</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sectionVisible.memberTxns && (
          <div>
            {sectionHead('👤', 'حركات عهد تنتظر القبول', pendingMTxns.length, '#7c3aed')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingMTxns.map(mt => {
                const ti = MEMBER_TXN_TYPES.find(x => x.id === mt.type);
                return (
                  <Card key={mt.id} style={{ padding: 14, borderRight: '3px solid #7c3aed' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{ti?.icon} {ti?.label} · {fmt(mt.amount)}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{memberName(mt.memberId)} · {projName(mt.projectId)}{mt.note ? ` · ${mt.note}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onDecideMemberTxn(mt.id, 'accepted')} style={actBtn('#15803d')}>✓ قبول</button>
                        <button onClick={() => onDecideMemberTxn(mt.id, 'rejected')} style={actBtn('#b91c1c', true)}>✕ رفض</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {sectionVisible.receivables && (
          <div>
            {sectionHead('⇄', 'ذمم مستحقة', dueRecv.length, '#0891b2')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dueRecv.map(r => {
                const isRecv = r.kind === 'receivable';
                const overdue = r.dueDate && r.dueDate < today();
                return (
                  <Card key={r.id} style={{ padding: 14, borderRight: `3px solid ${isRecv ? '#15803d' : '#b91c1c'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                          {isRecv ? 'تحصيل من' : 'سداد إلى'} {r.party}
                          {overdue && <span style={{ fontSize: 10, background: 'var(--danger-bg-2)', color: 'var(--danger-text)', borderRadius: 99, padding: '1px 7px', marginRight: 6 }}>متأخر</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{projName(r.projectId)} · متبقٍ {fmt(recvRemaining(r))}{r.dueDate ? ` · يستحق ${r.dueDate}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onPayReceivable(r.id, recvRemaining(r), 'تسوية كاملة من الإجراءات المطلوبة')} style={actBtn(isRecv ? '#15803d' : '#b91c1c')}>{isRecv ? '↓ تحصيل كامل' : '↑ سداد كامل'}</button>
                        <button onClick={() => onNav('receivables')} style={actBtn('#64748b', true)}>تفاصيل</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {sectionVisible.commitments && (
          <div>
            {sectionHead('↻', 'التزامات تستحق', dueComms.length, '#1d4ed8')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dueComms.map(c => {
                const isOut = c.direction === 'out';
                const overdue = c.nextDue < today();
                return (
                  <Card key={c.id} style={{ padding: 14, borderRight: `3px solid ${isOut ? '#f87171' : '#22c55e'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                          {c.name}
                          {overdue && <span style={{ fontSize: 10, background: 'var(--danger-bg-2)', color: 'var(--danger-text)', borderRadius: 99, padding: '1px 7px', marginRight: 6 }}>متأخر</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{projName(c.projectId)} · {fmt(c.amount)} · يستحق {c.nextDue}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onPayCommitment(c.id)} style={actBtn(isOut ? '#b91c1c' : '#15803d')}>{isOut ? '↑ تسجيل دفعة' : '↓ تسجيل استلام'}</button>
                        <button onClick={() => onNav('commitments')} style={actBtn('#64748b', true)}>تفاصيل</button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {sectionVisible.trackings && (
          <div>
            {sectionHead('⏰', 'متابعات تحتاج تجديد', urgentTracks.length, '#c2410c')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {urgentTracks.map(t => (
                <Card key={t.id} style={{ padding: 14, borderRight: `3px solid ${t.status === 'expired' ? '#b91c1c' : '#f59e0b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                        {t.icon} {t.name}
                        <span style={{ fontSize: 10, background: t.status === 'expired' ? 'var(--danger-bg-2)' : 'var(--warn-bg-2)', color: t.status === 'expired' ? '#b91c1c' : '#a16207', borderRadius: 99, padding: '1px 7px', marginRight: 6 }}>{t.status === 'expired' ? 'منتهٍ' : 'يوشك'}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>{projName(t.projectId)} · {t.type} · ينتهي {t.expiryDate}</div>
                    </div>
                    <button onClick={() => onNav('trackings')} style={actBtn('#c2410c')}>عرض / تجديد</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function actBtn(color: string, outline = false): React.CSSProperties {
  return {
    background: outline ? 'transparent' : color, color: outline ? color : '#fff',
    border: outline ? `1px solid ${color}40` : 'none', borderRadius: 8, padding: '7px 14px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}

// ═══════════════════════════════════════════
//  OVERVIEW (النظرة الشاملة — كل المشاريع للمشترك)
// ═══════════════════════════════════════════
function Overview({ projects, transactions, trackings, requests, receivables, commitments, onNav, onProject }: {
  projects: Project[]; transactions: Transaction[]; trackings: Tracking[]; requests: RequestItem[];
  receivables: Receivable[]; commitments: Commitment[];
  onNav: (p: Page) => void; onProject: (id: string) => void;
}) {
  const palette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];
  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';

  // totals across all projects
  const totalBalance = projects.reduce((s, p) => s + computeBalance(p, transactions), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const recvOpen = receivables.filter(r => r.kind === 'receivable' && r.status !== 'settled').reduce((s, r) => s + recvRemaining(r), 0);
  const payOpen = receivables.filter(r => r.kind === 'payable' && r.status !== 'settled').reduce((s, r) => s + recvRemaining(r), 0);

  // alerts across all projects
  const urgentTrackings = trackings.filter(t => t.status === 'expiring' || t.status === 'expired');
  const pendingReqs = requests.filter(r => r.status === 'pending');
  const overdueRecv = receivables.filter(r => r.status !== 'settled' && r.dueDate && r.dueDate < today());
  const dueCommitments = commitments.filter(c => c.active && !commitmentDone(c) && c.nextDue <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  // balance distribution donut
  const balanceSegments = projects
    .map((p, i) => ({ value: Math.max(0, Math.round(computeBalance(p, transactions))), color: palette[i % palette.length], label: p.name }))
    .filter(s => s.value > 0);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader title="النظرة الشاملة" subtitle={`${projects.length} مشروع · رؤية موحّدة لكل أعمالك`} />

      {/* top totals */}
      <StatCards cards={[
        { label: 'إجمالي الأرصدة', value: fmtNum(Math.round(totalBalance)), color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '💰' },
        { label: 'إجمالي الإيرادات', value: fmtNum(Math.round(totalIncome)), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '↓' },
        { label: 'إجمالي المصروفات', value: fmtNum(Math.round(totalExpense)), color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '↑' },
        { label: 'صافي الذمم', value: fmtNum(Math.round(recvOpen - payOpen)), color: recvOpen - payOpen >= 0 ? '#7c3aed' : '#b91c1c', bg: 'var(--purple-bg)', icon: '⇄' },
      ]} />

      {/* action alerts strip */}
      {(pendingReqs.length > 0 || urgentTrackings.length > 0 || overdueRecv.length > 0 || dueCommitments.length > 0) && (
        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>⚡ يحتاج انتباهك</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {pendingReqs.length > 0 && (
              <button onClick={() => onNav('requests')} style={alertBtnStyle('var(--warn-bg)', '#a16207')}>
                <span style={{ fontSize: 20 }}>◫</span><div><div style={{ fontWeight: 700, fontSize: 16 }}>{pendingReqs.length}</div><div style={{ fontSize: 11 }}>طلب معلّق</div></div>
              </button>
            )}
            {overdueRecv.length > 0 && (
              <button onClick={() => onNav('receivables')} style={alertBtnStyle('var(--danger-bg)', '#b91c1c')}>
                <span style={{ fontSize: 20 }}>⇄</span><div><div style={{ fontWeight: 700, fontSize: 16 }}>{overdueRecv.length}</div><div style={{ fontSize: 11 }}>ذمة متأخرة</div></div>
              </button>
            )}
            {dueCommitments.length > 0 && (
              <button onClick={() => onNav('commitments')} style={alertBtnStyle('var(--info-bg)', '#1d4ed8')}>
                <span style={{ fontSize: 20 }}>↻</span><div><div style={{ fontWeight: 700, fontSize: 16 }}>{dueCommitments.length}</div><div style={{ fontSize: 11 }}>التزام يستحق</div></div>
              </button>
            )}
            {urgentTrackings.length > 0 && (
              <button onClick={() => onNav('trackings')} style={alertBtnStyle('var(--warn-bg)', '#c2410c')}>
                <span style={{ fontSize: 20 }}>⏰</span><div><div style={{ fontWeight: 700, fontSize: 16 }}>{urgentTrackings.length}</div><div style={{ fontSize: 11 }}>متابعة عاجلة</div></div>
              </button>
            )}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* balance distribution */}
        {balanceSegments.length > 0 && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>توزيع الأرصدة على المشاريع</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Donut segments={balanceSegments} size={130} label="الرصيد" />
              <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {balanceSegments.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />{s.label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>{fmtNum(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* receivables snapshot */}
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>الذمم على مستوى المنشأة</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--ok-bg)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ok-text)' }}>مستحقّ لنا (مدينة)</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ok-text)' }}>{fmt(recvOpen)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--danger-bg)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--danger-text)' }}>مستحقّ علينا (دائنة)</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--danger-text)' }}>{fmt(payOpen)}</span>
            </div>
            <button onClick={() => onNav('receivables')} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit' }}>عرض كل الذمم ←</button>
          </div>
        </Card>
      </div>

      {/* projects grid */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>مشاريعك</div>
        <button onClick={() => onNav('projects')} style={{ background: 'none', border: 'none', fontSize: 12.5, color: 'var(--info-text)', cursor: 'pointer', fontFamily: 'inherit' }}>إدارة المشاريع ←</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {projects.map(p => {
          const bal = computeBalance(p, transactions);
          const ptxns = transactions.filter(t => t.projectId === p.id);
          const pinc = ptxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const pexp = ptxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const palerts = trackings.filter(t => t.projectId === p.id && t.status !== 'active').length
            + requests.filter(r => r.projectId === p.id && r.status === 'pending').length;
          return (
            <button key={p.id} onClick={() => onProject(p.id)} style={{
              textAlign: 'right', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
              padding: 16, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', gap: 10,
              borderTop: `3px solid ${p.color}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ProjectAvatar project={p} size={40} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.name}</span>
                </span>
                {palerts > 0 && <span style={{ fontSize: 10.5, background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 99, padding: '2px 8px', fontWeight: 600 }}>{palerts} تنبيه</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.type}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>الرصيد</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: bal >= 0 ? 'var(--text)' : '#b91c1c' }}>{fmtNum(Math.round(bal))}</div>
                </div>
                <div style={{ textAlign: 'left', fontSize: 11 }}>
                  <div style={{ color: 'var(--ok-text)' }}>↓ {fmtNum(Math.round(pinc))}</div>
                  <div style={{ color: 'var(--danger-text)' }}>↑ {fmtNum(Math.round(pexp))}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function alertBtnStyle(bg: string, color: string): React.CSSProperties {
  return { display: 'flex', alignItems: 'center', gap: 10, background: bg, color, border: 'none', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' };
}

function Dashboard({ projectId, onNav, projects, transactions, trackings, requests, onDecide, prefs, helpEntry }: {
  projectId: string; onNav: (p: Page) => void;
  projects: Project[]; transactions: Transaction[]; trackings: Tracking[];
  requests: RequestItem[]; onDecide: (id: string, status: RequestStatus) => void; prefs: UserPrefs; helpEntry?: HelpEntry;
}) {
  const project = projects.find(p => p.id === projectId)!;
  const [period, setPeriod] = useState(prefs.defaultPeriod ?? '1m');
  const PERIODS: { v: string; l: string; days: number }[] = [
    { v: '1d', l: 'آخر يوم', days: 1 },
    { v: '1w', l: 'آخر أسبوع', days: 7 },
    { v: '1m', l: 'آخر شهر', days: 31 },
    { v: '6m', l: 'آخر 6 أشهر', days: 183 },
    { v: '9m', l: 'آخر 9 أشهر', days: 274 },
    { v: '12m', l: 'آخر 12 شهر', days: 366 },
    { v: '18m', l: 'آخر 18 شهر', days: 548 },
    { v: '24m', l: 'آخر 24 شهر', days: 731 },
  ];
  const periodDays = PERIODS.find(p => p.v === period)?.days ?? 31;
  const periodLabel = PERIODS.find(p => p.v === period)?.l ?? '';
  const NOW = new Date('2025-06-26T23:59');
  const inPeriod = (date: string) => {
    const d = new Date(date); const diff = (NOW.getTime() - d.getTime()) / 86400000;
    return diff >= 0 && diff <= periodDays;
  };
  const allTxns = transactions.filter(t => t.projectId === projectId);
  const txns = allTxns.filter(t => inPeriod(t.date));
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const urgentTrackings = trackings.filter(t => t.projectId === projectId && (t.status === 'expiring' || t.status === 'expired'));
  const pendingReqs = requests.filter(r => r.projectId === projectId && r.status === 'pending');

  const stats = [
    { label: 'الرصيد الكلي', value: fmt(computeBalance(project, transactions)), icon: '💰', bg: 'var(--info-bg)', color: 'var(--info-text)' },
    { label: `إيرادات ${periodLabel}`, value: fmt(income), icon: '📈', bg: 'var(--ok-bg)', color: 'var(--ok-text)' },
    { label: `مصروفات ${periodLabel}`, value: fmt(expense), icon: '📉', bg: 'var(--danger-bg)', color: 'var(--danger-text)' },
    { label: `صافي ${periodLabel}`, value: fmt(income - expense), icon: '📊', bg: 'var(--purple-bg)', color: '#7e22ce' },
    { label: 'طلبات معلقة', value: String(pendingReqs.length), icon: '⏳', bg: 'var(--warn-bg)', color: 'var(--warn-text-2)' },
    { label: 'تنبيهات متابعات', value: String(urgentTrackings.length), icon: '⚠️', bg: 'var(--warn-bg)', color: 'var(--warn-text)' },
  ];

  // build monthly series from real transactions over the selected period
  const monthCount = Math.max(1, Math.min(12, Math.round(periodDays / 30)));
  const monthlyData = (() => {
    const arr: { month: string; income: number; expense: number }[] = [];
    const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(NOW.getFullYear(), NOW.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const mt = allTxns.filter(t => t.date.slice(0, 7) === key);
      arr.push({
        month: names[d.getMonth()],
        income: mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      });
    }
    return arr;
  })();
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <PageHeader help={helpEntry} title="لوحة التحكم" subtitle={`${project.name} — يونيو 2025`}
        action={
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)', fontWeight: 500 }}>
            {PERIODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{s.value}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 20, marginBottom: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>الإيرادات والمصروفات</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} />إيرادات</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#f87171', borderRadius: 2, display: 'inline-block' }} />مصروفات</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                  <div style={{ flex: 1, background: '#3b82f6', borderRadius: '3px 3px 0 0', height: `${(d.income / maxVal) * 100}%`, minHeight: 4 }} />
                  <div style={{ flex: 1, background: '#f87171', borderRadius: '3px 3px 0 0', height: `${(d.expense / maxVal) * 100}%`, minHeight: 4 }} />
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{d.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>تنبيهات عاجلة</div>
            <button onClick={() => onNav('trackings')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgentTrackings.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>✅ لا توجد تنبيهات عاجلة</div>}
            {urgentTrackings.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.status === 'expired' ? 'var(--danger-bg)' : 'var(--warn-bg)' }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: t.status === 'expired' ? '#b91c1c' : '#a16207', marginTop: 1 }}>
                    {t.status === 'expired' ? 'منتهي منذ ' + Math.abs(t.daysLeft) + ' أيام' : 'يتبقى ' + t.daysLeft + ' يوم'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>آخر العمليات</div>
            <button onClick={() => onNav('finance')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {txns.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد عمليات في هذا المشروع</div>}
            {txns.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: t.type === 'income' ? 'var(--ok-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  {t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.date}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.type === 'income' ? '#15803d' : t.type === 'expense' ? '#b91c1c' : '#1d4ed8', flexShrink: 0 }}>
                  {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-'}{fmtNum(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>طلبات تنتظر موافقتك</div>
            <button onClick={() => onNav('requests')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingReqs.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد طلبات تنتظر موافقتك</div>}
            {pendingReqs.map(r => (
              <div key={r.id} style={{ padding: '12px 14px', background: 'var(--warn-bg)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{r.title}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', flexShrink: 0 }}>{fmtNum(r.amount)}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>من: {r.requestedBy}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onDecide(r.id, 'approved')} style={{ flex: 1, padding: 6, borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✓ موافقة</button>
                  <button onClick={() => onDecide(r.id, 'rejected')} style={{ flex: 1, padding: 6, borderRadius: 8, background: 'var(--danger-bg-2)', color: 'var(--danger-text)', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════
//  PROJECTS  (create / view / edit)
// ═══════════════════════════════════════════
function ProjectForm({ initial, onSave, onCancel, projectTypes = DEFAULT_PROJECT_TYPES }: {
  initial?: Project; onSave: (p: Omit<Project, 'id'> & { id?: string }) => void; onCancel: () => void; projectTypes?: string[];
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? PROJECT_ICONS[0]);
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLORS[0]);
  const [balance, setBalance] = useState<number | ''>(initial?.balance ?? '');
  const [type, setType] = useState(initial?.type ?? projectTypes[0]);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const valid = name.trim().length > 0;

  return (
    <>
      <Field label="اسم المشروع">
        <TextInput value={name} onChange={setName} placeholder="مثال: شركة النخيل" />
      </Field>
      <Field label="نوع المشروع">
        <Select value={type} onChange={setType} options={projectTypes.map(t => ({ v: t, l: t }))} />
      </Field>
      <Field label="وصف المشروع (اختياري)">
        <TextArea value={description} onChange={setDescription} placeholder="نبذة قصيرة عن المشروع..." />
      </Field>
      <Field label="الصورة الرئيسية (تظهر بجانب اسم المشروع)">
        <ImagePicker value={image} onChange={setImage} shape="rounded" />
      </Field>
      <Field label="صور إضافية (حتى 3)">
        <ImageGalleryPicker value={gallery} onChange={setGallery} max={3} />
      </Field>
      <Field label="الأيقونة (احتياطية عند عدم وجود صورة)">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROJECT_ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)} style={{
              width: 44, height: 44, borderRadius: 10, fontSize: 20, cursor: 'pointer',
              border: `1.5px solid ${icon === ic ? '#2563eb' : 'var(--border)'}`, background: icon === ic ? 'var(--info-bg)' : 'var(--surface)',
            }}>{ic}</button>
          ))}
        </div>
      </Field>
      <Field label="اللون">
        <div style={{ display: 'flex', gap: 10 }}>
          {PROJECT_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 36, height: 36, borderRadius: 99, background: c, cursor: 'pointer',
              border: color === c ? '3px solid #111827' : '3px solid transparent',
            }} />
          ))}
        </div>
      </Field>
      <Field label="الرصيد الافتتاحي (ر.س)">
        <NumInput value={balance} onChange={setBalance} placeholder="0" />
      </Field>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({ id: initial?.id, name: name.trim(), icon, color, balance: balance === '' ? 0 : balance, type, description: description.trim(), image, gallery })}>
          {initial ? 'حفظ التعديلات' : 'إنشاء المشروع'}
        </Btn>
      </div>
    </>
  );
}

function Projects({ projects, transactions, onOpen, onSave, onDelete, openCreate, onCloseCreate, prefs, projectTypes = DEFAULT_PROJECT_TYPES, helpEntry }: {
  projects: Project[]; transactions: Transaction[];
  onOpen: (id: string) => void;
  onSave: (p: Omit<Project, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
  openCreate?: boolean; onCloseCreate?: () => void; prefs?: UserPrefs; projectTypes?: string[]; helpEntry?: HelpEntry;
}) {
  const [sheet, setSheet] = useState<null | { mode: 'create' } | { mode: 'edit' | 'view'; project: Project }>(null);
  const close = () => { setSheet(null); onCloseCreate?.(); };
  // open create sheet when triggered from the global FAB
  useEffect(() => { if (openCreate) setSheet({ mode: 'create' }); }, [openCreate]);

  // section statistics
  const totalBalance = projects.reduce((s, p) => s + computeBalance(p, transactions), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const palette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];
  const balanceSegments = projects.map((p, i) => ({ value: Math.max(0, Math.round(computeBalance(p, transactions))), color: palette[i % palette.length], label: p.name }));
  const netBars = projects.map((p, i) => {
    const txns = transactions.filter(t => t.projectId === p.id);
    const net = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) - txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label: p.name, value: Math.max(0, Math.round(net)), color: palette[i % palette.length] };
  });

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader help={helpEntry} title="المشاريع" action={<Btn size="sm" onClick={() => setSheet({ mode: 'create' })}>+ مشروع جديد</Btn>} />

      {/* section statistics */}
      {projects.length > 0 && (prefs?.showStats ?? true) && (
        <>
          <StatCards cards={[
            { label: 'عدد المشاريع', value: projects.length, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '⬡' },
            { label: 'إجمالي الأرصدة', value: fmtNum(totalBalance), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '∑' },
            { label: 'إجمالي الإيرادات', value: fmtNum(totalIncome), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '↓' },
            { label: 'إجمالي المصروفات', value: fmtNum(totalExpense), color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '↑' },
          ]} />
          {(prefs?.showCharts ?? true) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>توزيع الأرصدة على المشاريع</div>
                <Donut segments={balanceSegments} label="مشروع" />
              </Card>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>صافي كل مشروع</div>
                <StatBars bars={netBars} />
              </Card>
            </div>
          )}
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 18 }}>
        {projects.map(p => {
          const txns = transactions.filter(t => t.projectId === p.id);
          const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return (
            <Card key={p.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.type ?? 'مشروع نشط'}</div>
                </div>
                <button onClick={() => setSheet({ mode: 'view', project: p })} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: 'var(--text-3)' }}>⋯</button>
              </div>
              <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>الرصيد الحالي</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{fmt(computeBalance(p, transactions))}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: 'var(--ok-bg)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--ok-text)' }}>إيرادات</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok-text)' }}>{fmtNum(income)}</div>
                </div>
                <div style={{ background: 'var(--danger-bg)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--danger-text)' }}>مصروفات</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-text)' }}>{fmtNum(expense)}</div>
                </div>
              </div>
              <Btn variant="outline" size="sm" style={{ width: '100%' }} onClick={() => onOpen(p.id)}>عرض المشروع</Btn>
            </Card>
          );
        })}
        <div onClick={() => setSheet({ mode: 'create' })} style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 200, color: 'var(--text-3)' }}>
          <span style={{ fontSize: 32 }}>+</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>إضافة مشروع جديد</span>
        </div>
      </div>

      {/* Create / Edit */}
      <Sheet open={sheet?.mode === 'create' || sheet?.mode === 'edit'} onClose={close}
        title={sheet?.mode === 'edit' ? 'تعديل المشروع' : 'مشروع جديد'}>
        <ProjectForm
          key={sheet?.mode === 'edit' ? sheet.project.id : 'new'}
          initial={sheet?.mode === 'edit' ? sheet.project : undefined}
          projectTypes={projectTypes}
          onSave={(p) => { onSave(p); close(); }}
          onCancel={close}
        />
      </Sheet>

      {/* View */}
      <Sheet open={sheet?.mode === 'view'} onClose={close} title="تفاصيل المشروع"
        footer={sheet?.mode === 'view' ? (
          <>
            <Btn variant="danger" onClick={() => { onDelete(sheet.project.id); close(); }}>🗑️ حذف</Btn>
            <Btn variant="outline" style={{ flex: 1 }} onClick={() => setSheet({ mode: 'edit', project: sheet.project })}>✎ تعديل</Btn>
            <Btn style={{ flex: 1 }} onClick={() => { onOpen(sheet.project.id); close(); }}>فتح التفاصيل</Btn>
          </>
        ) : undefined}>
        {sheet?.mode === 'view' && (() => {
          const p = sheet.project;
          const txns = transactions.filter(t => t.projectId === p.id);
          const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: p.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{p.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>الرصيد: {fmt(computeBalance(p, transactions))}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['إيرادات', income, '#15803d'], ['مصروفات', expense, '#b91c1c'], ['عدد العمليات', txns.length, '#1d4ed8']].map(([l, v, c]) => (
                  <div key={l as string} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c as string }}>{typeof v === 'number' && (l === 'عدد العمليات') ? v : fmtNum(v as number)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  PROJECT DETAIL  (overview / members & permissions / cash flow)
// ═══════════════════════════════════════════
function MemberForm({ initial, projectId, onSave, onCancel }: {
  initial?: Member; projectId: string;
  onSave: (m: Omit<Member, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState<MemberRole>(initial?.role ?? 'member');
  const [perms, setPerms] = useState<string[]>(initial?.permissions ?? ROLE_PERMS.member);
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const valid = name.trim().length > 0 && email.trim().length > 0;

  // when role changes, reset to that role's default permissions
  const pickRole = (r: MemberRole) => { setRole(r); setPerms(ROLE_PERMS[r]); };
  const togglePerm = (id: string) => setPerms(ps => ps.includes(id) ? ps.filter(x => x !== id) : [...ps, id]);

  return (
    <>
      <Field label="صورة العضو (تظهر بجانب الاسم في كل مكان)">
        <ImagePicker value={image} onChange={setImage} shape="circle" />
      </Field>
      <Field label="اسم العضو">
        <TextInput value={name} onChange={setName} placeholder="مثال: أحمد العلي" />
      </Field>
      <Field label="البريد الإلكتروني">
        <TextInput type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
      </Field>
      <Field label="نوع التمكين (الدور)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLES.map(r => (
            <button key={r.id} onClick={() => pickRole(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${role === r.id ? r.color : 'var(--border)'}`, background: role === r.id ? r.color + '12' : '#fff',
              textAlign: 'right', fontFamily: 'inherit',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.desc}</div>
              </div>
              {role === r.id && <span style={{ color: r.color, fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
      </Field>
      <Field label="الصلاحيات التفصيلية">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PERMISSIONS.map(p => {
            const on = perms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePerm(p.id)} disabled={role === 'owner'} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 9,
                border: '1px solid var(--border)', background: on ? 'var(--info-bg)' : 'var(--surface)', cursor: role === 'owner' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: role === 'owner' ? 0.7 : 1,
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.label}</span>
                <span style={{
                  width: 36, height: 20, borderRadius: 99, background: on ? '#2563eb' : 'var(--border)', position: 'relative', transition: 'background .15s', flexShrink: 0,
                }}>
                  <span style={{ position: 'absolute', top: 2, [on ? 'left' : 'right']: 2, width: 16, height: 16, borderRadius: 99, background: 'var(--surface)' } as React.CSSProperties} />
                </span>
              </button>
            );
          })}
        </div>
        {role === 'owner' && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>المالك يملك جميع الصلاحيات تلقائياً.</div>}
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, projectId, name: name.trim(), email: email.trim(), role,
          permissions: role === 'owner' ? ROLE_PERMS.owner : perms, image,
        })}>{initial ? 'حفظ التعديلات' : 'إضافة العضو'}</Btn>
      </div>
    </>
  );
}

// member custody/settlement movement form
function MemberTxnForm({ projectId, members, onSave, onCancel }: {
  projectId: string; members: Member[];
  onSave: (t: Omit<MemberTxn, 'id'>) => void; onCancel: () => void;
}) {
  const projMembers = members.filter(m => m.projectId === projectId && m.role !== 'owner');
  const [memberId, setMemberId] = useState(projMembers[0]?.id ?? '');
  const [type, setType] = useState<MemberTxnType>('custody');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const typeInfo = MEMBER_TXN_TYPES.find(t => t.id === type)!;
  const valid = memberId && amount !== '' && Number(amount) > 0;

  return (
    <>
      <Field label="العضو">
        <Select value={memberId} onChange={setMemberId} options={projMembers.map(m => ({ v: m.id, l: `${m.name} (رصيد: ${fmtNum(m.balance ?? 0)})` }))} />
      </Field>
      <Field label="نوع الحركة">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MEMBER_TXN_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${type === t.id ? '#2563eb' : 'var(--border)'}`, background: type === t.id ? '#2563eb12' : 'var(--surface)',
              textAlign: 'right', fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.desc}</div>
              </div>
              <span style={{ fontSize: 11, color: t.direction === 'to_member' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                {t.direction === 'to_member' ? '+ للعضو' : '− من العضو'}
              </span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="المبلغ (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="سبب الحركة..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ background: 'var(--info-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--info-text)' }}>
        ℹ️ ستُرسل الحركة للعضو بانتظار {typeInfo.direction === 'to_member' ? 'قبوله الاستلام' : 'موافقته على الخصم'}.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          projectId, memberId, type, amount: amount === '' ? 0 : amount, note, date: today(),
          status: 'pending', direction: typeInfo.direction, attachments,
        })}>إرسال الحركة</Btn>
      </div>
    </>
  );
}

// invite member by email (simulated)
function InviteForm({ projectId, onInvite, onCancel }: {
  projectId: string; onInvite: (m: Omit<Member, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const valid = email.includes('@') && email.length > 4;
  return (
    <>
      <div style={{ background: '#f5f3ff', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 12, color: 'var(--purple-text)' }}>
        📧 ستُرسل دعوة انضمام عبر البريد. يشترط أن يكون المدعو مسجلاً في النظام لقبول الدعوة.
      </div>
      <Field label="البريد الإلكتروني للمدعو">
        <TextInput type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
      </Field>
      <Field label="الدور عند الانضمام">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLES.filter(r => r.id !== 'owner').map(r => (
            <button key={r.id} onClick={() => setRole(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              border: `1.5px solid ${role === r.id ? r.color : 'var(--border)'}`, background: role === r.id ? r.color + '12' : 'var(--surface)',
              textAlign: 'right', fontFamily: 'inherit',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onInvite({
          projectId, name: email.split('@')[0], email: email.trim(), role,
          permissions: ROLE_PERMS[role], balance: 0, status: 'invited',
        })}>📧 إرسال الدعوة</Btn>
      </div>
    </>
  );
}

function ProjectDetail({ projectId, projects, transactions, trackings, requests, documents, members, memberTxns, notifs, onNav, onSaveMember, onDeleteMember, onSaveMemberTxn, onDecideMemberTxn, onOpenMember, onSaveProject, onDeleteProject, onViewTx, onViewDoc, onViewTracking, onQuickAction, prefs, highlightId }: {
  projectId: string; projects: Project[]; transactions: Transaction[]; trackings: Tracking[];
  requests: RequestItem[]; documents: DocItem[]; members: Member[]; memberTxns: MemberTxn[]; notifs: Notif[];
  onNav: (p: Page) => void;
  onSaveMember: (m: Omit<Member, 'id'> & { id?: string }) => void; onDeleteMember: (id: string) => void;
  onSaveMemberTxn: (t: Omit<MemberTxn, 'id'>) => void; onDecideMemberTxn: (id: string, status: MemberTxnStatus) => void;
  onOpenMember: (id: string) => void;
  onSaveProject: (p: Omit<Project, 'id'> & { id?: string }) => void; onDeleteProject: (id: string) => void;
  onViewTx: (t: Transaction) => void; onViewDoc: (d: DocItem) => void; onViewTracking: (t: Tracking) => void;
  onQuickAction: (a: 'tx' | 'doc' | 'tracking' | 'request') => void;
  prefs: UserPrefs;
  highlightId?: string | null;
}) {
  const [tab, setTab] = useState<'overview' | 'members' | 'cashflow'>('overview');
  const [sheet, setSheet] = useState<null | { mode: 'add' } | { mode: 'edit'; member: Member } | { mode: 'txn' } | { mode: 'invite' } | { mode: 'editProject' } | { mode: 'deleteProject' }>(null);
  const project = projects.find(p => p.id === projectId);
  if (!project) return <div style={{ padding: 24 }}>المشروع غير موجود.</div>;

  const txns = transactions.filter(t => t.projectId === projectId);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const transfersOut = txns.filter(t => t.type === 'transfer' && t.transferDir === 'out').reduce((s, t) => s + t.amount, 0);
  const transfersIn = txns.filter(t => t.type === 'transfer' && t.transferDir === 'in').reduce((s, t) => s + t.amount, 0);
  const balance = computeBalance(project, transactions);
  const projMembers = members.filter(m => m.projectId === projectId);
  // detect members whose stored balance ≠ sum of accepted custody txns (for inline issue badge)
  const memberIssue = (m: Member): string | null => {
    const accepted = memberTxns.filter(t => t.memberId === m.id && t.status === 'accepted');
    const computed = accepted.reduce((s, t) => s + (t.direction === 'to_member' ? t.amount : -t.amount), 0);
    const stored = m.balance ?? 0;
    if (Math.abs(computed - stored) > 1) return `الرصيد المخزّن (${fmtNum(stored)}) لا يطابق مجموع الحركات المقبولة (${fmtNum(computed)}). الفرق: ${fmtNum(Math.abs(computed - stored))}. الحل: سجّل حركة تسوية تعيد الرصيد لمطابقة الواقع.`;
    return null;
  };
  const [issueMember, setIssueMember] = useState<string | null>(null);
  // if a deep-link highlights a member of this project, open the members tab so it becomes visible
  useEffect(() => {
    if (highlightId && projMembers.some(m => m.id === highlightId)) { setTab('members'); setIssueMember(highlightId); }
  }, [highlightId]);
  const projTrackings = trackings.filter(t => t.projectId === projectId);
  const projDocs = documents.filter(d => d.projectId === projectId);
  const projReqs = requests.filter(r => r.projectId === projectId);
  const pendingReqs = projReqs.filter(r => r.status === 'pending');

  // cash flow by month (group income/expense per month)
  const byMonth: Record<string, { income: number; expense: number }> = {};
  txns.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
    if (t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in')) byMonth[m].income += t.amount;
    else byMonth[m].expense += t.amount;
  });
  const months = Object.keys(byMonth).sort();
  const maxFlow = Math.max(...months.map(m => Math.max(byMonth[m].income, byMonth[m].expense)), 1);

  const close = () => setSheet(null);
  // current user's permissions in this project (simulated as owner — first member matching CURRENT_USER, else owner)
  const me = members.find(m => m.projectId === projectId && m.name === CURRENT_USER) ?? members.find(m => m.projectId === projectId && m.role === 'owner');
  const myPerms = me?.permissions ?? ROLE_PERMS.owner;
  const canEdit = myPerms.includes('project_edit');
  const canDelete = myPerms.includes('project_delete');

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      {/* header */}
      <button onClick={() => onNav('projects')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>‹ رجوع للمشاريع</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <ProjectAvatar project={project} size={64} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{project.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{project.type ?? 'مشروع'}{project.description ? ` — ${project.description}` : ''}</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>الرصيد الحالي</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: balance >= 0 ? '#15803d' : '#b91c1c' }}>{fmt(balance)}</div>
        </div>
        {(canEdit || canDelete) && (
          <div style={{ display: 'flex', gap: 8 }}>
            {canEdit && <button onClick={() => setSheet({ mode: 'editProject' })} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 15, color: 'var(--text-2)' }} title="تعديل المشروع">✎</button>}
            {canDelete && <button onClick={() => setSheet({ mode: 'deleteProject' })} style={{ background: 'var(--danger-bg)', border: '1px solid #fecaca', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 15, color: 'var(--danger-text)' }} title="حذف المشروع">🗑️</button>}
          </div>
        )}
      </div>

      {/* member avatars strip (up to 10, overlapping) */}
      {projMembers.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>الأعضاء:</span>
          <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'center' }}>
            {projMembers.slice(0, 10).map((m, i) => {
              const ri = ROLES.find(r => r.id === m.role)!;
              return (
                <div key={m.id} onClick={() => onOpenMember(m.id)} title={m.name} style={{ marginRight: i === 0 ? 0 : -10, cursor: 'pointer', border: '2px solid var(--surface)', borderRadius: 99, position: 'relative', zIndex: 10 - i }}>
                  <MemberAvatar member={m} size={36} color={ri.color} />
                </div>
              );
            })}
            {projMembers.length > 10 && (
              <div style={{ marginRight: -10, width: 36, height: 36, borderRadius: 99, background: 'var(--surface-3)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>+{projMembers.length - 10}</div>
            )}
          </div>
        </div>
      )}

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['overview', 'نظرة عامة'], ['members', 'الأعضاء والصلاحيات'], ['cashflow', 'التدفقات النقدية']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as any)} style={{
            padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: tab === v ? '#fff' : 'transparent', color: tab === v ? '#111827' : '#6b7280',
            boxShadow: tab === v ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
          }}>{l}</button>
        ))}
      </div>

      {/* quick actions: add any item directly within the project */}
      {prefs.showQuickActions && (
      <Card style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginLeft: 4 }}>إجراء سريع:</span>
          {[
            { a: 'tx' as const, icon: '💰', label: 'عملية مالية', color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
            { a: 'doc' as const, icon: '📄', label: 'مستند', color: 'var(--info-text)', bg: 'var(--info-bg)' },
            { a: 'tracking' as const, icon: '🛡️', label: 'متابعة', color: 'var(--warn-text-2)', bg: 'var(--warn-bg)' },
            { a: 'request' as const, icon: '📝', label: 'طلب', color: 'var(--purple-text)', bg: 'var(--purple-bg)' },
          ].map(b => (
            <button key={b.a} onClick={() => onQuickAction(b.a)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: b.bg, color: b.color, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            }}>
              <span style={{ fontSize: 15 }}>{b.icon}</span>{b.label}
            </button>
          ))}
        </div>
      </Card>
      )}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { l: 'إجمالي الإيرادات', v: fmt(income), c: '#15803d', bg: 'var(--ok-bg)', i: '📈' },
              { l: 'إجمالي المصروفات', v: fmt(expense), c: '#b91c1c', bg: 'var(--danger-bg)', i: '📉' },
              { l: 'صافي الربح', v: fmt(income - expense), c: '#1d4ed8', bg: 'var(--info-bg)', i: '💰' },
              { l: 'عدد الأعضاء', v: String(projMembers.length), c: '#7c3aed', bg: 'var(--purple-bg)', i: '👥' },
            ].map(s => (
              <div key={s.l} style={{ background: s.bg, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.i}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* resources summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16 }}>
            <Card>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>الموارد والمستندات</div>
              {[
                ['📄 المستندات', projDocs.length, 'documents' as Page],
                ['🛡️ المتابعات والضمانات', projTrackings.length, 'trackings' as Page],
                ['📝 الطلبات', projReqs.length, 'requests' as Page],
                ['⏳ طلبات معلقة', pendingReqs.length, 'requests' as Page],
              ].map(([l, n, dest]) => (
                <div key={l as string} onClick={() => onNav(dest as Page)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, cursor: 'pointer' }}>
                  <span style={{ color: 'var(--text-2)' }}>{l}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{n as number}</span>
                    <span style={{ color: 'var(--text-3)', fontSize: 15 }}>‹</span>
                  </span>
                </div>
              ))}
            </Card>

            {/* procedural notifications */}
            <Card>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>الإشعارات الإجرائية</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingReqs.length === 0 && projTrackings.filter(t => t.status !== 'active').length === 0 && (
                  <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد إجراءات مطلوبة ✅</div>
                )}
                {pendingReqs.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--warn-bg)' }}>
                    <span>⏳</span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{r.title}</div>
                      <div style={{ color: 'var(--warn-text-2)' }}>طلب بانتظار الاعتماد — {fmtNum(r.amount)} ر.س</div>
                    </div>
                  </div>
                ))}
                {projTrackings.filter(t => t.status !== 'active').map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.status === 'expired' ? 'var(--danger-bg)' : 'var(--warn-bg)' }}>
                    <span>{t.icon}</span>
                    <div style={{ flex: 1, fontSize: 12 }}>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{t.name}</div>
                      <div style={{ color: t.status === 'expired' ? '#b91c1c' : '#a16207' }}>
                        {t.status === 'expired' ? 'منتهي — يتطلب تجديد' : `ينتهي خلال ${t.daysLeft} يوم`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* interactive recent documents & trackings (open / view) */}
          {(projDocs.length > 0 || projTrackings.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16, marginTop: 16 }}>
              {projDocs.length > 0 && (
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>📄 مستندات المشروع</div>
                    <button onClick={() => onNav('documents')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل ‹</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {projDocs.slice(0, 4).map(d => (
                      <div key={d.id} onClick={() => onViewDoc(d)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer' }}>
                        {d.attachments && d.attachments.length > 0
                          ? <div onClick={e => e.stopPropagation()}><AttachmentThumb items={d.attachments} /></div>
                          : <span style={{ fontSize: 18 }}>📄</span>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.type} · {d.date}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onViewDoc(d); }} style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>⚡ إجراءات</button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {projTrackings.length > 0 && (
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>🛡️ متابعات المشروع</div>
                    <button onClick={() => onNav('trackings')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل ‹</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {projTrackings.slice(0, 4).map(t => (
                      <div key={t.id} onClick={() => onViewTracking(t)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: 'var(--surface-2)', cursor: 'pointer' }}>
                        <span style={{ fontSize: 18 }}>{t.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: t.status === 'expired' ? '#b91c1c' : 'var(--text-3)' }}>{t.status === 'expired' ? 'منتهي' : `${t.daysLeft} يوم`}</div>
                        </div>
                        <span style={{ color: 'var(--text-3)', fontSize: 14 }}>‹</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* MEMBERS */}
      {tab === 'members' && (() => {
        const projTxns = memberTxns.filter(t => t.projectId === projectId);
        const pendingTxns = projTxns.filter(t => t.status === 'pending');
        return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>أطراف العلاقة وأرصدتهم وحركاتهم</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="outline" onClick={() => setSheet({ mode: 'invite' })}>📧 دعوة</Btn>
              <Btn size="sm" variant="outline" onClick={() => setSheet({ mode: 'txn' })}>💱 حركة</Btn>
              <Btn size="sm" onClick={() => setSheet({ mode: 'add' })}>+ عضو</Btn>
            </div>
          </div>

          {/* pending movements requiring accept/reject */}
          {pendingTxns.length > 0 && (
            <Card style={{ marginBottom: 16, border: '1.5px solid #fde68a' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--warn-text-2)' }}>⏳ حركات بانتظار القبول/الرفض</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingTxns.map(t => {
                  const m = members.find(x => x.id === t.memberId);
                  const ti = MEMBER_TXN_TYPES.find(x => x.id === t.type)!;
                  return (
                    <div key={t.id} style={{ padding: '12px 14px', background: 'var(--warn-bg)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ti.icon} {ti.label} — {m?.name}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.direction === 'to_member' ? '#15803d' : '#b91c1c' }}>{t.direction === 'to_member' ? '+' : '−'}{fmtNum(t.amount)}</div>
                      </div>
                      {t.note && <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{t.note}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => onDecideMemberTxn(t.id, 'accepted')} style={{ flex: 1, padding: 6, borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✓ قبول</button>
                        <button onClick={() => onDecideMemberTxn(t.id, 'rejected')} style={{ flex: 1, padding: 6, borderRadius: 8, background: 'var(--danger-bg-2)', color: 'var(--danger-text)', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {projMembers.length === 0 && (
            <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 14 }}>لا يوجد أعضاء — أضف أول طرف للمشروع</div>
            </Card>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projMembers.map(m => {
              const roleInfo = ROLES.find(r => r.id === m.role)!;
              const issue = memberIssue(m);
              return (
                <Card key={m.id} dataHl={m.id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <MemberAvatar member={m} size={44} color={roleInfo.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.name}
                        {m.status === 'invited' && <span style={{ fontSize: 10, background: 'var(--warn-bg-2)', color: 'var(--warn-text-2)', padding: '1px 7px', borderRadius: 99 }}>دعوة معلّقة</span>}
                        {issue && <button onClick={() => setIssueMember(issueMember === m.id ? null : m.id)} title="مشكلة في الرصيد" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', borderRadius: 99, width: 22, height: 22, cursor: 'pointer', fontSize: 12, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</button>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.email}</div>
                    </div>
                    <span style={{ background: roleInfo.color + '18', color: roleInfo.color, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{roleInfo.label}</span>
                    <button onClick={() => onOpenMember(m.id)} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }} title="عرض الملف">👤</button>
                    {m.role !== 'owner' && (
                      <button onClick={() => setSheet({ mode: 'edit', member: m })} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0 }}>✎</button>
                    )}
                  </div>
                  {issue && issueMember === m.id && (
                    <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--danger-bg)', borderRadius: 10, animation: 'mzFade .2s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                        <span style={{ fontSize: 15 }}>⚠️</span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--danger-text)' }}>عدم تطابق في رصيد العهدة</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 10 }}>{issue}</div>
                      <Btn size="sm" onClick={() => onOpenMember(m.id)}>↗ فتح ملف العضو لتسجيل تسوية</Btn>
                    </div>
                  )}
                  {m.role !== 'owner' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>رصيد العضو (عُهد)</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: (m.balance ?? 0) > 0 ? '#15803d' : 'var(--text-3)' }}>{fmt(m.balance ?? 0)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    {m.permissions.map(pid => {
                      const p = PERMISSIONS.find(x => x.id === pid);
                      return p ? <span key={pid} style={{ fontSize: 11, background: 'var(--surface-3)', color: '#64748b', padding: '3px 9px', borderRadius: 99 }}>{p.label}</span> : null;
                    })}
                  </div>
                </Card>
              );
            })}
          </div>

          <Sheet open={sheet?.mode === 'add'} onClose={close} title="إضافة عضو">
            <MemberForm projectId={projectId} onSave={(m) => { onSaveMember(m); close(); }} onCancel={close} />
          </Sheet>
          <Sheet open={sheet?.mode === 'invite'} onClose={close} title="دعوة عضو">
            <InviteForm projectId={projectId} onInvite={(m) => { onSaveMember(m); close(); }} onCancel={close} />
          </Sheet>
          <Sheet open={sheet?.mode === 'txn'} onClose={close} title="حركة على رصيد عضو">
            <MemberTxnForm projectId={projectId} members={members} onSave={(t) => { onSaveMemberTxn(t); close(); }} onCancel={close} />
          </Sheet>
          <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل العضو والصلاحيات"
            footer={sheet?.mode === 'edit' ? <Btn variant="danger" onClick={() => { onDeleteMember(sheet.member.id); close(); }}>🗑️ إزالة العضو</Btn> : undefined}>
            {sheet?.mode === 'edit' && <MemberForm key={sheet.member.id} initial={sheet.member} projectId={projectId} onSave={(m) => { onSaveMember(m); close(); }} onCancel={close} />}
          </Sheet>
        </>
        );
      })()}

      {/* CASH FLOW */}
      {tab === 'cashflow' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { l: 'تدفق داخل (إيرادات)', v: income, c: '#15803d', bg: 'var(--ok-bg)' },
              { l: 'تدفق خارج (مصروفات)', v: expense, c: '#b91c1c', bg: 'var(--danger-bg)' },
              { l: 'تحويلات واردة', v: transfersIn, c: '#1d4ed8', bg: 'var(--info-bg)' },
              { l: 'تحويلات صادرة', v: transfersOut, c: '#a16207', bg: 'var(--warn-bg)' },
            ].map(s => (
              <div key={s.l} style={{ background: s.bg, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: s.c }}>{fmt(s.v)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>التدفق النقدي الشهري</div>
            {months.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد بيانات تدفق بعد</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {months.map(m => (
                <div key={m}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>
                    <span>{m}</span>
                    <span style={{ color: byMonth[m].income - byMonth[m].expense >= 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                      صافي: {fmtNum(byMonth[m].income - byMonth[m].expense)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--ok-text)', width: 50 }}>داخل</span>
                    <div style={{ flex: 1, height: 14, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(byMonth[m].income / maxFlow) * 100}%`, background: '#22c55e', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--ok-text)', width: 60, textAlign: 'left' }}>{fmtNum(byMonth[m].income)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--danger-text)', width: 50 }}>خارج</span>
                    <div style={{ flex: 1, height: 14, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(byMonth[m].expense / maxFlow) * 100}%`, background: '#f87171', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--danger-text)', width: 60, textAlign: 'left' }}>{fmtNum(byMonth[m].expense)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* innovative: all project operations as an interactive flow timeline */}
          <Card style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>تفاصيل عمليات التدفق ({txns.length})</div>
              <button onClick={() => onNav('finance')} style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>الإدارة المالية ‹</button>
            </div>
            {txns.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد عمليات بعد</div>}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...txns].sort((a, b) => b.date.localeCompare(a.date)).map(t => {
                const isIn = t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in');
                const hasErr = txErrors(t, { project, transactions }).length > 0;
                return (
                  <div key={t.id} data-hl={t.id} onClick={() => onViewTx(t)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', borderRadius: 10, cursor: 'pointer', borderRight: `3px solid ${hasErr ? 'var(--danger-text)' : isIn ? '#22c55e' : '#f87171'}`, background: hasErr ? 'var(--danger-bg)' : 'var(--surface-2)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 99, background: isIn ? 'var(--ok-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {t.type === 'income' ? '↓' : t.type === 'expense' ? '↑' : '↔'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</span>
                        <TxIssueBadge tx={t} project={project} transactions={transactions} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {t.category} · {t.date}{t.source ? ` · ${t.source}` : ''} · بواسطة {t.createdBy ?? CURRENT_USER}
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isIn ? '#15803d' : '#b91c1c' }}>{isIn ? '+' : '−'}{fmtNum(t.amount)}</div>
                      {t.attachments && t.attachments.length > 0 && <div style={{ marginTop: 4 }} onClick={e => e.stopPropagation()}><AttachmentThumb items={t.attachments} /></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* edit project */}
      <Sheet open={sheet?.mode === 'editProject'} onClose={close} title="تعديل المشروع">
        {sheet?.mode === 'editProject' && <ProjectForm initial={project} onSave={(p) => { onSaveProject(p); close(); }} onCancel={close} />}
      </Sheet>
      {/* delete project confirm */}
      <Sheet open={sheet?.mode === 'deleteProject'} onClose={close} title="حذف المشروع">
        <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>حذف "{project.name}"؟</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>سيتم حذف المشروع. لا يمكن التراجع عن هذا الإجراء.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outline" style={{ flex: 1 }} onClick={close}>إلغاء</Btn>
            <Btn variant="danger" style={{ flex: 1 }} onClick={() => { onDeleteProject(projectId); onNav('projects'); }}>🗑️ حذف نهائي</Btn>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  FINANCE  (create / view / edit transaction by type)
// ═══════════════════════════════════════════
// ── accounting sanity analysis ──────────────────────────────
// returns warnings/notes for a proposed (or saved) transaction so the user
// understands consequences before/after confirming.
type TxWarning = { level: 'error' | 'warning' | 'info'; title: string; detail: string; consequence?: string; fix?: string };
function analyzeTx(
  tx: { type: TxType; amount: number; projectId: string; toProject?: string; date: string; description: string; category?: string; id?: string },
  ctx: { project?: Project; transactions: Transaction[] }
): TxWarning[] {
  const out: TxWarning[] = [];
  const amt = Number(tx.amount) || 0;

  // 1. negative / zero amount
  if (amt < 0) out.push({ level: 'error', title: 'مبلغ سالب', detail: 'المبلغ المُدخل سالب.', consequence: 'في موازين يُحدَّد الاتجاه بنوع العملية لا بإشارة المبلغ، فالقيمة السالبة ستشوّه التقارير.', fix: 'أدخل المبلغ موجباً واختر النوع الصحيح (مصروف/إيراد).' });
  else if (amt === 0) out.push({ level: 'warning', title: 'مبلغ صفري', detail: 'قيمة العملية صفر.', consequence: 'لن تؤثّر على الرصيد، وقد تكون أُدخلت بالخطأ.' });

  // 2. transfer to same project
  if (tx.type === 'transfer' && tx.toProject && tx.toProject === tx.projectId) {
    out.push({ level: 'error', title: 'تحويل لنفس المشروع', detail: 'المشروع المصدر والوجهة متطابقان.', consequence: 'تحويل بلا أثر فعلي، وسيُنشئ طرفين متعارضين في نفس المشروع.', fix: 'اختر مشروع وجهة مختلفاً عن المصدر.' });
  }

  // 3. expense exceeding current balance (would go negative)
  if (tx.type === 'expense' && ctx.project) {
    const bal = computeBalance(ctx.project, ctx.transactions.filter(t => t.id !== tx.id));
    if (amt > bal) {
      out.push({
        level: 'warning', title: 'المصروف يتجاوز الرصيد',
        detail: `رصيد المشروع الحالي ${fmtNum(bal)} ر.س، والمصروف ${fmtNum(amt)} ر.س.`,
        consequence: `سيصبح رصيد المشروع سالباً (${fmtNum(bal - amt)} ر.س) بعد هذه العملية.`,
        fix: 'تأكّد من توفّر السيولة، أو سجّل إيراداً/تحويلاً وارداً أولاً، أو راجع المبلغ.',
      });
    }
  }

  // 4. future-dated transaction
  if (tx.date > today()) {
    out.push({ level: 'info', title: 'تاريخ مستقبلي', detail: `تاريخ العملية (${tx.date}) في المستقبل.`, consequence: 'ستظهر ضمن الفترات القادمة وقد لا تُحتسب في تقارير اليوم.' });
  }

  // 5. unusually large amount vs project history (> 5× average of same type)
  if ((tx.type === 'expense' || tx.type === 'income') && ctx.project) {
    const same = ctx.transactions.filter(t => t.projectId === tx.projectId && t.type === tx.type && t.id !== tx.id);
    if (same.length >= 3) {
      const avg = same.reduce((s, t) => s + t.amount, 0) / same.length;
      if (avg > 0 && amt > avg * 5) {
        out.push({ level: 'info', title: 'مبلغ غير معتاد', detail: `المبلغ أكبر بكثير من متوسط ${tx.type === 'expense' ? 'مصروفات' : 'إيرادات'} المشروع (${fmtNum(Math.round(avg))} ر.س).`, consequence: 'قد يكون إدخالاً خاطئاً (أصفار زائدة مثلاً). تأكّد من صحة المبلغ.' });
      }
    }
  }

  // 6. very short / missing description
  if (tx.description.trim().length > 0 && tx.description.trim().length < 3) {
    out.push({ level: 'info', title: 'وصف قصير', detail: 'وصف العملية قصير جداً.', consequence: 'وصف واضح يسهّل المراجعة والتقارير لاحقاً.' });
  }

  return out;
}
// the "blocking" issues that should flag a saved transaction red in lists
function txErrors(tx: Transaction, ctx: { project?: Project; transactions: Transaction[] }): TxWarning[] {
  return analyzeTx(tx, ctx).filter(w => w.level === 'error' || (w.level === 'warning' && w.title === 'المصروف يتجاوز الرصيد'));
}
// contextual fix options for a flagged transaction. Each option = a suggested resolution
// kind: 'edit' opens the editor; 'reverse'/'delete'/'reassign' are simulated operations the app can apply.
type TxFix = { id: string; label: string; icon: string; desc: string; kind: 'edit' | 'delete' | 'reverse' | 'fixAmount' | 'reassign' | 'changeDate' | 'changeCategory' };
function txFixOptions(tx: Transaction, errs: TxWarning[]): TxFix[] {
  const titles = errs.map(e => e.title);
  const fixes: TxFix[] = [];
  if (titles.includes('مبلغ سالب')) {
    fixes.push({ id: 'abs', label: 'تصحيح المبلغ (جعله موجباً)', icon: '✏️', desc: `تحويل المبلغ من ${fmtNum(tx.amount)} إلى ${fmtNum(Math.abs(tx.amount))} ر.س مع إبقاء النوع كما هو.`, kind: 'fixAmount' });
  }
  if (titles.includes('المصروف يتجاوز الرصيد')) {
    fixes.push({ id: 'edit-amt', label: 'تصحيح المبلغ', icon: '✏️', desc: 'فتح المحرّر لتعديل المبلغ ليتناسب مع السيولة المتاحة.', kind: 'edit' });
    fixes.push({ id: 'reassign', label: 'تغيير المشروع / الإسناد', icon: '🔀', desc: 'نقل العملية لمشروع آخر لديه رصيد كافٍ.', kind: 'reassign' });
  }
  if (titles.includes('تحويل لنفس المشروع')) {
    fixes.push({ id: 'edit-tr', label: 'تصحيح وجهة التحويل', icon: '✏️', desc: 'فتح المحرّر لاختيار مشروع وجهة مختلف عن المصدر.', kind: 'edit' });
  }
  // universal options
  fixes.push({ id: 'reverse', label: 'إرجاع المبلغ (عملية عكسية)', icon: '↩️', desc: `إنشاء عملية عكسية بنفس المبلغ تُلغي الأثر المالي دون حذف السجل (للتدقيق).`, kind: 'reverse' });
  fixes.push({ id: 'edit', label: 'تعديل العملية يدوياً', icon: '✎', desc: 'فتح محرّر العملية لتصحيح أي حقل.', kind: 'edit' });
  fixes.push({ id: 'delete', label: 'إلغاء/حذف العملية', icon: '🗑️', desc: 'حذف العملية نهائياً من السجل (لا يُنصح إن كانت موثّقة).', kind: 'delete' });
  return fixes;
}
// reusable inline issue badge: a ⚠️ chip that pops an explanation of the tx's accounting problems.
// self-contained (own open state) so it can be dropped anywhere a transaction is listed.
function TxIssueBadge({ tx, project, transactions, onEdit, onFix }: { tx: Transaction; project?: Project; transactions: Transaction[]; onEdit?: () => void; onFix?: () => void }) {
  const [open, setOpen] = useState(false);
  const errs = txErrors(tx, { project, transactions });
  if (errs.length === 0) return null;
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} title="مشكلة محاسبية" style={{ background: 'var(--danger-text)', color: '#fff', border: 'none', borderRadius: 99, width: 20, height: 20, cursor: 'pointer', fontSize: 11, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</button>
      {open && (
        <>
          <div onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{ position: 'fixed', inset: 0, zIndex: 60 }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 26, right: 0, zIndex: 61, width: 260, background: 'var(--surface)', border: '1px solid var(--danger-text)', borderRadius: 12, padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,.18)', textAlign: 'right' }}>
            {errs.map((w, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 0 : 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--danger-text)', marginBottom: 3 }}>⚠️ {w.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{w.detail}</div>
                {w.consequence && <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 3 }}><b>ماذا يترتب:</b> {w.consequence}</div>}
                {w.fix && <div style={{ fontSize: 11.5, color: 'var(--danger-text)', lineHeight: 1.6, marginTop: 3 }}><b>الحل:</b> {w.fix}</div>}
              </div>
            ))}
            {onFix && <Btn size="sm" style={{ marginTop: 10, width: '100%' }} onClick={() => { setOpen(false); onFix(); }}>🔧 معالجة بمساعدة الذكاء</Btn>}
            {onEdit && <Btn size="sm" variant="outline" style={{ marginTop: 7, width: '100%' }} onClick={() => { setOpen(false); onEdit(); }}>✎ تعديل يدوي</Btn>}
          </div>
        </>
      )}
    </span>
  );
}

// AI-assisted resolution sheet: lists contextual fix options for a flagged transaction and applies them.
function TxFixSheet({ tx, project, transactions, projects, txCategories = DEFAULT_TX_CATEGORIES, onClose, onEdit, onApply }: {
  tx: Transaction; project?: Project; transactions: Transaction[]; projects: Project[]; txCategories?: string[];
  onClose: () => void; onEdit: () => void;
  onApply: (action: TxFix['kind'], payload?: { toProject?: string; reason?: string; date?: string; category?: string; newAmount?: number }) => void;
}) {
  const errs = txErrors(tx, { project, transactions });
  const fixes = txFixOptions(tx, errs);
  const [active, setActive] = useState<TxFix | null>(null); // the fix being confirmed
  const [reassignTo, setReassignTo] = useState('');
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState(tx.date);
  const [newCategory, setNewCategory] = useState(tx.category);
  const [newAmount, setNewAmount] = useState<number | ''>(Math.abs(tx.amount));
  const otherProjects = projects.filter(p => p.id !== tx.projectId);

  // compute the impact statement shown before confirming
  const curBal = project ? computeBalance(project, transactions) : 0;
  const impactText = (f: TxFix): string => {
    if (f.kind === 'fixAmount') return `سيتحوّل المبلغ إلى ${fmtNum(Math.abs(tx.amount))} ر.س، وسيتغيّر رصيد المشروع «${project?.name ?? ''}» تبعاً لذلك.`;
    if (f.kind === 'delete') return `سيُحذف أثر العملية نهائياً، وسيتغيّر رصيد «${project?.name ?? ''}» من ${fmtNum(curBal)} إلى ${fmtNum(tx.type === 'expense' ? curBal + tx.amount : curBal - tx.amount)} ر.س.`;
    if (f.kind === 'reverse') return `ستُنشأ عملية عكسية بمبلغ ${fmtNum(Math.abs(tx.amount))} ر.س بتاريخ اليوم، تُلغي الأثر المالي مع بقاء السجل الأصلي للتدقيق.`;
    if (f.kind === 'reassign' && reassignTo) { const np = projects.find(p => p.id === reassignTo); return `ستُنقل العملية (${fmtNum(tx.amount)} ر.س) من «${project?.name}» إلى «${np?.name}»، فيتغيّر رصيد المشروعين تبعاً لذلك.`; }
    return 'سيُطبّق هذا التعديل على العملية مباشرةً.';
  };
  const needsReason = (k: TxFix['kind']) => k === 'delete' || k === 'reverse';

  // confirmation view for a chosen fix
  if (active) {
    const canConfirm = active.kind === 'reassign' ? !!reassignTo : needsReason(active.kind) ? reason.trim().length > 0 : true;
    return (
      <Sheet open onClose={onClose} title={active.label}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}><b>العملية:</b> {tx.description} — {fmtNum(tx.amount)} ر.س — {tx.date}</div>
        </div>

        {active.kind === 'reassign' && (
          <Field label="المشروع الجديد">
            <Select value={reassignTo} onChange={setReassignTo} options={[{ v: '', l: 'اختر المشروع…' }, ...otherProjects.map(p => ({ v: p.id, l: p.name }))]} />
          </Field>
        )}
        {active.kind === 'reverse' && (
          <Field label="حساب/مشروع الاسترجاع">
            <Select value={reassignTo || tx.projectId} onChange={setReassignTo} options={projects.map(p => ({ v: p.id, l: p.name }))} />
          </Field>
        )}
        {needsReason(active.kind) && (
          <Field label="سبب الإجراء (إلزامي للتدقيق)">
            <TextArea value={reason} onChange={setReason} placeholder="مثال: إدخال خاطئ، عملية مكرّرة، استرجاع من المورد…" />
          </Field>
        )}

        {/* impact preview */}
        <div style={{ background: 'var(--warn-bg)', borderRadius: 12, padding: 14, margin: '6px 0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ fontSize: 15 }}>🔎</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--warn-text)' }}>معاينة الأثر قبل التأكيد</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{impactText(active)}</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="outline" style={{ flex: 1 }} onClick={() => { setActive(null); setReason(''); }}>رجوع</Btn>
          <Btn style={{ flex: 1, background: active.kind === 'delete' ? 'var(--danger-text)' : undefined }} disabled={!canConfirm}
            onClick={() => onApply(active.kind, { toProject: reassignTo || undefined, reason: reason.trim() || undefined })}>
            تأكيد {active.label}
          </Btn>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title="معالجة العملية بمساعدة الذكاء">
      <div style={{ background: 'var(--purple-bg)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-text)' }}>تحليل المساعد الذكي</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
          العملية «{tx.description}» ({fmtNum(tx.amount)} ر.س) بها {errs.length} مشكلة: {errs.map(e => e.title).join('، ')}.
          <br />بناءً على السياق المحاسبي، إليك الحلول المقترحة مرتّبة من الأنسب:
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fixes.map(f => (
          <div key={f.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
              <span style={{ fontSize: 17 }}>{f.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{f.label}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 10 }}>{f.desc}</div>
            <Btn size="sm" variant={f.kind === 'delete' ? 'outline' : 'primary'} onClick={() => { if (f.kind === 'edit') onEdit(); else { setActive(f); setReassignTo(''); setReason(''); } }}>
              {f.kind === 'edit' ? 'فتح المحرّر' : 'اختيار هذا الحل'}
            </Btn>
          </div>
        ))}

        {/* quick change date — always available */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <span style={{ fontSize: 17 }}>📅</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>تغيير تاريخ العملية</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <TextInput type="date" value={newDate} onChange={setNewDate} />
            <Btn size="sm" disabled={newDate === tx.date} onClick={() => onApply('changeDate', { date: newDate })}>تطبيق</Btn>
          </div>
        </div>

        {/* quick change category (accounting reassignment) — for non-transfers */}
        {tx.type !== 'transfer' && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <span style={{ fontSize: 17 }}>🏷️</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>تغيير التصنيف (الإسناد المحاسبي)</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Select value={newCategory} onChange={setNewCategory} options={txCategories.map(c => ({ v: c, l: c }))} />
              <Btn size="sm" disabled={newCategory === tx.category} onClick={() => onApply('changeCategory', { category: newCategory })}>تطبيق</Btn>
            </div>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 14, textAlign: 'center' }}>💡 كل حل يعرض معاينة الأثر ويطلب سبباً قبل التأكيد، ويُسجَّل في سجل التدقيق.</div>
    </Sheet>
  );
}

function TxForm({ initial, projectId, projects, onSave, onCancel, txCategories = DEFAULT_TX_CATEGORIES, allTransactions = [] }: {
  initial?: Transaction; projectId: string; projects: Project[];
  onSave: (t: Omit<Transaction, 'id'> & { id?: string }) => void; onCancel: () => void; txCategories?: string[]; allTransactions?: Transaction[];
}) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [targetProject, setTargetProject] = useState(initial?.projectId ?? projectId);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState<number | ''>(initial?.amount ?? '');
  const [category, setCategory] = useState(initial?.category ?? txCategories[0]);
  const [date, setDate] = useState(initial?.date ?? today());
  const [toProject, setToProject] = useState(initial?.toProject ?? projects.find(p => p.id !== projectId)?.id ?? '');
  const [source, setSource] = useState(initial?.source ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const valid = description.trim().length > 0 && amount !== '' && Number(amount) > 0;

  // live accounting analysis of the in-progress entry
  const proposedProject = projects.find(p => p.id === targetProject);
  const warnings = (amount !== '' && Number(amount) >= 0) ? analyzeTx(
    { type, amount: Number(amount), projectId: targetProject, toProject: type === 'transfer' ? toProject : undefined, date, description, category, id: initial?.id },
    { project: proposedProject, transactions: allTransactions }
  ) : [];
  const wMeta = (l: TxWarning['level']) => l === 'error' ? { c: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '🔴' } : l === 'warning' ? { c: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '🟠' } : { c: 'var(--info-text)', bg: 'var(--info-bg)', icon: 'ℹ️' };
  const hasError = warnings.some(w => w.level === 'error');

  return (
    <>
      <Field label="نوع العملية">
        <TypePicker value={type} onChange={v => setType(v as TxType)} options={TX_TYPES.map(t => ({ v: t.id, l: t.label, icon: t.icon }))} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={setTargetProject} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <Field label="الوصف">
        <TextInput value={description} onChange={setDescription} placeholder={type === 'income' ? 'مثال: إيراد مبيعات' : type === 'expense' ? 'مثال: فاتورة كهرباء' : 'مثال: تحويل بين الحسابات'} />
      </Field>
      <Field label="المبلغ (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      {type === 'transfer' ? (
        <Field label="إلى مشروع">
          <Select value={toProject} onChange={setToProject} options={projects.filter(p => p.id !== targetProject).map(p => ({ v: p.id, l: p.name }))} />
        </Field>
      ) : (
        <Field label="التصنيف">
          <Select value={category} onChange={setCategory} options={txCategories.map(c => ({ v: c, l: c }))} />
        </Field>
      )}
      <Field label="المصدر / الجهة (اختياري)">
        <TextInput value={source} onChange={setSource} placeholder="مثال: مورد، عميل، بنك..." />
      </Field>
      <Field label="التاريخ">
        <TextInput type="date" value={date} onChange={setDate} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="أي تفاصيل إضافية..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>

      {/* live accounting hints */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {warnings.map((w, i) => {
            const m = wMeta(w.level);
            return (
              <div key={i} style={{ background: m.bg, borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{m.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: m.c }}>{w.title}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{w.detail}</div>
                {w.consequence && <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 4 }}><b>ماذا يترتب:</b> {w.consequence}</div>}
                {w.fix && <div style={{ fontSize: 12, color: m.c, lineHeight: 1.6, marginTop: 4 }}><b>الحل:</b> {w.fix}</div>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid || hasError} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, projectId: targetProject, type, description: description.trim(),
          amount: amount === '' ? 0 : amount, category: type === 'transfer' ? 'تحويل' : category,
          date, hasDoc: attachments.length > 0 || (initial?.hasDoc ?? false), note, source: source.trim() || undefined,
          attachments, toProject: type === 'transfer' ? toProject : undefined,
        })}>{hasError ? 'صحّح الأخطاء أولاً' : initial ? 'حفظ التعديلات' : 'إضافة العملية'}</Btn>
      </div>
    </>
  );
}

function Finance({ projectId, projects, transactions, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate, onNav, txCategories = DEFAULT_TX_CATEGORIES, helpEntry, onFixTx }: {
  projectId: string; projects: Project[]; transactions: Transaction[];
  onSave: (t: Omit<Transaction, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; onNav: (p: Page) => void; txCategories?: string[]; helpEntry?: HelpEntry; onFixTx?: (t: Transaction) => void;
}) {
  const [tab, setTab] = useState<'all' | TxType>('all');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [sheet, setSheet] = useState<null | { mode: 'edit' | 'view'; tx: Transaction }>(null);
  const [errTx, setErrTx] = useState<string | null>(null);
  const project = projects.find(p => p.id === projectId)!;
  const txns = transactions.filter(t => t.projectId === projectId);
  const cats = Array.from(new Set(txns.map(t => t.category)));
  const filtered = txns
    .filter(t => tab === 'all' ? true : t.type === tab)
    .filter(t => catFilter === 'all' ? true : t.category === catFilter)
    .filter(t => search.trim() === '' ? true : t.description.includes(search.trim()))
    .sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : sort === 'oldest' ? a.date.localeCompare(b.date) : b.amount - a.amount);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const transfersIn = txns.filter(t => t.type === 'transfer' && t.transferDir === 'in').reduce((s, t) => s + t.amount, 0);
  const transfersOut = txns.filter(t => t.type === 'transfer' && t.transferDir === 'out').reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader help={helpEntry} title="الإدارة المالية" subtitle={project.name}
        action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="outline" size="sm" onClick={() => onNav('projectDetail')}>👥 تحويل لعضو</Btn><Btn size="sm" onClick={onOpenCreate}>+ عملية جديدة</Btn></div>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الإيرادات', val: income, color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '📈' },
          { label: 'إجمالي المصروفات', val: expense, color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '📉' },
          { label: 'صافي الربح', val: income - expense, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '💰' },
          { label: 'صافي التحويلات', val: transfersIn - transfersOut, color: 'var(--warn-text-2)', bg: 'var(--warn-bg)', icon: '↔' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.label}</div><div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{fmt(s.val)}</div></div>
          </div>
        ))}
      </div>

      {/* financial charts: expense-by-category donut + monthly flow bars */}
      {txns.length > 0 && (() => {
        const expByCat: Record<string, number> = {};
        txns.filter(t => t.type === 'expense').forEach(t => { expByCat[t.category] = (expByCat[t.category] ?? 0) + t.amount; });
        const palette = ['#dc2626', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#2563eb', '#059669'];
        const catSegs = Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([k, v], i) => ({ value: Math.round(v), color: palette[i % palette.length], label: k }));
        // monthly net flow
        const byMonth: Record<string, { in: number; out: number }> = {};
        txns.forEach(t => {
          const m = t.date.slice(0, 7);
          if (!byMonth[m]) byMonth[m] = { in: 0, out: 0 };
          if (t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in')) byMonth[m].in += t.amount;
          else byMonth[m].out += t.amount;
        });
        const months = Object.keys(byMonth).sort().slice(-6);
        const monthBars = months.map(m => ({ label: m, value: Math.round(byMonth[m].in - byMonth[m].out) }));
        const maxAbs = Math.max(...monthBars.map(b => Math.abs(b.value)), 1);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
            <Card>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>توزيع المصروفات حسب التصنيف</div>
              {catSegs.length > 0 ? <Donut segments={catSegs} label="تصنيف" /> : <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: 20 }}>لا توجد مصروفات بعد</div>}
            </Card>
            <Card>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>صافي التدفق الشهري</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {monthBars.map(b => (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-2)' }}>{b.label}</span>
                      <span style={{ fontWeight: 700, color: b.value >= 0 ? '#15803d' : '#b91c1c' }}>{b.value >= 0 ? '+' : ''}{fmtNum(b.value)}</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(Math.abs(b.value) / maxAbs) * 100}%`, background: b.value >= 0 ? '#22c55e' : '#f87171', borderRadius: 99, transition: 'width .4s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      })()}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 4, padding: 16, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {[['all', 'الكل'], ['income', 'إيرادات'], ['expense', 'مصروفات'], ['transfer', 'تحويلات']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val as any)} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              background: tab === val ? '#fff' : 'transparent', color: tab === val ? '#111827' : '#6b7280',
              boxShadow: tab === val ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>
        {/* filter bar: search + category */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث في الوصف..." style={{ flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13 }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
            <option value="all">كل التصنيفات</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>
            <option value="newest">الأحدث أولاً</option>
            <option value="oldest">الأقدم أولاً</option>
            <option value="amount">الأعلى مبلغاً</option>
          </select>
          {(search || catFilter !== 'all' || sort !== 'newest') && (
            <button onClick={() => { setSearch(''); setCatFilter('all'); setSort('newest'); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--text-3)' }}>مسح الفلترة</button>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {['الوصف', 'التصنيف', 'التاريخ', 'المستند', 'المبلغ'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)' }}>لا توجد عمليات مطابقة</td></tr>}
              {filtered.map(t => {
                const errs = txErrors(t, { project, transactions });
                const open = errTx === t.id;
                return (
                <React.Fragment key={t.id}>
                <tr data-hl={t.id} onClick={() => setSheet({ mode: 'view', tx: t })} style={{ cursor: 'pointer', borderBottom: open ? 'none' : '1px solid var(--border)', background: errs.length > 0 ? 'var(--danger-bg)' : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: t.type === 'income' ? 'var(--ok-bg)' : t.type === 'expense' ? 'var(--danger-bg)' : 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔'}
                      </div>
                      <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{t.description}</span>
                      {errs.length > 0 && <button onClick={(e) => { e.stopPropagation(); setErrTx(open ? null : t.id); }} title="مشكلة محاسبية" style={{ background: 'var(--danger-text)', color: '#fff', border: 'none', borderRadius: 99, width: 20, height: 20, cursor: 'pointer', fontSize: 11, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</button>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{t.category}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-3)' }}>{t.date}</td>
                  <td style={{ padding: '12px 16px' }}>{t.attachments && t.attachments.length > 0 ? <AttachmentThumb items={t.attachments} /> : t.hasDoc ? <span style={{ color: 'var(--info-text)', fontSize: 12 }}>📎 مرفق</span> : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: t.type === 'income' ? '#15803d' : t.type === 'expense' ? '#b91c1c' : '#1d4ed8' }}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-'}{fmtNum(t.amount)} ر.س
                  </td>
                </tr>
                {open && errs.length > 0 && (
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--danger-bg)' }}>
                    <td colSpan={5} style={{ padding: '0 16px 14px 16px' }}>
                      {errs.map((w, i) => (
                        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--danger-text)', borderRadius: 10, padding: '11px 13px', marginTop: i === 0 ? 0 : 8 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--danger-text)', marginBottom: 4 }}>⚠️ {w.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{w.detail}</div>
                          {w.consequence && <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 4 }}><b>ماذا يترتب:</b> {w.consequence}</div>}
                          {w.fix && <div style={{ fontSize: 12, color: 'var(--danger-text)', lineHeight: 1.6, marginTop: 4 }}><b>الحل:</b> {w.fix}</div>}
                          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                            {onFixTx && <Btn size="sm" onClick={(e?: any) => { e?.stopPropagation?.(); onFixTx(t); setErrTx(null); }}>🔧 معالجة بمساعدة الذكاء</Btn>}
                            <Btn size="sm" variant="outline" onClick={(e?: any) => { e?.stopPropagation?.(); setSheet({ mode: 'edit', tx: t }); setErrTx(null); }}>✎ تعديل يدوي</Btn>
                          </div>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="عملية جديدة">
        <TxForm projectId={projectId} projects={projects} txCategories={txCategories} allTransactions={transactions} onSave={(t) => { onSave(t); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={() => setSheet(null)} title="تعديل العملية">
        {sheet?.mode === 'edit' && (
          <TxForm key={sheet.tx.id} initial={sheet.tx} projectId={projectId} projects={projects} txCategories={txCategories} allTransactions={transactions}
            onSave={(t) => { onSave(t); setSheet(null); }} onCancel={() => setSheet(null)} />
        )}
      </Sheet>

      {/* View */}
      <Sheet open={sheet?.mode === 'view'} onClose={() => setSheet(null)} title="تفاصيل العملية"
        footer={sheet?.mode === 'view' ? (
          <>
            <Btn variant="danger" onClick={() => { onDelete(sheet.tx.id); setSheet(null); }}>🗑️ حذف</Btn>
            <Btn variant="outline" style={{ flex: 1 }} onClick={() => setSheet({ mode: 'edit', tx: sheet.tx })}>✎ تعديل</Btn>
          </>
        ) : undefined}>
        {sheet?.mode === 'view' && (() => {
          const t = sheet.tx;
          const rows: [string, string][] = [
            ['النوع', t.type === 'income' ? '📈 إيراد' : t.type === 'expense' ? '📉 مصروف' : '🔄 تحويل'],
            ['الوصف', t.description],
            ['المبلغ', fmt(t.amount)],
            ['التصنيف', t.category],
            ...(t.source ? [['المصدر/الجهة', t.source] as [string, string]] : []),
            ['التاريخ', t.date],
            ...(t.toProject ? [['إلى مشروع', projects.find(p => p.id === t.toProject)?.name ?? '—'] as [string, string]] : []),
            ['أضافها', t.createdBy ?? CURRENT_USER],
            ...(t.note ? [['ملاحظات', t.note] as [string, string]] : []),
          ];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-2)', textAlign: 'left' }}>{v}</span>
                </div>
              ))}
              {t.attachments && t.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({t.attachments.length})</div>
                  <AttachmentView items={t.attachments} />
                </div>
              )}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
// ═══════════════════════════════════════════
//  FINANCIAL LEDGER (سجل العمليات + تحليل التدفقات)
// ═══════════════════════════════════════════
function Ledger({ projects, transactions, members, memberTxns, helpEntry, onNavigate }: {
  projects: Project[]; transactions: Transaction[]; members: Member[]; memberTxns: MemberTxn[]; helpEntry?: HelpEntry; onNavigate: (p: Page, itemId?: string, projId?: string) => void;
}) {
  const [view, setView] = useState<'log' | 'flows'>('log');
  const [fType, setFType] = useState('all');
  const [fProject, setFProject] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [fPeriod, setFPeriod] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<null | any>(null);

  // unify project transactions + member movements into one ledger model
  type Row = {
    id: string; num: string; kind: string; nature: string; projectId: string;
    memberId?: string; source?: string; amount: number; dir: 'in' | 'out';
    date: string; status: string; parties: string[];
  };

  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const memName = (id?: string) => id ? (members.find(m => m.id === id)?.name ?? '—') : '—';

  const rows: Row[] = [];
  // project transactions
  transactions.forEach((t, i) => {
    rows.push({
      id: t.id, num: 'TX-' + (1000 + i), kind: t.type === 'income' ? 'إيراد' : t.type === 'expense' ? 'مصروف' : 'تحويل',
      nature: t.category, projectId: t.projectId, memberId: t.memberId, source: t.source,
      amount: t.amount, dir: t.type === 'income' || (t.type === 'transfer' && t.transferDir === 'in') ? 'in' : 'out',
      date: t.date, status: 'منفّذة',
      parties: [projName(t.projectId), t.source, t.memberId ? memName(t.memberId) : null, t.toProject ? projName(t.toProject) : null].filter(Boolean) as string[],
    });
  });
  // member movements
  memberTxns.forEach((mt, i) => {
    const ti = MEMBER_TXN_TYPES.find(x => x.id === mt.type);
    rows.push({
      id: mt.id, num: 'MV-' + (2000 + i), kind: ti?.label ?? 'حركة عضو', nature: 'عُهد/تسوية',
      projectId: mt.projectId, memberId: mt.memberId, amount: mt.amount,
      dir: mt.direction === 'to_member' ? 'out' : 'in', date: mt.date,
      status: mt.status === 'accepted' ? 'مقبولة' : mt.status === 'rejected' ? 'مرفوضة' : 'معلّقة',
      parties: [projName(mt.projectId), memName(mt.memberId)].filter(Boolean) as string[],
    });
  });
  rows.sort((a, b) => b.date.localeCompare(a.date));

  // period filter
  const inPeriod = (date: string) => {
    if (fPeriod === 'all') return true;
    const d = new Date(date); const now = new Date('2025-06-30');
    const diffDays = (now.getTime() - d.getTime()) / 86400000;
    if (fPeriod === 'month') return diffDays <= 31;
    if (fPeriod === 'quarter') return diffDays <= 92;
    if (fPeriod === 'half') return diffDays <= 183;
    if (fPeriod === 'year') return diffDays <= 366;
    return true;
  };

  const filtered = rows
    .filter(r => fType === 'all' ? true : (fType === 'in' ? r.dir === 'in' : fType === 'out' ? r.dir === 'out' : r.kind === fType))
    .filter(r => fProject === 'all' ? true : r.projectId === fProject)
    .filter(r => fMember === 'all' ? true : r.memberId === fMember)
    .filter(r => inPeriod(r.date))
    .filter(r => search.trim() === '' ? true : (r.kind + r.nature + r.parties.join(' ') + r.num).includes(search.trim()));

  // running balance per row (project-scoped, computed over filtered set chronologically)
  const chrono = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const balBefore: Record<string, number> = {};
  const running: Record<string, number> = {};
  chrono.forEach(r => {
    const cur = running[r.projectId] ?? 0;
    balBefore[r.id] = cur;
    running[r.projectId] = cur + (r.dir === 'in' ? r.amount : -r.amount);
  });

  const totalIn = filtered.filter(r => r.dir === 'in').reduce((s, r) => s + r.amount, 0);
  const totalOut = filtered.filter(r => r.dir === 'out').reduce((s, r) => s + r.amount, 0);

  const clearFilters = () => { setFType('all'); setFProject('all'); setFMember('all'); setFPeriod('all'); setSearch(''); };
  const hasFilter = fType !== 'all' || fProject !== 'all' || fMember !== 'all' || fPeriod !== 'all' || search !== '';

  // flow aggregations
  const byProject = projects.map(p => {
    const rs = filtered.filter(r => r.projectId === p.id);
    return { name: p.name, icon: p.icon, in: rs.filter(r => r.dir === 'in').reduce((s, r) => s + r.amount, 0), out: rs.filter(r => r.dir === 'out').reduce((s, r) => s + r.amount, 0) };
  }).filter(x => x.in > 0 || x.out > 0);
  const byMember = members.map(m => {
    const rs = filtered.filter(r => r.memberId === m.id);
    return { name: m.name, in: rs.filter(r => r.dir === 'in').reduce((s, r) => s + r.amount, 0), out: rs.filter(r => r.dir === 'out').reduce((s, r) => s + r.amount, 0) };
  }).filter(x => x.in > 0 || x.out > 0);

  const selStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' };

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <PageHeader help={helpEntry} title="السجل المالي" subtitle="سجل موحّد لكل العمليات والتدفقات عبر المشاريع والأعضاء" />

      {/* view switch */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {[['log', '📋 العمليات'], ['flows', '📊 تحليل التدفقات']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v as any)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: view === v ? 'var(--surface)' : 'transparent', color: view === v ? 'var(--text)' : 'var(--text-3)',
          }}>{l}</button>
        ))}
      </div>

      {/* summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'إجمالي الوارد', v: totalIn, c: '#15803d', bg: 'var(--ok-bg)', i: '↓' },
          { l: 'إجمالي الصادر', v: totalOut, c: '#b91c1c', bg: 'var(--danger-bg)', i: '↑' },
          { l: 'صافي التدفق', v: totalIn - totalOut, c: '#1d4ed8', bg: 'var(--info-bg)', i: '⇄' },
          { l: 'عدد العمليات', v: filtered.length, c: '#7c3aed', bg: 'var(--purple-bg)', i: '#', raw: true },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.i}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.raw ? s.v : fmt(s.v)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* filters */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 بحث (رقم، نوع، طرف...)" style={{ ...selStyle, flex: 1, minWidth: 150 }} />
          <select value={fType} onChange={e => setFType(e.target.value)} style={selStyle}>
            <option value="all">كل الأنواع</option><option value="in">وارد</option><option value="out">صادر</option>
            <option value="إيراد">إيراد</option><option value="مصروف">مصروف</option><option value="تحويل">تحويل</option>
          </select>
          <select value={fProject} onChange={e => setFProject(e.target.value)} style={selStyle}>
            <option value="all">كل المشاريع</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fMember} onChange={e => setFMember(e.target.value)} style={selStyle}>
            <option value="all">كل الأعضاء</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={fPeriod} onChange={e => setFPeriod(e.target.value)} style={selStyle}>
            <option value="all">كل الفترات</option><option value="month">آخر شهر</option><option value="quarter">آخر ربع</option><option value="half">آخر نصف سنة</option><option value="year">آخر سنة</option>
          </select>
          {hasFilter && <button onClick={clearFilters} style={{ ...selStyle, color: 'var(--text-3)' }}>مسح الفلترة</button>}
        </div>
      </Card>

      {/* LOG view */}
      {view === 'log' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 820 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)' }}>
                  {['رقم', 'النوع', 'الطبيعة', 'المشروع', 'العضو/المصدر', 'المبلغ', 'قبل', 'بعد', 'التاريخ', 'الحالة'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 500, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>لا توجد عمليات مطابقة للفلترة</td></tr>}
                {filtered.map(r => {
                  const before = balBefore[r.id] ?? 0;
                  const after = before + (r.dir === 'in' ? r.amount : -r.amount);
                  const srcTx = transactions.find(t => t.id === r.id);
                  const errs = srcTx ? txErrors(srcTx, { project: projects.find(p => p.id === srcTx.projectId), transactions }) : [];
                  return (
                    <tr key={r.id} data-hl={r.id} onClick={() => setDetail({ ...r, before, after })} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', background: errs.length > 0 ? 'var(--danger-bg)' : 'transparent' }}>
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 11 }}>{r.num}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: r.dir === 'in' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>{r.dir === 'in' ? '↓' : '↑'} {r.kind}</span>
                          {srcTx && <TxIssueBadge tx={srcTx} project={projects.find(p => p.id === srcTx.projectId)} transactions={transactions} />}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)' }}>{r.nature}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)' }}>{projName(r.projectId)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)' }}>{r.memberId ? memName(r.memberId) : (r.source ?? '—')}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: r.dir === 'in' ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>{r.dir === 'in' ? '+' : '−'}{fmtNum(r.amount)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{fmtNum(before)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{fmtNum(after)}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: r.status === 'معلّقة' ? 'var(--warn-bg-2)' : r.status === 'مرفوضة' ? 'var(--danger-bg-2)' : 'var(--ok-bg-2)', color: r.status === 'معلّقة' ? '#a16207' : r.status === 'مرفوضة' ? '#b91c1c' : '#15803d' }}>{r.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* FLOWS view */}
      {view === 'flows' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>نسبة الوارد إلى الصادر</div>
            <Donut segments={[
              { value: Math.round(totalIn), color: '#22c55e', label: 'وارد' },
              { value: Math.round(totalOut), color: '#ef4444', label: 'صادر' },
            ]} label="ر.س" />
          </Card>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>العمليات حسب النوع</div>
            {(() => {
              const byKind: Record<string, number> = {};
              filtered.forEach(r => { byKind[r.kind] = (byKind[r.kind] ?? 0) + 1; });
              const palette = ['#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#059669'];
              const segs = Object.entries(byKind).map(([k, v], i) => ({ value: v, color: palette[i % palette.length], label: k }));
              return segs.length > 0 ? <Donut segments={segs} label="عملية" /> : <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12, textAlign: 'center' }}>لا توجد بيانات</div>;
            })()}
          </Card>
          <Card>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>التدفقات حسب المشروع</div>
            {byProject.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12, textAlign: 'center' }}>لا توجد بيانات</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {byProject.map(p => (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{p.icon} {p.name}</span>
                    <span style={{ color: p.in - p.out >= 0 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>صافي {fmtNum(p.in - p.out)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: 'var(--ok-text)', width: 36 }}>وارد</span>
                    <div style={{ flex: 1, height: 12, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (p.in / Math.max(p.in, p.out, 1)) * 100)}%`, background: '#22c55e' }} /></div>
                    <span style={{ fontSize: 11, color: 'var(--ok-text)', width: 64, textAlign: 'left' }}>{fmtNum(p.in)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--danger-text)', width: 36 }}>صادر</span>
                    <div style={{ flex: 1, height: 12, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100, (p.out / Math.max(p.in, p.out, 1)) * 100)}%`, background: '#f87171' }} /></div>
                    <span style={{ fontSize: 11, color: 'var(--danger-text)', width: 64, textAlign: 'left' }}>{fmtNum(p.out)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>التدفقات حسب العضو</div>
            {byMember.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12, textAlign: 'center' }}>لا توجد بيانات</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byMember.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{m.name}</span>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                    <span style={{ color: 'var(--ok-text)' }}>وارد {fmtNum(m.in)}</span>
                    <span style={{ color: 'var(--danger-text)' }}>صادر {fmtNum(m.out)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* operation detail sheet */}
      <Sheet open={!!detail} onClose={() => setDetail(null)} title={`تفاصيل العملية ${detail?.num ?? ''}`}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              ['رقم العملية', detail.num], ['النوع', detail.kind], ['الطبيعة', detail.nature],
              ['المشروع', projName(detail.projectId)], ['العضو', detail.memberId ? memName(detail.memberId) : '—'],
              ['المصدر/الجهة', detail.source ?? '—'], ['المبلغ', `${detail.dir === 'in' ? '+' : '−'}${fmt(detail.amount)}`],
              ['الرصيد قبل', fmt(detail.before)], ['الرصيد بعد', fmt(detail.after)],
              ['التاريخ', detail.date], ['الحالة', detail.status], ['الأطراف', detail.parties.join('، ')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{v}</span>
              </div>
            ))}
            {detail.id && (
              <Btn variant="outline" onClick={() => { setDetail(null); onNavigate('finance', detail.id, detail.projectId); }} style={{ marginTop: 14 }}>↗ عرض العملية في الإدارة المالية</Btn>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  DOCUMENTS  (upload by type / actions / view / edit)
// ═══════════════════════════════════════════
function DocForm({ initial, projectId, projects, onSave, onCancel, docTypes = DEFAULT_DOC_TYPES }: {
  initial?: DocItem; projectId: string; projects: Project[];
  onSave: (d: Omit<DocItem, 'id'> & { id?: string }) => void; onCancel: () => void; docTypes?: string[];
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? docTypes[0]);
  const [date, setDate] = useState(initial?.date ?? today());
  const [targetProject, setTargetProject] = useState(initial?.projectId ?? projectId);
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const valid = name.trim().length > 0;

  // smart suggestion: route document to a project type that fits the doc type
  const suggestProject = (docType: string): string | null => {
    const map: Record<string, string[]> = {
      'فاتورة': ['شركة', 'متجر إلكتروني', 'مطعم', 'مؤسسة'],
      'عقد': ['شركة', 'مؤسسة'],
      'كشف حساب': ['شركة', 'مؤسسة', 'مشروع منزلي'],
      'وثيقة رسمية': ['شركة', 'مؤسسة'],
    };
    const wanted = map[docType];
    if (!wanted) return null;
    const match = projects.find(p => p.type && wanted.includes(p.type));
    return match && match.id !== targetProject ? match.id : null;
  };
  const suggestion = suggestProject(type);
  const suggestedProject = suggestion ? projects.find(p => p.id === suggestion) : null;

  return (
    <>
      {!initial && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', marginBottom: 18, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>☁️</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>اسحب الملف هنا أو اضغط للاختيار</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>PDF, JPG, PNG — حد أقصى 10MB</div>
        </div>
      )}
      <Field label="نوع المستند">
        <TypePicker value={type} onChange={setType} options={docTypes.map(t => ({ v: t, l: t }))} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={setTargetProject} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      {suggestedProject && (
        <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '10px 14px', marginTop: -8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--purple-text)' }}>🤖 مقترح حسب نوع المستند: {suggestedProject.icon} {suggestedProject.name}</span>
          <button onClick={() => setTargetProject(suggestedProject.id)} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>توجيه</button>
        </div>
      )}
      <Field label="اسم المستند">
        <TextInput value={name} onChange={setName} placeholder="مثال: فاتورة مورد يونيو" />
      </Field>
      <Field label="تاريخ المستند">
        <TextInput type="date" value={date} onChange={setDate} />
      </Field>
      <Field label="المرفقات (صور / ملفات متعددة)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, name: name.trim(), type, date,
          size: initial?.size ?? Math.round(100 + Math.random() * 900) + ' KB',
          status: initial?.status ?? 'pending', projectId: targetProject, aiRead: initial?.aiRead ?? false,
          attachments,
        })}>{initial ? 'حفظ التعديلات' : 'رفع المستند'}</Btn>
      </div>
    </>
  );
}

// simulated AI extraction by document type (محاكاة استخراج البيانات)
function aiExtract(doc: DocItem): [string, string][] {
  const base: [string, string][] = [['نوع المستند', doc.type], ['تاريخ المستند', doc.date]];
  if (doc.type === 'فاتورة') return [...base, ['المورد', 'مؤسسة الإمداد التجارية'], ['المبلغ الإجمالي', '4,250 ر.س'], ['الضريبة (15%)', '554 ر.س'], ['طريقة الدفع', 'تحويل بنكي'], ['الضمان', '12 شهر']];
  if (doc.type === 'عقد') return [...base, ['الأطراف', 'الطرف الأول / الطرف الثاني'], ['قيمة العقد', '36,000 ر.س'], ['مدة العقد', '12 شهر'], ['تاريخ البداية', doc.date], ['الالتزامات', 'دفعات شهرية']];
  if (doc.type === 'كشف حساب') return [...base, ['البنك', 'البنك الأهلي'], ['عدد العمليات', '24'], ['إجمالي الإيداعات', '52,000 ر.س'], ['إجمالي السحوبات', '38,400 ر.س'], ['الرصيد الختامي', '13,600 ر.س']];
  if (doc.type === 'وثيقة رسمية') return [...base, ['رقم الوثيقة', '1078-4521'], ['الجهة المصدرة', 'وزارة التجارة'], ['تاريخ الإصدار', doc.date], ['تاريخ الانتهاء', '2026-07-15'], ['الحالة', 'سارية']];
  return [...base, ['المحتوى', 'تم تحليل المستند العام'], ['عدد الصفحات', '3']];
}

// smart suggested actions per document type (Document First)
type DocActionKind = 'tx' | 'tracking' | 'commitment' | 'asset' | 'receivable';
type DocSuggestion = { kind: DocActionKind; icon: string; label: string; desc: string };
function suggestedActions(docType: string): DocSuggestion[] {
  if (docType === 'فاتورة') return [
    { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'مصروف/إيراد بقيمة الفاتورة' },
    { kind: 'tracking', icon: '🛡️', label: 'إضافة ضمان للمتابعة', desc: 'تتبّع ضمان المنتج/الخدمة' },
    { kind: 'asset', icon: '⬚', label: 'تسجيل كأصل', desc: 'إن كانت فاتورة شراء أصل ملموس' },
  ];
  if (docType === 'عقد') return [
    { kind: 'tracking', icon: '📄', label: 'إضافة عقد للمتابعة', desc: 'تتبّع مدة العقد والتجديد' },
    { kind: 'commitment', icon: '↻', label: 'إنشاء التزام دوري', desc: 'إن كان العقد بدفعات متكررة' },
    { kind: 'receivable', icon: '⇄', label: 'تسجيل ذمة', desc: 'إن نتج عن العقد مبلغ مستحق' },
  ];
  if (docType === 'وثيقة رسمية') return [
    { kind: 'tracking', icon: '🪪', label: 'إضافة وثيقة للمتابعة', desc: 'تتبّع تاريخ انتهاء وتجديد' },
  ];
  if (docType === 'كشف حساب') return [
    { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'إدخال عملية من الكشف' },
  ];
  return [
    { kind: 'tx', icon: '💸', label: 'تسجيل عملية مالية', desc: 'تحويل المستند إلى عملية' },
    { kind: 'tracking', icon: '🛡️', label: 'إضافة عنصر متابعة', desc: 'تتبّع زمني للمستند' },
  ];
}

function Documents({ projectId, projects, documents, onSave, onDelete, onAction, openCreate, onOpenCreate, onCloseCreate, docTypeOptions = DEFAULT_DOC_TYPES, helpEntry, openDocId, onConsumeOpenDoc }: {
  projectId: string; projects: Project[]; documents: DocItem[];
  onSave: (d: Omit<DocItem, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  onAction: (action: DocActionKind, doc: DocItem) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; docTypeOptions?: string[]; helpEntry?: HelpEntry; openDocId?: string | null; onConsumeOpenDoc?: () => void;
}) {
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit' | 'actions' | 'ai'; doc: DocItem }>(null);
  // auto-open a document when navigated here from elsewhere (e.g. project detail)
  useEffect(() => {
    if (openDocId) {
      const d = documents.find(x => x.id === openDocId);
      if (d) setSheet({ mode: 'actions', doc: d });
      onConsumeOpenDoc?.();
    }
  }, [openDocId]);
  const [aiBusy, setAiBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fAi, setFAi] = useState('all');
  const [sort, setSort] = useState('newest');
  const docs = documents.filter(d => d.projectId === projectId);
  const docTypes = Array.from(new Set(docs.map(d => d.type)));
  const filteredDocs = docs
    .filter(d => fType === 'all' ? true : d.type === fType)
    .filter(d => fAi === 'all' ? true : fAi === 'read' ? d.aiRead : !d.aiRead)
    .filter(d => search.trim() === '' ? true : (d.name + d.type).includes(search.trim()))
    .sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : sort === 'oldest' ? a.date.localeCompare(b.date) : a.name.localeCompare(b.name));
  const clearFilters = () => { setSearch(''); setFType('all'); setFAi('all'); setSort('newest'); };
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader help={helpEntry} title="المستندات" subtitle="رفع وإدارة المستندات" action={<Btn size="sm" onClick={onOpenCreate}>+ رفع مستند</Btn>} />

      <div onClick={onOpenCreate} style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '32px 20px', textAlign: 'center', marginBottom: 24, background: 'var(--surface-2)', cursor: 'pointer' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
        <div style={{ fontWeight: 500, color: 'var(--text-2)', marginBottom: 4 }}>اسحب المستندات هنا أو اضغط للرفع</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>PDF, JPG, PNG — حد أقصى 10MB</div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--info-bg) 0%, #f5f3ff 100%)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd6fe' }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 600, color: '#4c1d95', fontSize: 14 }}>الذكاء الاصطناعي جاهز لقراءة مستنداتك</div>
          <div style={{ fontSize: 12, color: 'var(--purple-text)', marginTop: 2 }}>ارفع فاتورة أو عقد وسيستخرج البيانات تلقائياً</div>
        </div>
      </div>

      {docs.length > 0 && (() => {
        const byType: Record<string, number> = {};
        docs.forEach(d => { byType[d.type] = (byType[d.type] ?? 0) + 1; });
        const palette = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
        const typeSegs = Object.entries(byType).map(([k, v], i) => ({ value: v, color: palette[i % palette.length], label: k }));
        const aiRead = docs.filter(d => d.aiRead).length;
        const withAtt = docs.filter(d => d.attachments && d.attachments.length > 0).length;
        return (
          <>
            <StatCards cards={[
              { label: 'إجمالي المستندات', value: docs.length, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '📄' },
              { label: 'تمت قراءتها AI', value: aiRead, color: 'var(--purple-text)', bg: 'var(--purple-bg)', icon: '🤖' },
              { label: 'بها مرفقات', value: withAtt, color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '📎' },
              { label: 'أنواع مختلفة', value: Object.keys(byType).length, color: '#d97706', bg: 'var(--warn-bg)', icon: '🗂️' },
            ]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>توزيع المستندات حسب النوع</div>
                <Donut segments={typeSegs} label="مستند" />
              </Card>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>حالة قراءة الذكاء الاصطناعي</div>
                <StatBars bars={[
                  { label: 'تمت القراءة', value: aiRead, color: 'var(--purple-text)' },
                  { label: 'لم تُقرأ بعد', value: docs.length - aiRead, color: '#cbd5e1' },
                ]} />
              </Card>
            </div>
          </>
        );
      })()}

      {docs.length > 0 && (
        <FilterBar
          search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في المستندات..."
          values={{ type: fType, ai: fAi, sort }}
          onChange={(k, v) => { if (k === 'type') setFType(v); else if (k === 'ai') setFAi(v); else if (k === 'sort') setSort(v); }}
          onClear={clearFilters}
          filters={[
            { key: 'type', placeholder: 'النوع', options: [{ v: 'all', l: 'كل الأنواع' }, ...docTypes.map(t => ({ v: t, l: t }))] },
            { key: 'ai', placeholder: 'قراءة AI', options: [{ v: 'all', l: 'الكل' }, { v: 'read', l: 'مقروءة AI' }, { v: 'unread', l: 'غير مقروءة' }] },
            { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'newest', l: 'الأحدث' }, { v: 'oldest', l: 'الأقدم' }, { v: 'name', l: 'الاسم' }] },
          ]}
        />
      )}

      {docs.length === 0 && (
        <EmptyState icon="◻" title="لا توجد مستندات بعد" hint="المستند هو نقطة البداية في موازين — فاتورة أو عقد أو وثيقة. ارفع أول مستند ودع النظام يقترح تحويله إلى عملية أو متابعة أو أصل." actionLabel="+ رفع أول مستند" onAction={onOpenCreate} />
      )}
      {docs.length > 0 && filteredDocs.length === 0 && (
        <EmptyState icon="🔍" title="لا توجد مستندات مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {filteredDocs.map(d => (
          <Card key={d.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 48, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden', flexShrink: 0 }}>
                {(() => { const img = d.attachments?.find(a => a.kind === 'image' && a.preview); return img ? <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{d.attachments && d.attachments.length > 0 ? fileIcon(d.attachments[0]) : '📄'}</span>; })()}
              </div>
              {d.aiRead && <span style={{ fontSize: 10, background: '#f5f3ff', color: 'var(--purple-text)', padding: '2px 7px', borderRadius: 99, fontWeight: 500 }}>✨ AI</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{d.type} · {d.size}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <StatusBadge status={d.status} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn size="sm" variant="outline" style={{ flex: 1, fontSize: 12 }} onClick={() => setSheet({ mode: 'view', doc: d })}>استعراض</Btn>
              <Btn size="sm" style={{ flex: 1, fontSize: 12 }} onClick={() => setSheet({ mode: 'actions', doc: d })}>⚡ إجراءات</Btn>
            </div>
          </Card>
        ))}
      </div>

      {/* Upload */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="رفع مستند">
        <DocForm projectId={projectId} projects={projects} docTypes={docTypeOptions} onSave={(d) => { onSave(d); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل المستند">
        {sheet?.mode === 'edit' && <DocForm key={sheet.doc.id} initial={sheet.doc} projectId={projectId} projects={projects} docTypes={docTypeOptions} onSave={(d) => { onSave(d); close(); }} onCancel={close} />}
      </Sheet>

      {/* View */}
      <Sheet open={sheet?.mode === 'view'} onClose={close} title="استعراض المستند"
        footer={sheet?.mode === 'view' ? (
          <>
            <Btn variant="danger" onClick={() => { onDelete(sheet.doc.id); close(); }}>🗑️ حذف</Btn>
            <Btn variant="outline" style={{ flex: 1 }} onClick={() => setSheet({ mode: 'edit', doc: sheet.doc })}>✎ تعديل</Btn>
            <Btn style={{ flex: 1 }} onClick={() => setSheet({ mode: 'actions', doc: sheet.doc })}>⚡ إجراءات</Btn>
          </>
        ) : undefined}>
        {sheet?.mode === 'view' && (() => {
          const d = sheet.doc;
          const firstImg = d.attachments?.find(a => a.kind === 'image' && a.preview);
          return (
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 18, textAlign: 'center', marginBottom: 16 }}>
                {firstImg ? <img src={firstImg.preview} alt={d.name} style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10 }} /> : <div style={{ fontSize: 48 }}>📄</div>}
                <div style={{ fontWeight: 600, marginTop: 8 }}>{d.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['النوع', d.type], ['التاريخ', d.date], ['الحجم', d.size], ['أضافها', d.createdBy ?? CURRENT_USER], ['الحالة', d.status === 'processed' ? 'تمت المعالجة' : 'قيد الانتظار'], ['قراءة AI', d.aiRead ? 'تمت ✅' : 'لم تتم ❌']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 9, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)' }}>{k}</span><span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{v}</span>
                  </div>
                ))}
              </div>
              {d.attachments && d.attachments.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({d.attachments.length})</div>
                  <AttachmentView items={d.attachments} />
                </div>
              )}
            </>
          );
        })()}
      </Sheet>

      {/* Actions */}
      <Sheet open={sheet?.mode === 'actions'} onClose={close} title="إجراءات على المستند">
        {sheet?.mode === 'actions' && (() => {
          const d = sheet.doc;
          const suggestions = suggestedActions(d.type);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 2 }}>📄 {d.name} · {d.type}</div>

              {/* AI analysis entry */}
              <button onClick={() => { setSheet({ mode: 'ai', doc: d }); setAiBusy(true); setTimeout(() => setAiBusy(false), 1600); }} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                border: '1px solid #ddd6fe', background: 'linear-gradient(135deg,var(--purple-bg),var(--info-bg))', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
              }}>
                <span style={{ fontSize: 22 }}>🤖</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple-text)' }}>تحليل ذكي واستخراج البيانات</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>اقرأ المستند واقترح الإجراءات تلقائياً</div>
                </div>
                <span style={{ color: '#a78bfa' }}>‹</span>
              </button>

              {/* smart suggestions header */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 6 }}>✨ إجراءات مقترحة لـ «{d.type}»</div>
              {suggestions.map(s => (
                <button key={s.kind} onClick={() => { onAction(s.kind, d); close(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{s.desc}</div>
                  </div>
                  <span style={{ color: '#d1d5db' }}>‹</span>
                </button>
              ))}
            </div>
          );
        })()}
      </Sheet>

      {/* AI Analysis */}
      <Sheet open={sheet?.mode === 'ai'} onClose={close} title="🤖 تحليل الذكاء الاصطناعي"
        footer={sheet?.mode === 'ai' && !aiBusy ? (
          <>
            <Btn variant="outline" style={{ flex: 1 }} onClick={close}>إغلاق</Btn>
            <Btn style={{ flex: 1 }} onClick={() => { onSave({ ...sheet.doc, aiRead: true, status: 'processed' }); close(); }}>اعتماد النتائج</Btn>
          </>
        ) : undefined}>
        {sheet?.mode === 'ai' && (
          aiBusy ? (
            <div style={{ padding: '30px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#4c1d95', marginBottom: 14 }}>جارٍ قراءة المستند واستخراج البيانات...</div>
              <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#7c3aed,#2563eb)', borderRadius: 99, animation: 'mzProgress 1.6s ease forwards' }} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>📄 {sheet.doc.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {aiExtract(sheet.doc).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #eef2f6' }}>
                      <span style={{ color: 'var(--text-3)' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--ok-bg)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ok-text)', marginBottom: 10 }}>✨ إجراءات مقترحة — انقر للتنفيذ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {suggestedActions(sheet.doc.type).map(s => (
                    <button key={s.kind} onClick={() => { onAction(s.kind, sheet.doc); close(); }} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10,
                      border: '1px solid #bbf7d0', background: 'var(--surface)', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                    }}>
                      <span style={{ fontSize: 19 }}>{s.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.desc}</div>
                      </div>
                      <span style={{ color: '#86efac' }}>‹</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )
        )}
      </Sheet>
    </div>
  );
}
// ═══════════════════════════════════════════
//  TRACKINGS  (add by type / view / edit)
// ═══════════════════════════════════════════
function TrackingForm({ initial, projectId, projects, members, onSave, onCancel }: {
  initial?: Tracking; projectId: string; projects: Project[]; members: Member[];
  onSave: (t: Omit<Tracking, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? TRACKING_TYPES[0].id);
  const [targetProject, setTargetProject] = useState(initial?.projectId ?? projectId);
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [memberId, setMemberId] = useState(initial?.memberId ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const valid = name.trim().length > 0 && expiryDate.length > 0;
  const typeIcon = TRACKING_TYPES.find(t => t.id === type)?.icon ?? '🛡️';
  const projMembers = members.filter(m => m.projectId === targetProject);

  return (
    <>
      <Field label="نوع المتابعة">
        <TypePicker value={type} onChange={setType} options={TRACKING_TYPES.map(t => ({ v: t.id, l: t.id, icon: t.icon }))} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={v => { setTargetProject(v); setMemberId(''); }} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <Field label="الاسم">
        <TextInput value={name} onChange={setName} placeholder="مثال: ضمان الثلاجة" />
      </Field>
      <Field label="تاريخ الانتهاء">
        <TextInput type="date" value={expiryDate} onChange={setExpiryDate} />
      </Field>
      <Field label="إسناد لعضو (اختياري)">
        <Select value={memberId} onChange={setMemberId} options={[{ v: '', l: 'بدون إسناد' }, ...projMembers.map(m => ({ v: m.id, l: m.name }))]} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="رقم الضمان، الجهة، تفاصيل..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => {
          const d = daysBetween(expiryDate);
          onSave({ id: initial?.id, name: name.trim(), type, icon: initial?.icon ?? typeIcon, status: statusFromDays(d), daysLeft: d, expiryDate, projectId: targetProject, note, memberId: memberId || undefined, attachments });
        }}>{initial ? 'حفظ التعديلات' : 'إضافة المتابعة'}</Btn>
      </div>
    </>
  );
}

function Trackings({ projectId, projects, trackings, members, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate, presetName, presetType, helpEntry }: {
  projectId: string; projects: Project[]; trackings: Tracking[]; members: Member[];
  onSave: (t: Omit<Tracking, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; presetName?: string; presetType?: string; helpEntry?: HelpEntry;
}) {
  const [filter, setFilter] = useState<'all' | TrackingStatus>('all');
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [sort, setSort] = useState('soonest');
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit'; tr: Tracking }>(null);
  const all = trackings.filter(t => t.projectId === projectId);
  const types = Array.from(new Set(all.map(t => t.type)));
  const projMembers = members.filter(m => m.projectId === projectId);
  const filtered = all
    .filter(t => filter === 'all' ? true : t.status === filter)
    .filter(t => fType === 'all' ? true : t.type === fType)
    .filter(t => fMember === 'all' ? true : t.memberId === fMember)
    .filter(t => search.trim() === '' ? true : (t.name + t.type + (t.note ?? '')).includes(search.trim()))
    .sort((a, b) => sort === 'soonest' ? a.daysLeft - b.daysLeft : sort === 'latest' ? b.daysLeft - a.daysLeft : a.name.localeCompare(b.name));
  const counts = {
    all: all.length,
    active: all.filter(t => t.status === 'active').length,
    expiring: all.filter(t => t.status === 'expiring').length,
    expired: all.filter(t => t.status === 'expired').length,
  };
  const clearFilters = () => { setSearch(''); setFType('all'); setFMember('all'); setSort('soonest'); };
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader help={helpEntry} title="المتابعات والضمانات" subtitle="إدارة العقود والأصول والوثائق" action={<Btn size="sm" onClick={onOpenCreate}>+ إضافة متابعة</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { key: 'all', label: 'الكل', val: counts.all, color: 'var(--text-3)', bg: 'var(--surface-2)' },
          { key: 'active', label: 'نشط', val: counts.active, color: 'var(--ok-text)', bg: 'var(--ok-bg)' },
          { key: 'expiring', label: 'يوشك على الانتهاء', val: counts.expiring, color: 'var(--warn-text-2)', bg: 'var(--warn-bg)' },
          { key: 'expired', label: 'منتهي', val: counts.expired, color: 'var(--danger-text)', bg: 'var(--danger-bg)' },
        ].map(s => (
          <div key={s.key} onClick={() => setFilter(s.key as any)} style={{
            background: s.bg, borderRadius: 14, padding: '16px 18px', textAlign: 'center', cursor: 'pointer',
            outline: filter === s.key ? `2px solid ${s.color}` : 'none',
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: s.color, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في المتابعات..."
        values={{ type: fType, member: fMember, sort }}
        onChange={(k, v) => { if (k === 'type') setFType(v); else if (k === 'member') setFMember(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'type', placeholder: 'النوع', options: [{ v: 'all', l: 'كل الأنواع' }, ...types.map(t => ({ v: t, l: t }))] },
          { key: 'member', placeholder: 'العضو', options: [{ v: 'all', l: 'كل الأعضاء' }, ...projMembers.map(m => ({ v: m.id, l: m.name }))] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'soonest', l: 'الأقرب انتهاءً' }, { v: 'latest', l: 'الأبعد انتهاءً' }, { v: 'name', l: 'الاسم' }] },
        ]}
      />

      {filtered.length === 0 && (
        trackings.length === 0
          ? <EmptyState icon="◷" title="لا توجد متابعات بعد" hint="العقود والضمانات والتراخيص والوثائق الرسمية — أي شيء له تاريخ انتهاء. أضف أول متابعة لينبّهك النظام قبل الاستحقاق." actionLabel="+ إضافة أول متابعة" onAction={onOpenCreate} />
          : <EmptyState icon="🔍" title="لا توجد متابعات مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {filtered.map(t => {
          const pct = t.status === 'expired' ? 0 : Math.min(100, Math.max(2, Math.round((t.daysLeft / 365) * 100)));
          const barColor = t.status === 'expired' ? '#ef4444' : t.status === 'expiring' ? '#f59e0b' : '#22c55e';
          return (
            <Card key={t.id} dataHl={t.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.type}</div>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
                <span>ينتهي: {t.expiryDate}</span>
                <span style={{ color: t.status === 'expired' ? '#b91c1c' : t.status === 'expiring' ? '#a16207' : '#15803d', fontWeight: 500 }}>
                  {t.status === 'expired' ? 'منتهي منذ ' + Math.abs(t.daysLeft) + ' أيام' : 'يتبقى ' + t.daysLeft + ' يوم'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="outline" style={{ flex: 1, fontSize: 12 }} onClick={() => setSheet({ mode: 'view', tr: t })}>استعراض</Btn>
                <Btn size="sm" style={{ flex: 1, fontSize: 12 }} onClick={() => setSheet({ mode: 'edit', tr: t })}>✎ تعديل</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="متابعة جديدة">
        <TrackingForm key={presetName ?? 'new'} projectId={projectId} projects={projects} members={members}
          initial={presetName ? { id: '', name: presetName, type: presetType ?? TRACKING_TYPES[0].id, icon: TRACKING_TYPES.find(x => x.id === presetType)?.icon ?? '🛡️', status: 'active', daysLeft: 0, expiryDate: '', projectId } : undefined}
          onSave={(t) => { onSave(t); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل المتابعة">
        {sheet?.mode === 'edit' && <TrackingForm key={sheet.tr.id} initial={sheet.tr} projectId={projectId} projects={projects} members={members} onSave={(t) => { onSave(t); close(); }} onCancel={close} />}
      </Sheet>

      {/* View */}
      <Sheet open={sheet?.mode === 'view'} onClose={close} title="تفاصيل المتابعة"
        footer={sheet?.mode === 'view' ? (
          <>
            <Btn variant="danger" onClick={() => { onDelete(sheet.tr.id); close(); }}>🗑️ حذف</Btn>
            <Btn variant="outline" style={{ flex: 1 }} onClick={() => setSheet({ mode: 'edit', tr: sheet.tr })}>✎ تعديل</Btn>
            {(sheet.tr.status === 'expiring' || sheet.tr.status === 'expired') && <Btn style={{ flex: 1 }} onClick={close}>🔄 تجديد</Btn>}
          </>
        ) : undefined}>
        {sheet?.mode === 'view' && (() => {
          const t = sheet.tr;
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <span style={{ fontSize: 40 }}>{t.icon}</span>
                <div><div style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div><div style={{ fontSize: 13, color: 'var(--text-3)' }}>{t.type}</div></div>
                <div style={{ marginRight: 'auto' }}><StatusBadge status={t.status} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['تاريخ الانتهاء', t.expiryDate], ['المتبقي', t.status === 'expired' ? `منتهي منذ ${Math.abs(t.daysLeft)} يوم` : `${t.daysLeft} يوم`], ['أضافها', t.createdBy ?? CURRENT_USER], ...(t.note ? [['ملاحظات', t.note]] : [])].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 9, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 500, color: 'var(--text-2)', textAlign: 'left' }}>{v}</span>
                  </div>
                ))}
              </div>
              {t.attachments && t.attachments.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({t.attachments.length})</div>
                  <AttachmentView items={t.attachments} />
                </div>
              )}
            </>
          );
        })()}
      </Sheet>
    </div>
  );
}
// ═══════════════════════════════════════════
//  REQUESTS  (add by type / view / edit)
// ═══════════════════════════════════════════
function RequestForm({ initial, projectId, projects, members, onSave, onCancel }: {
  initial?: RequestItem; projectId: string; projects: Project[]; members: Member[];
  onSave: (r: Omit<RequestItem, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState(initial?.type ?? REQUEST_TYPES[0]);
  const [targetProject, setTargetProject] = useState(initial?.projectId ?? projectId);
  const [amount, setAmount] = useState<number | ''>(initial?.amount ?? '');
  const [requestedBy, setRequestedBy] = useState(initial?.requestedBy ?? 'محمد العمري');
  const [note, setNote] = useState(initial?.note ?? '');
  const [memberId, setMemberId] = useState(initial?.memberId ?? '');
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments ?? []);
  const valid = title.trim().length > 0 && amount !== '' && Number(amount) > 0;
  const projMembers = members.filter(m => m.projectId === targetProject);

  return (
    <>
      <Field label="نوع الطلب">
        <TypePicker value={type} onChange={setType} options={REQUEST_TYPES.map(t => ({ v: t, l: t }))} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={v => { setTargetProject(v); setMemberId(''); }} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <Field label="عنوان الطلب">
        <TextInput value={title} onChange={setTitle} placeholder="مثال: طلب صرف مصروفات السفر" />
      </Field>
      <Field label="المبلغ (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      <Field label="مقدّم الطلب">
        <TextInput value={requestedBy} onChange={setRequestedBy} placeholder="الاسم" />
      </Field>
      <Field label="إسناد لعضو (اختياري)">
        <Select value={memberId} onChange={setMemberId} options={[{ v: '', l: 'بدون إسناد' }, ...projMembers.map(m => ({ v: m.id, l: m.name }))]} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="مبرر الطلب أو تفاصيل..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, title: title.trim(), type, amount: amount === '' ? 0 : amount,
          requestedBy, status: initial?.status ?? 'pending', date: initial?.date ?? today(), projectId: targetProject, note, memberId: memberId || undefined, attachments,
        })}>{initial ? 'حفظ التعديلات' : 'إرسال الطلب'}</Btn>
      </div>
    </>
  );
}

function Requests({ projectId, projects, requests, members, onDecide, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate, helpEntry }: {
  projectId: string; projects: Project[]; requests: RequestItem[]; members: Member[];
  onDecide: (id: string, status: RequestStatus) => void;
  onSave: (r: Omit<RequestItem, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; helpEntry?: HelpEntry;
}) {
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [sort, setSort] = useState('newest');
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit'; req: RequestItem }>(null);
  const reqs = requests.filter(r => r.projectId === projectId);
  const types = Array.from(new Set(reqs.map(r => r.type)));
  const projMembers = members.filter(m => m.projectId === projectId);
  const filtered = reqs
    .filter(r => filter === 'all' ? true : r.status === filter)
    .filter(r => fType === 'all' ? true : r.type === fType)
    .filter(r => fMember === 'all' ? true : r.memberId === fMember)
    .filter(r => search.trim() === '' ? true : (r.title + r.requestedBy + (r.note ?? '')).includes(search.trim()))
    .sort((a, b) => sort === 'newest' ? b.date.localeCompare(a.date) : sort === 'oldest' ? a.date.localeCompare(b.date) : b.amount - a.amount);
  const clearFilters = () => { setSearch(''); setFType('all'); setFMember('all'); setSort('newest'); };
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader help={helpEntry} title="الطلبات والموافقات" subtitle="إدارة دورة الاعتماد" action={<Btn size="sm" onClick={onOpenCreate}>+ طلب جديد</Btn>} />

      {reqs.length > 0 && (() => {
        const pending = reqs.filter(r => r.status === 'pending');
        const approved = reqs.filter(r => r.status === 'approved');
        const rejected = reqs.filter(r => r.status === 'rejected');
        const decided = approved.length + rejected.length;
        const approvalRate = decided > 0 ? Math.round((approved.length / decided) * 100) : 0;
        const approvedAmount = approved.reduce((s, r) => s + r.amount, 0);
        const pendingAmount = pending.reduce((s, r) => s + r.amount, 0);
        return (
          <>
            <StatCards cards={[
              { label: 'إجمالي الطلبات', value: reqs.length, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '📋' },
              { label: 'معلقة', value: pending.length, color: 'var(--warn-text-2)', bg: 'var(--warn-bg)', icon: '⏳' },
              { label: 'معتمدة', value: approved.length, color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '✅' },
              { label: 'نسبة الاعتماد', value: approvalRate + '%', color: 'var(--purple-text)', bg: 'var(--purple-bg)', icon: '📊' },
            ]} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16, marginBottom: 22 }}>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>توزيع الطلبات حسب الحالة</div>
                <Donut segments={[
                  { value: pending.length, color: '#f59e0b', label: 'معلقة' },
                  { value: approved.length, color: '#22c55e', label: 'معتمدة' },
                  { value: rejected.length, color: '#ef4444', label: 'مرفوضة' },
                ]} label="طلب" />
              </Card>
              <Card>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>المبالغ حسب الحالة</div>
                <StatBars bars={[
                  { label: 'معتمدة (ر.س)', value: Math.round(approvedAmount), color: '#22c55e' },
                  { label: 'معلقة (ر.س)', value: Math.round(pendingAmount), color: '#f59e0b' },
                ]} />
              </Card>
            </div>
          </>
        );
      })()}

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ['pending', 'معلقة'], ['approved', 'معتمدة'], ['rejected', 'مرفوضة']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as any)} style={{
            padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: filter === val ? '#fff' : 'transparent', color: filter === val ? '#111827' : '#6b7280',
            boxShadow: filter === val ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في الطلبات..."
        values={{ type: fType, member: fMember, sort }}
        onChange={(k, v) => { if (k === 'type') setFType(v); else if (k === 'member') setFMember(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'type', placeholder: 'النوع', options: [{ v: 'all', l: 'كل الأنواع' }, ...types.map(t => ({ v: t, l: t }))] },
          { key: 'member', placeholder: 'العضو', options: [{ v: 'all', l: 'كل الأعضاء' }, ...projMembers.map(m => ({ v: m.id, l: m.name }))] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'newest', l: 'الأحدث' }, { v: 'oldest', l: 'الأقدم' }, { v: 'amount', l: 'الأعلى مبلغاً' }] },
        ]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          requests.length === 0
            ? <EmptyState icon="◫" title="لا توجد طلبات بعد" hint="الطلبات تطبّق الحوكمة: طلب صرف أو تحويل أو عهدة يمرّ بدورة اعتماد قبل التنفيذ. أنشئ أول طلب لتفعيل الرقابة على العمليات." actionLabel="+ إنشاء أول طلب" onAction={onOpenCreate} />
            : <EmptyState icon="🔍" title="لا توجد طلبات مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
        )}
        {filtered.map(r => (
          <Card key={r.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSheet({ mode: 'view', req: r })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, background: 'var(--surface-3)', color: '#64748b', padding: '2px 8px', borderRadius: 99 }}>{r.type}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>طلب بواسطة: {r.requestedBy} · {r.date}</div>
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{fmtNum(r.amount)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ر.س</div>
              </div>
            </div>
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => onDecide(r.id, 'approved')} style={{ flex: 1, padding: 8, borderRadius: 10, background: '#15803d', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓ اعتماد</button>
                <button onClick={() => onDecide(r.id, 'rejected')} style={{ flex: 1, padding: 8, borderRadius: 10, background: 'var(--danger-bg)', color: 'var(--danger-text)', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                <button onClick={() => setSheet({ mode: 'edit', req: r })} style={{ padding: '8px 16px', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✎ تعديل</button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="طلب جديد">
        <RequestForm projectId={projectId} projects={projects} members={members} onSave={(r) => { onSave(r); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل الطلب">
        {sheet?.mode === 'edit' && <RequestForm key={sheet.req.id} initial={sheet.req} projectId={projectId} projects={projects} members={members} onSave={(r) => { onSave(r); close(); }} onCancel={close} />}
      </Sheet>

      {/* View */}
      <Sheet open={sheet?.mode === 'view'} onClose={close} title="تفاصيل الطلب"
        footer={sheet?.mode === 'view' ? (
          <>
            <Btn variant="danger" onClick={() => { onDelete(sheet.req.id); close(); }}>🗑️ حذف</Btn>
            {sheet.req.status === 'pending' && <Btn variant="outline" style={{ flex: 1 }} onClick={() => setSheet({ mode: 'edit', req: sheet.req })}>✎ تعديل</Btn>}
            {sheet.req.status === 'pending' && <Btn variant="success" style={{ flex: 1 }} onClick={() => { onDecide(sheet.req.id, 'approved'); close(); }}>✓ اعتماد</Btn>}
          </>
        ) : undefined}>
        {sheet?.mode === 'view' && (() => {
          const r = sheet.req;
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, background: 'var(--surface-3)', color: '#64748b', padding: '3px 10px', borderRadius: 99 }}>{r.type}</span>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--info-text)', marginBottom: 16 }}>{fmt(r.amount)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['مقدّم الطلب', r.requestedBy], ['التاريخ', r.date], ['أضافها', r.createdBy ?? CURRENT_USER], ...(r.note ? [['ملاحظات', r.note]] : [])].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 9, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 500, color: 'var(--text-2)', textAlign: 'left' }}>{v}</span>
                  </div>
                ))}
              </div>
              {r.attachments && r.attachments.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({r.attachments.length})</div>
                  <AttachmentView items={r.attachments} />
                </div>
              )}
            </>
          );
        })()}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════
function Notifications({ notifs, projects, members, onMarkRead, onMarkAll, onNav, onNavigate }: { notifs: Notif[]; projects: Project[]; members: Member[]; onMarkRead: (id: string) => void; onMarkAll: () => void; onNav: (p: Page) => void; onNavigate: (p: Page, itemId?: string, projId?: string) => void }) {
  const icons: Record<string, string> = { warning: '⚠️', info: 'ℹ️', danger: '🔴', success: '✅' };
  const colors: Record<string, string> = { warning: 'var(--warn-bg)', info: 'var(--info-bg)', danger: 'var(--danger-bg)', success: 'var(--ok-bg)' };
  const linkLabel: Record<string, string> = { trackings: 'المتابعات', requests: 'الطلبات', documents: 'المستندات', finance: 'المالية', projects: 'المشاريع', projectDetail: 'المشروع' };
  const sectionLabel: Record<string, string> = { trackings: 'متابعات', requests: 'طلبات', documents: 'مستندات', finance: 'مالية', members: 'أعضاء' };

  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('all');
  const [fSection, setFSection] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [fRead, setFRead] = useState('all');
  const [fPeriod, setFPeriod] = useState('all');
  const [sort, setSort] = useState('newest');

  const inPeriod = (ts?: string) => {
    if (fPeriod === 'all' || !ts) return true;
    const d = new Date(ts.replace(' ', 'T')); const now = new Date('2025-06-26T23:59');
    const days = (now.getTime() - d.getTime()) / 86400000;
    if (fPeriod === 'today') return days <= 1;
    if (fPeriod === 'week') return days <= 7;
    if (fPeriod === 'month') return days <= 31;
    if (fPeriod === 'quarter') return days <= 92;
    return true;
  };

  const filtered = notifs
    .filter(n => fProject === 'all' ? true : n.projectId === fProject)
    .filter(n => fSection === 'all' ? true : n.section === fSection)
    .filter(n => fMember === 'all' ? true : n.memberId === fMember)
    .filter(n => fRead === 'all' ? true : fRead === 'read' ? n.read : !n.read)
    .filter(n => inPeriod(n.ts))
    .filter(n => search.trim() === '' ? true : (n.title + n.body).includes(search.trim()))
    .sort((a, b) => {
      const ta = a.ts ?? '', tb = b.ts ?? '';
      return sort === 'newest' ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });

  const clearFilters = () => { setSearch(''); setFProject('all'); setFSection('all'); setFMember('all'); setFRead('all'); setFPeriod('all'); };
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageHeader title="الإشعارات والتنبيهات" subtitle={`${unreadCount} غير مقروء من ${notifs.length}`} action={<Btn size="sm" variant="outline" onClick={onMarkAll}>✓ تعليم الكل كمقروء</Btn>} />

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في الإشعارات..."
        values={{ project: fProject, section: fSection, member: fMember, read: fRead, period: fPeriod, sort }}
        onChange={(k, v) => { if (k === 'project') setFProject(v); else if (k === 'section') setFSection(v); else if (k === 'member') setFMember(v); else if (k === 'read') setFRead(v); else if (k === 'period') setFPeriod(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'project', placeholder: 'المشروع', options: [{ v: 'all', l: 'كل المشاريع' }, ...projects.map(p => ({ v: p.id, l: p.name }))] },
          { key: 'section', placeholder: 'القسم', options: [{ v: 'all', l: 'كل الأقسام' }, { v: 'trackings', l: 'متابعات' }, { v: 'requests', l: 'طلبات' }, { v: 'documents', l: 'مستندات' }, { v: 'finance', l: 'مالية' }, { v: 'members', l: 'أعضاء' }] },
          { key: 'member', placeholder: 'العضو', options: [{ v: 'all', l: 'كل الأعضاء' }, ...members.map(m => ({ v: m.id, l: m.name }))] },
          { key: 'read', placeholder: 'الحالة', options: [{ v: 'all', l: 'الكل' }, { v: 'unread', l: 'غير مقروء' }, { v: 'read', l: 'مقروء' }] },
          { key: 'period', placeholder: 'الفترة', options: [{ v: 'all', l: 'كل الفترات' }, { v: 'today', l: 'اليوم' }, { v: 'week', l: 'آخر أسبوع' }, { v: 'month', l: 'آخر شهر' }, { v: 'quarter', l: 'آخر ربع' }] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'newest', l: 'الأحدث أولاً' }, { v: 'oldest', l: 'الأقدم أولاً' }] },
        ]}
      />

      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>عرض {filtered.length} إشعار</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            <div style={{ fontSize: 14 }}>لا توجد إشعارات مطابقة للفلترة</div>
          </Card>
        )}
        {filtered.map(n => {
          const proj = projects.find(p => p.id === n.projectId);
          return (
          <div key={n.id} style={{
            background: n.read ? 'var(--surface)' : colors[n.type], borderRadius: 14, padding: '14px 18px',
            border: `1px solid ${n.read ? 'var(--border)' : 'transparent'}`, display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all .2s',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icons[n.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, color: 'var(--text)' }}>{n.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{n.time}</div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{n.body}</div>
              {/* meta chips: project + section */}
              {(proj || n.section) && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {proj && <span style={{ fontSize: 10.5, background: 'var(--surface-3)', color: 'var(--text-3)', padding: '2px 8px', borderRadius: 99 }}>{proj.icon} {proj.name}</span>}
                  {n.section && sectionLabel[n.section] && <span style={{ fontSize: 10.5, background: 'var(--surface-3)', color: 'var(--text-3)', padding: '2px 8px', borderRadius: 99 }}>{sectionLabel[n.section]}</span>}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {n.link && (
                  <button onClick={() => { onMarkRead(n.id); onNavigate(n.link!, n.itemId, n.projectId); }} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    استعراض في {linkLabel[n.link] ?? 'القسم'} ‹
                  </button>
                )}
                {!n.read && <button onClick={() => onMarkRead(n.id)} style={{ background: 'var(--surface-3)', color: 'var(--text-3)', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>تعليم كمقروء</button>}
              </div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: 99, background: '#2563eb', flexShrink: 0, marginTop: 5 }} />}
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//  CUSTOMIZE (لوحة القوائم المخصّصة)
// ═══════════════════════════════════════════
function Customize({ lists, onChange, help, onHelpChange, healthData, onNav, onNavigate, documents = [] }: { lists: CustomLists; onChange: (l: CustomLists) => void; help: HelpTexts; onHelpChange: (h: HelpTexts) => void; healthData: Parameters<typeof runHealthCheck>[0]; onNav: (p: Page) => void; onNavigate: (p: Page, itemId?: string, projId?: string) => void; documents?: DocItem[] }) {
  const sections: { key: keyof CustomLists; title: string; icon: string; desc: string; placeholder: string }[] = [
    { key: 'txCategories', title: 'التصنيفات المالية', icon: '🏷️', desc: 'تصنيفات الإيرادات والمصروفات في الإدارة المالية', placeholder: 'مثال: تبرعات' },
    { key: 'projectTypes', title: 'أنواع المشاريع', icon: '⬡', desc: 'الأنواع المتاحة عند إنشاء مشروع جديد', placeholder: 'مثال: عيادة' },
    { key: 'docTypes', title: 'أنواع المستندات', icon: '◻', desc: 'الأنواع المتاحة عند رفع مستند', placeholder: 'مثال: شهادة' },
    { key: 'partyTypes', title: 'فئات الأطراف (الذمم)', icon: '⇄', desc: 'فئات تصنيف أطراف الذمم (للتنظيم)', placeholder: 'مثال: مقاول' },
  ];
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [delTarget, setDelTarget] = useState<null | { key: keyof CustomLists; item: string }>(null);

  // is this value a built-in (system) category? built-ins can't be deleted/edited.
  const isSystem = (key: keyof CustomLists, item: string) => DEFAULT_LISTS[key].includes(item);

  // count how many records currently use a given category value (to guard deletion)
  const usageOf = (key: keyof CustomLists, item: string): { active: number; total: number } => {
    let total = 0, active = 0;
    if (key === 'txCategories') {
      const used = healthData.transactions.filter(t => t.category === item);
      total = used.length; active = used.length; // all transactions are considered active records
    } else if (key === 'projectTypes') {
      const used = healthData.projects.filter(p => p.type === item);
      total = used.length; active = used.length;
    } else if (key === 'docTypes') {
      const used = documents.filter(d => d.type === item);
      total = used.length; active = used.length;
    } else if (key === 'partyTypes') {
      total = 0; active = 0; // party types are organizational labels, not hard-linked
    }
    return { active, total };
  };

  const addItem = (key: keyof CustomLists) => {
    const val = (drafts[key] ?? '').trim();
    if (!val || lists[key].includes(val)) { setDrafts(d => ({ ...d, [key]: '' })); return; }
    onChange({ ...lists, [key]: [...lists[key], val] });
    setDrafts(d => ({ ...d, [key]: '' }));
  };
  const confirmDelete = (key: keyof CustomLists, item: string) => {
    onChange({ ...lists, [key]: lists[key].filter(x => x !== item) });
    setDelTarget(null);
  };
  const requestDelete = (key: keyof CustomLists, item: string) => {
    const u = usageOf(key, item);
    if (u.active > 0) { setDelTarget({ key, item }); }  // has active links → confirm dialog
    else confirmDelete(key, item);                       // no links → delete immediately
  };

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <PageHeader title="التخصيص" subtitle="إدارة القوائم المخصّصة المستخدمة في كل الأقسام" />

      <HealthCheck data={healthData} onNavigate={onNavigate} />

      <Card style={{ marginBottom: 16, background: 'var(--info-bg)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, color: 'var(--info-text)', lineHeight: 1.8 }}>
          ℹ️ تنقسم كل قائمة إلى <b>تصنيفات النظام</b> (أساسية وثابتة، لا يمكن حذفها) و<b>تصنيفاتك</b> (تضيفها وتحذفها). لا يمكن حذف تصنيف مرتبط بعمليات نشطة قبل مراجعتها.
        </div>
      </Card>

      {sections.map(s => {
        const systemItems = lists[s.key].filter(i => isSystem(s.key, i));
        const userItems = lists[s.key].filter(i => !isSystem(s.key, i));
        return (
          <Card key={s.key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>

            {/* system categories (locked) */}
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>🔒 تصنيفات النظام (ثابتة)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {systemItems.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>لا يوجد.</span>}
              {systemItems.map(item => (
                <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--surface-3)', borderRadius: 99, padding: '5px 12px', fontSize: 12.5, color: 'var(--text-2)' }}>
                  <span style={{ fontSize: 10, opacity: .6 }}>🔒</span>{item}
                </span>
              ))}
            </div>

            {/* user categories (deletable) */}
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-3)', marginBottom: 8 }}>✎ تصنيفاتي (قابلة للحذف)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {userItems.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>لم تُضِف تصنيفات بعد.</span>}
              {userItems.map(item => {
                const u = usageOf(s.key, item);
                return (
                  <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--purple-bg)', borderRadius: 99, padding: '5px 8px 5px 12px', fontSize: 12.5, color: 'var(--purple-text)' }}>
                    {item}
                    {u.total > 0 && <span style={{ fontSize: 10, background: 'var(--surface)', borderRadius: 99, padding: '1px 6px', color: 'var(--text-3)' }}>{u.total}</span>}
                    <button onClick={() => requestDelete(s.key, item)} title="حذف" style={{ background: 'var(--surface)', border: 'none', borderRadius: 99, width: 20, height: 20, cursor: 'pointer', fontSize: 11, color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑️</button>
                  </span>
                );
              })}
            </div>

            {/* add */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={drafts[s.key] ?? ''}
                onChange={e => setDrafts(d => ({ ...d, [s.key]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addItem(s.key); }}
                placeholder={s.placeholder}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }}
              />
              <Btn size="sm" onClick={() => addItem(s.key)}>+ إضافة</Btn>
            </div>
          </Card>
        );
      })}

      {/* delete confirmation dialog (when category is linked to active records) */}
      <Sheet open={!!delTarget} onClose={() => setDelTarget(null)} title="تأكيد حذف التصنيف">
        {delTarget && (() => {
          const u = usageOf(delTarget.key, delTarget.item);
          const navPage: Page = delTarget.key === 'txCategories' ? 'finance' : delTarget.key === 'projectTypes' ? 'projects' : delTarget.key === 'docTypes' ? 'documents' : 'receivables';
          return (
            <div>
              <div style={{ background: 'var(--warn-bg)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warn-text)', marginBottom: 6 }}>⚠️ التصنيف «{delTarget.item}» مرتبط ببيانات</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
                  يوجد <b>{u.total}</b> عنصر مرتبط بهذا التصنيف. حذفه لن يحذف هذه العناصر، لكنها ستبقى بتصنيف غير معرّف.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn variant="outline" onClick={() => { setDelTarget(null); onNavigate(navPage); }}>↗ استعراض العناصر المرتبطة</Btn>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn variant="outline" style={{ flex: 1 }} onClick={() => setDelTarget(null)}>إلغاء</Btn>
                  <Btn style={{ flex: 1, background: 'var(--danger-text)' }} onClick={() => confirmDelete(delTarget.key, delTarget.item)}>تأكيد الحذف</Btn>
                </div>
              </div>
            </div>
          );
        })()}
      </Sheet>

      {/* ── help texts management (شرح الأقسام) ── */}
      <div style={{ marginTop: 32, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>شروحات الأقسام</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>عدّل نص الشرح الذي يظهر عند نقر أيقونة (ⓘ) بجانب عنوان كل قسم، أو أخفِه</div>
        </div>
      </div>

      {(Object.keys(help) as HelpKey[]).map(key => {
        const entry = help[key];
        return (
          <Card key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
              <input
                value={entry.title}
                onChange={e => onHelpChange({ ...help, [key]: { ...entry, title: e.target.value } })}
                style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)', background: 'transparent', border: 'none', borderBottom: '1px solid transparent', fontFamily: 'inherit', padding: '2px 0' }}
                onFocus={e => e.target.style.borderBottomColor = 'var(--border)'}
                onBlur={e => e.target.style.borderBottomColor = 'transparent'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{entry.show ? 'ظاهر' : 'مخفي'}</span>
                <button onClick={() => onHelpChange({ ...help, [key]: { ...entry, show: !entry.show } })} style={{ width: 44, height: 24, borderRadius: 99, border: 'none', background: entry.show ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
                  <span style={{ position: 'absolute', top: 3, [entry.show ? 'left' : 'right']: 3, width: 18, height: 18, borderRadius: 99, background: '#fff' } as React.CSSProperties} />
                </button>
              </div>
            </div>
            <textarea
              value={entry.body}
              onChange={e => onHelpChange({ ...help, [key]: { ...entry, body: e.target.value } })}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.8, background: 'var(--surface-2)', color: 'var(--text-2)', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: 8, textAlign: 'left' }}>
              <button onClick={() => onHelpChange({ ...help, [key]: DEFAULT_HELP[key] })} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>استعادة النص الافتراضي</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
//  INTEGRATIONS (التكاملات — نقاط ربط مستقبلية)
// ═══════════════════════════════════════════
const INTEGRATION_GROUPS: { group: string; icon: string; items: { name: string; desc: string }[] }[] = [
  { group: 'التخزين السحابي', icon: '☁️', items: [
    { name: 'Google Drive', desc: 'مزامنة المستندات والمرفقات' },
    { name: 'OneDrive', desc: 'نسخ احتياطي للملفات' },
    { name: 'Dropbox', desc: 'تخزين ومشاركة المستندات' },
  ]},
  { group: 'الاتصالات', icon: '✉️', items: [
    { name: 'البريد الإلكتروني', desc: 'إرسال التنبيهات والدعوات' },
    { name: 'WhatsApp', desc: 'إشعارات فورية للأعضاء' },
    { name: 'SMS', desc: 'رسائل نصية للتذكيرات' },
  ]},
  { group: 'التقويمات', icon: '📅', items: [
    { name: 'Google Calendar', desc: 'مزامنة الاستحقاقات والمواعيد' },
    { name: 'Outlook Calendar', desc: 'تذكيرات التجديد والصيانة' },
  ]},
  { group: 'الأنظمة المحاسبية', icon: '📊', items: [
    { name: 'QuickBooks', desc: 'مزامنة العمليات المالية' },
    { name: 'Zoho Books', desc: 'تكامل الفواتير والحسابات' },
    { name: 'Xero', desc: 'ربط الدفاتر المحاسبية' },
  ]},
  { group: 'أنظمة CRM', icon: '🤝', items: [
    { name: 'HubSpot', desc: 'ربط العملاء والذمم' },
    { name: 'Salesforce', desc: 'مزامنة بيانات العملاء' },
    { name: 'Zoho CRM', desc: 'إدارة العلاقات' },
  ]},
  { group: 'أنظمة ERP', icon: '🏭', items: [
    { name: 'Odoo', desc: 'تكامل العمليات المؤسسية' },
    { name: 'SAP', desc: 'ربط موارد المنشأة' },
    { name: 'Oracle / Dynamics', desc: 'أنظمة المؤسسات الكبرى' },
  ]},
  { group: 'تتبّع الأصول (GPS)', icon: '📍', items: [
    { name: 'تتبّع المركبات', desc: 'موقع وحالة المركبات' },
    { name: 'تتبّع المعدات', desc: 'مراقبة الأصول الميدانية' },
  ]},
];

function Integrations({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>‹ رجوع للإعدادات</button>
      <PageHeader title="التكاملات" subtitle="ربط موازين بأنظمتك وخدماتك الخارجية" />

      <Card style={{ marginBottom: 16, background: 'var(--info-bg)', border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, color: 'var(--info-text)', lineHeight: 1.8 }}>
          🔌 التكاملات قيد التطوير وستتوفّر تدريجياً. ستتيح لك ربط موازين بأنظمة التخزين والاتصالات والمحاسبة وإدارة العملاء لتقليل الإدخال اليدوي ومزامنة بياناتك تلقائياً.
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {INTEGRATION_GROUPS.map(g => (
          <Card key={g.group}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>{g.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{g.group}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {g.items.map(it => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-3)', fontWeight: 600, flexShrink: 0 }}>قريباً</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// color customization panel: presets + per-variable color pickers + reset
// ── Surveys: list, create from template, customize questions, fill (respond), view results ──
function Surveys({ surveys, projects, onSave, onDelete, openCreate, onCloseCreate, onOpenCreate }: {
  surveys: Survey[]; projects: Project[];
  onSave: (s: Survey) => void; onDelete: (id: string) => void;
  openCreate: boolean; onCloseCreate: () => void; onOpenCreate: () => void;
}) {
  const [view, setView] = useState<null | { mode: 'results' | 'fill' | 'share'; survey: Survey }>(null);
  const [builder, setBuilder] = useState<null | Survey>(null); // survey being built/edited

  const projName = (id?: string) => projects.find(p => p.id === id)?.name ?? 'عام';
  const statusInfo = (s: Survey['status']) => s === 'active' ? { l: 'نشط', c: 'var(--ok-text)', bg: 'var(--ok-bg)' } : s === 'closed' ? { l: 'مغلق', c: 'var(--text-3)', bg: 'var(--surface-3)' } : { l: 'مسودّة', c: 'var(--warn-text)', bg: 'var(--warn-bg)' };

  // start a new survey from a template
  const startFromTemplate = (tpl: typeof SURVEY_TEMPLATES[number]) => {
    setBuilder({
      id: uid('sv'), title: tpl.name, surveyType: tpl.id, description: tpl.desc,
      questions: tpl.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })),
      responses: [], status: 'draft', createdAt: today(),
    });
    onCloseCreate();
  };
  const startBlank = () => {
    setBuilder({ id: uid('sv'), title: '', surveyType: 'custom', questions: [{ id: 'q1', text: '', kind: 'text' }], responses: [], status: 'draft', createdAt: today() });
    onCloseCreate();
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="الاستبيانات" subtitle="أنشئ استبيانات، شاركها داخلياً، وحلّل النتائج" action={<Btn size="sm" onClick={onOpenCreate}>+ استبيان جديد</Btn>} />

      {surveys.length === 0 ? (
        <EmptyState icon="📊" title="لا توجد استبيانات بعد" desc="أنشئ أول استبيان من قالب جاهز أو من الصفر." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {surveys.map(s => {
            const si = statusInfo(s.status);
            const tpl = SURVEY_TEMPLATES.find(t => t.id === s.surveyType);
            return (
              <Card key={s.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 26 }}>{tpl?.icon ?? '📋'}</span>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: si.bg, color: si.c, fontWeight: 600 }}>{si.l}</span>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{projName(s.projectId)} · {s.questions.length} أسئلة</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent, #2563eb)' }}>{s.responses.length}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>إجابة{s.maxResponses ? ` / ${s.maxResponses}` : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn size="sm" variant="outline" style={{ flex: 1, fontSize: 11.5 }} onClick={() => setView({ mode: 'results', survey: s })}>📊 النتائج</Btn>
                  <Btn size="sm" style={{ flex: 1, fontSize: 11.5 }} onClick={() => setView({ mode: 'fill', survey: s })}>✍️ إجابة</Btn>
                  <Btn size="sm" variant="outline" style={{ fontSize: 11.5 }} onClick={() => setView({ mode: 'share', survey: s })}>🔗</Btn>
                  <Btn size="sm" variant="outline" style={{ fontSize: 11.5 }} onClick={() => setBuilder(s)}>✎</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* create: choose template */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="استبيان جديد">
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>اختر قالباً جاهزاً للبدء سريعاً، أو ابدأ من الصفر:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SURVEY_TEMPLATES.map(tpl => (
            <button key={tpl.id} onClick={() => startFromTemplate(tpl)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
              <span style={{ fontSize: 26 }}>{tpl.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{tpl.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{tpl.desc} · {tpl.questions.length} أسئلة</div>
              </div>
              <span style={{ color: 'var(--text-3)' }}>‹</span>
            </button>
          ))}
          <button onClick={startBlank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
            <span style={{ fontSize: 26 }}>➕</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>من الصفر</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>أنشئ استبياناً بأسئلتك الخاصة</div></div>
          </button>
        </div>
      </Sheet>

      {/* builder */}
      {builder && <SurveyBuilder survey={builder} projects={projects} onClose={() => setBuilder(null)} onSave={(s) => { onSave(s); setBuilder(null); }} onDelete={(id) => { onDelete(id); setBuilder(null); }} />}

      {/* results / fill / share */}
      {view?.mode === 'results' && <SurveyResults survey={view.survey} onClose={() => setView(null)} />}
      {view?.mode === 'fill' && <SurveyFill survey={view.survey} onClose={() => setView(null)} onSubmit={(resp) => { onSave({ ...view.survey, responses: [...view.survey.responses, resp] }); setView(null); }} />}
      {view?.mode === 'share' && <SurveyShare survey={view.survey} onClose={() => setView(null)} />}
    </div>
  );
}

// survey builder: edit title, questions (add/remove/reorder kinds), settings
function SurveyBuilder({ survey, projects, onClose, onSave, onDelete }: { survey: Survey; projects: Project[]; onClose: () => void; onSave: (s: Survey) => void; onDelete: (id: string) => void }) {
  const [title, setTitle] = useState(survey.title);
  const [projectId, setProjectId] = useState(survey.projectId ?? '');
  const [status, setStatus] = useState<Survey['status']>(survey.status);
  const [questions, setQuestions] = useState<SurveyQuestion[]>(survey.questions);
  const [maxResp, setMaxResp] = useState<number | ''>(survey.maxResponses ?? '');

  const addQ = () => setQuestions(qs => [...qs, { id: uid('q'), text: '', kind: 'text' }]);
  const updateQ = (id: string, patch: Partial<SurveyQuestion>) => setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...patch } : q));
  const removeQ = (id: string) => setQuestions(qs => qs.filter(q => q.id !== id));
  const kindLabel = { single: 'اختيار واحد', multi: 'متعدّد', rating: 'تقييم (نجوم)', text: 'نص حر' };

  return (
    <Sheet open onClose={onClose} title={survey.responses.length > 0 ? 'تعديل الاستبيان' : 'بناء الاستبيان'}>
      <Field label="عنوان الاستبيان"><TextInput value={title} onChange={setTitle} placeholder="مثال: استبيان رضا العملاء" /></Field>
      <Field label="المشروع (اختياري)">
        <Select value={projectId} onChange={setProjectId} options={[{ v: '', l: 'عام (بدون مشروع)' }, ...projects.map(p => ({ v: p.id, l: p.name }))]} />
      </Field>
      <Field label="الحالة">
        <Select value={status} onChange={v => setStatus(v as Survey['status'])} options={[{ v: 'draft', l: 'مسودّة' }, { v: 'active', l: 'نشط' }, { v: 'closed', l: 'مغلق' }]} />
      </Field>
      <Field label="حد أقصى للإجابات (اختياري)"><NumInput value={maxResp} onChange={setMaxResp} placeholder="بدون حد" /></Field>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '16px 0 10px' }}>الأسئلة ({questions.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>{i + 1}.</span>
              <input value={q.text} onChange={e => updateQ(q.id, { text: e.target.value })} placeholder="نص السؤال" style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, background: 'var(--surface)', color: 'var(--text)' }} />
              <button onClick={() => removeQ(q.id)} style={{ background: 'var(--danger-bg)', border: 'none', borderRadius: 7, width: 30, height: 30, cursor: 'pointer', color: 'var(--danger-text)', flexShrink: 0 }}>🗑️</button>
            </div>
            <Select value={q.kind} onChange={v => updateQ(q.id, { kind: v as SurveyQuestion['kind'], options: (v === 'single' || v === 'multi') ? (q.options ?? ['خيار 1', 'خيار 2']) : undefined })} options={Object.entries(kindLabel).map(([v, l]) => ({ v, l }))} />
            {(q.kind === 'single' || q.kind === 'multi') && (
              <div style={{ marginTop: 8 }}>
                <input value={(q.options ?? []).join('، ')} onChange={e => updateQ(q.id, { options: e.target.value.split('،').map(x => x.trim()).filter(Boolean) })} placeholder="الخيارات مفصولة بفاصلة عربية ،" style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 12, background: 'var(--surface-2)', color: 'var(--text-2)', boxSizing: 'border-box' }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <Btn size="sm" variant="outline" style={{ width: '100%', marginTop: 10 }} onClick={addQ}>+ إضافة سؤال</Btn>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {survey.responses.length === 0 && <Btn variant="outline" onClick={() => onDelete(survey.id)} style={{ color: 'var(--danger-text)' }}>حذف</Btn>}
        <Btn variant="outline" style={{ flex: 1 }} onClick={onClose}>إلغاء</Btn>
        <Btn style={{ flex: 1 }} disabled={!title.trim() || questions.some(q => !q.text.trim())} onClick={() => onSave({ ...survey, title: title.trim(), projectId: projectId || undefined, status, questions, maxResponses: maxResp === '' ? undefined : maxResp })}>حفظ</Btn>
      </div>
    </Sheet>
  );
}

// fill a survey (the interactive respondent experience)
function SurveyFill({ survey, onClose, onSubmit }: { survey: Survey; onClose: () => void; onSubmit: (r: SurveyResponse) => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const setA = (qid: string, v: string | string[] | number) => setAnswers(a => ({ ...a, [qid]: v }));
  const toggleMulti = (qid: string, opt: string) => {
    const cur = (answers[qid] as string[]) ?? [];
    setA(qid, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
  };

  return (
    <Sheet open onClose={onClose} title={survey.title}>
      {survey.description && <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>{survey.description}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {survey.questions.map((q, i) => (
          <div key={q.id}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{i + 1}. {q.text}</div>
            {q.kind === 'rating' && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setA(q.id, n)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', opacity: (answers[q.id] as number ?? 0) >= n ? 1 : 0.3 }}>⭐</button>
                ))}
              </div>
            )}
            {q.kind === 'single' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.options ?? []).map(opt => (
                  <button key={opt} onClick={() => setA(q.id, opt)} style={{ textAlign: 'right', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1.5px solid ${answers[q.id] === opt ? 'var(--accent, #2563eb)' : 'var(--border)'}`, background: answers[q.id] === opt ? 'var(--info-bg)' : 'var(--surface)', color: 'var(--text-2)', fontWeight: answers[q.id] === opt ? 700 : 500 }}>{opt}</button>
                ))}
              </div>
            )}
            {q.kind === 'multi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.options ?? []).map(opt => {
                  const sel = ((answers[q.id] as string[]) ?? []).includes(opt);
                  return <button key={opt} onClick={() => toggleMulti(q.id, opt)} style={{ textAlign: 'right', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1.5px solid ${sel ? 'var(--accent, #2563eb)' : 'var(--border)'}`, background: sel ? 'var(--info-bg)' : 'var(--surface)', color: 'var(--text-2)', fontWeight: sel ? 700 : 500 }}>{sel ? '☑' : '☐'} {opt}</button>;
                })}
              </div>
            )}
            {q.kind === 'text' && (
              <TextArea value={(answers[q.id] as string) ?? ''} onChange={v => setA(q.id, v)} placeholder="اكتب إجابتك…" />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onClose}>إلغاء</Btn>
        <Btn style={{ flex: 1 }} onClick={() => onSubmit({ id: uid('r'), answers, submittedAt: today(), respondent: 'مستجيب' })}>إرسال الإجابة</Btn>
      </div>
    </Sheet>
  );
}

// view aggregated results
function SurveyResults({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  return (
    <Sheet open onClose={onClose} title={`نتائج: ${survey.title}`}>
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 18, textAlign: 'center' }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent, #2563eb)' }}>{survey.responses.length}</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>إجمالي الإجابات</div>
      </div>
      {survey.responses.length === 0 ? (
        <EmptyState icon="📊" title="لا توجد إجابات بعد" desc="شارك الاستبيان لجمع الإجابات." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {survey.questions.map((q, i) => {
            const ans = survey.responses.map(r => r.answers[q.id]).filter(a => a !== undefined && a !== '');
            return (
              <div key={q.id}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>{i + 1}. {q.text}</div>
                {q.kind === 'rating' && ans.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)' }}>المتوسّط: <b style={{ color: 'var(--accent, #2563eb)' }}>{(ans.reduce((s, a) => s + (a as number), 0) / ans.length).toFixed(1)} ⭐</b> من {ans.length} تقييم</div>
                )}
                {(q.kind === 'single' || q.kind === 'multi') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(q.options ?? []).map(opt => {
                      const count = ans.filter(a => Array.isArray(a) ? a.includes(opt) : a === opt).length;
                      const pct = ans.length ? Math.round((count / survey.responses.length) * 100) : 0;
                      return (
                        <div key={opt}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 3 }}><span>{opt}</span><span>{count} ({pct}%)</span></div>
                          <div style={{ height: 7, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent, #2563eb)' }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {q.kind === 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ans.length === 0 ? <span style={{ fontSize: 12, color: 'var(--text-3)' }}>لا إجابات نصّية</span> : ans.map((a, j) => (
                      <div key={j} style={{ fontSize: 12.5, color: 'var(--text-2)', background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>“{a as string}”</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

// share (internal link + simulated external)
function SurveyShare({ survey, onClose }: { survey: Survey; onClose: () => void }) {
  const internalLink = `موازين › الاستبيانات › ${survey.title}`;
  const externalLink = `https://mazeen.app/s/${survey.id}`;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, which: string) => { try { navigator.clipboard?.writeText(text); } catch { /* */ } setCopied(which); setTimeout(() => setCopied(null), 1500); };

  return (
    <Sheet open onClose={onClose} title="مشاركة الاستبيان">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>🔗 رابط داخلي</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{internalLink}</div>
          <Btn size="sm" onClick={() => copy(internalLink, 'int')}>{copied === 'int' ? '✓' : 'نسخ'}</Btn>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>🌐 رابط خارجي (للمشاركة عبر واتساب/إيميل)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{externalLink}</div>
          <Btn size="sm" onClick={() => copy(externalLink, 'ext')}>{copied === 'ext' ? '✓' : 'نسخ'}</Btn>
        </div>
      </div>
      <div style={{ background: 'var(--warn-bg)', borderRadius: 10, padding: 12, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
        📌 الرابط الخارجي والمشاركة عبر واتساب/إيميل تعمل فعلياً عند ربط الخادم (Backend). حالياً الرابط الداخلي يعمل داخل النظام.
      </div>
    </Sheet>
  );
}

function ColorCustomize({ theme, onToggleTheme, custom, onCustom, onNav }: {
  theme: 'light' | 'dark'; onToggleTheme: () => void;
  custom: CustomTheme; onCustom: (c: CustomTheme) => void; onNav: (p: Page) => void;
}) {
  const set = (k: keyof CustomTheme, v: string | undefined) => onCustom({ ...custom, [k]: v });
  const swatches: { key: keyof CustomTheme; label: string; fallback: string }[] = [
    { key: 'primary', label: 'اللون الأساسي', fallback: '#2563eb' },
    { key: 'bg', label: 'لون الخلفية', fallback: theme === 'dark' ? '#0b0f17' : '#f4f6fa' },
    { key: 'surface', label: 'لون البطاقات', fallback: theme === 'dark' ? '#161b26' : '#ffffff' },
    { key: 'text', label: 'لون النصوص', fallback: theme === 'dark' ? '#f1f5f9' : '#0b1120' },
    { key: 'border', label: 'لون الحدود', fallback: theme === 'dark' ? '#2a3346' : '#e2e8f0' },
  ];
  const hasCustom = Object.values(custom).some(Boolean);

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <PageHeader title="تخصيص الألوان" subtitle="غيّر مظهر النظام بما يناسبك — يُحفظ تلقائياً" />

      {/* light / dark */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>الوضع العام</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{theme === 'dark' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري'}</div>
          </div>
          <button onClick={onToggleTheme} style={{ width: 52, height: 28, borderRadius: 99, border: 'none', background: theme === 'dark' ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
            <span style={{ position: 'absolute', top: 3, [theme === 'dark' ? 'left' : 'right']: 3, width: 22, height: 22, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 } as React.CSSProperties}>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </Card>

      {/* primary presets */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>🎨 لوحات جاهزة</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>اختر لوناً أساسياً جاهزاً بنقرة واحدة</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {THEME_PRESETS.map(p => {
            const selected = (custom.primary ?? '#2563eb') === p.primary;
            return (
              <button key={p.id} onClick={() => set('primary', p.id === 'blue' ? undefined : p.primary)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
                border: `2px solid ${selected ? p.primary : 'var(--border)'}`, background: selected ? p.primary + '15' : 'var(--surface)', color: 'var(--text-2)', fontWeight: selected ? 700 : 500,
              }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})`, flexShrink: 0 }} />
                {p.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* fine-grained color pickers */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>🛠️ تخصيص دقيق</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>تحكّم بكل لون على حدة</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {swatches.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 13.5, color: 'var(--text-2)', fontWeight: 500 }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {custom[s.key] && <button onClick={() => set(s.key, undefined)} title="إعادة هذا اللون للافتراضي" style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', fontSize: 12, color: 'var(--text-3)' }}>↺</button>}
                <input type="color" value={custom[s.key] ?? s.fallback} onChange={e => set(s.key, e.target.value)} style={{ width: 44, height: 32, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* live preview */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>معاينة حيّة</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ background: custom.primary ?? '#2563eb', color: '#fff', padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>زر أساسي</span>
          <span style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 18px', borderRadius: 10, fontSize: 13 }}>بطاقة</span>
          <span style={{ color: custom.primary ?? '#2563eb', fontSize: 13, fontWeight: 600 }}>رابط ملوّن</span>
        </div>
      </Card>

      {/* reset all */}
      <Btn variant="outline" disabled={!hasCustom} style={{ width: '100%' }} onClick={() => onCustom(DEFAULT_CUSTOM_THEME)}>
        ↺ العودة للألوان الافتراضية
      </Btn>
    </div>
  );
}

function Settings({ theme, onToggleTheme, onNav, onLogout, prefs, onPrefs }: { theme: 'light' | 'dark'; onToggleTheme: () => void; onNav: (p: Page) => void; onLogout: () => void; prefs: UserPrefs; onPrefs: (p: UserPrefs) => void }) {
  const toggle = (k: keyof UserPrefs) => onPrefs({ ...prefs, [k]: !prefs[k] });
  const Switch = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: 52, height: 28, borderRadius: 99, border: 'none', background: on ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, [on ? 'left' : 'right']: 3, width: 22, height: 22, borderRadius: 99, background: '#fff' } as React.CSSProperties} />
    </button>
  );
  const Row = ({ title, desc, k }: { title: string; desc: string; k: keyof UserPrefs }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
      <div><div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{desc}</div></div>
      <Switch on={prefs[k] as boolean} onClick={() => toggle(k)} />
    </div>
  );
  const PERIOD_OPTS = [['1d', 'آخر يوم'], ['1w', 'آخر أسبوع'], ['1m', 'آخر شهر'], ['6m', 'آخر 6 أشهر'], ['9m', 'آخر 9 أشهر'], ['12m', 'آخر 12 شهر'], ['18m', 'آخر 18 شهر'], ['24m', 'آخر 24 شهر']];
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <PageHeader title="الإعدادات" />

      {/* Appearance */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>المظهر</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>الوضع الليلي</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>تبديل بين المظهر الفاتح والداكن</div>
          </div>
          <button onClick={onToggleTheme} style={{ width: 52, height: 28, borderRadius: 99, border: 'none', background: theme === 'dark' ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
            <span style={{ position: 'absolute', top: 3, [theme === 'dark' ? 'left' : 'right']: 3, width: 22, height: 22, borderRadius: 99, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 } as React.CSSProperties}>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
        </div>
        <button onClick={() => onNav('colorCustomize')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>🎨 تخصيص الألوان</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>لوحات جاهزة وتحكّم دقيق بالألوان</div>
          </div>
          <span style={{ color: 'var(--text-3)', fontSize: 16 }}>‹</span>
        </button>
      </Card>

      {/* Display preferences — control how data appears across all sections */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>تفضيلات العرض (تطبّق على كل الأقسام)</div>
        <Row title="إظهار البطاقات الإحصائية" desc="بطاقات الأرقام أعلى الأقسام" k="showStats" />
        <Row title="إظهار الرسوم البيانية" desc="الحلقات والأعمدة في الأقسام" k="showCharts" />
        <Row title="إظهار شريط الإجراء السريع" desc="أزرار الإضافة داخل المشروع" k="showQuickActions" />
        <Row title="بطاقات مدمجة" desc="تقليل المسافات لعرض أكثف" k="compactCards" />
        <Row title="تأكيد قبل الحذف" desc="طلب تأكيد عند حذف أي عنصر" k="confirmDelete" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 4px', gap: 12 }}>
          <div><div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>الفترة الافتراضية للوحة التحكم</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>تُطبّق عند فتح الرئيسية</div></div>
          <select value={prefs.defaultPeriod} onChange={e => onPrefs({ ...prefs, defaultPeriod: e.target.value })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' }}>
            {PERIOD_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 4px', gap: 12, borderTop: '1px solid var(--border)' }}>
          <div><div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>طريقة عرض الإحصائيات</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>أفقي قابل للتمرير، أو رأسي بشبكة</div></div>
          <select value={prefs.statsLayout} onChange={e => onPrefs({ ...prefs, statsLayout: e.target.value as 'horizontal' | 'vertical' })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' }}>
            <option value="horizontal">أفقي (تمرير)</option>
            <option value="vertical">رأسي (شبكة)</option>
          </select>
        </div>
        {prefs.statsLayout === 'horizontal' && <Row title="تمرير الإحصائيات تلقائياً" desc="انتقال تلقائي بين البطاقات أفقياً" k="statsAutoScroll" />}
        {prefs.statsLayout === 'horizontal' && prefs.statsAutoScroll && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 4px', gap: 12 }}>
            <div><div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>مدة الانتقال</div><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>الزمن بين كل بطاقة وأخرى</div></div>
            <select value={prefs.statsScrollSeconds} onChange={e => onPrefs({ ...prefs, statsScrollSeconds: Number(e.target.value) })} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)' }}>
              {[2, 3, 4, 5, 7, 10].map(s => <option key={s} value={s}>{s} ثوانٍ</option>)}
            </select>
          </div>
        )}
      </Card>

      {/* Subscription shortcut */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>💎 الاشتراك والباقات</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>أنت على الباقة المجانية حالياً</div>
          </div>
          <Btn size="sm" onClick={() => onNav('subscription')}>عرض الباقات</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>🔌 التكاملات</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>ربط موازين بأنظمتك وخدماتك الخارجية</div>
          </div>
          <Btn size="sm" variant="outline" onClick={() => onNav('integrations')}>استعراض</Btn>
        </div>
      </Card>

      {[
        { title: 'الملف الشخصي', items: [{ label: 'الاسم الكامل', val: 'محمد العمري' }, { label: 'البريد الإلكتروني', val: 'mohammed@example.com' }, { label: 'رقم الجوال', val: '+966 50 123 4567' }] },
        { title: 'إعدادات الإشعارات', items: [{ label: 'إشعارات البريد الإلكتروني', val: 'مفعّل' }, { label: 'إشعارات واتساب', val: 'مفعّل' }, { label: 'إشعارات انتهاء الضمان', val: 'قبل 30 يوم' }] },
        { title: 'الأمان', items: [{ label: 'كلمة المرور', val: '••••••••' }, { label: 'التحقق الثنائي', val: 'مفعّل' }] },
      ].map(section => (
        <Card key={section.title} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>{section.title}</div>
          {section.items.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{item.val}</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--info-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>تعديل</button>
              </div>
            </div>
          ))}
        </Card>
      ))}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>إدارة البيانات</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>تصفير البيانات</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>حذف كل البيانات المحفوظة والعودة للبيانات الأولية</div>
          </div>
          <Btn variant="danger" size="sm" onClick={() => {
            if (confirm('سيتم حذف كل البيانات المحفوظة محلياً. متابعة؟')) {
              ['mz_projects', 'mz_transactions', 'mz_trackings', 'mz_requests', 'mz_documents', 'mz_notifs'].forEach(k => localStorage.removeItem(k));
              location.reload();
            }
          }}>🗑️ تصفير</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>تسجيل الخروج</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>الخروج من حسابك الحالي</div>
          </div>
          <Btn variant="outline" size="sm" onClick={onLogout}>↩ خروج</Btn>
        </div>
      </Card>
    </div>
  );
}
// ═══════════════════════════════════════════
//  SUBSCRIPTION (free + 3 paid plans)
// ═══════════════════════════════════════════
const PLANS = [
  { id: 'free', name: 'المجانية', price: 0, tag: 'للتجربة', color: '#6b7280', features: ['حتى 3 مشاريع', 'ذكاء اصطناعي أساسي', 'متابعات محدودة', 'تقارير أساسية'] },
  { id: 'pro', name: 'الاحترافية', price: 49, tag: 'الأكثر شيوعاً', color: 'var(--info-text)', features: ['مشاريع غير محدودة', 'متابعات وضمانات كاملة', 'ذكاء اصطناعي موسّع', 'تقارير متقدمة', 'دعم ذو أولوية'] },
  { id: 'business', name: 'الأعمال', price: 99, tag: 'للفرق', color: 'var(--purple-text)', features: ['كل مزايا الاحترافية', 'صلاحيات متقدمة', 'موافقات متعددة', 'إدارة أعضاء كاملة', 'تكاملات خارجية'] },
  { id: 'enterprise', name: 'المؤسسات', price: 249, tag: 'للمنشآت الكبيرة', color: '#059669', features: ['كل مزايا الأعمال', 'تكامل ERP / CRM', 'تتبّع GPS للأصول', 'ذكاء اصطناعي متقدم', 'دعم مؤسسي مخصص'] },
];

// ═══════════════════════════════════════════
//  MEMBER DETAIL (full profile + stats + charts)
// ═══════════════════════════════════════════
function MemberDetail({ memberId, members, projects, transactions, memberTxns, receivables, commitments, requests, onBack, onNav }: {
  memberId: string; members: Member[]; projects: Project[];
  transactions: Transaction[]; memberTxns: MemberTxn[];
  receivables: Receivable[]; commitments: Commitment[]; requests: RequestItem[];
  onBack: () => void; onNav: (p: Page) => void;
}) {
  const member = members.find(m => m.id === memberId);
  if (!member) return <div style={{ padding: 24 }}>العضو غير موجود.</div>;

  // all member movements across the system
  const myTxns = memberTxns.filter(t => t.memberId === memberId);
  const accepted = myTxns.filter(t => t.status === 'accepted');
  const incoming = accepted.filter(t => t.direction === 'to_member').reduce((s, t) => s + t.amount, 0);
  const outgoing = accepted.filter(t => t.direction === 'from_member').reduce((s, t) => s + t.amount, 0);
  const pending = myTxns.filter(t => t.status === 'pending').length;

  // projects this member belongs to (same email across projects)
  const myProjects = members.filter(m => m.email === member.email).map(m => {
    const proj = projects.find(p => p.id === m.projectId);
    const pTxns = memberTxns.filter(t => t.memberId === m.id && t.status === 'accepted');
    return {
      project: proj, role: m.role, balance: m.balance ?? 0,
      in: pTxns.filter(t => t.direction === 'to_member').reduce((s, t) => s + t.amount, 0),
      out: pTxns.filter(t => t.direction === 'from_member').reduce((s, t) => s + t.amount, 0),
    };
  }).filter(x => x.project);

  const totalBalanceAllProjects = myProjects.reduce((s, p) => s + p.balance, 0);
  const roleInfo = ROLES.find(r => r.id === member.role)!;

  // all member-ids belonging to this person (same email across projects)
  const myMemberIds = members.filter(m => m.email === member.email).map(m => m.id);
  // linked receivables / commitments / requests (read-only aggregation, no balance merge)
  const myRecv = receivables.filter(r => r.memberId && myMemberIds.includes(r.memberId));
  const myComms = commitments.filter(c => c.memberId && myMemberIds.includes(c.memberId));
  const myReqs = requests.filter(r => (r.memberId && myMemberIds.includes(r.memberId)) || r.requestedBy === member.name);

  // monthly chart of member movements
  const byMonth: Record<string, { in: number; out: number }> = {};
  accepted.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { in: 0, out: 0 };
    if (t.direction === 'to_member') byMonth[m].in += t.amount; else byMonth[m].out += t.amount;
  });
  const months = Object.keys(byMonth).sort();
  const maxM = Math.max(...months.map(m => Math.max(byMonth[m].in, byMonth[m].out)), 1);

  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const hasMismatch = Math.abs((incoming - outgoing) - (member.balance ?? 0)) > 1;
  // when a member with a balance issue is opened, draw attention to the alert automatically
  useEffect(() => {
    if (!hasMismatch) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector(`[data-hl="${member.id}"]`) as HTMLElement | null;
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('mz-flash'); window.setTimeout(() => el.classList.remove('mz-flash'), 2200); }
    }, 200);
    return () => window.clearTimeout(t);
  }, [member.id, hasMismatch]);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>‹ رجوع</button>

      {/* profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <MemberAvatar member={member} size={72} color={roleInfo.color} />
        <div style={{ flex: 1, minWidth: 180 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{member.name}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>{member.email}</div>
          <span style={{ display: 'inline-block', marginTop: 8, background: roleInfo.color + '18', color: roleInfo.color, padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>{roleInfo.label}</span>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>الرصيد (هذا المشروع)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: (member.balance ?? 0) > 0 ? '#15803d' : 'var(--text-3)' }}>{fmt(member.balance ?? 0)}</div>
        </div>
      </div>

      {/* balance mismatch alert: stored balance ≠ computed from accepted movements */}
      {Math.abs((incoming - outgoing) - (member.balance ?? 0)) > 1 && (
        <div data-hl={member.id} style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-text)', borderRadius: 14, padding: 18, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--danger-text)' }}>عدم تطابق في رصيد العهدة</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 10, marginBottom: 12 }}>
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>الرصيد المخزّن</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{fmt(member.balance ?? 0)}</div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>المحسوب من الحركات المقبولة</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{fmt(incoming - outgoing)}</div>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>الفرق</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger-text)' }}>{fmt(Math.abs((incoming - outgoing) - (member.balance ?? 0)))}</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <span style={{ fontSize: 15 }}>🤖</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple-text)' }}>توصية المساعد الذكي</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              الرصيد المخزّن لا يطابق مجموع الحركات المقبولة أدناه. غالباً السبب تعديل يدوي على الرصيد أو حركة عُدّلت/حُذفت بعد قبولها. راجع سجل الحركات في الأسفل، وسجّل حركة <b>تسوية</b> بمقدار الفرق ({fmt(Math.abs((incoming - outgoing) - (member.balance ?? 0)))}) لإعادة الرصيد لمطابقة الواقع — تجنّب تعديل الرصيد يدوياً ليبقى قابلاً للتتبّع.
            </div>
          </div>
        </div>
      )}

      {/* stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
        {[
          { l: 'إجمالي الوارد', v: fmt(incoming), c: '#15803d', bg: 'var(--ok-bg)', i: '↓' },
          { l: 'إجمالي الصادر', v: fmt(outgoing), c: '#b91c1c', bg: 'var(--danger-bg)', i: '↑' },
          { l: 'رصيد كل المشاريع', v: fmt(totalBalanceAllProjects), c: '#1d4ed8', bg: 'var(--info-bg)', i: '∑' },
          { l: 'حركات معلّقة', v: String(pending), c: '#a16207', bg: 'var(--warn-bg)', i: '⏳' },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.i}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px,1fr))', gap: 16, marginBottom: 16 }}>
        {/* projects of member */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>المشاريع المنتمي إليها ({myProjects.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myProjects.map((p, i) => (
              <div key={i} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{p.project!.icon} {p.project!.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{ROLES.find(r => r.id === p.role)?.label}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ color: 'var(--ok-text)' }}>وارد {fmtNum(p.in)}</span>
                  <span style={{ color: 'var(--danger-text)' }}>صادر {fmtNum(p.out)}</span>
                  <span style={{ color: 'var(--info-text)', marginRight: 'auto', fontWeight: 600 }}>رصيد {fmtNum(p.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* monthly movement chart */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>الحركة الشهرية</div>
          {months.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12, textAlign: 'center' }}>لا توجد حركات بعد</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {months.map(m => (
              <div key={m}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{m}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--ok-text)', width: 32 }}>وارد</span>
                  <div style={{ flex: 1, height: 12, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(byMonth[m].in / maxM) * 100}%`, background: '#22c55e' }} /></div>
                  <span style={{ fontSize: 11, color: 'var(--ok-text)', width: 60, textAlign: 'left' }}>{fmtNum(byMonth[m].in)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--danger-text)', width: 32 }}>صادر</span>
                  <div style={{ flex: 1, height: 12, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(byMonth[m].out / maxM) * 100}%`, background: '#f87171' }} /></div>
                  <span style={{ fontSize: 11, color: 'var(--danger-text)', width: 60, textAlign: 'left' }}>{fmtNum(byMonth[m].out)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* all member operations */}
      <Card>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>كل العمليات المرتبطة بالعضو ({myTxns.length})</div>
        {myTxns.length === 0 && <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12, textAlign: 'center' }}>لا توجد عمليات</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {myTxns.map(t => {
            const ti = MEMBER_TXN_TYPES.find(x => x.id === t.type);
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>{ti?.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ti?.label} — {projName(t.projectId)}</div>
                  {t.note && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.note}</div>}
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.direction === 'to_member' ? '#15803d' : '#b91c1c' }}>{t.direction === 'to_member' ? '+' : '−'}{fmtNum(t.amount)}</div>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: t.status === 'pending' ? 'var(--warn-bg-2)' : t.status === 'rejected' ? 'var(--danger-bg-2)' : 'var(--ok-bg-2)', color: t.status === 'pending' ? '#a16207' : t.status === 'rejected' ? '#b91c1c' : '#15803d' }}>
                    {t.status === 'accepted' ? 'مقبولة' : t.status === 'rejected' ? 'مرفوضة' : 'معلّقة'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* linked receivables */}
      {myRecv.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>⇄ الذمم المرتبطة ({myRecv.length})</div>
            <button onClick={() => onNav('receivables')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--info-text)', cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل ←</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myRecv.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.kind === 'receivable' ? 'مدينة (لنا)' : 'دائنة (علينا)'} — {r.party}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{projName(r.projectId)}{r.dueDate ? ` · يستحق ${r.dueDate}` : ''}</div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: r.kind === 'receivable' ? '#15803d' : '#b91c1c' }}>{fmtNum(recvRemaining(r))}</div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{r.status === 'settled' ? 'مسددة' : r.status === 'partial' ? 'جزئية' : 'مفتوحة'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* linked commitments */}
      {myComms.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>↻ الالتزامات المرتبطة ({myComms.length})</div>
            <button onClick={() => onNav('commitments')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--info-text)', cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل ←</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myComms.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{projName(c.projectId)} · {FREQ_LABEL[c.freq]}{!commitmentDone(c) ? ` · يستحق ${c.nextDue}` : ''}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.direction === 'out' ? '#b91c1c' : '#15803d', flexShrink: 0 }}>{c.direction === 'out' ? '−' : '+'}{fmtNum(c.amount)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* linked requests */}
      {myReqs.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>◫ الطلبات المرتبطة ({myReqs.length})</div>
            <button onClick={() => onNav('requests')} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--info-text)', cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل ←</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myReqs.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{projName(r.projectId)} · {r.type}</div>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  {r.amount > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmtNum(r.amount)}</div>}
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 99, background: r.status === 'pending' ? 'var(--warn-bg-2)' : r.status === 'rejected' ? 'var(--danger-bg-2)' : 'var(--ok-bg-2)', color: r.status === 'pending' ? '#a16207' : r.status === 'rejected' ? '#b91c1c' : '#15803d' }}>
                    {r.status === 'approved' ? 'معتمد' : r.status === 'rejected' ? 'مرفوض' : 'معلّق'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* read-only note */}
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center' }}>
        هذه نظرة مجمّعة للقراءة. أرصدة العهد والذمم والالتزامات تبقى مستقلة لتجنّب الازدواج المحاسبي.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  AUDIT LOG (سجل التدقيق لكل الأحداث)
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//  RECEIVABLES / PAYABLES (الذمم)
// ═══════════════════════════════════════════
function ReceivableForm({ projectId, projects, members, onSave, onCancel }: {
  projectId: string; projects: Project[]; members: Member[];
  onSave: (r: Omit<Receivable, 'id'>) => void; onCancel: () => void;
}) {
  const [kind, setKind] = useState<ReceivableKind>('receivable');
  const [targetProject, setTargetProject] = useState(projectId);
  const [partyMode, setPartyMode] = useState<'external' | 'member'>('external');
  const [party, setParty] = useState('');
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const projMembers = members.filter(m => m.projectId === targetProject);
  const partyName = partyMode === 'member' ? (projMembers.find(m => m.id === memberId)?.name ?? '') : party.trim();
  const valid = partyName.length > 0 && amount !== '' && Number(amount) > 0;

  return (
    <>
      <Field label="نوع الذمة">
        <TypePicker value={kind} onChange={v => setKind(v as ReceivableKind)} options={[
          { v: 'receivable', l: 'ذمة مدينة (لنا)', icon: '📥' },
          { v: 'payable', l: 'ذمة دائنة (علينا)', icon: '📤' },
        ]} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={v => { setTargetProject(v); setMemberId(''); }} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <Field label="نوع الطرف">
        <TypePicker value={partyMode} onChange={v => setPartyMode(v as 'external' | 'member')} options={[
          { v: 'external', l: 'جهة خارجية', icon: '🏢' },
          { v: 'member', l: 'عضو داخلي', icon: '👤' },
        ]} />
      </Field>
      {partyMode === 'external' ? (
        <Field label="اسم الطرف">
          <TextInput value={party} onChange={setParty} placeholder="مثال: عميل، مورد، جهة..." />
        </Field>
      ) : (
        <Field label="العضو">
          <Select value={memberId} onChange={setMemberId} options={[{ v: '', l: 'اختر عضواً' }, ...projMembers.map(m => ({ v: m.id, l: m.name }))]} />
        </Field>
      )}
      <Field label="المبلغ (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      <Field label="تاريخ الاستحقاق (اختياري)">
        <TextInput type="date" value={dueDate} onChange={setDueDate} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="تفاصيل الذمة..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ background: 'var(--info-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--info-text)' }}>
        ℹ️ الذمة لا تُحرّك الرصيد عند الإنشاء. عند التحصيل/السداد تتحول لعملية مالية فعلية تلقائياً.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          projectId: targetProject, kind, party: partyName, memberId: partyMode === 'member' ? memberId : undefined,
          amount: amount === '' ? 0 : amount, dueDate: dueDate || undefined, date: today(),
          status: 'open', payments: [], note, attachments, createdBy: CURRENT_USER,
        })}>إضافة الذمة</Btn>
      </div>
    </>
  );
}

function PaymentForm({ receivable, onSave, onCancel }: {
  receivable: Receivable; onSave: (amount: number, note: string) => void; onCancel: () => void;
}) {
  const remaining = recvRemaining(receivable);
  const [amount, setAmount] = useState<number | ''>(remaining);
  const [note, setNote] = useState('');
  const valid = amount !== '' && Number(amount) > 0 && Number(amount) <= remaining;
  const isRecv = receivable.kind === 'receivable';

  return (
    <>
      <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{isRecv ? 'تحصيل من' : 'سداد إلى'}: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{receivable.party}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-3)' }}>المبلغ الأصلي: <span style={{ color: 'var(--text-2)' }}>{fmtNum(receivable.amount)}</span></span>
          <span style={{ color: 'var(--text-3)' }}>المتبقي: <span style={{ fontWeight: 700, color: isRecv ? '#15803d' : '#b91c1c' }}>{fmtNum(remaining)}</span></span>
        </div>
      </div>
      <Field label={`مبلغ ${isRecv ? 'التحصيل' : 'السداد'} (ر.س)`}>
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      {amount !== '' && Number(amount) > remaining && <div style={{ fontSize: 12, color: 'var(--danger-text)', marginBottom: 12 }}>المبلغ أكبر من المتبقي ({fmtNum(remaining)}).</div>}
      <Field label="ملاحظة (اختياري)">
        <TextInput value={note} onChange={setNote} placeholder="مثال: دفعة نقدية، تحويل بنكي..." />
      </Field>
      <div style={{ background: isRecv ? 'var(--ok-bg)' : 'var(--danger-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: isRecv ? '#15803d' : '#b91c1c' }}>
        {isRecv ? '↓ سيُسجَّل تدفق وارد فعلي بالمبلغ في الإدارة المالية.' : '↑ سيُسجَّل تدفق صادر فعلي بالمبلغ في الإدارة المالية.'}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave(amount === '' ? 0 : amount, note)}>تأكيد {isRecv ? 'التحصيل' : 'السداد'}</Btn>
      </div>
    </>
  );
}

function Receivables({ projectId, projects, receivables, members, onSave, onPay, onDelete, openCreate, onOpenCreate, onCloseCreate, helpEntry }: {
  projectId: string; projects: Project[]; receivables: Receivable[]; members: Member[];
  onSave: (r: Omit<Receivable, 'id'>) => void; onPay: (id: string, amount: number, note: string) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; helpEntry?: HelpEntry;
}) {
  const [kindTab, setKindTab] = useState<'all' | ReceivableKind>('all');
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [sort, setSort] = useState('due');
  const [sheet, setSheet] = useState<null | { mode: 'pay' | 'view'; r: Receivable }>(null);

  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const memberName = (id: string) => members.find(m => m.id === id)?.name ?? '';
  // members that actually have receivables linked (for a focused filter list)
  const linkedMemberIds = Array.from(new Set(receivables.map(r => r.memberId).filter(Boolean) as string[]));
  const linkedMembers = members.filter(m => linkedMemberIds.includes(m.id));
  const all = receivables;
  const filtered = all
    .filter(r => kindTab === 'all' ? true : r.kind === kindTab)
    .filter(r => fProject === 'all' ? true : r.projectId === fProject)
    .filter(r => fMember === 'all' ? true : r.memberId === fMember)
    .filter(r => fStatus === 'all' ? true : r.status === fStatus)
    .filter(r => search.trim() === '' ? true : (r.party + (r.note ?? '')).includes(search.trim()))
    .sort((a, b) => sort === 'due' ? (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') : sort === 'amount' ? recvRemaining(b) - recvRemaining(a) : b.date.localeCompare(a.date));

  const recvs = all.filter(r => r.kind === 'receivable');
  const pays = all.filter(r => r.kind === 'payable');
  const totalRecv = recvs.reduce((s, r) => s + recvRemaining(r), 0);
  const totalPay = pays.reduce((s, r) => s + recvRemaining(r), 0);
  const overdue = all.filter(r => r.status !== 'settled' && r.dueDate && r.dueDate < today()).length;

  const clearFilters = () => { setSearch(''); setFProject('all'); setFMember('all'); setFStatus('all'); setSort('due'); };
  const close = () => setSheet(null);
  const statusInfo = (s: ReceivableStatus) => s === 'settled' ? { l: 'مسددة', c: '#15803d', bg: 'var(--ok-bg-2)' } : s === 'partial' ? { l: 'جزئية', c: '#a16207', bg: 'var(--warn-bg-2)' } : { l: 'مفتوحة', c: '#1d4ed8', bg: '#dbeafe' };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <PageHeader help={helpEntry} title="الذمم" subtitle="المبالغ المستحقة لك أو عليك" action={<Btn size="sm" onClick={onOpenCreate}>+ ذمة جديدة</Btn>} />

      <StatCards cards={[
        { label: 'ذمم مدينة (لنا)', value: fmtNum(totalRecv), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '📥' },
        { label: 'ذمم دائنة (علينا)', value: fmtNum(totalPay), color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '📤' },
        { label: 'صافي الذمم', value: fmtNum(totalRecv - totalPay), color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '⇄' },
        { label: 'متأخرة السداد', value: overdue, color: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '⏰' },
      ]} />

      {/* kind tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ['receivable', '📥 مدينة (لنا)'], ['payable', '📤 دائنة (علينا)']].map(([v, l]) => (
          <button key={v} onClick={() => setKindTab(v as any)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: kindTab === v ? 'var(--surface)' : 'transparent', color: kindTab === v ? 'var(--text)' : 'var(--text-3)',
          }}>{l}</button>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في الذمم..."
        values={{ project: fProject, member: fMember, status: fStatus, sort }}
        onChange={(k, v) => { if (k === 'project') setFProject(v); else if (k === 'member') setFMember(v); else if (k === 'status') setFStatus(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'project', placeholder: 'المشروع', options: [{ v: 'all', l: 'كل المشاريع' }, ...projects.map(p => ({ v: p.id, l: p.name }))] },
          ...(linkedMembers.length > 0 ? [{ key: 'member', placeholder: 'العضو', options: [{ v: 'all', l: 'كل الأعضاء' }, ...linkedMembers.map(m => ({ v: m.id, l: m.name }))] }] : []),
          { key: 'status', placeholder: 'الحالة', options: [{ v: 'all', l: 'كل الحالات' }, { v: 'open', l: 'مفتوحة' }, { v: 'partial', l: 'جزئية' }, { v: 'settled', l: 'مسددة' }] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'due', l: 'الأقرب استحقاقاً' }, { v: 'amount', l: 'الأعلى مبلغاً' }, { v: 'newest', l: 'الأحدث' }] },
        ]}
      />

      {filtered.length === 0 && (
        receivables.length === 0
          ? <EmptyState icon="⇄" title="لا توجد ذمم بعد" hint="الذمم هي المبالغ المستحقة لك (مدينة) أو عليك (دائنة). أضف أول ذمة لتتبّع ما لك وما عليك مع العملاء والموردين والأعضاء." actionLabel="+ إضافة أول ذمة" onAction={onOpenCreate} />
          : <EmptyState icon="🔍" title="لا توجد ذمم مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => {
          const remaining = recvRemaining(r);
          const paid = recvPaid(r);
          const isRecv = r.kind === 'receivable';
          const si = statusInfo(r.status);
          const isOverdue = r.status !== 'settled' && r.dueDate && r.dueDate < today();
          const pct = r.amount > 0 ? Math.round((paid / r.amount) * 100) : 0;
          return (
            <Card key={r.id} dataHl={r.id} style={{ padding: 16, borderRight: `3px solid ${isRecv ? '#22c55e' : '#f87171'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{isRecv ? '📥' : '📤'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{r.party}</span>
                    <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: si.bg, color: si.c }}>{si.l}</span>
                    {isOverdue && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: 'var(--danger-bg-2)', color: 'var(--danger-text)' }}>⏰ متأخرة</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                    {projName(r.projectId)}{r.memberId ? ` · 👤 ${memberName(r.memberId)}` : ''}{r.note ? ` · ${r.note}` : ''}{r.dueDate ? ` · تستحق ${r.dueDate}` : ''}
                  </div>
                  {/* progress */}
                  {paid > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isRecv ? '#22c55e' : '#f87171' }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>سُدّد {fmtNum(paid)} من {fmtNum(r.amount)} ({pct}%)</div>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isRecv ? '#15803d' : '#b91c1c' }}>{fmtNum(remaining)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>متبقٍ</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {r.status !== 'settled' && (
                  <button onClick={() => setSheet({ mode: 'pay', r })} style={{ background: isRecv ? '#15803d' : '#b91c1c', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isRecv ? '↓ تسجيل تحصيل' : '↑ تسجيل سداد'}
                  </button>
                )}
                <button onClick={() => setSheet({ mode: 'view', r })} style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>التفاصيل</button>
                <button onClick={() => onDelete(r.id)} style={{ background: 'none', color: 'var(--text-3)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', marginRight: 'auto' }}>🗑️</button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="ذمة جديدة">
        {openCreate && <ReceivableForm projectId={projectId} projects={projects} members={members} onSave={(r) => { onSave(r); onCloseCreate(); }} onCancel={onCloseCreate} />}
      </Sheet>

      {/* pay */}
      <Sheet open={sheet?.mode === 'pay'} onClose={close} title={sheet?.r.kind === 'receivable' ? 'تسجيل تحصيل' : 'تسجيل سداد'}>
        {sheet?.mode === 'pay' && <PaymentForm receivable={sheet.r} onSave={(amt, note) => { onPay(sheet.r.id, amt, note); close(); }} onCancel={close} />}
      </Sheet>

      {/* view */}
      <Sheet open={sheet?.mode === 'view'} onClose={close} title="تفاصيل الذمة">
        {sheet?.mode === 'view' && (() => {
          const r = sheet.r;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['النوع', r.kind === 'receivable' ? '📥 ذمة مدينة (لنا)' : '📤 ذمة دائنة (علينا)'],
                ['الطرف', r.party], ['المشروع', projName(r.projectId)],
                ['المبلغ الأصلي', fmt(r.amount)], ['المسدّد', fmt(recvPaid(r))], ['المتبقي', fmt(recvRemaining(r))],
                ['تاريخ الإنشاء', r.date], ...(r.dueDate ? [['تاريخ الاستحقاق', r.dueDate] as [string, string]] : []),
                ['الحالة', statusInfo(r.status).l], ['أضافها', r.createdBy ?? CURRENT_USER],
                ...(r.note ? [['ملاحظات', r.note] as [string, string]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{v}</span>
                </div>
              ))}
              {/* payment history */}
              {r.payments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>سجل الدفعات ({r.payments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {r.payments.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-3)' }}>{p.date}{p.note ? ` · ${p.note}` : ''}</span>
                        <span style={{ fontWeight: 600, color: r.kind === 'receivable' ? '#15803d' : '#b91c1c' }}>{fmtNum(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {r.attachments && r.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({r.attachments.length})</div>
                  <AttachmentView items={r.attachments} />
                </div>
              )}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  COMMITMENTS (الالتزامات الدورية: أقساط/التزامات/اشتراكات)
// ═══════════════════════════════════════════
const COMMITMENT_KINDS: { id: CommitmentKind; label: string; icon: string }[] = [
  { id: 'installment', label: 'قسط', icon: '🏦' },
  { id: 'obligation', label: 'التزام دوري', icon: '🔁' },
  { id: 'subscription', label: 'اشتراك', icon: '💳' },
];
function CommitmentForm({ projectId, projects, members, onSave, onCancel }: {
  projectId: string; projects: Project[]; members: Member[];
  onSave: (c: Omit<Commitment, 'id'>) => void; onCancel: () => void;
}) {
  const [kind, setKind] = useState<CommitmentKind>('installment');
  const [direction, setDirection] = useState<CommitmentDir>('out');
  const [targetProject, setTargetProject] = useState(projectId);
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [freq, setFreq] = useState<CommitmentFreq>('monthly');
  const [startDate, setStartDate] = useState(today());
  const [hasCount, setHasCount] = useState(true);
  const [totalCount, setTotalCount] = useState<number | ''>(12);
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const valid = name.trim().length > 0 && amount !== '' && Number(amount) > 0;

  return (
    <>
      <Field label="نوع الالتزام">
        <TypePicker value={kind} onChange={v => { setKind(v as CommitmentKind); if (v !== 'installment') setHasCount(false); else setHasCount(true); }} options={COMMITMENT_KINDS.map(k => ({ v: k.id, l: k.label, icon: k.icon }))} />
      </Field>
      <Field label="الاتجاه">
        <TypePicker value={direction} onChange={v => setDirection(v as CommitmentDir)} options={[
          { v: 'out', l: 'صادر (ندفع)', icon: '↑' },
          { v: 'in', l: 'وارد (نستلم)', icon: '↓' },
        ]} />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={setTargetProject} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <Field label="الاسم">
        <TextInput value={name} onChange={setName} placeholder="مثال: قسط السيارة، إيجار، اشتراك Adobe" />
      </Field>
      <Field label="الطرف (اختياري)">
        <TextInput value={party} onChange={setParty} placeholder="مثال: بنك، مالك العقار، مزوّد..." />
      </Field>
      <Field label="ربط بعضو (اختياري)">
        <Select value={memberId} onChange={setMemberId} options={[{ v: '', l: 'بدون ربط' }, ...members.filter(m => m.projectId === targetProject).map(m => ({ v: m.id, l: m.name }))]} />
      </Field>
      <Field label="مبلغ الدفعة الواحدة (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      <Field label="التكرار">
        <Select value={freq} onChange={v => setFreq(v as CommitmentFreq)} options={[
          { v: 'weekly', l: 'أسبوعي' }, { v: 'monthly', l: 'شهري' }, { v: 'quarterly', l: 'ربع سنوي' }, { v: 'yearly', l: 'سنوي' },
        ]} />
      </Field>
      <Field label="تاريخ أول استحقاق">
        <TextInput type="date" value={startDate} onChange={setStartDate} />
      </Field>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 12px' }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>عدد دفعات محدّد؟</div>
        <button onClick={() => setHasCount(!hasCount)} style={{ width: 48, height: 26, borderRadius: 99, border: 'none', background: hasCount ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer' }}>
          <span style={{ position: 'absolute', top: 3, [hasCount ? 'left' : 'right']: 3, width: 20, height: 20, borderRadius: 99, background: '#fff' } as React.CSSProperties} />
        </button>
      </div>
      {hasCount && (
        <Field label="إجمالي عدد الدفعات">
          <NumInput value={totalCount} onChange={setTotalCount} placeholder="12" />
        </Field>
      )}
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="تفاصيل الالتزام..." />
      </Field>
      <Field label="المرفقات (صور / ملفات)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ background: 'var(--info-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--info-text)' }}>
        ℹ️ عند تسجيل دفعة، تتحول لعملية مالية فعلية ويتقدّم الاستحقاق للموعد التالي تلقائياً.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          projectId: targetProject, kind, direction, name: name.trim(), party: party.trim() || undefined, memberId: memberId || undefined,
          amount: amount === '' ? 0 : amount, freq, startDate,
          totalCount: hasCount ? (totalCount === '' ? undefined : Number(totalCount)) : undefined,
          paidCount: 0, nextDue: startDate, active: true, payments: [], note, attachments, createdBy: CURRENT_USER,
        })}>إضافة الالتزام</Btn>
      </div>
    </>
  );
}

function Commitments({ projectId, projects, commitments, members, onSave, onPay, onToggle, onDelete, openCreate, onOpenCreate, onCloseCreate, helpEntry }: {
  projectId: string; projects: Project[]; commitments: Commitment[]; members: Member[];
  onSave: (c: Omit<Commitment, 'id'>) => void; onPay: (id: string) => void; onToggle: (id: string) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; helpEntry?: HelpEntry;
}) {
  const [kindTab, setKindTab] = useState<'all' | CommitmentKind>('all');
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('all');
  const [fMember, setFMember] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [sort, setSort] = useState('due');
  const [viewC, setViewC] = useState<Commitment | null>(null);

  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const memberName = (id: string) => members.find(m => m.id === id)?.name ?? '';
  const linkedMemberIds = Array.from(new Set(commitments.map(c => c.memberId).filter(Boolean) as string[]));
  const linkedMembers = members.filter(m => linkedMemberIds.includes(m.id));
  const filtered = commitments
    .filter(c => kindTab === 'all' ? true : c.kind === kindTab)
    .filter(c => fProject === 'all' ? true : c.projectId === fProject)
    .filter(c => fMember === 'all' ? true : c.memberId === fMember)
    .filter(c => fStatus === 'all' ? true : fStatus === 'active' ? (c.active && !commitmentDone(c)) : fStatus === 'paused' ? !c.active : commitmentDone(c))
    .filter(c => search.trim() === '' ? true : (c.name + (c.party ?? '') + (c.note ?? '')).includes(search.trim()))
    .sort((a, b) => sort === 'due' ? a.nextDue.localeCompare(b.nextDue) : sort === 'amount' ? b.amount - a.amount : b.startDate.localeCompare(a.startDate));

  // monthly-normalized cash impact (to compare across frequencies)
  const monthlyImpact = (c: Commitment) => {
    if (!c.active || commitmentDone(c)) return 0;
    const perMonth = c.freq === 'weekly' ? c.amount * 4.33 : c.freq === 'monthly' ? c.amount : c.freq === 'quarterly' ? c.amount / 3 : c.amount / 12;
    return c.direction === 'out' ? -perMonth : perMonth;
  };
  const activeCs = commitments.filter(c => c.active && !commitmentDone(c));
  const monthlyOut = activeCs.filter(c => c.direction === 'out').reduce((s, c) => s + Math.abs(monthlyImpact(c)), 0);
  const monthlyIn = activeCs.filter(c => c.direction === 'in').reduce((s, c) => s + Math.abs(monthlyImpact(c)), 0);
  const dueSoon = activeCs.filter(c => c.nextDue <= advanceDate(today(), 'weekly')).length;

  const clearFilters = () => { setSearch(''); setFProject('all'); setFMember('all'); setFStatus('all'); setSort('due'); };
  const kindInfo = (k: CommitmentKind) => COMMITMENT_KINDS.find(x => x.id === k)!;

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <PageHeader help={helpEntry} title="الالتزامات الدورية" subtitle="الأقساط والالتزامات والاشتراكات المتكررة" action={<Btn size="sm" onClick={onOpenCreate}>+ التزام جديد</Btn>} />

      <StatCards cards={[
        { label: 'صادر شهرياً (تقديري)', value: fmtNum(Math.round(monthlyOut)), color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '↑' },
        { label: 'وارد شهرياً (تقديري)', value: fmtNum(Math.round(monthlyIn)), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '↓' },
        { label: 'صافي شهري', value: fmtNum(Math.round(monthlyIn - monthlyOut)), color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '⇄' },
        { label: 'تستحق هذا الأسبوع', value: dueSoon, color: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '⏰' },
      ]} />

      {/* kind tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ['installment', '🏦 أقساط'], ['obligation', '🔁 التزامات'], ['subscription', '💳 اشتراكات']].map(([v, l]) => (
          <button key={v} onClick={() => setKindTab(v as any)} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: kindTab === v ? 'var(--surface)' : 'transparent', color: kindTab === v ? 'var(--text)' : 'var(--text-3)',
          }}>{l}</button>
        ))}
      </div>

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في الالتزامات..."
        values={{ project: fProject, member: fMember, status: fStatus, sort }}
        onChange={(k, v) => { if (k === 'project') setFProject(v); else if (k === 'member') setFMember(v); else if (k === 'status') setFStatus(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'project', placeholder: 'المشروع', options: [{ v: 'all', l: 'كل المشاريع' }, ...projects.map(p => ({ v: p.id, l: p.name }))] },
          ...(linkedMembers.length > 0 ? [{ key: 'member', placeholder: 'العضو', options: [{ v: 'all', l: 'كل الأعضاء' }, ...linkedMembers.map(m => ({ v: m.id, l: m.name }))] }] : []),
          { key: 'status', placeholder: 'الحالة', options: [{ v: 'all', l: 'كل الحالات' }, { v: 'active', l: 'نشطة' }, { v: 'paused', l: 'موقوفة' }, { v: 'done', l: 'مكتملة' }] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'due', l: 'الأقرب استحقاقاً' }, { v: 'amount', l: 'الأعلى مبلغاً' }, { v: 'newest', l: 'الأحدث' }] },
        ]}
      />

      {filtered.length === 0 && (
        commitments.length === 0
          ? <EmptyState icon="↻" title="لا توجد التزامات دورية بعد" hint="الأقساط والإيجارات والاشتراكات وأي مبلغ يتكرر بجدول زمني. أضف أول التزام ليذكّرك النظام بمواعيد الاستحقاق تلقائياً." actionLabel="+ إضافة أول التزام" onAction={onOpenCreate} />
          : <EmptyState icon="🔍" title="لا توجد التزامات مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(c => {
          const ki = kindInfo(c.kind);
          const done = commitmentDone(c);
          const isOut = c.direction === 'out';
          const overdue = c.active && !done && c.nextDue < today();
          const pct = c.totalCount ? Math.round((c.paidCount / c.totalCount) * 100) : 0;
          return (
            <Card key={c.id} dataHl={c.id} style={{ padding: 16, opacity: c.active && !done ? 1 : 0.65, borderRight: `3px solid ${isOut ? '#f87171' : '#22c55e'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{ki.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.name}</span>
                    <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-3)' }}>{ki.label} · {FREQ_LABEL[c.freq]}</span>
                    {done && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: 'var(--ok-bg-2)', color: 'var(--ok-text)' }}>مكتمل</span>}
                    {!c.active && !done && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: '#f1f5f9', color: '#64748b' }}>موقوف</span>}
                    {overdue && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: 'var(--danger-bg-2)', color: 'var(--danger-text)' }}>⏰ متأخر</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                    {projName(c.projectId)}{c.memberId ? ` · 👤 ${memberName(c.memberId)}` : ''}{c.party ? ` · ${c.party}` : ''}{!done ? ` · يستحق ${c.nextDue}` : ''}
                  </div>
                  {c.totalCount != null && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isOut ? '#f87171' : '#22c55e' }} />
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3 }}>دُفع {c.paidCount} من {c.totalCount} دفعة ({pct}%)</div>
                    </div>
                  )}
                  {c.totalCount == null && c.paidCount > 0 && <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 6 }}>دُفع {c.paidCount} دفعة (مستمر)</div>}
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: isOut ? '#b91c1c' : '#15803d' }}>{isOut ? '−' : '+'}{fmtNum(c.amount)}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>/ {FREQ_LABEL[c.freq]}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {c.active && !done && (
                  <button onClick={() => onPay(c.id)} style={{ background: isOut ? '#b91c1c' : '#15803d', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isOut ? '↑ تسجيل دفعة' : '↓ تسجيل استلام'}
                  </button>
                )}
                <button onClick={() => setViewC(c)} style={{ background: 'var(--surface-3)', color: 'var(--text-2)', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>التفاصيل</button>
                {!done && <button onClick={() => onToggle(c.id)} style={{ background: 'var(--surface-3)', color: 'var(--text-3)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{c.active ? '⏸ إيقاف' : '▶ تفعيل'}</button>}
                <button onClick={() => onDelete(c.id)} style={{ background: 'none', color: 'var(--text-3)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', marginRight: 'auto' }}>🗑️</button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="التزام دوري جديد">
        {openCreate && <CommitmentForm projectId={projectId} projects={projects} members={members} onSave={(c) => { onSave(c); onCloseCreate(); }} onCancel={onCloseCreate} />}
      </Sheet>

      {/* view */}
      <Sheet open={!!viewC} onClose={() => setViewC(null)} title="تفاصيل الالتزام">
        {viewC && (() => {
          const c = viewC;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {([
                ['النوع', `${kindInfo(c.kind).icon} ${kindInfo(c.kind).label}`],
                ['الاتجاه', c.direction === 'out' ? '↑ صادر (ندفع)' : '↓ وارد (نستلم)'],
                ['الاسم', c.name], ...(c.party ? [['الطرف', c.party]] : []),
                ['المشروع', projName(c.projectId)],
                ['مبلغ الدفعة', fmt(c.amount)], ['التكرار', FREQ_LABEL[c.freq]],
                ['تاريخ البداية', c.startDate], ['الاستحقاق القادم', commitmentDone(c) ? 'مكتمل' : c.nextDue],
                ['الدفعات', c.totalCount ? `${c.paidCount} من ${c.totalCount}` : `${c.paidCount} (مستمر)`],
                ['الحالة', commitmentDone(c) ? 'مكتمل' : c.active ? 'نشط' : 'موقوف'],
                ['أضافها', c.createdBy ?? CURRENT_USER],
                ...(c.note ? [['ملاحظات', c.note]] : []),
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{v}</span>
                </div>
              ))}
              {c.payments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>سجل الدفعات ({c.payments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...c.payments].reverse().map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12.5 }}>
                        <span style={{ color: 'var(--text-3)' }}>{p.date} · {p.dueLabel}</span>
                        <span style={{ fontWeight: 600, color: c.direction === 'out' ? '#b91c1c' : '#15803d' }}>{fmtNum(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {c.attachments && c.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({c.attachments.length})</div>
                  <AttachmentView items={c.attachments} />
                </div>
              )}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  REPORTS & ANALYTICS (التقارير والتحليلات)
// ═══════════════════════════════════════════
const REPORT_PERIODS: { v: string; l: string; days: number }[] = [
  { v: '1m', l: 'آخر شهر', days: 30 },
  { v: '3m', l: 'آخر 3 أشهر', days: 91 },
  { v: '6m', l: 'آخر 6 أشهر', days: 182 },
  { v: '12m', l: 'آخر سنة', days: 365 },
  { v: 'all', l: 'كل الفترات', days: 99999 },
];
const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM
const monthLabelAr = (key: string) => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const [y, m] = key.split('-');
  return `${months[Number(m) - 1]} ${y.slice(2)}`;
};

function Reports({ projects, transactions, receivables, commitments, trackings, requests, members }: {
  projects: Project[]; transactions: Transaction[]; receivables: Receivable[];
  commitments: Commitment[]; trackings: Tracking[]; requests: RequestItem[]; members: Member[];
}) {
  const [tab, setTab] = useState<'financial' | 'operational' | 'smart'>('financial');
  const [fProject, setFProject] = useState('all');
  const [period, setPeriod] = useState('6m');
  const palette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

  const periodDays = REPORT_PERIODS.find(p => p.v === period)?.days ?? 182;
  const cutoff = new Date(Date.now() - periodDays * 86400000).toISOString().slice(0, 10);
  const inProject = (pid: string) => fProject === 'all' || pid === fProject;
  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';

  // filtered datasets
  const txs = transactions.filter(t => inProject(t.projectId) && t.date >= cutoff);
  const recvs = receivables.filter(r => inProject(r.projectId));
  const comms = commitments.filter(c => inProject(c.projectId));
  const tracks = trackings.filter(t => inProject(t.projectId));
  const reqs = requests.filter(r => inProject(r.projectId) && r.date >= cutoff);

  const scopeLabel = fProject === 'all' ? 'كل المشاريع' : projName(fProject);
  const periodLabel = REPORT_PERIODS.find(p => p.v === period)?.l ?? '';

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <PageHeader title="التقارير والتحليلات" subtitle={`${scopeLabel} · ${periodLabel}`} action={
        <Btn size="sm" variant="outline" onClick={() => window.print()}>🖨️ تصدير / طباعة</Btn>
      } />

      {/* scope filters */}
      <Card style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>المشروع</div>
          <Select value={fProject} onChange={setFProject} options={[{ v: 'all', l: 'كل المشاريع' }, ...projects.map(p => ({ v: p.id, l: p.name }))]} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>الفترة</div>
          <Select value={period} onChange={setPeriod} options={REPORT_PERIODS.map(p => ({ v: p.v, l: p.l }))} />
        </div>
      </Card>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-3)', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['financial', '💰 مالية'], ['operational', '⚙️ تشغيلية'], ['smart', '🧠 ذكية']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v as any)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            background: tab === v ? 'var(--surface)' : 'transparent', color: tab === v ? 'var(--text)' : 'var(--text-3)',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'financial' && <FinancialReport txs={txs} recvs={recvs} projects={projects} fProject={fProject} palette={palette} />}
      {tab === 'operational' && <OperationalReport tracks={tracks} reqs={reqs} comms={comms} projects={projects} palette={palette} projName={projName} />}
      {tab === 'smart' && <SmartReport txs={txs} recvs={recvs} comms={comms} tracks={tracks} reqs={reqs} projName={projName} />}
    </div>
  );
}

// ── tab 1: financial ──
function FinancialReport({ txs, recvs, projects, fProject, palette }: {
  txs: Transaction[]; recvs: Receivable[]; projects: Project[];
  fProject: string; palette: string[];
}) {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expense;
  const recvOpen = recvs.filter(r => r.kind === 'receivable').reduce((s, r) => s + recvRemaining(r), 0);
  const payOpen = recvs.filter(r => r.kind === 'payable').reduce((s, r) => s + recvRemaining(r), 0);

  // monthly income vs expense
  const months = Array.from(new Set(txs.map(t => monthKey(t.date)))).sort();
  const monthlyIncome = months.map(m => txs.filter(t => t.type === 'income' && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0));
  const monthlyExpense = months.map(m => txs.filter(t => t.type === 'expense' && monthKey(t.date) === m).reduce((s, t) => s + t.amount, 0));

  // expense by category
  const catMap = new Map<string, number>();
  txs.filter(t => t.type === 'expense').forEach(t => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
  const catSegments = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value: Math.round(value), color: palette[i % palette.length] }));

  // income/expense by project (only when viewing all)
  const projBars = fProject === 'all' ? projects.map((p, i) => {
    const pinc = txs.filter(t => t.projectId === p.id && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const pexp = txs.filter(t => t.projectId === p.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { label: p.name, value: Math.round(pinc - pexp), color: palette[i % palette.length] };
  }).filter(b => b.value !== 0) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatCards cards={[
        { label: 'إجمالي الإيرادات', value: fmtNum(Math.round(income)), color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '↓' },
        { label: 'إجمالي المصروفات', value: fmtNum(Math.round(expense)), color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '↑' },
        { label: 'صافي التدفق', value: fmtNum(Math.round(net)), color: net >= 0 ? '#1d4ed8' : '#b91c1c', bg: 'var(--info-bg)', icon: '⇄' },
        { label: 'عدد العمليات', value: txs.length, color: 'var(--purple-text)', bg: 'var(--purple-bg)', icon: '#' },
      ]} />

      {months.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>الإيرادات والمصروفات شهرياً</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, padding: '0 4px', overflowX: 'auto' }}>
            {months.map((m, i) => {
              const maxV = Math.max(...monthlyIncome, ...monthlyExpense, 1);
              return (
                <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 56, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140 }}>
                    <div title={`إيراد: ${fmt(monthlyIncome[i])}`} style={{ width: 14, height: `${(monthlyIncome[i] / maxV) * 140}px`, background: '#22c55e', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                    <div title={`مصروف: ${fmt(monthlyExpense[i])}`} style={{ width: 14, height: `${(monthlyExpense[i] / maxV) * 140}px`, background: '#f87171', borderRadius: '3px 3px 0 0', minHeight: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{monthLabelAr(m)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', fontSize: 11.5, color: 'var(--text-3)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#22c55e', marginLeft: 4 }} />إيرادات</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#f87171', marginLeft: 4 }} />مصروفات</span>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {catSegments.length > 0 && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>المصروفات حسب التصنيف</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Donut segments={catSegments} size={130} label="مصروف" />
              <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catSegments.slice(0, 6).map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}><span style={{ width: 9, height: 9, borderRadius: 2, background: s.color }} />{s.label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>{fmtNum(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>وضع الذمم</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--ok-bg)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--ok-text)' }}>ذمم مدينة (لنا)</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ok-text)' }}>{fmt(recvOpen)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--danger-bg)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--danger-text)' }}>ذمم دائنة (علينا)</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--danger-text)' }}>{fmt(payOpen)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>صافي الذمم</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: recvOpen - payOpen >= 0 ? '#15803d' : '#b91c1c' }}>{fmt(recvOpen - payOpen)}</span>
            </div>
          </div>
        </Card>
      </div>

      {projBars.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>صافي كل مشروع (إيراد − مصروف)</div>
          <StatBars bars={projBars} />
        </Card>
      )}
    </div>
  );
}

// ── tab 2: operational ──
function OperationalReport({ tracks, reqs, comms, projects, palette, projName }: {
  tracks: Tracking[]; reqs: RequestItem[]; comms: Commitment[];
  projects: Project[]; palette: string[]; projName: (id: string) => string;
}) {
  const expiring = tracks.filter(t => t.status === 'expiring').length;
  const expired = tracks.filter(t => t.status === 'expired').length;
  const pendingReqs = reqs.filter(r => r.status === 'pending').length;
  const activeComms = comms.filter(c => c.active && !commitmentDone(c)).length;

  // trackings by type
  const typeMap = new Map<string, number>();
  tracks.forEach(t => typeMap.set(t.type, (typeMap.get(t.type) ?? 0) + 1));
  const typeBars = Array.from(typeMap.entries()).map(([label, value], i) => ({ label, value, color: palette[i % palette.length] }));

  // upcoming commitments (next due, sorted)
  const upcoming = [...comms].filter(c => c.active && !commitmentDone(c)).sort((a, b) => a.nextDue.localeCompare(b.nextDue)).slice(0, 6);
  // soonest expiring trackings
  const soonExpiring = [...tracks].filter(t => t.status !== 'active').sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0, 6);

  // requests by status
  const reqStatuses = ['pending', 'approved', 'rejected'] as const;
  const reqLabels: Record<string, string> = { pending: 'معلّقة', approved: 'معتمدة', rejected: 'مرفوضة' };
  const reqColors: Record<string, string> = { pending: '#d97706', approved: '#15803d', rejected: '#b91c1c' };
  const reqBars = reqStatuses.map(s => ({ label: reqLabels[s], value: reqs.filter(r => r.status === s).length, color: reqColors[s] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatCards cards={[
        { label: 'متابعات تنتهي قريباً', value: expiring, color: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '⏰' },
        { label: 'متابعات منتهية', value: expired, color: 'var(--danger-text)', bg: 'var(--danger-bg)', icon: '⚠️' },
        { label: 'طلبات معلّقة', value: pendingReqs, color: '#d97706', bg: 'var(--warn-bg)', icon: '◫' },
        { label: 'التزامات نشطة', value: activeComms, color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '↻' },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {typeBars.length > 0 && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>المتابعات حسب النوع</div>
            <StatBars bars={typeBars} />
          </Card>
        )}
        {reqs.length > 0 && (
          <Card>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>الطلبات حسب الحالة</div>
            <StatBars bars={reqBars} />
          </Card>
        )}
      </div>

      {soonExpiring.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>أقرب المتابعات انتهاءً</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {soonExpiring.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span>{t.icon}</span>{t.name}
                  <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>· {projName(t.projectId)}</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.status === 'expired' ? '#b91c1c' : '#c2410c' }}>{t.expiryDate}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>الالتزامات القادمة</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{c.name} <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>· {projName(c.projectId)} · يستحق {c.nextDue}</span></span>
                <span style={{ fontSize: 12, fontWeight: 600, color: c.direction === 'out' ? '#b91c1c' : '#15803d' }}>{c.direction === 'out' ? '−' : '+'}{fmtNum(c.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── tab 3: smart insights ──
function SmartReport({ txs, recvs, comms, tracks, reqs, projName }: {
  txs: Transaction[]; recvs: Receivable[]; comms: Commitment[]; tracks: Tracking[]; reqs: RequestItem[];
  projName: (id: string) => string;
}) {
  type Insight = { kind: 'risk' | 'trend' | 'tip'; icon: string; title: string; body: string; color: string; bg: string };
  const insights: Insight[] = [];

  // RISK: overdue receivables
  const overdueRecv = recvs.filter(r => r.kind === 'receivable' && r.status !== 'settled' && r.dueDate && r.dueDate < today());
  if (overdueRecv.length > 0) {
    const sum = overdueRecv.reduce((s, r) => s + recvRemaining(r), 0);
    insights.push({ kind: 'risk', icon: '⚠️', color: 'var(--danger-text)', bg: 'var(--danger-bg)', title: `${overdueRecv.length} ذمة مدينة متأخرة`, body: `بإجمالي ${fmt(sum)} تجاوزت تاريخ الاستحقاق ولم تُحصّل بعد. يُنصح بالمتابعة مع الأطراف.` });
  }
  // RISK: overdue payables
  const overduePay = recvs.filter(r => r.kind === 'payable' && r.status !== 'settled' && r.dueDate && r.dueDate < today());
  if (overduePay.length > 0) {
    const sum = overduePay.reduce((s, r) => s + recvRemaining(r), 0);
    insights.push({ kind: 'risk', icon: '⚠️', color: 'var(--danger-text)', bg: 'var(--danger-bg)', title: `${overduePay.length} ذمة دائنة متأخرة`, body: `بإجمالي ${fmt(sum)} مستحقة عليك وتجاوزت موعدها. سدادها يحافظ على علاقاتك ومصداقيتك.` });
  }
  // RISK: expired/expiring trackings
  const expiredTr = tracks.filter(t => t.status === 'expired');
  const expiringTr = tracks.filter(t => t.status === 'expiring');
  if (expiredTr.length > 0) insights.push({ kind: 'risk', icon: '🔴', color: 'var(--danger-text)', bg: 'var(--danger-bg)', title: `${expiredTr.length} متابعة منتهية`, body: `هناك عقود أو ضمانات أو وثائق انتهت صلاحيتها. راجعها لتجنّب انقطاع الخدمة أو فقد الضمان.` });
  if (expiringTr.length > 0) insights.push({ kind: 'risk', icon: '⏰', color: 'var(--warn-text)', bg: 'var(--warn-bg)', title: `${expiringTr.length} متابعة تنتهي قريباً`, body: `تنتهي خلال 30 يوماً. بادر بالتجديد قبل فوات الموعد.` });

  // TREND: expense trend (last 2 months)
  const months = Array.from(new Set(txs.map(t => monthKey(t.date)))).sort();
  if (months.length >= 2) {
    const last = months[months.length - 1], prev = months[months.length - 2];
    const lastExp = txs.filter(t => t.type === 'expense' && monthKey(t.date) === last).reduce((s, t) => s + t.amount, 0);
    const prevExp = txs.filter(t => t.type === 'expense' && monthKey(t.date) === prev).reduce((s, t) => s + t.amount, 0);
    if (prevExp > 0) {
      const change = Math.round(((lastExp - prevExp) / prevExp) * 100);
      if (Math.abs(change) >= 10) {
        insights.push({
          kind: 'trend', icon: change > 0 ? '📈' : '📉', color: change > 0 ? '#b91c1c' : '#15803d', bg: change > 0 ? 'var(--danger-bg)' : 'var(--ok-bg)',
          title: `المصروفات ${change > 0 ? 'ارتفعت' : 'انخفضت'} ${Math.abs(change)}%`, body: `مقارنةً بالشهر السابق (${monthLabelAr(prev)}). ${change > 0 ? 'راجع بنود الصرف لتحديد سبب الزيادة.' : 'استمرار جيد في ضبط المصروفات.'}`
        });
      }
    }
  }

  // TREND: top expense category
  const catMap = new Map<string, number>();
  txs.filter(t => t.type === 'expense').forEach(t => catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.amount));
  const topCat = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCat) insights.push({ kind: 'trend', icon: '🏷️', color: 'var(--purple-text)', bg: 'var(--purple-bg)', title: `أكبر بند مصروف: ${topCat[0]}`, body: `استحوذ على ${fmt(topCat[1])} من إجمالي مصروفاتك في الفترة. مراقبته تساعد على ضبط التكاليف.` });

  // TIP: monthly commitment load
  const monthlyOut = comms.filter(c => c.active && !commitmentDone(c) && c.direction === 'out').reduce((s, c) => {
    const perMonth = c.freq === 'weekly' ? c.amount * 4.33 : c.freq === 'monthly' ? c.amount : c.freq === 'quarterly' ? c.amount / 3 : c.amount / 12;
    return s + perMonth;
  }, 0);
  if (monthlyOut > 0) insights.push({ kind: 'tip', icon: '💡', color: 'var(--info-text)', bg: 'var(--info-bg)', title: `التزاماتك الشهرية ≈ ${fmt(Math.round(monthlyOut))}`, body: `هذا متوسط ما يخرج شهرياً من أقساط والتزامات واشتراكات. خطّط لتدفقك النقدي بناءً عليه.` });

  // TIP: pending requests
  const pending = reqs.filter(r => r.status === 'pending');
  if (pending.length > 0) insights.push({ kind: 'tip', icon: '📋', color: '#d97706', bg: 'var(--warn-bg)', title: `${pending.length} طلب بانتظار قرارك`, body: `هناك طلبات معلّقة تنتظر الاعتماد أو الرفض. مراجعتها تُبقي سير العمل سلساً.` });

  if (insights.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-3)' }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>كل شيء يبدو على ما يرام</div>
        <div style={{ fontSize: 13 }}>لا توجد مخاطر أو تنبيهات بارزة في هذه الفترة والنطاق.</div>
      </Card>
    );
  }

  const order = { risk: 0, trend: 1, tip: 2 };
  insights.sort((a, b) => order[a.kind] - order[b.kind]);
  const kindLabel = { risk: 'مخاطر وتنبيهات', trend: 'اتجاهات وأنماط', tip: 'توصيات' };
  const groups = (['risk', 'trend', 'tip'] as const).filter(k => insights.some(i => i.kind === k));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🧠</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>تحليل ذكي لبياناتك</div>
            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>{insights.length} ملاحظة مستخرجة تلقائياً من عملياتك وذممك والتزاماتك ومتابعاتك</div>
          </div>
        </div>
      </Card>

      {groups.map(g => (
        <div key={g}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10 }}>{kindLabel[g]}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.filter(i => i.kind === g).map((ins, idx) => (
              <Card key={idx} style={{ borderRight: `3px solid ${ins.color}`, background: ins.bg }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{ins.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: ins.color, marginBottom: 4 }}>{ins.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{ins.body}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
//  ASSETS (الأصول الملموسة)
// ═══════════════════════════════════════════
function AssetForm({ projectId, projects, members, onSave, onCancel }: {
  projectId: string; projects: Project[]; members: Member[];
  onSave: (a: Omit<Asset, 'id'>) => void; onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('vehicle');
  const [targetProject, setTargetProject] = useState(projectId);
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [purchaseValue, setPurchaseValue] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');
  const [warrantyEnd, setWarrantyEnd] = useState('');
  const [serial, setSerial] = useState('');
  const [usageMeter, setUsageMeter] = useState<number | ''>('');
  const [usageUnit, setUsageUnit] = useState('');
  const [memberId, setMemberId] = useState('');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const valid = name.trim().length > 0 && purchaseValue !== '' && Number(purchaseValue) >= 0;

  return (
    <>
      <Field label="نوع الأصل">
        <TypePicker value={category} onChange={v => setCategory(v as AssetCategory)} options={ASSET_CATEGORIES.map(c => ({ v: c.id, l: c.label, icon: c.icon }))} />
      </Field>
      <Field label="اسم الأصل">
        <TextInput value={name} onChange={setName} placeholder="مثال: سيارة هايلكس، خادم Dell" />
      </Field>
      <Field label="المشروع">
        <Select value={targetProject} onChange={setTargetProject} options={projects.map(p => ({ v: p.id, l: `${p.icon} ${p.name}` }))} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="تاريخ الشراء" style={{ flex: 1 }}>
          <TextInput type="date" value={purchaseDate} onChange={setPurchaseDate} />
        </Field>
        <Field label="قيمة الشراء (ر.س)" style={{ flex: 1 }}>
          <NumInput value={purchaseValue} onChange={setPurchaseValue} placeholder="0" />
        </Field>
      </div>
      <Field label="المورّد (اختياري)">
        <TextInput value={supplier} onChange={setSupplier} placeholder="مثال: الوكالة، شركة التقنية" />
      </Field>
      <Field label="انتهاء الضمان (اختياري)">
        <TextInput type="date" value={warrantyEnd} onChange={setWarrantyEnd} />
      </Field>
      <Field label="الرقم التسلسلي / اللوحة (اختياري)">
        <TextInput value={serial} onChange={setSerial} placeholder="مثال: أ ب ج 1234" />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="عداد الاستخدام (اختياري)" style={{ flex: 1 }}>
          <NumInput value={usageMeter} onChange={setUsageMeter} placeholder="0" />
        </Field>
        <Field label="وحدة العداد" style={{ flex: 1 }}>
          <TextInput value={usageUnit} onChange={setUsageUnit} placeholder="كم / ساعة" />
        </Field>
      </div>
      <Field label="المسؤول/الحائز (اختياري)">
        <Select value={memberId} onChange={setMemberId} options={[{ v: '', l: 'بدون' }, ...members.filter(m => m.projectId === targetProject).map(m => ({ v: m.id, l: m.name }))]} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="تفاصيل إضافية..." />
      </Field>
      <Field label="المرفقات (فاتورة، صور)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          projectId: targetProject, name: name.trim(), category, purchaseDate,
          purchaseValue: purchaseValue === '' ? 0 : purchaseValue, supplier: supplier.trim() || undefined,
          warrantyEnd: warrantyEnd || undefined, serial: serial.trim() || undefined,
          usageMeter: usageMeter === '' ? undefined : Number(usageMeter), usageUnit: usageUnit.trim() || undefined,
          status: 'active', memberId: memberId || undefined, maintenance: [], note: note.trim() || undefined, attachments, createdBy: CURRENT_USER,
        })}>إضافة الأصل</Btn>
      </div>
    </>
  );
}

function MaintenanceForm({ onSave, onCancel }: { onSave: (m: Omit<MaintenanceEntry, 'id'>) => void; onCancel: () => void }) {
  const [type, setType] = useState<MaintenanceEntry['type']>('صيانة');
  const [date, setDate] = useState(today());
  const [cost, setCost] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  return (
    <>
      <Field label="النوع">
        <TypePicker value={type} onChange={v => setType(v as MaintenanceEntry['type'])} options={[
          { v: 'صيانة', l: 'صيانة', icon: '🔧' }, { v: 'عطل', l: 'عطل', icon: '⚠️' }, { v: 'فحص', l: 'فحص', icon: '🔍' },
        ]} />
      </Field>
      <Field label="التاريخ">
        <TextInput type="date" value={date} onChange={setDate} />
      </Field>
      <Field label="التكلفة (ر.س)">
        <NumInput value={cost} onChange={setCost} placeholder="0" />
      </Field>
      <Field label="الوصف">
        <TextArea value={note} onChange={setNote} placeholder="تفاصيل الصيانة أو العطل..." />
      </Field>
      <Field label="المرفقات (فاتورة، تقرير فحص، صور، PDF)">
        <AttachmentPicker value={attachments} onChange={setAttachments} />
      </Field>
      <div style={{ background: 'var(--info-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--info-text)' }}>
        ℹ️ ستُسجّل التكلفة كمصروف فعلي في الإدارة المالية للمشروع.
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={cost === '' || Number(cost) < 0} style={{ flex: 1 }} onClick={() => onSave({ type, date, cost: cost === '' ? 0 : cost, note: note.trim(), createdBy: CURRENT_USER, attachments })}>تسجيل</Btn>
      </div>
    </>
  );
}

function Assets({ projectId, projects, assets, members, onSave, onDelete, onAddMaintenance, openCreate, onOpenCreate, onCloseCreate }: {
  projectId: string; projects: Project[]; assets: Asset[]; members: Member[];
  onSave: (a: Omit<Asset, 'id'>) => void; onDelete: (id: string) => void;
  onAddMaintenance: (assetId: string, m: Omit<MaintenanceEntry, 'id'>) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void;
}) {
  const [search, setSearch] = useState('');
  const [fProject, setFProject] = useState('all');
  const [fCategory, setFCategory] = useState('all');
  const [fStatus, setFStatus] = useState('all');
  const [view, setView] = useState<Asset | null>(null);
  const [addMaint, setAddMaint] = useState(false);

  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '—';
  const memberName = (id?: string) => members.find(m => m.id === id)?.name ?? '';
  const catInfo = (c: AssetCategory) => ASSET_CATEGORIES.find(x => x.id === c)!;

  const filtered = assets
    .filter(a => fProject === 'all' ? true : a.projectId === fProject)
    .filter(a => fCategory === 'all' ? true : a.category === fCategory)
    .filter(a => fStatus === 'all' ? true : a.status === fStatus)
    .filter(a => search.trim() === '' ? true : (a.name + (a.serial ?? '') + (a.supplier ?? '')).includes(search.trim()));

  const totalValue = assets.reduce((s, a) => s + a.purchaseValue, 0);
  const activeCount = assets.filter(a => a.status === 'active').length;
  const inMaint = assets.filter(a => a.status === 'maintenance').length;
  const warrantyExpiring = assets.filter(a => a.warrantyEnd && a.warrantyEnd >= today() && a.warrantyEnd <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;

  const clearFilters = () => { setSearch(''); setFProject('all'); setFCategory('all'); setFStatus('all'); };

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      <PageHeader title="الأصول" subtitle="إدارة الأصول الملموسة ودورة حياتها" action={<Btn size="sm" onClick={onOpenCreate}>+ أصل جديد</Btn>} />

      <StatCards cards={[
        { label: 'إجمالي قيمة الأصول', value: fmtNum(Math.round(totalValue)), color: 'var(--info-text)', bg: 'var(--info-bg)', icon: '💎' },
        { label: 'أصول نشطة', value: activeCount, color: 'var(--ok-text)', bg: 'var(--ok-bg)', icon: '✓' },
        { label: 'تحت الصيانة', value: inMaint, color: 'var(--warn-text-2)', bg: 'var(--warn-bg-2)', icon: '🔧' },
        { label: 'ضمانات تنتهي قريباً', value: warrantyExpiring, color: 'var(--warn-text)', bg: 'var(--warn-bg)', icon: '🛡️' },
      ]} />

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في الأصول..."
        values={{ project: fProject, category: fCategory, status: fStatus }}
        onChange={(k, v) => { if (k === 'project') setFProject(v); else if (k === 'category') setFCategory(v); else if (k === 'status') setFStatus(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'project', placeholder: 'المشروع', options: [{ v: 'all', l: 'كل المشاريع' }, ...projects.map(p => ({ v: p.id, l: p.name }))] },
          { key: 'category', placeholder: 'النوع', options: [{ v: 'all', l: 'كل الأنواع' }, ...ASSET_CATEGORIES.map(c => ({ v: c.id, l: c.label }))] },
          { key: 'status', placeholder: 'الحالة', options: [{ v: 'all', l: 'كل الحالات' }, { v: 'active', l: 'نشط' }, { v: 'maintenance', l: 'تحت الصيانة' }, { v: 'retired', l: 'مستبعَد' }] },
        ]}
      />

      {filtered.length === 0 && (
        assets.length === 0
          ? <EmptyState icon="⬚" title="لا توجد أصول بعد" hint="السيارات والأجهزة والمعدّات وأي ممتلكات ملموسة. سجّل أول أصل لتتبّع قيمته وضمانه وصيانته وعداد استخدامه في مكان واحد." actionLabel="+ إضافة أول أصل" onAction={onOpenCreate} />
          : <EmptyState icon="🔍" title="لا توجد أصول مطابقة" hint="جرّب تعديل الفلاتر أو البحث." />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(a => {
          const ci = catInfo(a.category);
          const st = ASSET_STATUS[a.status];
          const warrantyActive = a.warrantyEnd && a.warrantyEnd >= today();
          const warrantyExp = a.warrantyEnd && a.warrantyEnd >= today() && a.warrantyEnd <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
          return (
            <Card key={a.id} style={{ padding: 16, cursor: 'pointer' }}>
              <div onClick={() => setView(a)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{ci.icon}</span>
                    <span>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ci.label} · {projName(a.projectId)}</div>
                    </span>
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)' }}>قيمة الشراء</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{fmtNum(a.purchaseValue)}</div>
                  </div>
                  {a.warrantyEnd && (
                    <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 99, background: warrantyExp ? 'var(--warn-bg)' : warrantyActive ? 'var(--ok-bg-2)' : '#f1f5f9', color: warrantyExp ? '#c2410c' : warrantyActive ? '#15803d' : '#64748b' }}>
                      {warrantyActive ? `🛡️ ضمان حتى ${a.warrantyEnd}` : 'انتهى الضمان'}
                    </span>
                  )}
                </div>
                {a.usageMeter != null && a.usageUnit && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>العداد: {fmtNum(a.usageMeter)} {a.usageUnit}</div>}
                {a.maintenance.length > 0 && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>🔧 {a.maintenance.length} سجل صيانة · إجمالي {fmtNum(assetMaintCost(a))} ر.س</div>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="أصل جديد">
        {openCreate && <AssetForm projectId={projectId} projects={projects} members={members} onSave={(a) => { onSave(a); onCloseCreate(); }} onCancel={onCloseCreate} />}
      </Sheet>

      {/* view detail */}
      <Sheet open={!!view} onClose={() => { setView(null); setAddMaint(false); }} title="تفاصيل الأصل">
        {view && (() => {
          const a = view; const ci = catInfo(a.category); const st = ASSET_STATUS[a.status];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{ci.icon}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{a.name}</div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              </div>

              {[
                ['النوع', ci.label], ['المشروع', projName(a.projectId)],
                ['قيمة الشراء', fmt(a.purchaseValue)], ['تاريخ الشراء', a.purchaseDate],
                ...(a.supplier ? [['المورّد', a.supplier] as [string, string]] : []),
                ...(a.warrantyEnd ? [['انتهاء الضمان', a.warrantyEnd] as [string, string]] : []),
                ...(a.serial ? [['الرقم/اللوحة', a.serial] as [string, string]] : []),
                ...(a.usageMeter != null ? [['العداد', `${fmtNum(a.usageMeter)} ${a.usageUnit ?? ''}`] as [string, string]] : []),
                ...(a.memberId ? [['المسؤول', memberName(a.memberId)] as [string, string]] : []),
                ['إجمالي الصيانة', fmt(assetMaintCost(a))],
                ...(a.note ? [['ملاحظات', a.note] as [string, string]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}>{v}</span>
                </div>
              ))}

              {/* maintenance log */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>سجل الصيانة والأعطال ({a.maintenance.length})</span>
                  <button onClick={() => setAddMaint(true)} style={{ background: 'var(--info-bg)', color: 'var(--info-text)', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ تسجيل</button>
                </div>
                {a.maintenance.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 0' }}>لا توجد سجلات بعد.</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...a.maintenance].reverse().map(m => (
                    <div key={m.id} style={{ padding: '9px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{m.type === 'صيانة' ? '🔧' : m.type === 'عطل' ? '⚠️' : '🔍'} {m.type} — {m.date}</div>
                          {m.note && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.note}</div>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger-text)', flexShrink: 0 }}>{fmtNum(m.cost)}</div>
                      </div>
                      {m.attachments && m.attachments.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4 }}>📎 {m.attachments.length} مرفق</div>
                          <AttachmentView items={m.attachments} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {a.attachments && a.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>المرفقات ({a.attachments.length})</div>
                  <AttachmentView items={a.attachments} />
                </div>
              )}

              <button onClick={() => { onDelete(a.id); setView(null); }} style={{ background: 'none', border: '1px solid #fecaca', color: 'var(--danger-text)', borderRadius: 8, padding: '8px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>🗑️ حذف الأصل</button>
            </div>
          );
        })()}
      </Sheet>

      {/* add maintenance */}
      <Sheet open={addMaint} onClose={() => setAddMaint(false)} title="تسجيل صيانة / عطل">
        {addMaint && view && <MaintenanceForm onSave={(m) => { onAddMaintenance(view.id, m); setAddMaint(false); setView(null); }} onCancel={() => setAddMaint(false)} />}
      </Sheet>
    </div>
  );
}

// ═══════════════════════════════════════════
//  HEALTH CHECK (فحص اتساق الحسابات)
// ═══════════════════════════════════════════
type HealthIssue = {
  level: 'error' | 'warning' | 'ok'; title: string; detail: string;
  cause?: string; why?: string; fix?: string; ai?: string;
  action?: { label: string; page: Page; itemId?: string; projId?: string };
  actions?: { label: string; page: Page; itemId?: string; projId?: string }[];
};
// ── context-aware AI assistant ──────────────────────────────
type AICtx = {
  page: Page; projectId: string;
  projects: Project[]; transactions: Transaction[]; trackings: Tracking[];
  assets: Asset[]; receivables: Receivable[]; commitments: Commitment[];
  members: Member[]; memberTxns: MemberTxn[]; requests: RequestItem[]; documents: DocItem[];
};
// page → short human label + quick suggested prompts (so the assistant adapts to where the user is)
const AI_PAGE_INFO: Partial<Record<Page, { label: string; prompts: string[] }>> = {
  overview: { label: 'النظرة الشاملة', prompts: ['ما ملخّص وضعي المالي؟', 'أي مشروع يحتاج انتباهي؟', 'ما أبرز التنبيهات؟'] },
  finance: { label: 'الإدارة المالية', prompts: ['لماذا ارتفعت المصروفات؟', 'هل توجد عمليات خاطئة؟', 'ما أكبر بنود الصرف؟'] },
  ledger: { label: 'السجل المالي', prompts: ['ما صافي التدفق النقدي؟', 'من أين تأتي الأموال؟'] },
  trackings: { label: 'المتابعات والضمانات', prompts: ['ما الذي يوشك على الانتهاء؟', 'هل توجد وثائق منتهية؟'] },
  assets: { label: 'الأصول', prompts: ['ما الأصول التي تحتاج صيانة؟', 'كم تبلغ قيمة أصولي؟'] },
  receivables: { label: 'الذمم', prompts: ['كم لي وكم عليّ؟', 'ما الذمم المتأخرة؟'] },
  commitments: { label: 'الالتزامات', prompts: ['ما الأقساط القادمة؟', 'كم إجمالي التزاماتي الشهرية؟'] },
  requests: { label: 'الطلبات والموافقات', prompts: ['ما الطلبات المعلّقة؟', 'كم قيمة الطلبات المنتظرة؟'] },
  reports: { label: 'التقارير', prompts: ['ما أهم المؤشرات؟', 'فسّر لي اتجاه المصروفات'] },
  documents: { label: 'المستندات', prompts: ['كم مستنداً لديّ؟', 'ما المستندات الأخيرة؟'] },
};
function fmtN(n: number) { return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(Math.round(n)); }

// generate a context-aware textual answer from the user's query + the data on the current page
type AIReply = { text: string; link?: { label: string; page: Page; itemId?: string; projId?: string } };
function aiRespond(query: string, ctx: AICtx): AIReply {
  const q = query.trim();
  const proj = ctx.projects.find(p => p.id === ctx.projectId);
  const projTx = ctx.transactions.filter(t => t.projectId === ctx.projectId);
  const income = projTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = projTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // detect bad transactions anywhere (project-aware)
  const badTx = ctx.transactions.filter(t => txErrors(t, { project: ctx.projects.find(p => p.id === t.projectId), transactions: ctx.transactions }).length > 0);

  // intent matching (lightweight keyword routing)
  const has = (...kw: string[]) => kw.some(k => q.includes(k));

  // ── financial summary ──
  if (has('ملخّص', 'ملخص', 'وضعي', 'وضع المالي', 'الوضع المالي')) {
    const totalBal = ctx.projects.reduce((s, p) => s + computeBalance(p, ctx.transactions), 0);
    return { text: `إجمالي أرصدة مشاريعك ${fmtN(totalBal)} ر.س عبر ${ctx.projects.length} مشاريع.\nفي «${proj?.name ?? '—'}»: الإيرادات ${fmtN(income)} والمصروفات ${fmtN(expense)} ر.س (الصافي ${fmtN(income - expense)}).${badTx.length ? `\n⚠️ انتبه: لديك ${badTx.length} عملية تحتاج مراجعة محاسبية.` : ''}`, link: badTx.length ? { label: 'مراجعة العمليات', page: 'finance', itemId: badTx[0].id, projId: badTx[0].projectId } : { label: 'فتح التقارير', page: 'reports' } };
  }
  // ── expenses analysis ──
  if (has('مصروف', 'المصروفات', 'الصرف', 'صرف', 'ارتفع')) {
    const byCat: Record<string, number> = {};
    projTx.filter(t => t.type === 'expense').forEach(t => { byCat[t.category] = (byCat[t.category] ?? 0) + t.amount; });
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (top.length === 0) return { text: `لا توجد مصروفات مسجّلة في «${proj?.name ?? 'هذا المشروع'}» بعد.` };
    return { text: `أكبر بنود الصرف في «${proj?.name}»:\n${top.map(([c, v], i) => `${i + 1}. ${c}: ${fmtN(v)} ر.س`).join('\n')}\nإجمالي المصروفات ${fmtN(expense)} ر.س.${top[0][1] > expense * 0.5 ? `\n💡 بند «${top[0][0]}» وحده يمثّل أكثر من نصف مصروفاتك — راجعه لفرص التوفير.` : ''}`, link: { label: 'فتح الإدارة المالية', page: 'finance' } };
  }
  // ── erroneous transactions ──
  if (has('خطأ', 'خاطئة', 'خاطئ', 'مشكلة', 'غير صحيح')) {
    if (badTx.length === 0) return { text: '✅ لا توجد عمليات خاطئة محاسبياً حالياً. كل العمليات سليمة.' };
    return { text: `رصدت ${badTx.length} عملية تحتاج مراجعة:\n${badTx.slice(0, 4).map(t => `• ${t.description} (${fmtN(t.amount)} ر.س)`).join('\n')}\n💡 افتح الإدارة المالية — ستجدها مميّزة بالأحمر مع زر «معالجة» عند الضغط على ⚠️.`, link: { label: 'الذهاب للعملية', page: 'finance', itemId: badTx[0].id, projId: badTx[0].projectId } };
  }
  // ── trackings / expiring ──
  if (has('ينتهي', 'انتهاء', 'يوشك', 'ضمان', 'تجديد', 'منتهي')) {
    const soon = ctx.trackings.filter(t => t.status === 'expiring' || t.status === 'expired');
    if (soon.length === 0) return { text: 'لا توجد متابعات أو ضمانات قريبة الانتهاء حالياً. كل شيء ضمن المدة.' };
    return { text: `${soon.length} عنصر يحتاج انتباهك:\n${soon.slice(0, 5).map(t => `• ${t.name} — ${t.status === 'expired' ? 'منتهٍ' : `خلال ${t.daysLeft} يوم`}`).join('\n')}\n💡 راجعها في قسم المتابعات والضمانات وجدّد ما يلزم.`, link: { label: 'الذهاب للمتابعات', page: 'trackings', itemId: soon[0].id, projId: soon[0].projectId } };
  }
  // ── assets / maintenance ──
  if (has('أصول', 'أصل', 'صيانة', 'سيارة', 'معدات')) {
    const totalVal = ctx.assets.reduce((s, a) => s + a.purchaseValue, 0);
    const needMaint = ctx.assets.filter(a => a.status === 'maintenance');
    return { text: `لديك ${ctx.assets.length} أصل بقيمة شراء إجمالية ${fmtN(totalVal)} ر.س.${needMaint.length ? `\n🔧 ${needMaint.length} أصل في حالة صيانة: ${needMaint.map(a => a.name).join('، ')}.` : '\n✅ كل الأصول في حالة تشغيل جيدة.'}`, link: { label: 'فتح الأصول', page: 'assets' } };
  }
  // ── receivables ──
  if (has('ذمم', 'ذمة', 'مستحق', 'لي', 'عليّ', 'علي ')) {
    const recv = ctx.receivables.filter(r => r.kind === 'receivable').reduce((s, r) => s + (r.amount - recvPaid(r)), 0);
    const pay = ctx.receivables.filter(r => r.kind === 'payable').reduce((s, r) => s + (r.amount - recvPaid(r)), 0);
    return { text: `الذمم المستحقة لك (لك): ${fmtN(recv)} ر.س.\nالذمم المستحقة عليك (عليك): ${fmtN(pay)} ر.س.\nالصافي: ${fmtN(recv - pay)} ر.س.${recv > pay ? '\n💡 وضعك إيجابي — لك أكثر مما عليك.' : ''}`, link: { label: 'فتح الذمم', page: 'receivables' } };
  }
  // ── commitments ──
  if (has('التزام', 'أقساط', 'قسط', 'اشتراك')) {
    const active = ctx.commitments.filter(c => c.active);
    const monthly = active.reduce((s, c) => s + c.amount, 0);
    return { text: `لديك ${active.length} التزام نشط بإجمالي تقريبي ${fmtN(monthly)} ر.س لكل دورة.\n💡 راجع قسم الالتزامات لرؤية تواريخ الاستحقاق القادمة.`, link: { label: 'فتح الالتزامات', page: 'commitments' } };
  }
  // ── requests ──
  if (has('طلب', 'طلبات', 'موافق', 'معلّق', 'معلق')) {
    const pending = ctx.requests.filter(r => r.status === 'pending');
    const sum = pending.reduce((s, r) => s + r.amount, 0);
    if (pending.length === 0) return { text: 'لا توجد طلبات معلّقة بانتظار موافقتك حالياً.' };
    return { text: `${pending.length} طلب معلّق بإجمالي ${fmtN(sum)} ر.س:\n${pending.slice(0, 4).map(r => `• ${r.title} — ${fmtN(r.amount)} ر.س (${r.requestedBy})`).join('\n')}`, link: { label: 'فتح الطلبات', page: 'requests' } };
  }
  // ── which project needs attention ──
  if (has('انتباه', 'مشروع يحتاج', 'أي مشروع', 'انتباهي')) {
    const flagged = ctx.projects.map(p => {
      const bal = computeBalance(p, ctx.transactions);
      const bad = ctx.transactions.filter(t => t.projectId === p.id && txErrors(t, { project: p, transactions: ctx.transactions }).length > 0).length;
      return { p, bal, bad };
    }).filter(x => x.bal < 0 || x.bad > 0);
    if (flagged.length === 0) return { text: '✅ كل مشاريعك بحالة جيدة — لا أرصدة سالبة ولا عمليات خاطئة.' };
    return { text: `مشاريع تحتاج انتباهك:\n${flagged.map(x => `• ${x.p.name}: ${x.bal < 0 ? `رصيد سالب (${fmtN(x.bal)})` : ''}${x.bad ? `${x.bal < 0 ? ' و' : ''}${x.bad} عملية خاطئة` : ''}`).join('\n')}`, link: { label: `فتح ${flagged[0].p.name}`, page: 'finance', projId: flagged[0].p.id } };
  }
  // ── alerts / notifications ──
  if (has('تنبيه', 'تنبيهات', 'إشعار')) {
    const expiring = ctx.trackings.filter(t => t.status === 'expiring' || t.status === 'expired').length;
    const txt = `أبرز ما يحتاج انتباهك الآن:\n${expiring ? `• ${expiring} متابعة/ضمان قريب الانتهاء\n` : ''}${badTx.length ? `• ${badTx.length} عملية تحتاج مراجعة محاسبية\n` : ''}${ctx.requests.filter(r => r.status === 'pending').length ? `• ${ctx.requests.filter(r => r.status === 'pending').length} طلب بانتظار موافقتك` : ''}`.trim();
    return { text: txt || '✅ لا تنبيهات عاجلة — كل شيء تحت السيطرة.', link: { label: 'فتح الإشعارات', page: 'notifications' } };
  }

  // ── fallback: page-aware generic help ──
  const info = AI_PAGE_INFO[ctx.page];
  return { text: `أنا مساعدك الذكي في موازين، وأرى أنك في «${info?.label ?? 'النظام'}».\nيمكنني مساعدتك في تحليل بياناتك، تفسير الأرقام، واقتراح الإجراءات. جرّب أن تسألني:\n${(info?.prompts ?? ['ما ملخّص وضعي المالي؟']).map(p => `• ${p}`).join('\n')}` };
}

function AIAssistant({ ctx, onClose, onNavigate }: { ctx: AICtx; onClose: () => void; onNavigate: (p: Page, itemId?: string, projId?: string) => void }) {
  const info = AI_PAGE_INFO[ctx.page];
  const [msgs, setMsgs] = useState<{ role: 'user' | 'ai'; text: string; link?: AIReply['link'] }[]>([
    { role: 'ai', text: `مرحباً! أنا مساعد موازين الذكي 🤖\nأنت الآن في «${info?.label ?? 'النظام'}». كيف أساعدك؟` },
  ]);
  const [input, setInput] = useState('');
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [typing, setTyping] = useState(false);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setMsgs(m => [...m, { role: 'user', text: q }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = aiRespond(q, ctx);
      setMsgs(m => [...m, { role: 'ai', text: reply.text, link: reply.link }]);
      setTyping(false);
    }, 600);
  };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, typing]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'mzFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', width: '100%', maxWidth: 520, height: '78vh', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', animation: 'mzSlideUp .3s cubic-bezier(.16,1,.3,1)', boxShadow: '0 -8px 40px rgba(0,0,0,.18)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 99, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>المساعد الذكي</div>
              <div style={{ fontSize: 11, color: 'var(--purple-text)' }}>يدرك سياق: {info?.label ?? 'النظام'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 99, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: 'var(--text-3)' }}>✕</button>
        </div>
        {/* messages */}
        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-start' : 'flex-end', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-start' : 'flex-end', gap: 6 }}>
              <div style={{ background: m.role === 'user' ? '#2563eb' : 'var(--surface-2)', color: m.role === 'user' ? '#fff' : 'var(--text)', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 14px 4px' : '14px 14px 4px 14px', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{m.text}</div>
              {m.link && (
                <button onClick={() => { onNavigate(m.link!.page, m.link!.itemId, m.link!.projId); onClose(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--info-bg)', color: 'var(--info-text)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>↗ {m.link.label}</button>
              )}
            </div>
          ))}
          {typing && <div style={{ alignSelf: 'flex-end', background: 'var(--surface-2)', padding: '10px 16px', borderRadius: 14, fontSize: 13, color: 'var(--text-3)' }}>يكتب…</div>}
        </div>
        {/* quick prompts */}
        {info && msgs.length <= 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px', flexWrap: 'wrap', flexShrink: 0 }}>
            {info.prompts.map(p => (
              <button key={p} onClick={() => send(p)} style={{ background: 'var(--purple-bg)', color: 'var(--purple-text)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>
        )}
        {/* input */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(input); }} placeholder="اسأل عن بياناتك…" style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }} />
          <button onClick={() => send(input)} disabled={!input.trim()} style={{ background: input.trim() ? '#2563eb' : 'var(--surface-3)', color: input.trim() ? '#fff' : 'var(--text-3)', border: 'none', borderRadius: 12, padding: '0 18px', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>إرسال</button>
        </div>
      </div>
    </div>
  );
}

function runHealthCheck(data: {
  projects: Project[]; transactions: Transaction[]; receivables: Receivable[];
  commitments: Commitment[]; assets: Asset[]; members: Member[]; memberTxns: MemberTxn[];
}): HealthIssue[] {
  const { projects, transactions, receivables, commitments, assets, members, memberTxns } = data;
  const issues: HealthIssue[] = [];
  const projIds = new Set(projects.map(p => p.id));

  // 1. transfer balance: each transfer pair (linkId) must net to zero across projects
  const transfers = transactions.filter(t => t.type === 'transfer');
  const linkGroups = new Map<string, Transaction[]>();
  transfers.forEach(t => { if (t.linkId) { const g = linkGroups.get(t.linkId) ?? []; g.push(t); linkGroups.set(t.linkId, g); } });
  let brokenTransfers = 0; let firstBrokenTx: Transaction | undefined;
  linkGroups.forEach(g => {
    const hasIn = g.some(x => x.transferDir === 'in');
    const hasOut = g.some(x => x.transferDir === 'out');
    if (!hasIn || !hasOut || g.length !== 2) { brokenTransfers++; firstBrokenTx = firstBrokenTx ?? g[0]; }
  });
  const orphanTransfersList = transfers.filter(t => !t.linkId);
  const orphanTransfers = orphanTransfersList.length;
  if (brokenTransfers === 0 && orphanTransfers === 0) issues.push({ level: 'ok', title: 'التحويلات متوازنة', detail: 'كل التحويلات بين المشاريع لها طرفان (صادر ووارد) متطابقان.', ai: 'تحويلاتك سليمة محاسبياً. كل مبلغ خرج من مشروع دخل في الآخر دون فقد أو ازدواج.' });
  else {
    const tx = firstBrokenTx ?? orphanTransfersList[0];
    issues.push({
      level: 'warning', title: 'تحويلات غير متوازنة', detail: `${brokenTransfers + orphanTransfers} تحويل بلا طرف مقابل مكتمل.`,
      cause: 'تحويل بين مشروعين فقد أحد طرفيه (الصادر أو الوارد).',
      why: 'يحدث عادةً عند حذف إحدى عمليتي التحويل المرتبطتين يدوياً، فيبقى الطرف الآخر معلّقاً.',
      fix: 'افتح العملية المتأثرة في الإدارة المالية، واحذف الطرف المتبقي ثم أعد إنشاء التحويل كاملاً، أو أضف الطرف المقابل يدوياً.',
      ai: 'أنصحك بإعادة إنشاء هذا التحويل من البداية بدل ترقيعه — هذا يضمن ربط الطرفين تلقائياً ويحافظ على توازن أرصدة المشروعين.',
      action: tx ? { label: 'عرض العملية في المالية', page: 'finance', itemId: tx.id, projId: tx.projectId } : undefined,
    });
  }

  // 2. member balance consistency
  const mismatchList: Member[] = [];
  members.forEach(m => {
    const accepted = memberTxns.filter(t => t.memberId === m.id && t.status === 'accepted');
    const computed = accepted.reduce((s, t) => s + (t.direction === 'to_member' ? t.amount : -t.amount), 0);
    const stored = m.balance ?? 0;
    if (Math.abs(computed - stored) > 1) mismatchList.push(m);
  });
  if (mismatchList.length === 0) issues.push({ level: 'ok', title: 'أرصدة الأعضاء متطابقة', detail: 'رصيد كل عضو يساوي مجموع حركات عهده المقبولة.', ai: 'أرصدة العهد لدى أعضائك دقيقة ومطابقة لحركاتهم. لا حاجة لأي تسوية.' });
  else issues.push({
    level: 'warning', title: 'أرصدة أعضاء غير متطابقة', detail: `${mismatchList.length} عضو رصيده المخزّن لا يطابق مجموع حركاته المقبولة: ${mismatchList.map(m => m.name).join('، ')}.`,
    cause: 'الرصيد المحفوظ للعضو يختلف عن ناتج جمع حركات عهده المقبولة.',
    why: 'قد ينتج عن تعديل يدوي على الرصيد، أو حركة عهدة عُدّلت/حُذفت بعد قبولها.',
    fix: 'افتح صفحة كل عضو وراجع سجل حركاته، ثم سجّل حركة تسوية تعيد الرصيد لمطابقة الواقع.',
    ai: mismatchList.length > 1
      ? `يوجد ${mismatchList.length} أعضاء بحاجة لتسوية. أنصح بمعالجتهم واحداً تلو الآخر — استخدم أزرار الانتقال أدناه للوصول لكل عضو على حدة. الأسلم تسجيل حركة "تسوية/إرجاع" أو "خصم" بدل تعديل الرصيد يدوياً.`
      : 'الأسلم محاسبياً ألا تُعدّل رصيد العضو يدوياً، بل تسجّل حركة "تسوية/إرجاع" أو "خصم" — هكذا يبقى الرصيد دائماً قابلاً للتتبّع.',
    actions: mismatchList.map(m => ({ label: `عرض «${m.name}» في المشروع`, page: 'projectDetail' as Page, itemId: m.id, projId: m.projectId })),
  });

  // 3. orphan records (project deleted)
  const orphanList = [
    ...transactions.filter(t => !projIds.has(t.projectId)),
    ...receivables.filter(r => !projIds.has(r.projectId)),
    ...commitments.filter(c => !projIds.has(c.projectId)),
    ...assets.filter(a => !projIds.has(a.projectId)),
  ];
  if (orphanList.length === 0) issues.push({ level: 'ok', title: 'لا سجلات يتيمة', detail: 'كل العمليات والذمم والالتزامات والأصول مرتبطة بمشاريع قائمة.', ai: 'بنية بياناتك سليمة — لا توجد سجلات معلّقة بلا مشروع.' });
  else issues.push({
    level: 'error', title: 'سجلات يتيمة', detail: `${orphanList.length} سجل مرتبط بمشروع محذوف.`,
    cause: 'سجلات (عمليات/ذمم/التزامات/أصول) تشير إلى مشروع لم يعد موجوداً.',
    why: 'حُذف المشروع دون حذف أو نقل سجلاته المرتبطة، فبقيت معلّقة بلا أب.',
    fix: 'أنشئ مشروعاً بديلاً وأعد إسناد هذه السجلات إليه، أو احذفها إن لم تعد مطلوبة.',
    ai: 'أنصح بشدة بمعالجة هذا النوع أولاً — السجلات اليتيمة تشوّه التقارير والإجماليات لأنها لا تظهر تحت أي مشروع.',
    action: { label: 'إدارة المشاريع', page: 'projects' },
  });

  // 4. receivable overpayment
  const overpaidList = receivables.filter(r => recvPaid(r) > r.amount + 1);
  if (overpaidList.length === 0) issues.push({ level: 'ok', title: 'مدفوعات الذمم سليمة', detail: 'لا توجد ذمة سُدّد فيها أكثر من قيمتها.', ai: 'سدادات ذممك منضبطة ولا تتجاوز المبالغ الأصلية.' });
  else issues.push({
    level: 'warning', title: 'ذمم مدفوعة بزيادة', detail: `${overpaidList.length} ذمة تجاوز إجمالي سدادها قيمتها الأصلية.`,
    cause: 'مجموع الدفعات المسجّلة على الذمة أكبر من قيمتها الأصلية.',
    why: 'قد يكون نتيجة تسجيل دفعة مكررة، أو إدخال مبلغ دفعة أكبر من المتبقي.',
    fix: 'افتح الذمة المعنية وراجع دفعاتها، واحذف الدفعة الزائدة أو صحّح مبلغها.',
    ai: 'راجع دفعات هذه الذمة — غالباً توجد دفعة مكررة. حذفها يعيد الرصيد لصحته دون التأثير على بقية العمليات.',
    action: { label: 'عرض الذمم', page: 'receivables', itemId: overpaidList[0].id, projId: overpaidList[0].projectId },
  });

  // 5. commitment paid count integrity
  const badCommitList = commitments.filter(c => c.totalCount != null && c.paidCount > c.totalCount);
  if (badCommitList.length === 0) issues.push({ level: 'ok', title: 'عدّادات الالتزامات سليمة', detail: 'لا يوجد التزام تجاوزت دفعاته المسددة إجماليه.', ai: 'عدّادات أقساطك والتزاماتك دقيقة.' });
  else issues.push({
    level: 'warning', title: 'عدّادات التزامات خاطئة', detail: `${badCommitList.length} التزام عدد دفعاته المسددة يتجاوز الإجمالي المحدّد.`,
    cause: 'عدد الدفعات المسددة أكبر من إجمالي عدد الدفعات المحدّد للالتزام.',
    why: 'قد يكون إجمالي الدفعات أُدخل أقل من الواقع، أو سُجّلت دفعات إضافية بعد اكتمال الالتزام.',
    fix: 'افتح الالتزام وعدّل إجمالي عدد الدفعات ليطابق الواقع، أو راجع الدفعات الزائدة.',
    ai: 'صحّح إجمالي عدد الدفعات في هذا الالتزام — هذا أبسط من حذف الدفعات ويحافظ على سجل السداد كاملاً.',
    action: { label: 'عرض الالتزامات', page: 'commitments', itemId: badCommitList[0].id, projId: badCommitList[0].projectId },
  });

  // 6. negative-amount records
  const negTx = transactions.filter(t => t.amount < 0);
  const negRecv = receivables.filter(r => r.amount < 0);
  if (negTx.length + negRecv.length === 0) issues.push({ level: 'ok', title: 'لا مبالغ سالبة', detail: 'كل المبالغ المسجّلة موجبة كما هو متوقّع.', ai: 'كل مبالغك موجبة — الاتجاه (دخل/خرج) يُحدّد بنوع العملية لا بإشارة المبلغ، وهذا صحيح.' });
  else issues.push({
    level: 'warning', title: 'مبالغ سالبة', detail: `${negTx.length + negRecv.length} سجل بمبلغ سالب.`,
    cause: 'سجلات تحمل مبلغاً بقيمة سالبة.',
    why: 'في موازين الاتجاه يُحدَّد بنوع العملية (دخل/خرج)، لا بإشارة المبلغ — فالمبلغ السالب غالباً خطأ إدخال.',
    fix: 'افتح السجل المعني وأدخل المبلغ كقيمة موجبة، مع اختيار النوع الصحيح (مصروف/إيراد).',
    ai: 'حوّل المبلغ السالب إلى موجب واضبط نوع العملية — هذا يصحّح التقارير دون التأثير على الرصيد النهائي.',
    action: negTx[0] ? { label: 'عرض العملية في المالية', page: 'finance', itemId: negTx[0].id, projId: negTx[0].projectId } : { label: 'عرض الذمم', page: 'receivables', itemId: negRecv[0]?.id, projId: negRecv[0]?.projectId },
  });

  return issues;
}

function HealthCheck({ data, onNavigate }: { data: Parameters<typeof runHealthCheck>[0]; onNavigate: (p: Page, itemId?: string, projId?: string) => void }) {
  const [issues, setIssues] = useState<HealthIssue[] | null>(null);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const run = () => { setRunning(true); setExpanded(null); setTimeout(() => { setIssues(runHealthCheck(data)); setRunning(false); }, 700); };

  const errors = issues?.filter(i => i.level === 'error').length ?? 0;
  const warnings = issues?.filter(i => i.level === 'warning').length ?? 0;
  const oks = issues?.filter(i => i.level === 'ok').length ?? 0;
  const meta = (l: HealthIssue['level']) => l === 'error' ? { icon: '🔴', c: '#b91c1c', bg: 'var(--danger-bg)' } : l === 'warning' ? { icon: '🟠', c: '#c2410c', bg: 'var(--warn-bg)' } : { icon: '🟢', c: '#15803d', bg: 'var(--ok-bg)' };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🩺</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>فحص اتساق الحسابات</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>تدقيق منطقي للتأكد من سلامة الأرصدة والروابط</div>
          </div>
        </div>
        <Btn size="sm" onClick={run} disabled={running}>{running ? 'جارٍ الفحص...' : '▶ تشغيل الفحص'}</Btn>
      </div>

      {issues && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: 'var(--ok-bg)', color: 'var(--ok-text)', fontWeight: 600 }}>🟢 {oks} سليم</span>
            {warnings > 0 && <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: 'var(--warn-bg)', color: 'var(--warn-text)', fontWeight: 600 }}>🟠 {warnings} تحذير</span>}
            {errors > 0 && <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: 'var(--danger-bg)', color: 'var(--danger-text)', fontWeight: 600 }}>🔴 {errors} خطأ</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {issues.map((i, idx) => {
              const mt = meta(i.level);
              const hasDetail = i.level !== 'ok' && (i.cause || i.why || i.fix);
              const isOpen = expanded === idx;
              return (
                <div key={idx} style={{ background: mt.bg, borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    onClick={() => (hasDetail || i.ai) ? setExpanded(isOpen ? null : idx) : undefined}
                    style={{ display: 'flex', gap: 12, padding: '12px 14px', cursor: (hasDetail || i.ai) ? 'pointer' : 'default', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{mt.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: mt.c }}>{i.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.6 }}>{i.detail}</div>
                    </div>
                    {(hasDetail || i.ai) && <span style={{ color: 'var(--text-3)', fontSize: 11, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>}
                  </div>

                  {isOpen && (
                    <div style={{ padding: '0 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10, animation: 'mzFade .2s ease' }}>
                      {i.cause && <ExplainRow icon="🔎" title="السبب" body={i.cause} />}
                      {i.why && <ExplainRow icon="❓" title="لماذا حدث" body={i.why} />}
                      {i.fix && <ExplainRow icon="🛠️" title="طريقة المعالجة" body={i.fix} />}
                      {i.ai && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                            <span style={{ fontSize: 15 }}>🤖</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple-text)' }}>توصية المساعد الذكي</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>{i.ai}</div>
                        </div>
                      )}
                      {i.action && (
                        <Btn size="sm" onClick={() => i.action && onNavigate(i.action.page, i.action.itemId, i.action.projId)} style={{ alignSelf: 'flex-start' }}>↗ {i.action.label}</Btn>
                      )}
                      {i.actions && i.actions.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {i.actions.map((act, ai) => (
                            <Btn key={ai} size="sm" variant="outline" onClick={() => onNavigate(act.page, act.itemId, act.projId)} style={{ alignSelf: 'flex-start' }}>↗ {act.label}</Btn>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {errors === 0 && warnings === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', marginTop: 8, fontSize: 13, color: 'var(--ok-text)', fontWeight: 600 }}>✅ كل الحسابات متسقة وسليمة</div>
          )}
        </div>
      )}
    </Card>
  );
}
function ExplainRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 9 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginTop: 1 }}>{body}</div>
      </div>
    </div>
  );
}

function AuditLog({ audit, onNav }: { audit: AuditEntry[]; onNav: (p: Page) => void }) {
  const [search, setSearch] = useState('');
  const [fAction, setFAction] = useState('all');
  const [fEntity, setFEntity] = useState('all');
  const [fUser, setFUser] = useState('all');
  const [fPeriod, setFPeriod] = useState('all');
  const [sort, setSort] = useState('newest');
  const actions = Array.from(new Set(audit.map(a => a.action)));
  const entities = Array.from(new Set(audit.map(a => a.entity)));
  const users = Array.from(new Set(audit.map(a => a.user)));

  const inPeriod = (ts: string) => {
    if (fPeriod === 'all') return true;
    const d = new Date(ts.replace(' ', 'T')); const now = new Date('2025-06-26T23:59');
    const days = (now.getTime() - d.getTime()) / 86400000;
    if (fPeriod === 'today') return days <= 1;
    if (fPeriod === 'week') return days <= 7;
    if (fPeriod === 'month') return days <= 31;
    return true;
  };

  const filtered = audit
    .filter(a => fAction === 'all' ? true : a.action === fAction)
    .filter(a => fEntity === 'all' ? true : a.entity === fEntity)
    .filter(a => fUser === 'all' ? true : a.user === fUser)
    .filter(a => inPeriod(a.ts))
    .filter(a => search.trim() === '' ? true : (a.action + a.entity + a.detail + a.user).includes(search.trim()))
    .sort((a, b) => sort === 'newest' ? b.ts.localeCompare(a.ts) : a.ts.localeCompare(b.ts));

  const clearFilters = () => { setSearch(''); setFAction('all'); setFEntity('all'); setFUser('all'); setFPeriod('all'); };

  // map entity → destination page (clickable navigation)
  const entityNav: Record<string, Page> = {
    'عملية مالية': 'finance', 'طلب': 'requests', 'متابعة': 'trackings',
    'مستند': 'documents', 'مشروع': 'projects',
  };

  const actionColor = (action: string) =>
    action.includes('حذف') ? '#b91c1c' : action.includes('إنشاء') ? '#15803d'
    : action.includes('تعديل') ? '#a16207' : action.includes('اعتماد') || action.includes('دخول') ? '#1d4ed8'
    : action.includes('رفض') || action.includes('خروج') ? '#9333ea' : '#64748b';

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader title="سجل العمليات" subtitle="تتبّع كل الأحداث المهمة داخل النظام" />

      <FilterBar
        search={search} onSearch={setSearch} searchPlaceholder="🔍 بحث في السجل..."
        values={{ action: fAction, entity: fEntity, user: fUser, period: fPeriod, sort }}
        onChange={(k, v) => { if (k === 'action') setFAction(v); else if (k === 'entity') setFEntity(v); else if (k === 'user') setFUser(v); else if (k === 'period') setFPeriod(v); else if (k === 'sort') setSort(v); }}
        onClear={clearFilters}
        filters={[
          { key: 'action', placeholder: 'الإجراء', options: [{ v: 'all', l: 'كل الإجراءات' }, ...actions.map(a => ({ v: a, l: a }))] },
          { key: 'entity', placeholder: 'الكيان', options: [{ v: 'all', l: 'كل الكيانات' }, ...entities.map(e => ({ v: e, l: e }))] },
          { key: 'user', placeholder: 'المنفّذ', options: [{ v: 'all', l: 'كل المنفّذين' }, ...users.map(u => ({ v: u, l: u }))] },
          { key: 'period', placeholder: 'الفترة', options: [{ v: 'all', l: 'كل الفترات' }, { v: 'today', l: 'اليوم' }, { v: 'week', l: 'آخر أسبوع' }, { v: 'month', l: 'آخر شهر' }] },
          { key: 'sort', placeholder: 'الترتيب', options: [{ v: 'newest', l: 'الأحدث أولاً' }, { v: 'oldest', l: 'الأقدم أولاً' }] },
        ]}
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>لا توجد سجلات مطابقة</div>}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map(a => {
            const dest = entityNav[a.entity];
            return (
              <div key={a.id} onClick={() => dest && onNav(dest)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: dest ? 'pointer' : 'default' }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: actionColor(a.action), marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: actionColor(a.action) }}>{a.action}</span>
                    <span style={{ fontSize: 11, background: 'var(--surface-3)', color: 'var(--text-3)', padding: '2px 8px', borderRadius: 99 }}>{a.entity}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{a.detail}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>👤 {a.user} · 🕐 {a.ts}</div>
                </div>
                {dest && <span style={{ color: 'var(--text-3)', fontSize: 16, alignSelf: 'center' }}>‹</span>}
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
        📌 يُسجّل الجهاز وعنوان IP والبيانات قبل/بعد التعديل عند ربط النظام بالـ Backend.
      </div>
    </div>
  );
}

function Subscription({ current, onChoose }: { current: string; onChoose: (id: string) => void }) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader title="الاشتراك والباقات" subtitle="اختر الباقة المناسبة لاحتياجك" />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface-3)', padding: 4, borderRadius: 12 }}>
          {[['monthly', 'شهري'], ['yearly', 'سنوي (وفّر 20%)']].map(([v, l]) => (
            <button key={v} onClick={() => setBilling(v as any)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              background: billing === v ? 'var(--surface)' : 'transparent', color: billing === v ? 'var(--text)' : 'var(--text-3)',
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
        {PLANS.map(p => {
          const isCurrent = current === p.id;
          const price = billing === 'yearly' ? Math.round(p.price * 12 * 0.8) : p.price;
          return (
            <div key={p.id} style={{
              background: 'var(--surface)', borderRadius: 16, padding: 22,
              border: `2px solid ${isCurrent ? p.color : 'var(--border)'}`, position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}>
              {p.tag && <span style={{ position: 'absolute', top: -11, right: 18, background: p.color, color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99 }}>{p.tag}</span>}
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: p.color }}>{price === 0 ? 'مجاني' : price}</span>
                {price > 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>ر.س / {billing === 'yearly' ? 'سنة' : 'شهر'}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, flex: 1 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                    <span style={{ color: p.color }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <Btn variant={isCurrent ? 'outline' : 'primary'} disabled={isCurrent} style={{ width: '100%', justifyContent: 'center', ...(isCurrent ? {} : { background: p.color }) }} onClick={() => onChoose(p.id)}>
                {isCurrent ? '✓ باقتك الحالية' : p.price === 0 ? 'التحويل للمجانية' : 'اشترك الآن'}
              </Btn>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-3)' }}>
        جميع الأسعار شاملة الضريبة · يمكنك الترقية أو الإلغاء في أي وقت
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  LOGIN / SIGNUP
// ═══════════════════════════════════════════
function Login({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const valid = email.trim().length > 3 && password.length >= 4 && (mode === 'login' || name.trim().length > 0);

  return (
    <div className="mz-light" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#0b1120 0%,#1e293b 100%)', direction: 'rtl', fontFamily: "'IBM Plex Sans Arabic', sans-serif", padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#2563eb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 28, fontFamily: 'serif' }}>م</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0b1120' }}>موازين</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>المنصة المالية والإدارية الذكية</div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, marginBottom: 20 }}>
          {[['login', 'تسجيل الدخول'], ['signup', 'حساب جديد']].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v as any)} style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: mode === v ? '#fff' : 'transparent', color: mode === v ? '#0b1120' : '#64748b',
              boxShadow: mode === v ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
            }}>{l}</button>
          ))}
        </div>

        {mode === 'signup' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>الاسم الكامل</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="محمد العمري" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>كلمة المرور</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
        </div>

        <button disabled={!valid} onClick={onAuth} style={{
          width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
          background: valid ? '#2563eb' : '#cbd5e1', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
        }}>{mode === 'login' ? 'دخول' : 'إنشاء الحساب'}</button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          {mode === 'login' ? 'بالدخول أنت توافق على الشروط والأحكام' : 'سيتم إنشاء حساب جديد في النظام'}
        </div>
      </div>
    </div>
  );
}

// quick-add bottom sheet for mobile bottom bar's + button
function MobileFabSheet({ onClose, onAction }: { onClose: () => void; onAction: (a: 'tx' | 'doc' | 'tracking' | 'request' | 'project') => void }) {
  const actions = [
    { id: 'tx' as const, icon: '💸', label: 'عملية مالية', bg: '#2563eb' },
    { id: 'doc' as const, icon: '📄', label: 'رفع مستند', bg: '#7c3aed' },
    { id: 'tracking' as const, icon: '🛡️', label: 'متابعة', bg: '#0891b2' },
    { id: 'request' as const, icon: '📝', label: 'طلب جديد', bg: '#d97706' },
    { id: 'project' as const, icon: '⬡', label: 'مشروع', bg: '#059669' },
  ];
  return (
    <Sheet open={true} onClose={onClose} title="إضافة سريعة">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {actions.map(a => (
          <button key={a.id} onClick={() => onAction(a.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 12px', borderRadius: 14,
            border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <span style={{ width: 46, height: 46, borderRadius: 99, background: a.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{a.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ═══════════════════════════════════════════
//  BOTTOM BAR (mobile quick nav — 5 icons)
// ═══════════════════════════════════════════
function BottomBar({ page, onNav, onFab, unread }: {
  page: Page; onNav: (p: Page) => void; onFab: () => void; unread: number;
}) {
  const items: { id: Page | 'fab'; icon: string; label: string }[] = [
    { id: 'overview', icon: '⬢', label: 'الشاملة' },
    { id: 'projects', icon: '⬡', label: 'المشاريع' },
    { id: 'fab', icon: '＋', label: 'إضافة' },
    { id: 'reports', icon: '◳', label: 'التقارير' },
    { id: 'settings', icon: '☰', label: 'المزيد' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 800, display: 'flex',
      background: 'var(--surface)', borderTop: '1px solid var(--border)', boxShadow: '0 -2px 12px rgba(0,0,0,.06)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {items.map(it => {
        if (it.id === 'fab') {
          return (
            <button key="fab" onClick={onFab} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', border: 'none', background: 'transparent', cursor: 'pointer', paddingTop: 4 }}>
              <span style={{ width: 48, height: 48, marginTop: -16, borderRadius: 99, background: 'linear-gradient(135deg,#2563eb,#4f46e5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, boxShadow: '0 4px 14px rgba(37,99,235,.5)' }}>＋</span>
            </button>
          );
        }
        const active = page === it.id;
        const showBadge = it.id === 'settings' && unread > 0;
        return (
          <button key={it.id} onClick={() => onNav(it.id as Page)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 0 10px',
            border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
          }}>
            <span style={{ fontSize: 18, color: active ? '#2563eb' : 'var(--text-3)' }}>{it.icon}</span>
            <span style={{ fontSize: 10, color: active ? '#2563eb' : 'var(--text-3)', fontWeight: active ? 600 : 400 }}>{it.label}</span>
            {showBadge && <span style={{ position: 'absolute', top: 4, right: '28%', width: 8, height: 8, borderRadius: 99, background: '#ef4444' }} />}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════
const KEYFRAMES = `
:root, .mz-light {
  --bg: #f4f6fa; --surface: #ffffff; --surface-2: #f8fafc; --surface-3: #f1f5f9;
  --text: #0b1120; --text-2: #475569; --text-3: #64748b; --border: #e2e8f0;
  --sidebar: #0b1120; --sidebar-2: #1a2234;
  /* semantic tinted backgrounds + text (success/danger/info/warning/purple/neutral) */
  --ok-bg: var(--ok-bg); --ok-bg-2: var(--ok-bg-2); --ok-text: #15803d;
  --danger-bg: var(--danger-bg); --danger-bg-2: var(--danger-bg-2); --danger-text: #b91c1c;
  --info-bg: var(--info-bg); --info-text: #1d4ed8;
  --warn-bg: var(--warn-bg); --warn-bg-2: var(--warn-bg-2); --warn-text: #c2410c; --warn-text-2: #a16207;
  --purple-bg: var(--purple-bg); --purple-text: #7c3aed;
  --neutral-bg: #f1f5f9; --neutral-text: #64748b;
}
.mz-dark {
  --bg: #0b0f17; --surface: #161b26; --surface-2: #1c2230; --surface-3: #232b3a;
  --text: #f1f5f9; --text-2: #b8c2d4; --text-3: #94a3b8; --border: #2a3346;
  --sidebar: #060911; --sidebar-2: #161b26;
  /* dark-mode tints: deep translucent-feel backgrounds + brighter text for contrast */
  --ok-bg: #112a1d; --ok-bg-2: #15351f; --ok-text: #4ade80;
  --danger-bg: #2c1517; --danger-bg-2: #3a181b; --danger-text: #f87171;
  --info-bg: #14233d; --info-text: #60a5fa;
  --warn-bg: #2c1d10; --warn-bg-2: #33260f; --warn-text: #fb923c; --warn-text-2: #fbbf24;
  --purple-bg: #21183a; --purple-text: #a78bfa;
  --neutral-bg: #232b3a; --neutral-text: #94a3b8;
}
@keyframes mzFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes mzSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes mzFlash {
  0% { box-shadow: 0 0 0 0 rgba(37,99,235,0); background-color: rgba(37,99,235,0); }
  15% { box-shadow: 0 0 0 3px rgba(37,99,235,.55); background-color: rgba(37,99,235,.10); }
  100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); background-color: rgba(37,99,235,0); }
}
.mz-flash { animation: mzFlash 2.2s ease; border-radius: 12px; }
@keyframes mzPop { from { opacity: 0; transform: translateY(8px) scale(.9) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes mzPulse { 0%,100% { box-shadow: 0 6px 22px rgba(37,99,235,.45) } 50% { box-shadow: 0 6px 30px rgba(37,99,235,.7) } }
@keyframes mzProgress { from { width: 0% } to { width: 100% } }
@keyframes mzSlideRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
.mz-mobile > div { padding: 16px !important; max-width: 100% !important; padding-bottom: 80px !important; }
.mz-mobile h1 { font-size: 19px !important; }
.mz-mobile table { font-size: 12px !important; }
.mz-mobile input, .mz-mobile select, .mz-mobile textarea { font-size: 16px !important; }
@media (max-width: 420px) {
  .mz-mobile .mz-statgrid { grid-template-columns: 1fr 1fr !important; }
}
input, select, textarea { background: var(--surface) !important; color: var(--text) !important; border-color: var(--border) !important; }
.mz-hide-scroll::-webkit-scrollbar { display: none; }
.mz-hide-scroll { -ms-overflow-style: none; }`;

// ═══════════════════════════════════════════
//  GLOBAL SEARCH (البحث الشامل)
// ═══════════════════════════════════════════
type SearchResult = { id: string; icon: string; title: string; subtitle: string; group: string; page: Page; projectId?: string };
function GlobalSearch({ projects, transactions, documents, receivables, commitments, assets, trackings, requests, members, onClose, onGo }: {
  projects: Project[]; transactions: Transaction[]; documents: DocItem[]; receivables: Receivable[];
  commitments: Commitment[]; assets: Asset[]; trackings: Tracking[]; requests: RequestItem[]; members: Member[];
  onClose: () => void; onGo: (page: Page, projectId?: string) => void;
}) {
  const [q, setQ] = useState('');
  const projName = (id: string) => projects.find(p => p.id === id)?.name ?? '';
  const term = q.trim();

  const results: SearchResult[] = (() => {
    if (term.length < 1) return [];
    const m = (s?: string) => (s ?? '').toLowerCase().includes(term.toLowerCase());
    const out: SearchResult[] = [];
    projects.filter(p => m(p.name) || m(p.type)).forEach(p => out.push({ id: p.id, icon: p.icon, title: p.name, subtitle: `مشروع · ${p.type}`, group: 'المشاريع', page: 'projectDetail', projectId: p.id }));
    transactions.filter(t => m(t.description) || m(t.category) || m(t.source)).slice(0, 8).forEach(t => out.push({ id: t.id, icon: t.type === 'income' ? '↓' : t.type === 'expense' ? '↑' : '⇄', title: t.description, subtitle: `عملية · ${fmtNum(t.amount)} · ${projName(t.projectId)}`, group: 'العمليات المالية', page: 'finance', projectId: t.projectId }));
    documents.filter(d => m(d.name) || m(d.type)).slice(0, 6).forEach(d => out.push({ id: d.id, icon: '◻', title: d.name, subtitle: `مستند · ${d.type} · ${projName(d.projectId)}`, group: 'المستندات', page: 'documents', projectId: d.projectId }));
    receivables.filter(r => m(r.party) || m(r.note)).slice(0, 6).forEach(r => out.push({ id: r.id, icon: '⇄', title: r.party, subtitle: `ذمة ${r.kind === 'receivable' ? 'مدينة' : 'دائنة'} · ${fmtNum(recvRemaining(r))} · ${projName(r.projectId)}`, group: 'الذمم', page: 'receivables', projectId: r.projectId }));
    commitments.filter(c => m(c.name) || m(c.party)).slice(0, 6).forEach(c => out.push({ id: c.id, icon: '↻', title: c.name, subtitle: `التزام · ${fmtNum(c.amount)} ${FREQ_LABEL[c.freq]} · ${projName(c.projectId)}`, group: 'الالتزامات', page: 'commitments', projectId: c.projectId }));
    assets.filter(a => m(a.name) || m(a.serial) || m(a.supplier)).slice(0, 6).forEach(a => out.push({ id: a.id, icon: ASSET_CATEGORIES.find(x => x.id === a.category)?.icon ?? '⬚', title: a.name, subtitle: `أصل · ${fmtNum(a.purchaseValue)} · ${projName(a.projectId)}`, group: 'الأصول', page: 'assets', projectId: a.projectId }));
    trackings.filter(t => m(t.name) || m(t.type)).slice(0, 6).forEach(t => out.push({ id: t.id, icon: t.icon, title: t.name, subtitle: `متابعة · ${t.type} · ${projName(t.projectId)}`, group: 'المتابعات', page: 'trackings', projectId: t.projectId }));
    requests.filter(r => m(r.title) || m(r.type) || m(r.requestedBy)).slice(0, 6).forEach(r => out.push({ id: r.id, icon: '◫', title: r.title, subtitle: `طلب · ${r.type} · ${projName(r.projectId)}`, group: 'الطلبات', page: 'requests', projectId: r.projectId }));
    members.filter(mm => m(mm.name) || m(mm.email)).slice(0, 6).forEach(mm => out.push({ id: mm.id, icon: '👤', title: mm.name, subtitle: `عضو · ${projName(mm.projectId)}`, group: 'الأعضاء', page: 'projectDetail', projectId: mm.projectId }));
    return out;
  })();

  const groups = Array.from(new Set(results.map(r => r.group)));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,17,23,.5)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '8vh 16px 16px', animation: 'mzFade .15s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 16px 60px rgba(0,0,0,.3)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 18, color: 'var(--text-3)' }}>🔍</span>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث في كل شيء: مشاريع، عمليات، مستندات، ذمم، أصول..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: 'var(--text)' }} />
          <button onClick={onClose} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>إغلاق</button>
        </div>
        <div style={{ overflowY: 'auto', padding: term.length < 1 ? 0 : 8 }}>
          {term.length < 1 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 14 }}>اكتب للبحث عبر كل أقسام موازين</div>
            </div>
          )}
          {term.length >= 1 && results.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🤷</div>
              <div style={{ fontSize: 14 }}>لا نتائج لـ «{term}»</div>
            </div>
          )}
          {groups.map(g => (
            <div key={g} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', padding: '8px 12px 4px' }}>{g}</div>
              {results.filter(r => r.group === g).map(r => (
                <button key={r.group + r.id} onClick={() => { onGo(r.page, r.projectId); onClose(); }} style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{r.subtitle}</div>
                  </div>
                  <span style={{ color: '#d1d5db', flexShrink: 0 }}>‹</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPageRaw] = useState<Page>('overview');
  const [history, setHistory] = useState<Page[]>([]);
  const setPage = (p: Page) => { setHistory(h => [...h, page]); setPageRaw(p); };
  const goBack = () => setHistory(h => { if (h.length === 0) return h; const prev = h[h.length - 1]; setPageRaw(prev); return h.slice(0, -1); });
  const [projectId, setProjectId] = useState('p1');
  // shared deep-link target: navigate to a page and highlight a specific item by id
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const navigateTo = (p: Page, itemId?: string, projId?: string) => {
    if (projId) setProjectId(projId);
    setPage(p);
    if (itemId) {
      setHighlightId(itemId);
      // clear after the highlight animation finishes so it can retrigger later
      window.setTimeout(() => setHighlightId(cur => cur === itemId ? null : cur), 2600);
    }
  };
  const canGoBack = history.length > 0;
  const isMobile = useIsMobile();
  useHighlight(highlightId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = usePersist<boolean>('mz_sidebar_projects_open', false);
  const [fabSheet, setFabSheet] = useState(false);
  const [fixTx, setFixTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = usePersist<'light' | 'dark'>('mz_theme', 'light');
  const [customTheme, setCustomTheme] = usePersist<CustomTheme>('mz_custom_theme', DEFAULT_CUSTOM_THEME);
  // apply user color overrides as CSS variables on the root element
  useEffect(() => {
    const root = document.documentElement;
    const map: [string, string | undefined][] = [
      ['--primary-user', customTheme.primary], ['--bg', customTheme.bg], ['--surface', customTheme.surface],
      ['--text', customTheme.text], ['--border', customTheme.border],
    ];
    map.forEach(([k, v]) => { if (v) root.style.setProperty(k, v); else root.style.removeProperty(k); });
    // primary drives buttons/accents — expose as --accent used across the app
    if (customTheme.primary) root.style.setProperty('--accent', customTheme.primary);
    else root.style.removeProperty('--accent');
  }, [customTheme, theme]);
  const [authed, setAuthed] = usePersist<boolean>('mz_authed', false);
  const [plan, setPlan] = usePersist<string>('mz_plan', 'free');

  const [projects, setProjects] = usePersist<Project[]>('mz_projects', INITIAL_PROJECTS);
  const [transactions, setTransactions] = usePersist<Transaction[]>('mz_transactions', INITIAL_TRANSACTIONS);
  const [trackings, setTrackings] = usePersist<Tracking[]>('mz_trackings', INITIAL_TRACKINGS);
  const [assets, setAssets] = usePersist<Asset[]>('mz_assets', INITIAL_ASSETS);
  const [requests, setRequests] = usePersist<RequestItem[]>('mz_requests', INITIAL_REQUESTS);
  const [documents, setDocuments] = usePersist<DocItem[]>('mz_documents', INITIAL_DOCUMENTS);
  const [surveys, setSurveys] = usePersist<Survey[]>('mz_surveys', INITIAL_SURVEYS);
  const [notifs, setNotifs] = usePersist<Notif[]>('mz_notifs', INITIAL_NOTIFS);
  const [members, setMembers] = usePersist<Member[]>('mz_members', INITIAL_MEMBERS);
  const [memberTxns, setMemberTxns] = usePersist<MemberTxn[]>('mz_member_txns', INITIAL_MEMBER_TXNS);
  const [receivables, setReceivables] = usePersist<Receivable[]>('mz_receivables', INITIAL_RECEIVABLES);
  const [commitments, setCommitments] = usePersist<Commitment[]>('mz_commitments', INITIAL_COMMITMENTS);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [prefs, setPrefs] = usePersist<UserPrefs>('mz_prefs', DEFAULT_PREFS);
  const [lists, setLists] = usePersist<CustomLists>('mz_lists', DEFAULT_LISTS);
  const [help, setHelp] = usePersist<HelpTexts>('mz_help', DEFAULT_HELP);
  const [audit, setAudit] = usePersist<AuditEntry[]>('mz_audit', INITIAL_AUDIT);
  const logAudit = (action: string, entity: string, detail: string) =>
    setAudit(list => [{ id: uid('a'), action, entity, detail, user: 'محمد العمري', ts: new Date().toISOString().slice(0, 16).replace('T', ' ') }, ...list].slice(0, 200));

  // create-sheet flags triggered by FAB / headers
  const [createTx, setCreateTx] = useState(false);
  const [createDoc, setCreateDoc] = useState(false);
  const [createSurvey, setCreateSurvey] = useState(false);
  const [pendingDocId, setPendingDocId] = useState<string | null>(null);
  const [createTracking, setCreateTracking] = useState(false);
  const [createRequest, setCreateRequest] = useState(false);
  const [createReceivable, setCreateReceivable] = useState(false);
  const [createCommitment, setCreateCommitment] = useState(false);
  const [createAsset, setCreateAsset] = useState(false);
  const [createProject, setCreateProject] = useState(false);
  const [trackingPreset, setTrackingPreset] = useState<{ name?: string; type?: string }>({});

  const unread = notifs.filter(n => !n.read).length;
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const decideRequest = (id: string, status: RequestStatus) => {
    const req = requests.find(r => r.id === id);
    logAudit(status === 'approved' ? 'اعتماد' : 'رفض', 'طلب', req?.title ?? '');
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    if (req && status === 'approved') {
      // approved request → create a matching expense transaction
      const txType: TxType = req.type === 'تحويل' ? 'transfer' : 'expense';
      const newTx: Transaction = {
        id: uid('t'), projectId: req.projectId, type: txType,
        description: `${req.title} (طلب معتمد)`, amount: req.amount,
        category: req.type, date: today(), hasDoc: false,
        note: `أُنشئت تلقائياً من اعتماد الطلب #${req.id}`,
      };
      setTransactions(list => [newTx, ...list]);
      const notif: Notif = {
        id: uid('n'), type: 'success', title: 'تم اعتماد طلب',
        body: `تم اعتماد "${req.title}" وإنشاء عملية مالية بمبلغ ${fmt(req.amount)}. مقدّم الطلب: ${req.requestedBy}.`,
        time: 'الآن', read: false, link: 'requests', projectId: req.projectId, section: 'requests', memberId: req.memberId, ts: nowStamp(),
      };
      setNotifs(ns => [notif, ...ns]);
    }
    if (req && status === 'rejected') {
      const notif: Notif = {
        id: uid('n'), type: 'warning', title: 'تم رفض طلب',
        body: `تم رفض "${req.title}" المقدّم من ${req.requestedBy}.`, time: 'الآن', read: false,
        link: 'requests', projectId: req.projectId, section: 'requests', memberId: req.memberId, ts: nowStamp(),
      };
      setNotifs(ns => [notif, ...ns]);
    }
  };

  // upsert helpers (id present = edit, absent = create)
  const saveProject = (p: Omit<Project, 'id'> & { id?: string }) => {
    logAudit(p.id ? 'تعديل' : 'إنشاء', 'مشروع', p.name);
    setProjects(list => p.id ? list.map(x => x.id === p.id ? { ...x, ...p } as Project : x) : [...list, { ...p, id: uid('p') }]);
  };
  const deleteProject = (id: string) => { const pr = projects.find(p => p.id === id); logAudit('حذف', 'مشروع', pr?.name ?? ''); setProjects(l => l.filter(x => x.id !== id)); if (projectId === id) setProjectId(projects.find(p => p.id !== id)?.id ?? ''); };

  const saveTx = (t: Omit<Transaction, 'id'> & { id?: string }) => {
    logAudit(t.id ? 'تعديل' : 'إنشاء', 'عملية مالية', `${t.description} — ${fmt(t.amount)}`);
    // Editing an existing transaction
    if (t.id) { setTransactions(list => list.map(x => x.id === t.id ? { ...x, ...t } as Transaction : x)); return; }
    // New transfer → create two linked records (out from source, in to target)
    if (t.type === 'transfer' && t.toProject) {
      const link = uid('lnk');
      const outTx: Transaction = { ...t, id: uid('t'), type: 'transfer', transferDir: 'out', linkId: link, createdBy: CURRENT_USER };
      const targetName = projects.find(p => p.id === t.toProject)?.name ?? '';
      const sourceName = projects.find(p => p.id === t.projectId)?.name ?? '';
      const inTx: Transaction = {
        ...t, id: uid('t'), projectId: t.toProject, toProject: t.projectId,
        type: 'transfer', transferDir: 'in', linkId: link, createdBy: CURRENT_USER,
        description: `تحويل وارد من ${sourceName}`,
      };
      outTx.description = t.description || `تحويل صادر إلى ${targetName}`;
      setTransactions(list => [inTx, outTx, ...list]);
      return;
    }
    // Normal income/expense
    setTransactions(list => [{ ...t, id: uid('t'), createdBy: t.createdBy ?? CURRENT_USER }, ...list]);
  };
  const deleteTx = (id: string) => setTransactions(list => {
    const tx = list.find(x => x.id === id);
    logAudit('حذف', 'عملية مالية', tx?.description ?? '');
    if (tx?.linkId) return list.filter(x => x.linkId !== tx.linkId); // delete both sides of a transfer
    return list.filter(x => x.id !== id);
  });
  // apply an AI-suggested fix to a flagged transaction
  const applyTxFix = (tx: Transaction, action: TxFix['kind'], payload?: { toProject?: string; reason?: string; date?: string; category?: string; newAmount?: number }) => {
    const why = payload?.reason ? ` — السبب: ${payload.reason}` : '';
    if (action === 'delete') {
      logAudit('إلغاء', 'عملية مالية', `إلغاء «${tx.description}» (${fmt(tx.amount)})${why}`);
      deleteTx(tx.id);
    }
    else if (action === 'fixAmount') {
      setTransactions(list => list.map(x => x.id === tx.id ? { ...x, amount: Math.abs(x.amount) } : x));
      logAudit('تصحيح مبلغ', 'عملية مالية', `تصحيح مبلغ «${tx.description}» من ${fmt(tx.amount)} إلى ${fmt(Math.abs(tx.amount))}${why}`);
    }
    else if (action === 'reassign' && payload?.toProject) {
      const np = projects.find(p => p.id === payload.toProject)?.name ?? '';
      setTransactions(list => list.map(x => x.id === tx.id ? { ...x, projectId: payload.toProject! } : x));
      logAudit('إعادة إسناد', 'عملية مالية', `نقل «${tx.description}» إلى مشروع «${np}»${why}`);
    }
    else if (action === 'changeDate' && payload?.date) {
      setTransactions(list => list.map(x => x.id === tx.id ? { ...x, date: payload.date! } : x));
      logAudit('تغيير تاريخ', 'عملية مالية', `تغيير تاريخ «${tx.description}» من ${tx.date} إلى ${payload.date}${why}`);
    }
    else if (action === 'changeCategory' && payload?.category) {
      setTransactions(list => list.map(x => x.id === tx.id ? { ...x, category: payload.category! } : x));
      logAudit('تغيير تصنيف', 'عملية مالية', `تغيير تصنيف «${tx.description}» من ${tx.category} إلى ${payload.category}${why}`);
    }
    else if (action === 'reverse') {
      const dest = payload?.toProject || tx.projectId;
      const destName = projects.find(p => p.id === dest)?.name ?? '';
      const rev: Transaction = {
        ...tx, id: uid('t'), projectId: dest,
        type: tx.type === 'income' ? 'expense' : tx.type === 'expense' ? 'income' : tx.type,
        amount: Math.abs(tx.amount), description: `استرجاع: ${tx.description}`,
        category: tx.category, date: today(), linkId: undefined, transferDir: undefined,
        createdBy: CURRENT_USER, note: payload?.reason,
      };
      setTransactions(list => [rev, ...list]);
      logAudit('استرجاع/عكس', 'عملية مالية', `عملية استرجاع لـ «${tx.description}» (${fmt(Math.abs(tx.amount))}) في «${destName}»${why}`);
    }
    setFixTx(null);
  };

  const saveTracking = (t: Omit<Tracking, 'id'> & { id?: string }) => {
    logAudit(t.id ? 'تعديل' : 'إنشاء', 'متابعة', t.name);
    setTrackings(list => t.id ? list.map(x => x.id === t.id ? { ...x, ...t } as Tracking : x) : [{ ...t, id: uid('tr'), createdBy: CURRENT_USER }, ...list]);
  };
  const deleteTracking = (id: string) => { const tr = trackings.find(x => x.id === id); logAudit('حذف', 'متابعة', tr?.name ?? ''); setTrackings(l => l.filter(x => x.id !== id)); };

  const saveRequest = (r: Omit<RequestItem, 'id'> & { id?: string }) => {
    logAudit(r.id ? 'تعديل' : 'إنشاء', 'طلب', r.title);
    setRequests(list => r.id ? list.map(x => x.id === r.id ? { ...x, ...r } as RequestItem : x) : [{ ...r, id: uid('r'), createdBy: CURRENT_USER }, ...list]);
  };
  const deleteRequest = (id: string) => { const rq = requests.find(x => x.id === id); logAudit('حذف', 'طلب', rq?.title ?? ''); setRequests(l => l.filter(x => x.id !== id)); };

  // ── receivables (الذمم) ──
  const saveReceivable = (r: Omit<Receivable, 'id'>) => {
    logAudit('إنشاء', r.kind === 'receivable' ? 'ذمة مدينة' : 'ذمة دائنة', `${r.party} — ${fmt(r.amount)}`);
    setReceivables(list => [{ ...r, id: uid('rc') }, ...list]);
  };
  const deleteReceivable = (id: string) => { const rc = receivables.find(x => x.id === id); logAudit('حذف', 'ذمة', rc?.party ?? ''); setReceivables(l => l.filter(x => x.id !== id)); };
  // record a payment/collection → updates the receivable AND creates a real cash-flow transaction
  const payReceivable = (id: string, amount: number, note: string) => {
    const r = receivables.find(x => x.id === id);
    if (!r) return;
    const payment: ReceivablePayment = { id: uid('pm'), amount, date: today(), note: note || undefined, createdBy: CURRENT_USER };
    const newPaid = recvPaid(r) + amount;
    const newStatus: ReceivableStatus = newPaid >= r.amount ? 'settled' : newPaid > 0 ? 'partial' : 'open';
    setReceivables(list => list.map(x => x.id === id ? { ...x, payments: [...x.payments, payment], status: newStatus } : x));
    // create the real financial transaction: receivable → income, payable → expense
    const isRecv = r.kind === 'receivable';
    const tx: Transaction = {
      id: uid('t'), projectId: r.projectId, type: isRecv ? 'income' : 'expense',
      description: `${isRecv ? 'تحصيل ذمة من' : 'سداد ذمة إلى'} ${r.party}`,
      amount, category: 'ذمم', date: today(), hasDoc: false,
      source: r.party, memberId: r.memberId, note: note || `${isRecv ? 'تحصيل' : 'سداد'} ذمة`, createdBy: CURRENT_USER,
    };
    setTransactions(list => [tx, ...list]);
    logAudit(isRecv ? 'تحصيل' : 'سداد', 'ذمة', `${r.party} — ${fmt(amount)}`);
    setNotifs(ns => [{ id: uid('n'), type: 'success', title: isRecv ? 'تم تحصيل ذمة' : 'تم سداد ذمة', body: `${isRecv ? 'تحصيل' : 'سداد'} ${fmt(amount)} ${isRecv ? 'من' : 'إلى'} ${r.party}.${newStatus === 'settled' ? ' (مسددة بالكامل)' : ''}`, time: 'الآن', read: false, link: 'receivables', projectId: r.projectId, section: 'finance', memberId: r.memberId, ts: nowStamp() }, ...ns]);
  };

  // ── commitments (الالتزامات الدورية) ──
  const saveCommitment = (c: Omit<Commitment, 'id'>) => {
    logAudit('إنشاء', 'التزام دوري', `${c.name} — ${fmt(c.amount)} ${FREQ_LABEL[c.freq]}`);
    setCommitments(list => [{ ...c, id: uid('cm') }, ...list]);
  };
  const deleteCommitment = (id: string) => { const c = commitments.find(x => x.id === id); logAudit('حذف', 'التزام دوري', c?.name ?? ''); setCommitments(l => l.filter(x => x.id !== id)); };
  const toggleCommitment = (id: string) => setCommitments(list => list.map(c => c.id === id ? { ...c, active: !c.active } : c));
  // record an installment payment → creates a real transaction AND advances next due date
  const payCommitment = (id: string) => {
    const c = commitments.find(x => x.id === id);
    if (!c) return;
    const isOut = c.direction === 'out';
    const payment: CommitmentPayment = { id: uid('cp'), amount: c.amount, date: today(), dueLabel: `دفعة ${c.paidCount + 1}${c.totalCount ? `/${c.totalCount}` : ''}`, createdBy: CURRENT_USER };
    const newPaidCount = c.paidCount + 1;
    const reachedEnd = c.totalCount != null && newPaidCount >= c.totalCount;
    setCommitments(list => list.map(x => x.id === id ? {
      ...x, paidCount: newPaidCount, payments: [...x.payments, payment],
      nextDue: reachedEnd ? x.nextDue : advanceDate(x.nextDue, x.freq),
      active: reachedEnd ? false : x.active,
    } : x));
    // create the real cash-flow transaction
    const tx: Transaction = {
      id: uid('t'), projectId: c.projectId, type: isOut ? 'expense' : 'income',
      description: `${c.name} (${COMMITMENT_KINDS.find(k => k.id === c.kind)?.label} - ${payment.dueLabel})`,
      amount: c.amount, category: c.kind === 'subscription' ? 'اشتراكات' : c.kind === 'installment' ? 'أقساط' : 'التزامات',
      date: today(), hasDoc: false, source: c.party, memberId: c.memberId, note: `دفعة ${FREQ_LABEL[c.freq]}`, createdBy: CURRENT_USER,
    };
    setTransactions(list => [tx, ...list]);
    logAudit(isOut ? 'دفع' : 'استلام', 'التزام دوري', `${c.name} — ${fmt(c.amount)}`);
    setNotifs(ns => [{ id: uid('n'), type: 'success', title: isOut ? 'تم دفع التزام' : 'تم استلام دفعة', body: `${c.name}: ${fmt(c.amount)}.${reachedEnd ? ' (اكتملت كل الدفعات)' : ` الاستحقاق القادم بعد التقدّم.`}`, time: 'الآن', read: false, link: 'commitments', projectId: c.projectId, section: 'finance', memberId: c.memberId, ts: nowStamp() }, ...ns]);
  };

  // ── assets (الأصول) ──
  const saveAsset = (a: Omit<Asset, 'id'>) => {
    logAudit('إنشاء', 'أصل', `${a.name} — ${fmt(a.purchaseValue)}`);
    setAssets(list => [{ ...a, id: uid('as') }, ...list]);
    setNotifs(ns => [{ id: uid('n'), type: 'success', title: 'تمت إضافة أصل', body: `${a.name} بقيمة ${fmt(a.purchaseValue)}.`, time: 'الآن', read: false, link: 'assets', projectId: a.projectId, ts: nowStamp() }, ...ns]);
  };
  const deleteAsset = (id: string) => { const a = assets.find(x => x.id === id); logAudit('حذف', 'أصل', a?.name ?? ''); setAssets(l => l.filter(x => x.id !== id)); };
  // adding maintenance → records a real expense transaction + may flip status
  const addMaintenance = (assetId: string, m: Omit<MaintenanceEntry, 'id'>) => {
    const a = assets.find(x => x.id === assetId);
    if (!a) return;
    const entry: MaintenanceEntry = { ...m, id: uid('mn') };
    setAssets(list => list.map(x => x.id === assetId ? {
      ...x, maintenance: [...x.maintenance, entry],
      status: m.type === 'عطل' ? 'maintenance' : x.status,
    } : x));
    if (m.cost > 0) {
      const tx: Transaction = {
        id: uid('t'), projectId: a.projectId, type: 'expense',
        description: `${m.type} - ${a.name}${m.note ? ` (${m.note})` : ''}`,
        amount: m.cost, category: 'صيانة', date: m.date, hasDoc: false, note: 'صيانة أصل', createdBy: CURRENT_USER,
      };
      setTransactions(list => [tx, ...list]);
    }
    logAudit('تسجيل', 'صيانة أصل', `${a.name} — ${m.type} ${fmt(m.cost)}`);
    setNotifs(ns => [{ id: uid('n'), type: 'info', title: `${m.type} مسجّلة`, body: `${a.name}: ${m.type} بتكلفة ${fmt(m.cost)}.`, time: 'الآن', read: false, link: 'assets', projectId: a.projectId, section: 'finance', ts: nowStamp() }, ...ns]);
  };

  const saveDoc = (d: Omit<DocItem, 'id'> & { id?: string }) =>
    setDocuments(list => d.id ? list.map(x => x.id === d.id ? { ...x, ...d } as DocItem : x) : [{ ...d, id: uid('d'), createdBy: CURRENT_USER }, ...list]);
  const deleteDoc = (id: string) => setDocuments(l => l.filter(x => x.id !== id));

  const saveSurvey = (s: Survey) => {
    setSurveys(list => list.some(x => x.id === s.id) ? list.map(x => x.id === s.id ? s : x) : [s, ...list]);
    logAudit(surveys.some(x => x.id === s.id) ? 'تعديل' : 'إنشاء', 'استبيان', s.title);
  };
  const deleteSurvey = (id: string) => { const sv = surveys.find(x => x.id === id); logAudit('حذف', 'استبيان', sv?.title ?? ''); setSurveys(l => l.filter(x => x.id !== id)); };

  const saveMember = (m: Omit<Member, 'id'> & { id?: string }) =>
    setMembers(list => m.id ? list.map(x => x.id === m.id ? { ...x, ...m } as Member : x) : [...list, { ...m, id: uid('m') }]);
  const deleteMember = (id: string) => setMembers(l => l.filter(x => x.id !== id));

  const saveMemberTxn = (t: Omit<MemberTxn, 'id'>) => setMemberTxns(list => [{ ...t, id: uid('mt'), createdBy: CURRENT_USER }, ...list]);
  const decideMemberTxn = (id: string, status: MemberTxnStatus) => {
    const txn = memberTxns.find(t => t.id === id);
    setMemberTxns(list => list.map(t => t.id === id ? { ...t, status } : t));
    if (txn && status === 'accepted') {
      // update member balance: +amount when money goes to member, −amount when taken from member
      const delta = txn.direction === 'to_member' ? txn.amount : -txn.amount;
      setMembers(ms => ms.map(m => m.id === txn.memberId ? { ...m, balance: (m.balance ?? 0) + delta } : m));
      const m = members.find(x => x.id === txn.memberId);
      const ti = MEMBER_TXN_TYPES.find(x => x.id === txn.type);
      // reflect in project finances: money to member = expense, money from member = income
      const projTx: Transaction = {
        id: uid('t'), projectId: txn.projectId,
        type: txn.direction === 'to_member' ? 'expense' : 'income',
        description: `${ti?.label ?? 'حركة عضو'} — ${m?.name ?? ''}`,
        amount: txn.amount, category: 'عُهد', date: today(), hasDoc: false,
        note: `حركة على رصيد العضو (${txn.type})`,
      };
      setTransactions(list => [projTx, ...list]);
      setNotifs(ns => [{ id: uid('n'), type: 'success', title: 'تمت حركة على رصيد عضو', body: `${ti?.label} بمبلغ ${fmt(txn.amount)} لـ ${m?.name ?? ''}.`, time: 'الآن', read: false, link: 'projectDetail', projectId: txn.projectId, section: 'members', memberId: txn.memberId, ts: nowStamp() }, ...ns]);
    }
  };

  // document → action bridges (Document First): route to the right section + open its create form
  const docAction = (action: DocActionKind, doc: DocItem) => {
    setProjectId(doc.projectId);
    if (action === 'tx') { setPage('finance'); setCreateTx(true); }
    else if (action === 'tracking') { setTrackingPreset({ name: doc.name, type: doc.type === 'عقد' ? 'عقد' : doc.type === 'وثيقة رسمية' ? 'وثيقة' : 'ضمان' }); setPage('trackings'); setCreateTracking(true); }
    else if (action === 'commitment') { setPage('commitments'); setCreateCommitment(true); }
    else if (action === 'asset') { setPage('assets'); setCreateAsset(true); }
    else if (action === 'receivable') { setPage('receivables'); setCreateReceivable(true); }
    setNotifs(ns => [{ id: uid('n'), type: 'info', title: 'من المستند إلى إجراء', body: `تم فتح نموذج الإنشاء من المستند «${doc.name}».`, time: 'الآن', read: false, projectId: doc.projectId, ts: nowStamp() }, ...ns]);
  };

  // FAB dispatcher
  // global quick-create overlay: opens a creation sheet ON TOP of the current page.
  // navigation happens only on actual save; cancel keeps the user where they were.
  const [quickCreate, setQuickCreate] = useState<null | 'tx' | 'doc' | 'tracking' | 'request' | 'project'>(null);
  const fabAction = (a: 'tx' | 'doc' | 'tracking' | 'request' | 'project') => setQuickCreate(a);

  const renderPage = () => {
    switch (page) {
      case 'overview': return <Overview projects={projects} transactions={transactions} trackings={trackings} requests={requests} receivables={receivables} commitments={commitments} onNav={setPage} onProject={(id) => { setProjectId(id); setPage('projectDetail'); }} />;
      case 'tasks': return <Tasks projects={projects} requests={requests} receivables={receivables} commitments={commitments} trackings={trackings} memberTxns={memberTxns} members={members} onDecideRequest={decideRequest} onPayReceivable={payReceivable} onPayCommitment={payCommitment} onDecideMemberTxn={decideMemberTxn} onNav={setPage} />;
      case 'dashboard': return <Dashboard projectId={projectId} onNav={setPage} projects={projects} transactions={transactions} trackings={trackings} requests={requests} onDecide={decideRequest} prefs={prefs} helpEntry={help.dashboard} />;
      case 'projects': return <Projects projects={projects} transactions={transactions} onOpen={(id) => { setProjectId(id); setPage('projectDetail'); }} onSave={saveProject} onDelete={deleteProject} openCreate={createProject} onCloseCreate={() => setCreateProject(false)} prefs={prefs} projectTypes={lists.projectTypes} helpEntry={help.projects} />;
      case 'projectDetail': return <ProjectDetail projectId={projectId} projects={projects} transactions={transactions} trackings={trackings} requests={requests} documents={documents} members={members} memberTxns={memberTxns} notifs={notifs} onNav={setPage} onSaveMember={saveMember} onDeleteMember={deleteMember} onSaveMemberTxn={saveMemberTxn} onDecideMemberTxn={decideMemberTxn} onOpenMember={(id) => { setSelectedMember(id); setPage('memberDetail'); }} onSaveProject={saveProject} onDeleteProject={deleteProject} onViewTx={() => setPage('finance')} onViewDoc={(d) => { setPendingDocId(d.id); setProjectId(d.projectId); setPage('documents'); }} onViewTracking={() => setPage('trackings')} onQuickAction={fabAction} prefs={prefs} highlightId={highlightId} />;
      case 'memberDetail': return selectedMember ? <MemberDetail memberId={selectedMember} members={members} projects={projects} transactions={transactions} memberTxns={memberTxns} receivables={receivables} commitments={commitments} requests={requests} onBack={goBack} onNav={setPage} /> : <div style={{ padding: 24 }}>لم يتم اختيار عضو.</div>;
      case 'finance': return <Finance projectId={projectId} projects={projects} transactions={transactions} onSave={saveTx} onDelete={deleteTx} openCreate={createTx} onOpenCreate={() => setCreateTx(true)} onCloseCreate={() => setCreateTx(false)} onNav={setPage} txCategories={lists.txCategories} helpEntry={help.finance} onFixTx={(t) => setFixTx(t)} />;
      case 'ledger': return <Ledger projects={projects} transactions={transactions} members={members} memberTxns={memberTxns} helpEntry={help.ledger} onNavigate={navigateTo} />;
      case 'reports': return <Reports projects={projects} transactions={transactions} receivables={receivables} commitments={commitments} trackings={trackings} requests={requests} members={members} />;
      case 'receivables': return <Receivables projectId={projectId} projects={projects} receivables={receivables} members={members} onSave={saveReceivable} onPay={payReceivable} onDelete={deleteReceivable} openCreate={createReceivable} onOpenCreate={() => setCreateReceivable(true)} onCloseCreate={() => setCreateReceivable(false)} helpEntry={help.receivables} />;
      case 'commitments': return <Commitments projectId={projectId} projects={projects} commitments={commitments} members={members} onSave={saveCommitment} onPay={payCommitment} onToggle={toggleCommitment} onDelete={deleteCommitment} openCreate={createCommitment} onOpenCreate={() => setCreateCommitment(true)} onCloseCreate={() => setCreateCommitment(false)} helpEntry={help.commitments} />;
      case 'documents': return <Documents projectId={projectId} projects={projects} documents={documents} onSave={saveDoc} onDelete={deleteDoc} onAction={docAction} openCreate={createDoc} onOpenCreate={() => setCreateDoc(true)} onCloseCreate={() => setCreateDoc(false)} docTypeOptions={lists.docTypes} helpEntry={help.documents} openDocId={pendingDocId} onConsumeOpenDoc={() => setPendingDocId(null)} />;
      case 'trackings': return <Trackings projectId={projectId} projects={projects} trackings={trackings} members={members} onSave={saveTracking} onDelete={deleteTracking} openCreate={createTracking} onOpenCreate={() => { setTrackingPreset({}); setCreateTracking(true); }} onCloseCreate={() => { setCreateTracking(false); setTrackingPreset({}); }} presetName={trackingPreset.name} presetType={trackingPreset.type} helpEntry={help.trackings} />;
      case 'assets': return <Assets projectId={projectId} projects={projects} assets={assets} members={members} onSave={saveAsset} onDelete={deleteAsset} onAddMaintenance={addMaintenance} openCreate={createAsset} onOpenCreate={() => setCreateAsset(true)} onCloseCreate={() => setCreateAsset(false)} />;
      case 'requests': return <Requests projectId={projectId} projects={projects} requests={requests} members={members} onDecide={decideRequest} onSave={saveRequest} onDelete={deleteRequest} openCreate={createRequest} onOpenCreate={() => setCreateRequest(true)} onCloseCreate={() => setCreateRequest(false)} helpEntry={help.requests} />;
      case 'notifications': return <Notifications notifs={notifs} projects={projects} members={members} onMarkRead={markRead} onMarkAll={markAll} onNav={setPage} onNavigate={navigateTo} />;
      case 'audit': return <AuditLog audit={audit} onNav={setPage} />;
      case 'customize': return <Customize lists={lists} onChange={setLists} help={help} onHelpChange={setHelp} healthData={{ projects, transactions, receivables, commitments, assets, members, memberTxns }} onNav={setPage} onNavigate={navigateTo} documents={documents} />;
      case 'colorCustomize': return <ColorCustomize theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} custom={customTheme} onCustom={setCustomTheme} onNav={setPage} />;
      case 'surveys': return <Surveys surveys={surveys} projects={projects} onSave={saveSurvey} onDelete={deleteSurvey} openCreate={createSurvey} onOpenCreate={() => setCreateSurvey(true)} onCloseCreate={() => setCreateSurvey(false)} />;
      case 'integrations': return <Integrations onBack={() => setPage('settings')} />;
      case 'settings': return <Settings theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onNav={setPage} onLogout={() => { logAudit('تسجيل خروج', 'النظام', 'تم تسجيل الخروج'); setAuthed(false); }} prefs={prefs} onPrefs={setPrefs} />;
      case 'subscription': return <Subscription current={plan} onChoose={setPlan} />;
      default: return null;
    }
  };

  const currentProject = projects.find(p => p.id === projectId);

  // login gate
  if (!authed) {
    return (
      <>
        <style>{KEYFRAMES}</style>
        <Login onAuth={() => { logAudit('تسجيل دخول', 'النظام', 'تسجيل دخول ناجح'); setAuthed(true); }} />
      </>
    );
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className={theme === 'dark' ? 'mz-dark' : 'mz-light'} style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'IBM Plex Sans Arabic', sans-serif", direction: 'rtl', background: 'var(--bg)', color: 'var(--text)' }}>
        <Sidebar page={page} onNav={setPage} projects={projects} projectId={projectId} onProject={setProjectId} unread={unread} isMobile={isMobile} open={drawerOpen} onClose={() => setDrawerOpen(false)} theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} projectsOpen={projectsOpen} onToggleProjects={() => setProjectsOpen(v => !v)} />
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* mobile top bar */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 12px', background: 'var(--sidebar)', position: 'sticky', top: 0, zIndex: 50 }}>
              <button onClick={() => setDrawerOpen(true)} style={{ background: 'var(--sidebar-2)', border: 'none', color: '#fff', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 17, flexShrink: 0 }}>☰</button>
              {canGoBack && <button onClick={goBack} style={{ background: 'var(--sidebar-2)', border: 'none', color: '#fff', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 17, flexShrink: 0 }}>›</button>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>موازين</div>
                {currentProject && <div style={{ color: 'var(--text-3)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentProject.icon} {currentProject.name}</div>}
              </div>
              <button onClick={() => setSearchOpen(true)} style={{ background: 'var(--sidebar-2)', border: 'none', color: '#fff', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 15, flexShrink: 0 }}>🔍</button>
              <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ background: 'var(--sidebar-2)', border: 'none', color: '#fff', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 15, flexShrink: 0 }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
              <button onClick={() => setPage('notifications')} style={{ background: 'var(--sidebar-2)', border: 'none', color: '#fff', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', fontSize: 15, position: 'relative', flexShrink: 0 }}>
                🔔
                {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 99, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--sidebar)' }}>{unread}</span>}
              </button>
            </div>
          )}
          {/* desktop top actions */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px 0' }}>
              {canGoBack && (
                <button onClick={goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  › رجوع
                </button>
              )}
              <button onClick={() => setSearchOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)', borderRadius: 10, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginRight: canGoBack ? 0 : 'auto', minWidth: 220 }}>
                <span>🔍</span><span>بحث شامل...</span>
              </button>
            </div>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }} className={isMobile ? 'mz-mobile' : ''}>
            {renderPage()}
          </div>
        </main>
        {!isMobile && <ActionCenter unread={unread} onAction={fabAction} onNav={setPage} />}
        {isMobile && <BottomBar page={page} onNav={setPage} onFab={() => setFabSheet(true)} unread={unread} />}
        {isMobile && fabSheet && <MobileFabSheet onClose={() => setFabSheet(false)} onAction={(a) => { setFabSheet(false); fabAction(a); }} />}
        {searchOpen && <GlobalSearch projects={projects} transactions={transactions} documents={documents} receivables={receivables} commitments={commitments} assets={assets} trackings={trackings} requests={requests} members={members} onClose={() => setSearchOpen(false)} onGo={(pg, pid) => { if (pid) setProjectId(pid); setPage(pg); }} />}

        {/* AI assistant: floating button + context-aware chat */}
        <button onClick={() => setAiOpen(true)} title="المساعد الذكي" style={{ position: 'fixed', bottom: isMobile ? 80 : 24, right: 24, zIndex: 850, width: 54, height: 54, borderRadius: 99, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontSize: 24, boxShadow: '0 6px 24px rgba(124,58,237,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</button>
        {aiOpen && <AIAssistant ctx={{ page, projectId, projects, transactions, trackings, assets, receivables, commitments, members, memberTxns, requests, documents }} onClose={() => setAiOpen(false)} onNavigate={navigateTo} />}

        {/* AI-assisted fix flow for flagged transactions */}
        {fixTx && <TxFixSheet tx={fixTx} project={projects.find(p => p.id === fixTx.projectId)} transactions={transactions} projects={projects} txCategories={lists.txCategories} onClose={() => setFixTx(null)} onEdit={() => { setEditTx(fixTx); setFixTx(null); }} onApply={(action, payload) => applyTxFix(fixTx, action, payload)} />}
        <Sheet open={!!editTx} onClose={() => setEditTx(null)} title="تعديل العملية">
          {editTx && <TxForm key={editTx.id} initial={editTx} projectId={editTx.projectId} projects={projects} txCategories={lists.txCategories} allTransactions={transactions} onSave={(t) => { saveTx(t); setEditTx(null); }} onCancel={() => setEditTx(null)} />}
        </Sheet>

        {/* global quick-create: navigates only on save, cancel stays put */}
        <Sheet open={quickCreate === 'tx'} onClose={() => setQuickCreate(null)} title="عملية مالية جديدة">
          {quickCreate === 'tx' && <TxForm projectId={projectId} projects={projects} txCategories={lists.txCategories} allTransactions={transactions} onSave={(t) => { saveTx(t); setQuickCreate(null); setProjectId(t.projectId); setPage('finance'); }} onCancel={() => setQuickCreate(null)} />}
        </Sheet>
        <Sheet open={quickCreate === 'doc'} onClose={() => setQuickCreate(null)} title="رفع مستند جديد">
          {quickCreate === 'doc' && <DocForm projectId={projectId} projects={projects} docTypes={lists.docTypes} onSave={(d) => { saveDoc(d); setQuickCreate(null); setProjectId(d.projectId); setPage('documents'); }} onCancel={() => setQuickCreate(null)} />}
        </Sheet>
        <Sheet open={quickCreate === 'tracking'} onClose={() => setQuickCreate(null)} title="متابعة جديدة">
          {quickCreate === 'tracking' && <TrackingForm projectId={projectId} projects={projects} members={members} onSave={(t) => { saveTracking(t); setQuickCreate(null); setProjectId(t.projectId); setPage('trackings'); }} onCancel={() => setQuickCreate(null)} />}
        </Sheet>
        <Sheet open={quickCreate === 'request'} onClose={() => setQuickCreate(null)} title="طلب جديد">
          {quickCreate === 'request' && <RequestForm projectId={projectId} projects={projects} members={members} onSave={(r) => { saveRequest(r); setQuickCreate(null); setProjectId(r.projectId); setPage('requests'); }} onCancel={() => setQuickCreate(null)} />}
        </Sheet>
        <Sheet open={quickCreate === 'project'} onClose={() => setQuickCreate(null)} title="مشروع جديد">
          {quickCreate === 'project' && <ProjectForm projectTypes={lists.projectTypes} onSave={(p) => { saveProject(p); setQuickCreate(null); setPage('projects'); }} onCancel={() => setQuickCreate(null)} />}
        </Sheet>
      </div>
    </>
  );
}
