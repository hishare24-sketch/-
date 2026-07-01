// ═══════════════════════════════════════════
//  نماذج البيانات المشتركة (منقولة من legacy/App.tsx)
//  المصدر الموحّد لأنواع الكيانات — تستوردها الموديولات
// ═══════════════════════════════════════════

export type TxType = 'income' | 'expense' | 'transfer'
export type TrackingStatus = 'active' | 'expiring' | 'expired'
export type RequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled'

// مرفق موحّد (صورة/ملف) — المعاينة في الجلسة، الرفع الفعلي عبر backend لاحقاً
export interface Attachment {
  id: string
  name: string
  kind: 'image' | 'file'
  size: string
  preview?: string
  fileType?: string
  uploadDate?: string
  dataUrl?: string // محتوى الملف base64 (يُحفظ ويدوم عبر IndexedDB)
}

export interface Project {
  id: string
  name: string
  icon: string
  balance: number
  color: string
  type?: string
  description?: string
  image?: string
  gallery?: string[]
}

export type MemberRole = 'owner' | 'manager' | 'member' | 'viewer'

export interface Member {
  id: string
  projectId: string
  name: string
  email: string
  role: MemberRole
  permissions: string[]
  balance?: number
  status?: 'active' | 'invited'
  image?: string
}

// حركات عهد/تسوية الأعضاء (طلب → قبول/رفض)
export type MemberTxnType =
  | 'custody'
  | 'settlement'
  | 'expense'
  | 'deduction'
  | 'supply'
  | 'bonus'
  | 'advance'
  | 'salary'
export type MemberTxnStatus = 'pending' | 'accepted' | 'rejected'

export interface MemberTxn {
  id: string
  projectId: string
  memberId: string
  type: MemberTxnType
  amount: number
  note?: string
  date: string
  status: MemberTxnStatus
  direction: 'to_member' | 'from_member'
  attachments?: Attachment[]
  createdBy?: string
}

// الذمم (مدينة/دائنة)
export type ReceivableKind = 'receivable' | 'payable'
export type ReceivableStatus = 'open' | 'partial' | 'settled' | 'disputed' | 'written_off' | 'cancelled'

export interface ReceivablePayment {
  id: string
  amount: number
  date: string
  note?: string
  source?: string // مصدر السداد (نقدي/تحويل بنكي/صندوق/شيك/عهدة عضو/أخرى)
  attachments?: Attachment[]
  createdBy?: string
}

export interface Receivable {
  id: string
  projectId: string
  kind: ReceivableKind
  party: string
  memberId?: string
  amount: number
  dueDate?: string
  date: string
  status: ReceivableStatus
  invoiceNo?: string
  terms?: string
  payments: ReceivablePayment[]
  note?: string
  attachments?: Attachment[]
  createdBy?: string
}

// الالتزامات الدورية (أقساط/التزامات/اشتراكات)
export type CommitmentKind = 'installment' | 'obligation' | 'subscription'
export type CommitmentFreq = 'monthly' | 'quarterly' | 'yearly' | 'weekly'
export type CommitmentDir = 'out' | 'in'

export interface CommitmentPayment {
  id: string
  amount: number
  date: string
  dueLabel: string
  createdBy?: string
  attachments?: Attachment[]
}

export interface Commitment {
  id: string
  projectId: string
  kind: CommitmentKind
  direction: CommitmentDir
  name: string
  party?: string
  memberId?: string
  amount: number
  freq: CommitmentFreq
  startDate: string
  totalCount?: number
  paidCount: number
  nextDue: string
  active: boolean
  cancelled?: boolean
  payments: CommitmentPayment[]
  note?: string
  specs?: Record<string, string>
  attachments?: Attachment[]
  createdBy?: string
}

// الأصول الملموسة
export type AssetCategory = 'vehicle' | 'device' | 'equipment' | 'furniture' | 'property' | 'other'

// دورة حياة الأصل الملموس
export type AssetStatus = 'active' | 'idle' | 'maintenance' | 'damaged' | 'retired' | 'sold'

export type MaintenanceType = 'صيانة' | 'إصلاح' | 'عطل' | 'فحص' | 'دورية'

export interface MaintenanceEntry {
  id: string
  date: string
  type: MaintenanceType
  cost: number
  note: string
  meter?: number // قراءة العداد وقت العملية
  createdBy?: string
  attachments?: Attachment[]
}

// حدث غير مالي في سجل الأصل (تغيير حالة/نقل/عداد/بيع/ربط ضمان)
export type AssetEventKind = 'status' | 'transfer' | 'meter' | 'sale' | 'warranty' | 'periodic' | 'note'
export interface AssetEvent {
  id: string
  date: string
  kind: AssetEventKind
  text: string
  createdBy?: string
}

