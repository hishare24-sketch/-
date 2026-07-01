// ═══════════════════════════════════════════
//  البيانات التجريبية الأولية (offline) — منقولة من legacy/App.tsx
//  تُحمَّل في Pinia stores. تُستبدل بنداءات API عند توفّر backend.
// ═══════════════════════════════════════════
import type {
  Project, Transaction, Tracking, Asset, RequestItem, DocItem,
  Notif, AuditEntry, Member, MemberTxn, Receivable, Commitment, Survey,
  DocTemplate,
} from '@/interfaces/models'
import { ROLE_PERMS } from '@/constants'
import { buildTemplate, buildProfessionalTemplate } from '@/modules/templates/constants'

export const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'شركة النخيل', icon: '🏢', balance: 284500, color: '#0891b2', type: 'شركة', description: 'شركة تجارية متخصصة في التوريدات' },
  { id: 'p2', name: 'مشروع المنزل', icon: '🏠', balance: 52300, color: '#059669', type: 'مشروع منزلي', description: 'إدارة مصاريف والتزامات المنزل' },
  { id: 'p3', name: 'مطعم الديوانية', icon: '🍽️', balance: 118900, color: '#d97706', type: 'مطعم', description: 'مطعم وجبات شعبية' },
  { id: 'p4', name: 'متجر أناقة', icon: '🛍️', balance: 76400, color: '#7c3aed', type: 'متجر إلكتروني', description: 'متجر إلكتروني للأزياء والإكسسوارات' },
  { id: 'p5', name: 'عيادة الشفاء', icon: '🏥', balance: 203100, color: '#0891b2', type: 'عيادة', description: 'عيادة طبية متعددة التخصصات' },
  { id: 'p6', name: 'ميزانية العائلة', icon: '👨‍👩‍👧', balance: 31800, color: '#db2777', type: 'مشروع أسري', description: 'إدارة الالتزامات والمصاريف العائلية' },
  { id: 'p7', name: 'مزرعة الخير', icon: '🌿', balance: 96500, color: '#65a30d', type: 'مشروع زراعي', description: 'إنتاج وبيع المحاصيل والتمور' },
  { id: 'p8', name: 'صالون لمسات', icon: '💈', balance: 41200, color: '#db2777', type: 'صالون', description: 'صالون تجميل وعناية' },
  { id: 'p9', name: 'ورشة الإتقان', icon: '🔧', balance: 58700, color: '#475569', type: 'ورشة', description: 'ورشة صيانة مركبات' },
  { id: 'p10', name: 'مقهى الركن', icon: '☕', balance: 67300, color: '#d97706', type: 'مقهى', description: 'مقهى ومحمصة بن' },
]

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', projectId: 'p1', type: 'income', description: 'إيراد مبيعات يونيو', amount: 48000, category: 'مبيعات', date: '2025-06-18', hasDoc: true, source: 'عميل: مجموعة الرواد', createdBy: 'محمد العمري' },
  { id: 'tErr1', projectId: 'p1', type: 'expense', description: 'فاتورة صيانة (مبلغ سالب بالخطأ)', amount: -3500, category: 'صيانة', date: '2025-06-20', hasDoc: false, source: 'ورشة الأمانة', createdBy: 'محمد العمري' },
  { id: 'tErr2', projectId: 'p1', type: 'expense', description: 'دفعة مورد (مبلغ غير معتاد؟)', amount: 9800000, category: 'مشتريات', date: '2025-06-21', hasDoc: false, source: 'مورد: التقنية الحديثة', createdBy: 'محمد العمري' },
  { id: 't2', projectId: 'p1', type: 'expense', description: 'رواتب الموظفين', amount: 21000, category: 'رواتب', date: '2025-06-15', hasDoc: true, createdBy: 'سارة المحمد' },
  { id: 't3', projectId: 'p1', type: 'expense', description: 'إيجار المكتب', amount: 8500, category: 'إيجار', date: '2025-06-01', hasDoc: false, createdBy: 'محمد العمري' },
  { id: 't4', projectId: 'p1', type: 'income', description: 'عمولة مشروع', amount: 12000, category: 'مبيعات', date: '2025-05-10', hasDoc: true, source: 'شركة البناء الحديث', createdBy: 'محمد العمري' },
  { id: 't5', projectId: 'p1', type: 'expense', description: 'فاتورة كهرباء', amount: 1800, category: 'فواتير', date: '2025-06-05', hasDoc: true, createdBy: 'أحمد العلي' },
  { id: 't6', projectId: 'p1', type: 'expense', description: 'حملة تسويق رقمي', amount: 6500, category: 'تسويق', date: '2025-05-28', hasDoc: false, createdBy: 'سارة المحمد' },
  { id: 't7', projectId: 'p2', type: 'expense', description: 'قسط السيارة', amount: 2200, category: 'قسط', date: '2025-06-20', hasDoc: false, createdBy: 'محمد العمري' },
  { id: 't8', projectId: 'p2', type: 'expense', description: 'فاتورة المياه والكهرباء', amount: 740, category: 'فواتير', date: '2025-06-08', hasDoc: true, createdBy: 'محمد العمري' },
  { id: 't9', projectId: 'p2', type: 'income', description: 'الراتب الشهري', amount: 18000, category: 'مبيعات', date: '2025-06-01', hasDoc: false, createdBy: 'محمد العمري' },
  { id: 't10', projectId: 'p3', type: 'income', description: 'مبيعات الأسبوع', amount: 32000, category: 'مبيعات', date: '2025-06-19', hasDoc: false, createdBy: 'محمد الزيد' },
  { id: 't11', projectId: 'p3', type: 'expense', description: 'شراء مواد خام', amount: 14500, category: 'أخرى', date: '2025-06-17', hasDoc: true, source: 'سوق الخضار المركزي', createdBy: 'محمد الزيد' },
  { id: 't12', projectId: 'p3', type: 'expense', description: 'رواتب العمالة', amount: 9000, category: 'رواتب', date: '2025-06-15', hasDoc: false, createdBy: 'محمد الزيد' },
  { id: 't13', projectId: 'p4', type: 'income', description: 'مبيعات المتجر الإلكتروني', amount: 27600, category: 'مبيعات', date: '2025-06-21', hasDoc: true, source: 'منصة سلة', createdBy: 'نورة القحطاني' },
  { id: 't14', projectId: 'p4', type: 'expense', description: 'رسوم الشحن', amount: 3400, category: 'أخرى', date: '2025-06-20', hasDoc: false, createdBy: 'نورة القحطاني' },
  { id: 't15', projectId: 'p4', type: 'expense', description: 'اشتراك المنصة الشهري', amount: 1200, category: 'فواتير', date: '2025-06-10', hasDoc: true, createdBy: 'فهد الدوسري' },
  { id: 't16', projectId: 'p5', type: 'income', description: 'إيرادات الكشوفات', amount: 56000, category: 'مبيعات', date: '2025-06-22', hasDoc: true, source: 'مرضى + تأمين', createdBy: 'د. ليلى الحربي' },
  { id: 't17', projectId: 'p5', type: 'expense', description: 'مستلزمات طبية', amount: 18900, category: 'أخرى', date: '2025-06-18', hasDoc: true, source: 'شركة المعدات الطبية', createdBy: 'د. ليلى الحربي' },
  { id: 't18', projectId: 'p5', type: 'expense', description: 'رواتب الكادر الطبي', amount: 42000, category: 'رواتب', date: '2025-06-15', hasDoc: false, createdBy: 'عبدالله الشمري' },
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
  // تحويلات بين المشاريع (قيدان مرتبطان)
  { id: 't31', projectId: 'p1', type: 'transfer', description: 'تحويل سيولة لمطعم الديوانية', amount: 15000, category: 'تحويل', date: '2025-06-19', hasDoc: false, transferDir: 'out', toProject: 'p3', linkId: 'lnkSeed1', createdBy: 'محمد العمري' },
  { id: 't32', projectId: 'p3', type: 'transfer', description: 'تحويل سيولة من شركة النخيل', amount: 15000, category: 'تحويل', date: '2025-06-19', hasDoc: false, transferDir: 'in', toProject: 'p1', linkId: 'lnkSeed1', createdBy: 'محمد العمري' },
  { id: 't33', projectId: 'p5', type: 'income', description: 'منحة تشغيلية', amount: 25000, category: 'مبيعات', date: '2025-06-23', hasDoc: true, source: 'جهة داعمة', createdBy: 'د. ليلى الحربي' },
  { id: 't34', projectId: 'p4', type: 'expense', description: 'تغليف وهدايا', amount: 1900, category: 'تسويق', date: '2025-06-22', hasDoc: false, createdBy: 'نورة القحطاني' },
  // مزرعة الخير
  { id: 't35', projectId: 'p7', type: 'income', description: 'بيع محصول التمور', amount: 42000, category: 'مبيعات', date: '2025-06-18', hasDoc: true, source: 'سوق الجملة', createdBy: 'سعد الزهراني' },
  { id: 't36', projectId: 'p7', type: 'expense', description: 'بذور وأسمدة', amount: 8500, category: 'أخرى', date: '2025-06-10', hasDoc: true, source: 'مورد زراعي', createdBy: 'فيصل العتيبي' },
  { id: 't37', projectId: 'p7', type: 'expense', description: 'أجور موسمية', amount: 6000, category: 'رواتب', date: '2025-06-15', hasDoc: false, createdBy: 'سعد الزهراني' },
  // صالون لمسات
  { id: 't38', projectId: 'p8', type: 'income', description: 'إيرادات خدمات يونيو', amount: 18500, category: 'مبيعات', date: '2025-06-20', hasDoc: false, createdBy: 'لمياء السالم' },
  { id: 't39', projectId: 'p8', type: 'expense', description: 'مستلزمات تجميل', amount: 4200, category: 'أخرى', date: '2025-06-12', hasDoc: true, source: 'مورد المستحضرات', createdBy: 'دانة الحربي' },
  // ورشة الإتقان
  { id: 't40', projectId: 'p9', type: 'income', description: 'إصلاحات وصيانة', amount: 23700, category: 'مبيعات', date: '2025-06-21', hasDoc: false, createdBy: 'ماجد الشهري' },
  { id: 't41', projectId: 'p9', type: 'expense', description: 'قطع غيار', amount: 9800, category: 'مشتريات', date: '2025-06-14', hasDoc: true, source: 'مستودع القطع', createdBy: 'بدر القرني' },
  // مقهى الركن
  { id: 't42', projectId: 'p10', type: 'income', description: 'مبيعات المقهى', amount: 21000, category: 'مبيعات', date: '2025-06-22', hasDoc: false, createdBy: 'ريان الدوسري' },
  { id: 't43', projectId: 'p10', type: 'expense', description: 'شراء بن وحليب', amount: 5400, category: 'أخرى', date: '2025-06-17', hasDoc: true, source: 'محمصة البن', createdBy: 'نوف الشمري' },
  { id: 't44', projectId: 'p10', type: 'expense', description: 'إيجار المقهى', amount: 7000, category: 'إيجار', date: '2025-06-01', hasDoc: false, createdBy: 'ريان الدوسري' },
]