export interface AssetPeriodic {
  every: number
  unit: 'يوم' | 'أسبوع' | 'شهر' | 'سنة'
  nextDue: string
}

// سياق الضمان الفرعي: من الشراء الأصلي، مكوّن مُشترى، صيانة، إصلاح، أو غير ذلك
export type WarrantyContext = 'purchase' | 'component' | 'maintenance' | 'repair' | 'other'

// ضمان فرعي داخل الأصل — لكل مكوّن/إصلاح ضمانه وفاتورته وتاريخ انتهائه ومرفقاته، قابل للتتبّع والتذكير
export interface AssetWarranty {
  id: string
  name: string
  provider?: string
  context: WarrantyContext
  startDate?: string
  endDate: string
  cost?: number
  invoiceNo?: string
  linkedMaintenanceId?: string
  note?: string
  attachments?: Attachment[]
  trackingId?: string
  createdBy?: string
}

export interface Asset {
  id: string
  projectId: string
  name: string
  category: AssetCategory
  purchaseDate: string
  purchaseValue: number
  supplier?: string
  warrantyEnd?: string
  serial?: string
  usageMeter?: number
  usageUnit?: string
  status: AssetStatus
  memberId?: string
  maintenance: MaintenanceEntry[]
  note?: string
  attachments?: Attachment[]
  createdBy?: string
  // إضافات: حقول حسب الطبيعة + ربط ضمان + دورية + سجل أحداث + بيانات البيع
  specs?: Record<string, string>
  trackingId?: string
  periodic?: AssetPeriodic
  events?: AssetEvent[]
  warranties?: AssetWarranty[]
  saleValue?: number
  saleDate?: string
}

export interface Transaction {
  id: string
  projectId: string
  type: TxType
  description: string
  amount: number
  category: string
  date: string
  hasDoc: boolean
  note?: string
  toProject?: string
  transferDir?: 'out' | 'in'
  linkId?: string
  source?: string
  memberId?: string
  attachments?: Attachment[]
  createdBy?: string
}

export interface Tracking {
  id: string
  name: string
  type: string
  icon: string
  status: TrackingStatus
  daysLeft: number
  expiryDate: string
  projectId: string
  note?: string
  memberId?: string
  specs?: Record<string, string>
  cancelled?: boolean
  renewedCount?: number
  cost?: number
  attachments?: Attachment[]
  createdBy?: string
}

export interface RequestItem {
  id: string
  title: string
  amount: number
  requestedBy: string
  status: RequestStatus
  date: string
  type: string
  projectId: string
  note?: string
  memberId?: string
  specs?: Record<string, string>
  decisionNote?: string
  decidedBy?: string
  attachments?: Attachment[]
  createdBy?: string
}

export interface DocItem {
  id: string
  name: string
  type: string
  date: string
  size: string
  status: string
  projectId: string
  aiRead: boolean
  attachments?: Attachment[]
  createdBy?: string
  // أنواع الإجراءات التي سبق تنفيذها من هذا المستند (لمنع تكرارها)
  performedActions?: string[]
}

// الاستبيانات
export type SurveyQuestionKind =
  | 'single' // اختيار واحد
  | 'multi' // اختيار متعدد
  | 'rating' // تقييم 1-5
  | 'text' // نص حر
  | 'yesno' // نعم / لا
  | 'number' // رقم
  | 'nps' // مقياس الترشيح 0-10

export interface SurveyQuestion {
  id: string
  text: string
  kind: SurveyQuestionKind
  options?: string[]
  required?: boolean
}

export type RespondentSource = 'member' | 'manual' | 'excel' | 'external'

export interface SurveyRespondent {
  id: string
  name: string
  email?: string
  source: RespondentSource
  responded: boolean
}

export interface SurveyResponse {
  id: string
  answers: Record<string, string | string[] | number>
  submittedAt: string
  respondent?: string
  respondentId?: string
}

export interface Survey {
  id: string
  title: string
  description?: string
  surveyType: string
  projectId?: string
  questions: SurveyQuestion[]
  responses: SurveyResponse[]
  respondents?: SurveyRespondent[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  maxResponses?: number
  closeDate?: string
  anonymous?: boolean
  shareId?: string
  webhookUrl?: string
}

export type Page =
  | 'overview' | 'tasks' | 'dashboard' | 'projects' | 'projectDetail' | 'finance'
  | 'ledger' | 'reports' | 'receivables' | 'commitments' | 'documents' | 'trackings'
  | 'assets' | 'requests' | 'notifications' | 'settings' | 'integrations'
  | 'subscription' | 'memberDetail' | 'audit' | 'customize' | 'colorCustomize' | 'surveys'

export interface Notif {
  id: string
  type: string
  title: string
  body: string
  time: string
  read: boolean
  link?: Page
  projectId?: string
  section?: string
  memberId?: string
  itemId?: string
  ts?: string
}

export interface AuditEntry {
  id: string
  action: string
  entity: string
  detail: string
  user: string
  ts: string
}

// تفضيلات المستخدم (تتحكم بالعرض عبر الأقسام)
export interface UserPrefs {
  showStats: boolean
  showCharts: boolean
  defaultPeriod: string
  compactCards: boolean
  showQuickActions: boolean
  confirmDelete: boolean
  statsAutoScroll: boolean
  statsScrollSeconds: number
  statsLayout: 'horizontal' | 'vertical'
  density: 'comfortable' | 'compact'
}

// قوائم قابلة للتخصيص (من صفحة التخصيص)
export interface CustomLists {
  txCategories: string[]
  projectTypes: string[]
  docTypes: string[]
  partyTypes: string[]
}

// مفتاح الشرح = معرّف الشاشة (مرن، يدعم أي شاشة)
export type HelpKey = string
export interface HelpEntry {
  title: string
  body: string
  show: boolean
}
export type HelpTexts = Record<string, HelpEntry>

// ═══════════════════════════════════════════
//  مولّد القوالب الديناميكي (منشئ القوالب الذكي)
// ═══════════════════════════════════════════

// أنواع المستندات الخمسة المدعومة
export type TemplateDocType = 'quote' | 'invoice' | 'agreement' | 'payment_order' | 'official'
export type TemplateStatus = 'active' | 'archived'

// أنواع الأقسام الستة داخل القالب
export type TemplateSectionKind =
  | 'header' // رأس الصفحة
  | 'fixed' // قسم ثابت (مرة واحدة)
  | 'repeatable' // قسم مكرر (صفوف/بنود قابلة للإضافة والحذف)
  | 'group' // مجموعة عناصر مرتبطة
  | 'conditional' // قسم شرطي (يظهر عند شرط)
  | 'footer' // تذييل الصفحة

// أنواع العناصر الـ15 القابلة للإضافة
export type TemplateElementType =
  | 'paragraph' // فقرة نصية
  | 'heading' // عنوان
  | 'table' // جدول بسيط
  | 'items_table' // جدول منتجات/خدمات (بإجمالي تلقائي)
  | 'number' // حقل رقمي
  | 'date' // حقل تاريخ
  | 'short_text' // نص قصير
  | 'long_text' // نص طويل
  | 'image' // صورة (شعار/توقيع/ختم/باركود)
  | 'dropdown' // قائمة منسدلة
  | 'checkbox' // خانة اختيار
  | 'page_break' // فاصل صفحة
  | 'signature' // توقيع إلكتروني
  | 'computed' // حقل محسوب
  | 'group' // مجموعة عناصر فرعية

// عنصر داخل قسم — الخصائص كلها اختيارية وتُستخدم حسب نوع العنصر
export interface TemplateElement {
  id: string
  type: TemplateElementType
  label: string
  hidden?: boolean // إخفاء مؤقت دون حذف
  // إدخال عام
  placeholder?: string
  required?: boolean
  defaultValue?: string
  // نص/عنوان
  fontSize?: number
  color?: string
  bold?: boolean
  italic?: boolean
  align?: 'start' | 'center' | 'end'
  // رقمي
  numberFormat?: 'integer' | 'decimal' | 'currency' | 'percent'
  min?: number
  max?: number
  // تاريخ
  dateFormat?: 'gregorian' | 'hijri'
  // قائمة منسدلة
  options?: string[]
  // حقل محسوب
  formula?: string
  // صورة
  imageKind?: 'logo' | 'signature' | 'stamp' | 'barcode'
  src?: string // صورة مرفوعة (base64 dataUrl) — تُحفظ مع القالب وتدوم عبر IndexedDB
  // جدول
  columns?: string[]
}

export interface TemplateSection {
  id: string
  kind: TemplateSectionKind
  title: string
  repeatable?: boolean
  condition?: string // شرط ظهور القسم الشرطي
  elements: TemplateElement[]
}

export interface DocTemplate {
  id: string
  name: string
  docType: TemplateDocType
  status: TemplateStatus
  sections: TemplateSection[]
  createdAt: string
  updatedAt: string
  createdBy?: string
}