export const INITIAL_TRACKINGS: Tracking[] = [
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
  { id: 'tr11', name: 'تأمين طبي للموظفين', type: 'تأمين', icon: '🏥', status: 'active', daysLeft: 150, expiryDate: '2025-11-23', projectId: 'p5', createdBy: 'عبدالله الشمري' },
  { id: 'tr12', name: 'وثيقة الدفاع المدني', type: 'وثيقة', icon: '🪪', status: 'expiring', daysLeft: 20, expiryDate: '2025-07-16', projectId: 'p3', createdBy: 'محمد الزيد' },
  { id: 'tr13', name: 'عقد صيانة المصاعد', type: 'عقد', icon: '📄', status: 'expired', daysLeft: -10, expiryDate: '2025-06-16', projectId: 'p5', createdBy: 'عبدالله الشمري' },
  { id: 'tr14', name: 'رخصة المزرعة', type: 'ترخيص', icon: '🏛️', status: 'active', daysLeft: 200, expiryDate: '2026-01-12', projectId: 'p7', createdBy: 'سعد الزهراني' },
  { id: 'tr15', name: 'تأمين معدات الري', type: 'تأمين', icon: '🚜', status: 'expiring', daysLeft: 22, expiryDate: '2025-07-18', projectId: 'p7', createdBy: 'فيصل العتيبي' },
  { id: 'tr16', name: 'رخصة الصالون البلدية', type: 'ترخيص', icon: '🏛️', status: 'active', daysLeft: 95, expiryDate: '2025-09-29', projectId: 'p8', createdBy: 'لمياء السالم' },
  { id: 'tr17', name: 'ضمان معدات الورشة', type: 'ضمان', icon: '🔧', status: 'active', daysLeft: 300, expiryDate: '2026-04-22', projectId: 'p9', createdBy: 'ماجد الشهري' },
  { id: 'tr18', name: 'عقد إيجار المقهى', type: 'عقد', icon: '📄', status: 'expiring', daysLeft: 28, expiryDate: '2025-07-24', projectId: 'p10', createdBy: 'ريان الدوسري' },
]

export const INITIAL_ASSETS: Asset[] = [
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
  { id: 'as6', projectId: 'p1', name: 'أثاث مكتبي (مكاتب وكراسي)', category: 'furniture', purchaseDate: '2024-02-20', purchaseValue: 32000, supplier: 'معرض المكاتب', warrantyEnd: '2026-02-20', status: 'active', maintenance: [], note: 'أثاث الإدارة', createdBy: 'محمد العمري' },
  { id: 'as7', projectId: 'p5', name: 'مبنى العيادة', category: 'property', purchaseDate: '2022-08-01', purchaseValue: 1850000, supplier: 'تطوير عقاري', status: 'active', maintenance: [], note: 'العقار الرئيسي', createdBy: 'د. ليلى الحربي' },
  { id: 'as8', projectId: 'p3', name: 'فرن قديم (مستبعَد)', category: 'equipment', purchaseDate: '2020-05-10', purchaseValue: 9000, status: 'retired', maintenance: [
    { id: 'mn5', date: '2024-12-01', type: 'عطل', cost: 0, note: 'تعذّر الإصلاح — استُبعد', createdBy: 'محمد الزيد' },
  ], note: 'خارج الخدمة', createdBy: 'محمد الزيد' },
  { id: 'as9', projectId: 'p4', name: 'لوازم وتجهيزات متنوعة', category: 'other', purchaseDate: '2024-09-15', purchaseValue: 5000, status: 'active', maintenance: [], createdBy: 'فهد الدوسري' },
  { id: 'as10', projectId: 'p7', name: 'جرّار زراعي', category: 'vehicle', purchaseDate: '2023-09-01', purchaseValue: 95000, supplier: 'وكالة المعدات الزراعية', warrantyEnd: '2026-09-01', serial: 'TRC-7781', usageMeter: 1250, usageUnit: 'ساعة', status: 'active', memberId: 'm18', maintenance: [
    { id: 'mn6', date: '2025-04-10', type: 'صيانة', cost: 1500, note: 'تغيير زيت وفلاتر', createdBy: 'فيصل العتيبي' },
  ], createdBy: 'سعد الزهراني' },
  { id: 'as11', projectId: 'p8', name: 'كراسي وتجهيزات الصالون', category: 'furniture', purchaseDate: '2024-03-12', purchaseValue: 38000, supplier: 'معرض التجهيزات', status: 'active', maintenance: [], createdBy: 'لمياء السالم' },
  { id: 'as12', projectId: 'p9', name: 'رافعة سيارات هيدروليكية', category: 'equipment', purchaseDate: '2023-11-05', purchaseValue: 62000, supplier: 'مورد معدات الورش', warrantyEnd: '2025-07-05', serial: 'LFT-2290', status: 'maintenance', maintenance: [
    { id: 'mn7', date: '2025-06-18', type: 'عطل', cost: 2800, note: 'تسريب في النظام الهيدروليكي', createdBy: 'بدر القرني' },
  ], createdBy: 'ماجد الشهري' },
  { id: 'as13', projectId: 'p10', name: 'ماكينة إسبريسو احترافية', category: 'device', purchaseDate: '2024-05-20', purchaseValue: 28000, supplier: 'مورد معدات المقاهي', warrantyEnd: '2026-05-20', status: 'active', maintenance: [], createdBy: 'ريان الدوسري' },
]

export const INITIAL_REQUESTS: RequestItem[] = [
  { id: 'r1', title: 'طلب صرف مصروفات السفر', amount: 3200, requestedBy: 'أحمد العلي', status: 'pending', date: '2025-06-20', type: 'مصروف', projectId: 'p1', createdBy: 'أحمد العلي' },
  { id: 'r2', title: 'تعزيز عهدة الصندوق', amount: 5000, requestedBy: 'سارة المحمد', status: 'pending', date: '2025-06-19', type: 'عهدة', projectId: 'p1', createdBy: 'سارة المحمد' },
  { id: 'r3', title: 'شراء معدات مكتبية', amount: 8700, requestedBy: 'خالد السعد', status: 'approved', date: '2025-06-15', type: 'شراء', projectId: 'p1', createdBy: 'خالد السعد' },
  { id: 'r4', title: 'صيانة أجهزة المطبخ', amount: 1500, requestedBy: 'محمد الزيد', status: 'rejected', date: '2025-06-12', type: 'صيانة', projectId: 'p3', createdBy: 'محمد الزيد' },
  { id: 'r5', title: 'شراء مخزون جديد', amount: 12000, requestedBy: 'نورة القحطاني', status: 'pending', date: '2025-06-21', type: 'شراء', projectId: 'p4', createdBy: 'نورة القحطاني' },
  { id: 'r6', title: 'تعويض مستلزمات طبية', amount: 6300, requestedBy: 'د. ليلى الحربي', status: 'approved', date: '2025-06-18', type: 'مصروف', projectId: 'p5', createdBy: 'د. ليلى الحربي' },
  { id: 'r7', title: 'طلب إجازة مدفوعة', amount: 0, requestedBy: 'عبدالله الشمري', status: 'pending', date: '2025-06-22', type: 'أخرى', projectId: 'p5', createdBy: 'عبدالله الشمري' },
  { id: 'r8', title: 'صرف بدل مواصلات', amount: 800, requestedBy: 'فهد الدوسري', status: 'approved', date: '2025-06-14', type: 'مصروف', projectId: 'p4', createdBy: 'فهد الدوسري' },
  { id: 'r9', title: 'طلب تحويل بين المشاريع', amount: 10000, requestedBy: 'محمد العمري', status: 'pending', date: '2025-06-25', type: 'تحويل', projectId: 'p1', createdBy: 'محمد العمري' },
  { id: 'r10', title: 'صيانة مكيف القاعة', amount: 1300, requestedBy: 'هند المطيري', status: 'approved', date: '2025-06-16', type: 'صيانة', projectId: 'p5', createdBy: 'هند المطيري' },
  { id: 'r11', title: 'شراء بذور موسم جديد', amount: 7000, requestedBy: 'فيصل العتيبي', status: 'pending', date: '2025-06-24', type: 'شراء', projectId: 'p7', createdBy: 'فيصل العتيبي' },
  { id: 'r12', title: 'تعزيز عهدة مشتريات الورشة', amount: 4000, requestedBy: 'بدر القرني', status: 'pending', date: '2025-06-23', type: 'عهدة', projectId: 'p9', createdBy: 'بدر القرني' },
  { id: 'r13', title: 'صرف رواتب الباريستا', amount: 9000, requestedBy: 'نوف الشمري', status: 'approved', date: '2025-06-19', type: 'مصروف', projectId: 'p10', createdBy: 'نوف الشمري' },
]

export const INITIAL_DOCUMENTS: DocItem[] = [
  { id: 'd1', name: 'فاتورة مورد يونيو', type: 'فاتورة', date: '2025-06-18', size: '245 KB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd2', name: 'عقد الإيجار السنوي', type: 'عقد', date: '2025-01-01', size: '1.2 MB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd3', name: 'كشف حساب البنك', type: 'كشف حساب', date: '2025-06-01', size: '380 KB', status: 'pending', projectId: 'p1', aiRead: false, createdBy: 'سارة المحمد' },
  { id: 'd4', name: 'رخصة البلدية', type: 'وثيقة رسمية', date: '2024-07-15', size: '890 KB', status: 'processed', projectId: 'p1', aiRead: true, createdBy: 'محمد العمري' },
  { id: 'd5', name: 'فاتورة مواد خام', type: 'فاتورة', date: '2025-06-17', size: '198 KB', status: 'processed', projectId: 'p3', aiRead: true, createdBy: 'محمد الزيد' },
  { id: 'd6', name: 'عقد توريد الأقمشة', type: 'عقد', date: '2025-06-24', size: '760 KB', status: 'pending', projectId: 'p4', aiRead: false, createdBy: 'نورة القحطاني' },
  { id: 'd7', name: 'ترخيص وزارة الصحة', type: 'وثيقة رسمية', date: '2024-07-24', size: '1.1 MB', status: 'processed', projectId: 'p5', aiRead: true, createdBy: 'د. ليلى الحربي' },
  { id: 'd8', name: 'كشف حساب العيادة', type: 'كشف حساب', date: '2025-06-22', size: '420 KB', status: 'processed', projectId: 'p5', aiRead: true, createdBy: 'عبدالله الشمري' },
  { id: 'd9', name: 'فاتورة المدارس', type: 'فاتورة', date: '2025-06-12', size: '156 KB', status: 'pending', projectId: 'p6', aiRead: false, createdBy: 'محمد العمري' },
  { id: 'd10', name: 'ملف سياسات الشركة', type: 'ملف عام', date: '2025-06-05', size: '600 KB', status: 'pending', projectId: 'p1', aiRead: false, createdBy: 'سارة المحمد' },
  { id: 'd11', name: 'كشف حساب متجر أناقة', type: 'كشف حساب', date: '2025-06-20', size: '512 KB', status: 'processed', projectId: 'p4', aiRead: true, createdBy: 'فهد الدوسري' },
  { id: 'd12', name: 'فاتورة بيع التمور', type: 'فاتورة', date: '2025-06-18', size: '210 KB', status: 'processed', projectId: 'p7', aiRead: true, createdBy: 'سعد الزهراني' },
  { id: 'd13', name: 'رخصة الصالون', type: 'وثيقة رسمية', date: '2024-09-29', size: '880 KB', status: 'processed', projectId: 'p8', aiRead: true, createdBy: 'لمياء السالم' },
  { id: 'd14', name: 'عقد إيجار المقهى', type: 'عقد', date: '2025-01-01', size: '1.0 MB', status: 'pending', projectId: 'p10', aiRead: false, createdBy: 'ريان الدوسري' },
]

export const INITIAL_NOTIFS: Notif[] = [
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
  { id: 'n13', type: 'warning', title: 'تأمين معدات الري يقترب من الانتهاء', body: 'تأمين معدات الري في مزرعة الخير ينتهي خلال 22 يوماً.', time: 'أمس', read: false, link: 'trackings', projectId: 'p7', section: 'trackings', itemId: 'tr15', ts: '2025-06-25 11:00' },
  { id: 'n14', type: 'info', title: 'طلب جديد بانتظار موافقتك', body: 'طلب شراء بذور موسم جديد بمبلغ 7,000 ر.س — مزرعة الخير.', time: 'أمس', read: false, link: 'requests', projectId: 'p7', section: 'requests', ts: '2025-06-24 09:30' },
  { id: 'n15', type: 'warning', title: 'رافعة الورشة تحت الصيانة', body: 'الرافعة الهيدروليكية في ورشة الإتقان مُعطّلة وقيد الإصلاح.', time: 'قبل يومين', read: true, link: 'assets', projectId: 'p9', section: 'assets', itemId: 'as12', ts: '2025-06-23 14:20' },
  { id: 'n16', type: 'success', title: 'تحصيل دفعة', body: 'تم تحصيل 6,000 ر.س من سوق الجملة المركزي (مزرعة الخير).', time: 'قبل يومين', read: true, link: 'receivables', projectId: 'p7', section: 'receivables', ts: '2025-06-25 16:00' },
]

export const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'a1', action: 'تسجيل دخول', entity: 'النظام', detail: 'تسجيل دخول ناجح', user: 'محمد العمري', ts: '2025-06-26 09:12' },
  { id: 'a2', action: 'إنشاء', entity: 'عملية مالية', detail: 'إيراد مبيعات — 12,000 ر.س', user: 'محمد العمري', ts: '2025-06-26 09:20' },
  { id: 'a3', action: 'اعتماد', entity: 'طلب', detail: 'اعتماد طلب صرف مصروفات السفر', user: 'سارة المحمد', ts: '2025-06-25 16:40' },
  { id: 'a4', action: 'سداد', entity: 'ذمة', detail: 'سداد ذمة سوق الخضار — 3,000 ر.س', user: 'محمد الزيد', ts: '2025-06-22 15:30' },
  { id: 'a5', action: 'تعديل', entity: 'مشروع', detail: 'تحديث وصف شركة النخيل', user: 'محمد العمري', ts: '2025-06-21 10:05' },
  { id: 'a6', action: 'حذف', entity: 'مستند', detail: 'حذف مسودة فاتورة مكررة', user: 'سارة المحمد', ts: '2025-06-20 09:40' },
]

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', projectId: 'p1', name: 'محمد العمري', email: 'mohammed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm2', projectId: 'p1', name: 'سارة المحمد', email: 'sara@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 5000, status: 'active' },
  { id: 'm3', projectId: 'p1', name: 'أحمد العلي', email: 'ahmad@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 1200, status: 'active' },
  { id: 'm4', projectId: 'p1', name: 'خالد السعد', email: 'khalid@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 0, status: 'active' },
  { id: 'm5', projectId: 'p1', name: 'ريم الناصر', email: 'reem@example.com', role: 'viewer', permissions: ROLE_PERMS.viewer, balance: 0, status: 'active' },
  { id: 'm6', projectId: 'p3', name: 'محمد الزيد', email: 'mz@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 800, status: 'active' },
  { id: 'm7', projectId: 'p3', name: 'يوسف الحمدان', email: 'yousef@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 300, status: 'active' },
  { id: 'm8', projectId: 'p4', name: 'نورة القحطاني', email: 'noura@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm9', projectId: 'p4', name: 'فهد الدوسري', email: 'fahad@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 1500, status: 'active' },
  { id: 'm10', projectId: 'p5', name: 'د. ليلى الحربي', email: 'laila@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm11', projectId: 'p5', name: 'عبدالله الشمري', email: 'abdullah@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 2400, status: 'active' },
  { id: 'm12', projectId: 'p5', name: 'هند المطيري', email: 'hind@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 600, status: 'active' },
  { id: 'm13', projectId: 'p6', name: 'محمد العمري', email: 'mohammed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm14', projectId: 'p6', name: 'منى العمري', email: 'mona@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 0, status: 'active' },
  // مشروع المنزل (كان بلا أعضاء)
  { id: 'm15', projectId: 'p2', name: 'محمد العمري', email: 'mohammed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm16', projectId: 'p2', name: 'منى العمري', email: 'mona@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 0, status: 'active' },
  // مزرعة الخير
  { id: 'm17', projectId: 'p7', name: 'سعد الزهراني', email: 'saad@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm18', projectId: 'p7', name: 'فيصل العتيبي', email: 'faisal@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 1800, status: 'active' },
  { id: 'm19', projectId: 'p7', name: 'تركي الغامدي', email: 'turki@example.com', role: 'viewer', permissions: ROLE_PERMS.viewer, balance: 0, status: 'invited' },
  // صالون لمسات
  { id: 'm20', projectId: 'p8', name: 'لمياء السالم', email: 'lamia@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm21', projectId: 'p8', name: 'دانة الحربي', email: 'dana@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 700, status: 'active' },
  // ورشة الإتقان
  { id: 'm22', projectId: 'p9', name: 'ماجد الشهري', email: 'majed@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm23', projectId: 'p9', name: 'بدر القرني', email: 'badr@example.com', role: 'member', permissions: ROLE_PERMS.member, balance: 950, status: 'active' },
  // مقهى الركن
  { id: 'm24', projectId: 'p10', name: 'ريان الدوسري', email: 'rayan@example.com', role: 'owner', permissions: ROLE_PERMS.owner, balance: 0, status: 'active' },
  { id: 'm25', projectId: 'p10', name: 'نوف الشمري', email: 'nouf@example.com', role: 'manager', permissions: ROLE_PERMS.manager, balance: 1200, status: 'active' },
]

export const INITIAL_MEMBER_TXNS: MemberTxn[] = [
  { id: 'mt1', projectId: 'p1', memberId: 'm2', type: 'custody', amount: 5000, note: 'عهدة مصاريف تشغيلية', date: '2025-06-15', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt2', projectId: 'p1', memberId: 'm3', type: 'custody', amount: 1200, note: 'عهدة نثرية', date: '2025-06-18', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt3', projectId: 'p1', memberId: 'm3', type: 'custody', amount: 2000, note: 'عهدة إضافية بانتظار القبول', date: '2025-06-22', status: 'pending', direction: 'to_member', createdBy: 'سارة المحمد' },
  { id: 'mt4', projectId: 'p1', memberId: 'm4', type: 'expense', amount: 950, note: 'تعويض مصروف وقود', date: '2025-06-20', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt5', projectId: 'p1', memberId: 'm2', type: 'settlement', amount: 1800, note: 'إرجاع جزء من العهدة', date: '2025-06-23', status: 'pending', direction: 'from_member', createdBy: 'سارة المحمد' },
  { id: 'mt6', projectId: 'p3', memberId: 'm6', type: 'custody', amount: 800, note: 'عهدة مشتريات يومية', date: '2025-06-19', status: 'accepted', direction: 'to_member', createdBy: 'محمد الزيد' },
  { id: 'mt7', projectId: 'p4', memberId: 'm9', type: 'custody', amount: 1500, note: 'عهدة تغليف وشحن', date: '2025-06-21', status: 'accepted', direction: 'to_member', createdBy: 'نورة القحطاني' },
  { id: 'mt8', projectId: 'p5', memberId: 'm11', type: 'custody', amount: 2400, note: 'عهدة مستلزمات', date: '2025-06-18', status: 'accepted', direction: 'to_member', createdBy: 'د. ليلى الحربي' },
  { id: 'mt9', projectId: 'p5', memberId: 'm12', type: 'expense', amount: 600, note: 'تعويض مواصلات', date: '2025-06-22', status: 'pending', direction: 'to_member', createdBy: 'عبدالله الشمري' },
  { id: 'mt10', projectId: 'p1', memberId: 'm3', type: 'bonus', amount: 1500, note: 'مكافأة أداء', date: '2025-06-24', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt11', projectId: 'p1', memberId: 'm4', type: 'advance', amount: 3000, note: 'سلفة على الراتب', date: '2025-06-20', status: 'accepted', direction: 'to_member', createdBy: 'محمد العمري' },
  { id: 'mt12', projectId: 'p5', memberId: 'm11', type: 'salary', amount: 8000, note: 'راتب يونيو', date: '2025-06-25', status: 'accepted', direction: 'to_member', createdBy: 'عبدالله الشمري' },
  { id: 'mt13', projectId: 'p1', memberId: 'm3', type: 'supply', amount: 4500, note: 'توريد تحصيل مبيعات', date: '2025-06-26', status: 'accepted', direction: 'from_member', createdBy: 'أحمد العلي' },
  { id: 'mt14', projectId: 'p3', memberId: 'm7', type: 'deduction', amount: 200, note: 'خصم نقص في الصندوق', date: '2025-06-24', status: 'pending', direction: 'from_member', createdBy: 'محمد الزيد' },
  { id: 'mt15', projectId: 'p7', memberId: 'm18', type: 'custody', amount: 1800, note: 'عهدة مشتريات زراعية', date: '2025-06-12', status: 'accepted', direction: 'to_member', createdBy: 'سعد الزهراني' },
  { id: 'mt16', projectId: 'p8', memberId: 'm21', type: 'custody', amount: 700, note: 'عهدة مستلزمات', date: '2025-06-15', status: 'accepted', direction: 'to_member', createdBy: 'لمياء السالم' },
  { id: 'mt17', projectId: 'p9', memberId: 'm23', type: 'custody', amount: 950, note: 'عهدة قطع غيار', date: '2025-06-16', status: 'pending', direction: 'to_member', createdBy: 'ماجد الشهري' },
  { id: 'mt18', projectId: 'p10', memberId: 'm25', type: 'supply', amount: 3000, note: 'توريد مبيعات اليوم', date: '2025-06-22', status: 'accepted', direction: 'from_member', createdBy: 'نوف الشمري' },
]

export const INITIAL_RECEIVABLES: Receivable[] = [
  { id: 'rc1', projectId: 'p1', kind: 'receivable', party: 'مجموعة الرواد', amount: 18000, dueDate: '2025-07-15', date: '2025-06-10', status: 'partial', payments: [{ id: 'pm1', amount: 8000, date: '2025-06-20', note: 'دفعة أولى', createdBy: 'محمد العمري' }], note: 'فاتورة مبيعات آجلة', createdBy: 'محمد العمري' },
  { id: 'rc2', projectId: 'p1', kind: 'receivable', memberId: 'm3', party: 'أحمد العلي (مندوب مبيعات)', amount: 4500, dueDate: '2025-07-01', date: '2025-06-18', status: 'open', payments: [], note: 'مبالغ حصّلها المندوب ولم تورّد بعد', createdBy: 'سارة المحمد' },
  { id: 'rc3', projectId: 'p4', kind: 'receivable', party: 'عميل التجزئة - طلب #482', amount: 3200, dueDate: '2025-07-05', date: '2025-06-21', status: 'open', payments: [], note: 'طلب بالأجل', createdBy: 'نورة القحطاني' },
  { id: 'rc4', projectId: 'p1', kind: 'payable', party: 'مورد المعدات المكتبية', amount: 9500, dueDate: '2025-07-10', date: '2025-06-12', status: 'open', payments: [], note: 'فاتورة توريد آجلة', createdBy: 'محمد العمري' },
  { id: 'rc5', projectId: 'p3', kind: 'payable', party: 'سوق الخضار المركزي', amount: 6200, dueDate: '2025-06-30', date: '2025-06-17', status: 'partial', payments: [{ id: 'pm2', amount: 3000, date: '2025-06-22', createdBy: 'محمد الزيد' }], note: 'مستحقات مواد خام', createdBy: 'محمد الزيد' },
  { id: 'rc6', projectId: 'p5', kind: 'payable', memberId: 'm11', party: 'عبدالله الشمري (مندوب مشتريات)', amount: 2400, dueDate: '2025-07-08', date: '2025-06-18', status: 'open', payments: [], note: 'مبالغ صرفها المندوب تُستحق له', createdBy: 'د. ليلى الحربي' },
  { id: 'rc7', projectId: 'p1', kind: 'receivable', party: 'عميل التجزئة - طلب #501', amount: 5000, dueDate: '2025-06-15', date: '2025-05-20', status: 'settled', payments: [{ id: 'pm3', amount: 5000, date: '2025-06-14', note: 'سداد كامل', createdBy: 'محمد العمري' }], note: 'مسددة بالكامل', createdBy: 'محمد العمري' },
  { id: 'rc8', projectId: 'p4', kind: 'payable', party: 'شركة الشحن السريع', amount: 7800, dueDate: '2025-06-20', date: '2025-06-05', status: 'open', payments: [], note: 'متأخرة السداد', createdBy: 'نورة القحطاني' },
  { id: 'rc9', projectId: 'p7', kind: 'receivable', party: 'سوق الجملة المركزي', amount: 14000, dueDate: '2025-07-20', date: '2025-06-18', status: 'partial', payments: [{ id: 'pm4', amount: 6000, date: '2025-06-25', createdBy: 'سعد الزهراني' }], note: 'بيع محصول بالآجل', createdBy: 'سعد الزهراني' },
  { id: 'rc10', projectId: 'p9', kind: 'payable', party: 'مستودع قطع الغيار', amount: 5200, dueDate: '2025-07-05', date: '2025-06-14', status: 'open', payments: [], createdBy: 'بدر القرني' },
  { id: 'rc11', projectId: 'p8', kind: 'receivable', party: 'عميلة باقة شهرية', amount: 1800, dueDate: '2025-07-10', date: '2025-06-22', status: 'open', payments: [], createdBy: 'دانة الحربي' },
]

export const INITIAL_COMMITMENTS: Commitment[] = [
  { id: 'cm1', projectId: 'p2', kind: 'installment', direction: 'out', name: 'قسط السيارة', party: 'بنك التمويل', amount: 2200, freq: 'monthly', startDate: '2025-01-05', totalCount: 36, paidCount: 5, nextDue: '2025-07-05', active: true, payments: [], note: 'قسط شهري لمدة 3 سنوات', createdBy: 'محمد العمري' },
  { id: 'cm2', projectId: 'p1', kind: 'installment', direction: 'out', name: 'قسط معدات الإنتاج', party: 'شركة المعدات', amount: 4500, freq: 'monthly', startDate: '2025-03-10', totalCount: 12, paidCount: 3, nextDue: '2025-07-10', active: true, payments: [], createdBy: 'محمد العمري' },
  { id: 'cm3', projectId: 'p1', kind: 'obligation', direction: 'out', name: 'إيجار المكتب', party: 'مالك العقار', amount: 8500, freq: 'monthly', startDate: '2025-01-01', paidCount: 5, nextDue: '2025-07-01', active: true, payments: [], note: 'إيجار شهري', createdBy: 'محمد العمري' },
  { id: 'cm4', projectId: 'p5', kind: 'obligation', direction: 'out', name: 'رواتب الكادر الطبي', party: 'الموظفون', amount: 42000, freq: 'monthly', startDate: '2025-01-28', paidCount: 5, nextDue: '2025-06-28', active: true, payments: [], createdBy: 'د. ليلى الحربي' },
  { id: 'cm5', projectId: 'p4', kind: 'obligation', direction: 'in', name: 'عقد توريد شهري', party: 'عميل الجملة', amount: 12000, freq: 'monthly', startDate: '2025-02-15', paidCount: 4, nextDue: '2025-07-15', active: true, payments: [], note: 'دخل دوري من عقد', createdBy: 'نورة القحطاني' },
  { id: 'cm6', projectId: 'p1', kind: 'subscription', direction: 'out', name: 'اشتراك Adobe', party: 'Adobe', amount: 240, freq: 'monthly', startDate: '2025-01-08', paidCount: 5, nextDue: '2025-07-08', active: true, payments: [], createdBy: 'أحمد العلي' },
  { id: 'cm7', projectId: 'p4', kind: 'subscription', direction: 'out', name: 'اشتراك منصة سلة', party: 'سلة', amount: 1200, freq: 'monthly', startDate: '2025-01-10', paidCount: 5, nextDue: '2025-07-10', active: true, payments: [], createdBy: 'فهد الدوسري' },
  { id: 'cm8', projectId: 'p5', kind: 'subscription', direction: 'out', name: 'نظام الحجوزات', party: 'مزوّد النظام', amount: 800, freq: 'yearly', startDate: '2024-10-24', paidCount: 1, nextDue: '2025-10-24', active: true, payments: [], createdBy: 'عبدالله الشمري' },
  { id: 'cm9', projectId: 'p3', kind: 'obligation', direction: 'out', name: 'أجور عمالة أسبوعية', party: 'مكتب التوظيف', amount: 1800, freq: 'weekly', startDate: '2025-06-02', paidCount: 3, nextDue: '2025-06-30', active: true, payments: [], note: 'تُدفع كل أسبوع', createdBy: 'محمد الزيد' },
  { id: 'cm10', projectId: 'p1', kind: 'subscription', direction: 'out', name: 'ترخيص برنامج محاسبة', party: 'مزوّد البرمجيات', amount: 2400, freq: 'quarterly', startDate: '2025-04-15', paidCount: 1, nextDue: '2025-07-15', active: true, payments: [], createdBy: 'أحمد العلي' },
  { id: 'cm11', projectId: 'p2', kind: 'installment', direction: 'out', name: 'قسط أثاث المنزل', party: 'معرض الديار', amount: 1200, freq: 'monthly', startDate: '2025-02-10', totalCount: 10, paidCount: 4, nextDue: '2025-07-10', active: true, payments: [], createdBy: 'محمد العمري' },
  { id: 'cm12', projectId: 'p6', kind: 'obligation', direction: 'out', name: 'اشتراك نادي رياضي (موقوف)', party: 'النادي', amount: 300, freq: 'monthly', startDate: '2025-01-01', paidCount: 5, nextDue: '2025-07-01', active: false, payments: [], note: 'موقوف مؤقتاً', createdBy: 'منى العمري' },
  { id: 'cm13', projectId: 'p7', kind: 'installment', direction: 'out', name: 'قسط الجرّار الزراعي', party: 'شركة التمويل الزراعي', amount: 3200, freq: 'monthly', startDate: '2024-09-01', totalCount: 24, paidCount: 9, nextDue: '2025-07-01', active: true, payments: [], createdBy: 'سعد الزهراني' },
  { id: 'cm14', projectId: 'p10', kind: 'obligation', direction: 'out', name: 'إيجار المقهى', party: 'مالك العقار', amount: 7000, freq: 'monthly', startDate: '2025-01-01', paidCount: 5, nextDue: '2025-07-01', active: true, payments: [], createdBy: 'ريان الدوسري' },
  { id: 'cm15', projectId: 'p8', kind: 'subscription', direction: 'out', name: 'اشتراك نظام الحجوزات', party: 'مزوّد النظام', amount: 350, freq: 'monthly', startDate: '2025-02-01', paidCount: 4, nextDue: '2025-07-01', active: true, payments: [], createdBy: 'لمياء السالم' },
]

export const INITIAL_SURVEYS: Survey[] = [
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
  {
    id: 'sv2', title: 'استبيان رضا الموظفين — الربع الثاني', surveyType: 'employee', projectId: 'p1',
    status: 'active', createdAt: '2025-06-10',
    questions: [
      { id: 'q1', text: 'مدى رضاك عن بيئة العمل', kind: 'rating', required: true },
      { id: 'q2', text: 'هل تشعر بالتقدير في عملك؟', kind: 'yesno' },
      { id: 'q3', text: 'ما مدى ترشيحك للعمل هنا لصديق؟', kind: 'nps' },
      { id: 'q4', text: 'عدد سنوات خبرتك', kind: 'number' },
      { id: 'q5', text: 'ما الذي يحفّزك أكثر؟', kind: 'multi', options: ['الراتب', 'التطوّر المهني', 'بيئة العمل', 'المرونة', 'التقدير'] },
      { id: 'q6', text: 'اقتراحاتك للتحسين', kind: 'text' },
    ],
    respondents: [
      { id: 'rsp1', name: 'أحمد العلي', email: 'ahmad@example.com', source: 'member', responded: true },
      { id: 'rsp2', name: 'سارة المحمد', email: 'sara@example.com', source: 'member', responded: true },
      { id: 'rsp3', name: 'خالد السعد', email: 'khalid@example.com', source: 'member', responded: false },
      { id: 'rsp4', name: 'زائر خارجي', email: 'guest@example.com', source: 'excel', responded: true },
    ],
    responses: [
      { id: 'r1', respondentId: 'rsp1', answers: { q1: 4, q2: 'نعم', q3: 9, q4: 5, q5: ['الراتب', 'التطوّر المهني'], q6: 'بيئة عمل ممتازة' }, submittedAt: '2025-06-12', respondent: 'أحمد العلي' },
      { id: 'r2', respondentId: 'rsp2', answers: { q1: 5, q2: 'نعم', q3: 10, q4: 8, q5: ['التقدير', 'المرونة'], q6: '' }, submittedAt: '2025-06-13', respondent: 'سارة المحمد' },
      { id: 'r3', respondentId: 'rsp4', answers: { q1: 3, q2: 'لا', q3: 6, q4: 2, q5: ['الراتب'], q6: 'نحتاج مرونة أكثر في الدوام' }, submittedAt: '2025-06-14', respondent: 'زائر خارجي' },
    ],
  },
]

// قوالب جاهزة: 5 نماذج احترافية (نوع لكل) + 3 قوالب مبدئية بسيطة — كلها قابلة للتعديل/الحذف
export const INITIAL_TEMPLATES: DocTemplate[] = [
  buildProfessionalTemplate('quote', '2025-06-01'),
  buildProfessionalTemplate('invoice', '2025-06-01'),
  buildProfessionalTemplate('agreement', '2025-06-01'),
  buildProfessionalTemplate('payment_order', '2025-06-01'),
  buildProfessionalTemplate('official', '2025-06-01'),
  buildTemplate('عرض سعر افتراضي', 'quote', '2025-06-01'),
  buildTemplate('فاتورة فورية افتراضية', 'invoice', '2025-06-01'),
  buildTemplate('اتفاقية افتراضية', 'agreement', '2025-06-01'),
]
