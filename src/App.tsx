import { useState, useEffect } from 'react';

// ═══════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════
type Page = 'dashboard' | 'projects' | 'finance' | 'documents' | 'trackings' | 'requests' | 'notifications' | 'settings';
type TxType = 'income' | 'expense' | 'transfer';
type TrackingStatus = 'active' | 'expiring' | 'expired';
type RequestStatus = 'pending' | 'approved' | 'rejected';

type Project = { id: string; name: string; icon: string; balance: number; color: string };
type Transaction = { id: string; projectId: string; type: TxType; description: string; amount: number; category: string; date: string; hasDoc: boolean; note?: string; toProject?: string; transferDir?: 'out' | 'in'; linkId?: string };
type Tracking = { id: string; name: string; type: string; icon: string; status: TrackingStatus; daysLeft: number; expiryDate: string; projectId: string; note?: string };
type RequestItem = { id: string; title: string; amount: number; requestedBy: string; status: RequestStatus; date: string; type: string; projectId: string; note?: string };
type DocItem = { id: string; name: string; type: string; date: string; size: string; status: string; projectId: string; aiRead: boolean };
type Notif = { id: string; type: string; title: string; body: string; time: string; read: boolean };

// ═══════════════════════════════════════════
//  CONSTANTS (type options per module)
// ═══════════════════════════════════════════
const PROJECT_ICONS = ['🏢', '🏠', '🍽️', '🏪', '🚗', '💼', '🏭', '⚙️', '📦', '🌿'];
const PROJECT_COLORS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

const TX_TYPES: { id: TxType; label: string; icon: string }[] = [
  { id: 'income', label: 'إيراد', icon: '📈' },
  { id: 'expense', label: 'مصروف', icon: '📉' },
  { id: 'transfer', label: 'تحويل', icon: '🔄' },
];
const TX_CATEGORIES = ['مبيعات', 'رواتب', 'إيجار', 'فواتير', 'قسط', 'صيانة', 'تسويق', 'أخرى'];

const TRACKING_TYPES = [
  { id: 'ضمان', icon: '🛡️' },
  { id: 'عقد', icon: '📄' },
  { id: 'ترخيص', icon: '🏛️' },
  { id: 'اشتراك', icon: '💻' },
  { id: 'تأمين', icon: '🚗' },
  { id: 'وثيقة', icon: '🪪' },
];

const REQUEST_TYPES = ['مصروف', 'تحويل', 'عهدة', 'صيانة', 'شراء'];

const DOC_TYPES = ['فاتورة', 'عقد', 'كشف حساب', 'وثيقة رسمية', 'ملف عام'];

// ═══════════════════════════════════════════
//  MOCK DATA
// ═══════════════════════════════════════════
const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'شركة النخيل', icon: '🏢', balance: 284500, color: '#2563eb' },
  { id: 'p2', name: 'مشروع المنزل', icon: '🏠', balance: 52300, color: '#059669' },
  { id: 'p3', name: 'مطعم الديوانية', icon: '🍽️', balance: 118900, color: '#d97706' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', projectId: 'p1', type: 'income', description: 'إيراد مبيعات يونيو', amount: 48000, category: 'مبيعات', date: '2025-06-18', hasDoc: true },
  { id: 't2', projectId: 'p1', type: 'expense', description: 'رواتب الموظفين', amount: 21000, category: 'رواتب', date: '2025-06-15', hasDoc: true },
  { id: 't3', projectId: 'p1', type: 'expense', description: 'إيجار المكتب', amount: 8500, category: 'إيجار', date: '2025-06-01', hasDoc: false },
  { id: 't4', projectId: 'p1', type: 'income', description: 'عمولة مشروع', amount: 12000, category: 'مبيعات', date: '2025-06-10', hasDoc: true },
  { id: 't5', projectId: 'p1', type: 'expense', description: 'فاتورة كهرباء', amount: 1800, category: 'فواتير', date: '2025-06-05', hasDoc: true },
  { id: 't6', projectId: 'p2', type: 'expense', description: 'قسط السيارة', amount: 2200, category: 'قسط', date: '2025-06-20', hasDoc: false },
  { id: 't7', projectId: 'p3', type: 'income', description: 'مبيعات الأسبوع', amount: 32000, category: 'مبيعات', date: '2025-06-19', hasDoc: false },
];

const INITIAL_TRACKINGS: Tracking[] = [
  { id: 'tr1', name: 'ضمان ثلاجة المطبخ', type: 'ضمان', icon: '🧊', status: 'expiring', daysLeft: 12, expiryDate: '2025-07-06', projectId: 'p1' },
  { id: 'tr2', name: 'عقد إيجار المكتب', type: 'عقد', icon: '📄', status: 'active', daysLeft: 180, expiryDate: '2025-12-31', projectId: 'p1' },
  { id: 'tr3', name: 'رخصة السجل التجاري', type: 'ترخيص', icon: '🏛️', status: 'expiring', daysLeft: 25, expiryDate: '2025-07-19', projectId: 'p1' },
  { id: 'tr4', name: 'تأمين السيارة', type: 'تأمين', icon: '🚗', status: 'expired', daysLeft: -5, expiryDate: '2025-06-19', projectId: 'p2' },
  { id: 'tr5', name: 'اشتراك Adobe', type: 'اشتراك', icon: '💻', status: 'active', daysLeft: 45, expiryDate: '2025-08-08', projectId: 'p1' },
  { id: 'tr6', name: 'ضمان مكيف الاستقبال', type: 'ضمان', icon: '❄️', status: 'active', daysLeft: 240, expiryDate: '2026-02-20', projectId: 'p3' },
];

const INITIAL_REQUESTS: RequestItem[] = [
  { id: 'r1', title: 'طلب صرف مصروفات السفر', amount: 3200, requestedBy: 'أحمد العلي', status: 'pending', date: '2025-06-20', type: 'مصروف', projectId: 'p1' },
  { id: 'r2', title: 'تعزيز عهدة الصندوق', amount: 5000, requestedBy: 'سارة المحمد', status: 'pending', date: '2025-06-19', type: 'عهدة', projectId: 'p1' },
  { id: 'r3', title: 'شراء معدات مكتبية', amount: 8700, requestedBy: 'خالد السعد', status: 'approved', date: '2025-06-15', type: 'شراء', projectId: 'p1' },
  { id: 'r4', title: 'صيانة أجهزة المطبخ', amount: 1500, requestedBy: 'محمد الزيد', status: 'rejected', date: '2025-06-12', type: 'صيانة', projectId: 'p3' },
];

const INITIAL_DOCUMENTS: DocItem[] = [
  { id: 'd1', name: 'فاتورة مورد يونيو', type: 'فاتورة', date: '2025-06-18', size: '245 KB', status: 'processed', projectId: 'p1', aiRead: true },
  { id: 'd2', name: 'عقد الإيجار السنوي', type: 'عقد', date: '2025-01-01', size: '1.2 MB', status: 'processed', projectId: 'p1', aiRead: true },
  { id: 'd3', name: 'كشف حساب البنك', type: 'كشف حساب', date: '2025-06-01', size: '380 KB', status: 'pending', projectId: 'p1', aiRead: false },
  { id: 'd4', name: 'رخصة البلدية', type: 'وثيقة رسمية', date: '2024-07-15', size: '890 KB', status: 'processed', projectId: 'p1', aiRead: true },
];

const INITIAL_NOTIFS: Notif[] = [
  { id: 'n1', type: 'danger', title: 'تأمين السيارة منتهي', body: 'انتهى تأمين السيارة منذ 5 أيام. يرجى التجديد.', time: 'قبل ساعة', read: false },
  { id: 'n2', type: 'warning', title: 'ضمان يوشك على الانتهاء', body: 'ضمان ثلاجة المطبخ ينتهي خلال 12 يوم.', time: 'قبل 3 ساعات', read: false },
  { id: 'n3', type: 'info', title: 'طلب جديد بانتظار موافقتك', body: 'طلب صرف مصروفات السفر بمبلغ 3,200 ر.س.', time: 'أمس', read: false },
  { id: 'n4', type: 'success', title: 'تمت معالجة مستند', body: 'تمت قراءة فاتورة مورد يونيو بنجاح.', time: 'أمس', read: true },
];

// ═══════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════
const fmt = (n: number) => n.toLocaleString('ar-SA') + ' ر.س';
const fmtNum = (n: number) => n.toLocaleString('ar-SA');
const today = () => new Date().toISOString().slice(0, 10);
const uid = (p: string) => p + Math.random().toString(36).slice(2, 8);
const daysBetween = (iso: string) => Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
const statusFromDays = (d: number): TrackingStatus => d < 0 ? 'expired' : d <= 30 ? 'expiring' : 'active';

// ── localStorage-backed state (replaceable by a real DB later) ──
function usePersist<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore quota errors */ }
  }, [key, val]);
  return [val, setVal];
}

// ── computed balance: opening + income − expense ± transfers ──
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
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: 'نشط',              bg: '#dcfce7', color: '#15803d' },
    expiring:  { label: 'يوشك على الانتهاء', bg: '#fef9c3', color: '#a16207' },
    expired:   { label: 'منتهي',            bg: '#fee2e2', color: '#b91c1c' },
    pending:   { label: 'معلق',             bg: '#fef9c3', color: '#a16207' },
    approved:  { label: 'معتمد',            bg: '#dcfce7', color: '#15803d' },
    rejected:  { label: 'مرفوض',           bg: '#fee2e2', color: '#b91c1c' },
    processed: { label: 'تمت المعالجة',    bg: '#dbeafe', color: '#1d4ed8' },
  };
  const s = map[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f3f5', padding: 20, ...style }}>
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{subtitle}</p>}
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
    primary: { background: '#2563eb', color: '#fff' },
    outline: { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' },
    ghost:   { background: 'transparent', color: '#6b7280' },
    danger:  { background: '#fee2e2', color: '#b91c1c' },
    success: { background: '#dcfce7', color: '#15803d' },
  };
  return <button disabled={disabled} style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>{children}</button>;
}

// ─── Bottom Sheet (mobile-first modal) ───
function Sheet({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,17,23,.45)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'mzFade .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', width: '100%', maxWidth: 560, maxHeight: '92vh',
          borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column',
          animation: 'mzSlideUp .28s cubic-bezier(.16,1,.3,1)', boxShadow: '0 -8px 40px rgba(0,0,0,.18)',
        }}
      >
        {/* grabber */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#e5e7eb' }} />
        </div>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>{title}</div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 99, width: 30, height: 30, cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>✕</button>
        </div>
        {/* body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {/* footer */}
        {footer && <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Form field primitives ───
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb',
  fontFamily: 'inherit', fontSize: 14, color: '#111827', background: '#fff', boxSizing: 'border-box',
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
            border: `1.5px solid ${active ? '#2563eb' : '#e5e7eb'}`, background: active ? '#eff6ff' : '#fff',
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
//  SIDEBAR
// ═══════════════════════════════════════════
const NAV = [
  { id: 'dashboard',     icon: '◉',  label: 'الرئيسية' },
  { id: 'projects',      icon: '⬡',  label: 'المشاريع' },
  { id: 'finance',       icon: '◈',  label: 'الإدارة المالية' },
  { id: 'documents',     icon: '◻',  label: 'المستندات' },
  { id: 'trackings',     icon: '◷',  label: 'المتابعات والضمانات' },
  { id: 'requests',      icon: '◫',  label: 'الطلبات والموافقات' },
  { id: 'notifications', icon: '◌',  label: 'الإشعارات' },
  { id: 'settings',      icon: '◎',  label: 'الإعدادات' },
];

function Sidebar({ page, onNav, projects, projectId, onProject, unread }: {
  page: Page; onNav: (p: Page) => void; projects: Project[];
  projectId: string; onProject: (id: string) => void; unread: number;
}) {
  return (
    <aside style={{ width: 240, background: '#0f1117', display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1e2230' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, fontFamily: 'serif' }}>م</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>موازين</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>المنصة المالية الذكية</div>
          </div>
        </div>
      </div>

      {/* Project switcher */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #1e2230' }}>
        <div style={{ color: '#4b5563', fontSize: 11, padding: '0 8px', marginBottom: 6 }}>المشروع الحالي</div>
        {projects.map(p => (
          <button key={p.id} onClick={() => onProject(p.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'right', transition: 'background .15s',
            background: projectId === p.id ? '#1e2230' : 'transparent', marginBottom: 2,
          }}>
            <span style={{ fontSize: 16 }}>{p.icon}</span>
            <span style={{ color: projectId === p.id ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', flex: 1, textAlign: 'right' }}>{p.name}</span>
            {projectId === p.id && <span style={{ width: 6, height: 6, borderRadius: 99, background: '#3b82f6', flexShrink: 0 }} />}
          </button>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = page === item.id;
          const hasNotif = item.id === 'notifications' && unread > 0;
          return (
            <button key={item.id} onClick={() => onNav(item.id as Page)} style={{
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
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #1e2230' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>م</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>محمد العمري</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>مالك المشروع</div>
          </div>
        </div>
      </div>
    </aside>
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
                background: '#fff', borderRadius: 99, padding: '8px 16px 8px 8px', boxShadow: '0 4px 18px rgba(0,0,0,.16)',
                fontFamily: 'inherit', animation: `mzPop .28s cubic-bezier(.16,1,.3,1) ${i * 0.04}s both`,
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 99, background: a.bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{a.label}</span>
              </button>
            ))}
            {/* quick notifications shortcut */}
            <button onClick={() => { setOpen(false); onNav('notifications'); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer',
              background: '#fff', borderRadius: 99, padding: '8px 16px 8px 8px', boxShadow: '0 4px 18px rgba(0,0,0,.16)',
              fontFamily: 'inherit', animation: `mzPop .28s cubic-bezier(.16,1,.3,1) ${actions.length * 0.04}s both`,
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 99, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔔</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>الإشعارات{unread > 0 ? ` (${unread})` : ''}</span>
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
function Dashboard({ projectId, onNav, projects, transactions, trackings, requests, onDecide }: {
  projectId: string; onNav: (p: Page) => void;
  projects: Project[]; transactions: Transaction[]; trackings: Tracking[];
  requests: RequestItem[]; onDecide: (id: string, status: RequestStatus) => void;
}) {
  const project = projects.find(p => p.id === projectId)!;
  const txns = transactions.filter(t => t.projectId === projectId);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const urgentTrackings = trackings.filter(t => t.projectId === projectId && (t.status === 'expiring' || t.status === 'expired'));
  const pendingReqs = requests.filter(r => r.projectId === projectId && r.status === 'pending');

  const stats = [
    { label: 'الرصيد الكلي', value: fmt(computeBalance(project, transactions)), icon: '💰', bg: '#eff6ff', color: '#1d4ed8', trend: '+8%' },
    { label: 'إيرادات الشهر', value: fmt(income), icon: '📈', bg: '#f0fdf4', color: '#15803d', trend: '+12%' },
    { label: 'مصروفات الشهر', value: fmt(expense), icon: '📉', bg: '#fef2f2', color: '#b91c1c', trend: '-3%' },
    { label: 'صافي الشهر', value: fmt(income - expense), icon: '📊', bg: '#faf5ff', color: '#7e22ce', trend: '+22%' },
    { label: 'طلبات معلقة', value: String(pendingReqs.length), icon: '⏳', bg: '#fffbeb', color: '#a16207' },
    { label: 'تنبيهات متابعات', value: String(urgentTrackings.length), icon: '⚠️', bg: '#fff7ed', color: '#c2410c' },
  ];

  const monthlyData = [
    { month: 'يناير', income: 38000, expense: 24000 },
    { month: 'فبراير', income: 42000, expense: 27000 },
    { month: 'مارس', income: 35000, expense: 22000 },
    { month: 'أبريل', income: 51000, expense: 31000 },
    { month: 'مايو', income: 47000, expense: 29000 },
    { month: 'يونيو', income, expense },
  ];
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)), 1);

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <PageHeader title="لوحة التحكم" subtitle={`${project.name} — يونيو 2025`}
        action={<div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" size="sm" onClick={() => onNav('documents')}>+ رفع مستند</Btn>
          <Btn size="sm">📊 تقرير شهري</Btn>
        </div>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{s.value}</div>
                {s.trend && <div style={{ fontSize: 12, color: s.trend.startsWith('+') ? '#15803d' : '#b91c1c', marginTop: 4 }}>{s.trend} من الشهر الماضي</div>}
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
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
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
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{d.month.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>تنبيهات عاجلة</div>
            <button onClick={() => onNav('trackings')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {urgentTrackings.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>✅ لا توجد تنبيهات عاجلة</div>}
            {urgentTrackings.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: t.status === 'expired' ? '#fef2f2' : '#fffbeb' }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
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
            <button onClick={() => onNav('finance')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {txns.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>لا توجد عمليات في هذا المشروع</div>}
            {txns.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: t.type === 'income' ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                  {t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.date}</div>
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
            <button onClick={() => onNav('requests')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>عرض الكل</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingReqs.length === 0 && <div style={{ padding: '20px 12px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>لا توجد طلبات تنتظر موافقتك</div>}
            {pendingReqs.map(r => (
              <div key={r.id} style={{ padding: '12px 14px', background: '#fffbeb', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.title}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', flexShrink: 0 }}>{fmtNum(r.amount)}</div>
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>من: {r.requestedBy}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onDecide(r.id, 'approved')} style={{ flex: 1, padding: 6, borderRadius: 8, background: '#15803d', color: '#fff', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✓ موافقة</button>
                  <button onClick={() => onDecide(r.id, 'rejected')} style={{ flex: 1, padding: 6, borderRadius: 8, background: '#fee2e2', color: '#b91c1c', border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
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
function ProjectForm({ initial, onSave, onCancel }: {
  initial?: Project; onSave: (p: Omit<Project, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? PROJECT_ICONS[0]);
  const [color, setColor] = useState(initial?.color ?? PROJECT_COLORS[0]);
  const [balance, setBalance] = useState<number | ''>(initial?.balance ?? '');
  const valid = name.trim().length > 0;

  return (
    <>
      <Field label="اسم المشروع">
        <TextInput value={name} onChange={setName} placeholder="مثال: شركة النخيل" />
      </Field>
      <Field label="الأيقونة">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PROJECT_ICONS.map(ic => (
            <button key={ic} onClick={() => setIcon(ic)} style={{
              width: 44, height: 44, borderRadius: 10, fontSize: 20, cursor: 'pointer',
              border: `1.5px solid ${icon === ic ? '#2563eb' : '#e5e7eb'}`, background: icon === ic ? '#eff6ff' : '#fff',
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
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({ id: initial?.id, name: name.trim(), icon, color, balance: balance === '' ? 0 : balance })}>
          {initial ? 'حفظ التعديلات' : 'إنشاء المشروع'}
        </Btn>
      </div>
    </>
  );
}

function Projects({ projects, transactions, onOpen, onSave, onDelete }: {
  projects: Project[]; transactions: Transaction[];
  onOpen: (id: string) => void;
  onSave: (p: Omit<Project, 'id'> & { id?: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [sheet, setSheet] = useState<null | { mode: 'create' } | { mode: 'edit' | 'view'; project: Project }>(null);
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader title="المشاريع" action={<Btn size="sm" onClick={() => setSheet({ mode: 'create' })}>+ مشروع جديد</Btn>} />
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
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>مشروع نشط</div>
                </div>
                <button onClick={() => setSheet({ mode: 'view', project: p })} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, color: '#6b7280' }}>⋯</button>
              </div>
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>الرصيد الحالي</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{fmt(computeBalance(p, transactions))}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#15803d' }}>إيرادات</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{fmtNum(income)}</div>
                </div>
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#b91c1c' }}>مصروفات</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c' }}>{fmtNum(expense)}</div>
                </div>
              </div>
              <Btn variant="outline" size="sm" style={{ width: '100%' }} onClick={() => onOpen(p.id)}>عرض المشروع</Btn>
            </Card>
          );
        })}
        <div onClick={() => setSheet({ mode: 'create' })} style={{ border: '2px dashed #e5e7eb', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 200, color: '#9ca3af' }}>
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
            <Btn style={{ flex: 1 }} onClick={() => { onOpen(sheet.project.id); close(); }}>فتح المالية</Btn>
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
                  <div style={{ fontSize: 13, color: '#6b7280' }}>الرصيد: {fmt(computeBalance(p, transactions))}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[['إيرادات', income, '#15803d'], ['مصروفات', expense, '#b91c1c'], ['عدد العمليات', txns.length, '#1d4ed8']].map(([l, v, c]) => (
                  <div key={l as string} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c as string }}>{typeof v === 'number' && (l === 'عدد العمليات') ? v : fmtNum(v as number)}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{l}</div>
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
//  FINANCE  (create / view / edit transaction by type)
// ═══════════════════════════════════════════
function TxForm({ initial, projectId, projects, onSave, onCancel }: {
  initial?: Transaction; projectId: string; projects: Project[];
  onSave: (t: Omit<Transaction, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'expense');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState<number | ''>(initial?.amount ?? '');
  const [category, setCategory] = useState(initial?.category ?? TX_CATEGORIES[0]);
  const [date, setDate] = useState(initial?.date ?? today());
  const [toProject, setToProject] = useState(initial?.toProject ?? projects.find(p => p.id !== projectId)?.id ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const valid = description.trim().length > 0 && amount !== '' && Number(amount) > 0;

  return (
    <>
      <Field label="نوع العملية">
        <TypePicker value={type} onChange={v => setType(v as TxType)} options={TX_TYPES.map(t => ({ v: t.id, l: t.label, icon: t.icon }))} />
      </Field>
      <Field label="الوصف">
        <TextInput value={description} onChange={setDescription} placeholder={type === 'income' ? 'مثال: إيراد مبيعات' : type === 'expense' ? 'مثال: فاتورة كهرباء' : 'مثال: تحويل بين الحسابات'} />
      </Field>
      <Field label="المبلغ (ر.س)">
        <NumInput value={amount} onChange={setAmount} placeholder="0" />
      </Field>
      {type === 'transfer' ? (
        <Field label="إلى مشروع">
          <Select value={toProject} onChange={setToProject} options={projects.filter(p => p.id !== projectId).map(p => ({ v: p.id, l: p.name }))} />
        </Field>
      ) : (
        <Field label="التصنيف">
          <Select value={category} onChange={setCategory} options={TX_CATEGORIES.map(c => ({ v: c, l: c }))} />
        </Field>
      )}
      <Field label="التاريخ">
        <TextInput type="date" value={date} onChange={setDate} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="أي تفاصيل إضافية..." />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, projectId, type, description: description.trim(),
          amount: amount === '' ? 0 : amount, category: type === 'transfer' ? 'تحويل' : category,
          date, hasDoc: initial?.hasDoc ?? false, note, toProject: type === 'transfer' ? toProject : undefined,
        })}>{initial ? 'حفظ التعديلات' : 'إضافة العملية'}</Btn>
      </div>
    </>
  );
}

function Finance({ projectId, projects, transactions, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate }: {
  projectId: string; projects: Project[]; transactions: Transaction[];
  onSave: (t: Omit<Transaction, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void;
}) {
  const [tab, setTab] = useState<'all' | TxType>('all');
  const [sheet, setSheet] = useState<null | { mode: 'edit' | 'view'; tx: Transaction }>(null);
  const project = projects.find(p => p.id === projectId)!;
  const txns = transactions.filter(t => t.projectId === projectId);
  const filtered = tab === 'all' ? txns : txns.filter(t => t.type === tab);
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader title="الإدارة المالية" subtitle={project.name}
        action={<div style={{ display: 'flex', gap: 8 }}><Btn variant="outline" size="sm">📥 تصدير</Btn><Btn size="sm" onClick={onOpenCreate}>+ عملية جديدة</Btn></div>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'إجمالي الإيرادات', val: income, color: '#15803d', bg: '#f0fdf4', icon: '📈' },
          { label: 'إجمالي المصروفات', val: expense, color: '#b91c1c', bg: '#fef2f2', icon: '📉' },
          { label: 'صافي الربح', val: income - expense, color: '#1d4ed8', bg: '#eff6ff', icon: '💰' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>{s.icon}</span>
            <div><div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div><div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{fmt(s.val)}</div></div>
          </div>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 4, padding: 16, background: '#f9fafb', borderBottom: '1px solid #f1f3f5', flexWrap: 'wrap' }}>
          {[['all', 'الكل'], ['income', 'إيرادات'], ['expense', 'مصروفات'], ['transfer', 'تحويلات']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val as any)} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              background: tab === val ? '#fff' : 'transparent', color: tab === val ? '#111827' : '#6b7280',
              boxShadow: tab === val ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['الوصف', 'التصنيف', 'التاريخ', 'المستند', 'المبلغ'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: '#6b7280', borderBottom: '1px solid #f1f3f5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>لا توجد عمليات مطابقة</td></tr>}
              {filtered.map(t => (
                <tr key={t.id} onClick={() => setSheet({ mode: 'view', tx: t })} style={{ cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: t.type === 'income' ? '#f0fdf4' : t.type === 'expense' ? '#fef2f2' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                        {t.type === 'income' ? '↑' : t.type === 'expense' ? '↓' : '↔'}
                      </div>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{t.description}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{t.category}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{t.date}</td>
                  <td style={{ padding: '12px 16px' }}>{t.hasDoc ? <span style={{ color: '#2563eb', fontSize: 12 }}>📎 مرفق</span> : <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: t.type === 'income' ? '#15803d' : t.type === 'expense' ? '#b91c1c' : '#1d4ed8' }}>
                    {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : t.transferDir === 'in' ? '+' : '-'}{fmtNum(t.amount)} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="عملية جديدة">
        <TxForm projectId={projectId} projects={projects} onSave={(t) => { onSave(t); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={() => setSheet(null)} title="تعديل العملية">
        {sheet?.mode === 'edit' && (
          <TxForm key={sheet.tx.id} initial={sheet.tx} projectId={projectId} projects={projects}
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
            ['التاريخ', t.date],
            ...(t.toProject ? [['إلى مشروع', projects.find(p => p.id === t.toProject)?.name ?? '—'] as [string, string]] : []),
            ['المستند', t.hasDoc ? '✅ مرفق' : '❌ غير مرفق'],
            ...(t.note ? [['ملاحظات', t.note] as [string, string]] : []),
          ];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 10, borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ color: '#9ca3af', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#374151', textAlign: 'left' }}>{v}</span>
                </div>
              ))}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
// ═══════════════════════════════════════════
//  DOCUMENTS  (upload by type / actions / view / edit)
// ═══════════════════════════════════════════
function DocForm({ initial, projectId, onSave, onCancel }: {
  initial?: DocItem; projectId: string;
  onSave: (d: Omit<DocItem, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? DOC_TYPES[0]);
  const [date, setDate] = useState(initial?.date ?? today());
  const valid = name.trim().length > 0;

  return (
    <>
      {!initial && (
        <div style={{ border: '2px dashed #e5e7eb', borderRadius: 14, padding: '24px 16px', textAlign: 'center', marginBottom: 18, background: '#fafafa' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>☁️</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>اسحب الملف هنا أو اضغط للاختيار</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>PDF, JPG, PNG — حد أقصى 10MB</div>
        </div>
      )}
      <Field label="نوع المستند">
        <TypePicker value={type} onChange={setType} options={DOC_TYPES.map(t => ({ v: t, l: t }))} />
      </Field>
      <Field label="اسم المستند">
        <TextInput value={name} onChange={setName} placeholder="مثال: فاتورة مورد يونيو" />
      </Field>
      <Field label="تاريخ المستند">
        <TextInput type="date" value={date} onChange={setDate} />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, name: name.trim(), type, date,
          size: initial?.size ?? Math.round(100 + Math.random() * 900) + ' KB',
          status: initial?.status ?? 'pending', projectId, aiRead: initial?.aiRead ?? false,
        })}>{initial ? 'حفظ التعديلات' : 'رفع المستند'}</Btn>
      </div>
    </>
  );
}

function Documents({ projectId, projects, documents, onSave, onDelete, onAction, openCreate, onOpenCreate, onCloseCreate }: {
  projectId: string; projects: Project[]; documents: DocItem[];
  onSave: (d: Omit<DocItem, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  onAction: (action: 'tx' | 'tracking', doc: DocItem) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void;
}) {
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit' | 'actions'; doc: DocItem }>(null);
  const docs = documents.filter(d => d.projectId === projectId);
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader title="المستندات" subtitle="رفع وإدارة المستندات" action={<Btn size="sm" onClick={onOpenCreate}>+ رفع مستند</Btn>} />

      <div onClick={onOpenCreate} style={{ border: '2px dashed #e5e7eb', borderRadius: 16, padding: '32px 20px', textAlign: 'center', marginBottom: 24, background: '#fafafa', cursor: 'pointer' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>☁️</div>
        <div style={{ fontWeight: 500, color: '#374151', marginBottom: 4 }}>اسحب المستندات هنا أو اضغط للرفع</div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>PDF, JPG, PNG — حد أقصى 10MB</div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', borderRadius: 14, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #ddd6fe' }}>
        <span style={{ fontSize: 24 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 600, color: '#4c1d95', fontSize: 14 }}>الذكاء الاصطناعي جاهز لقراءة مستنداتك</div>
          <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 2 }}>ارفع فاتورة أو عقد وسيستخرج البيانات تلقائياً</div>
        </div>
      </div>

      {docs.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
          <div style={{ fontSize: 14 }}>لا توجد مستندات في هذا المشروع</div>
        </Card>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {docs.map(d => (
          <Card key={d.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 48, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📄</div>
              {d.aiRead && <span style={{ fontSize: 10, background: '#f5f3ff', color: '#7c3aed', padding: '2px 7px', borderRadius: 99, fontWeight: 500 }}>✨ AI</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>{d.type} · {d.size}</div>
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
        <DocForm projectId={projectId} onSave={(d) => { onSave(d); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل المستند">
        {sheet?.mode === 'edit' && <DocForm key={sheet.doc.id} initial={sheet.doc} projectId={projectId} onSave={(d) => { onSave(d); close(); }} onCancel={close} />}
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
          return (
            <>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 18, textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 48 }}>📄</div>
                <div style={{ fontWeight: 600, marginTop: 8 }}>{d.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['النوع', d.type], ['التاريخ', d.date], ['الحجم', d.size], ['الحالة', d.status === 'processed' ? 'تمت المعالجة' : 'قيد الانتظار'], ['قراءة AI', d.aiRead ? 'تمت ✅' : 'لم تتم ❌']].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingBottom: 9, borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ color: '#9ca3af' }}>{k}</span><span style={{ fontWeight: 500, color: '#374151' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </Sheet>

      {/* Actions */}
      <Sheet open={sheet?.mode === 'actions'} onClose={close} title="إجراءات على المستند">
        {sheet?.mode === 'actions' && (() => {
          const d = sheet.doc;
          const items = [
            { icon: '🤖', label: 'تحليل بالذكاء الاصطناعي', desc: 'استخراج البيانات تلقائياً', onClick: () => { onSave({ ...d, aiRead: true, status: 'processed' }); close(); } },
            { icon: '💸', label: 'إنشاء عملية مالية', desc: 'تحويل الفاتورة إلى مصروف/إيراد', onClick: () => { onAction('tx', d); close(); } },
            { icon: '🛡️', label: 'إضافة عنصر متابعة', desc: 'إنشاء ضمان أو عقد من المستند', onClick: () => { onAction('tracking', d); close(); } },
            { icon: '📥', label: 'تنزيل المستند', desc: 'حفظ نسخة على جهازك', onClick: close },
          ];
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>📄 {d.name}</div>
              {items.map(it => (
                <button key={it.label} onClick={it.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12,
                  border: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer', textAlign: 'right', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: 22 }}>{it.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{it.label}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{it.desc}</div>
                  </div>
                  <span style={{ color: '#d1d5db' }}>‹</span>
                </button>
              ))}
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}
// ═══════════════════════════════════════════
//  TRACKINGS  (add by type / view / edit)
// ═══════════════════════════════════════════
function TrackingForm({ initial, projectId, onSave, onCancel }: {
  initial?: Tracking; projectId: string;
  onSave: (t: Omit<Tracking, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState(initial?.type ?? TRACKING_TYPES[0].id);
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const valid = name.trim().length > 0 && expiryDate.length > 0;
  const typeIcon = TRACKING_TYPES.find(t => t.id === type)?.icon ?? '🛡️';

  return (
    <>
      <Field label="نوع المتابعة">
        <TypePicker value={type} onChange={setType} options={TRACKING_TYPES.map(t => ({ v: t.id, l: t.id, icon: t.icon }))} />
      </Field>
      <Field label="الاسم">
        <TextInput value={name} onChange={setName} placeholder="مثال: ضمان الثلاجة" />
      </Field>
      <Field label="تاريخ الانتهاء">
        <TextInput type="date" value={expiryDate} onChange={setExpiryDate} />
      </Field>
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="رقم الضمان، الجهة، تفاصيل..." />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => {
          const d = daysBetween(expiryDate);
          onSave({ id: initial?.id, name: name.trim(), type, icon: initial?.icon ?? typeIcon, status: statusFromDays(d), daysLeft: d, expiryDate, projectId, note });
        }}>{initial ? 'حفظ التعديلات' : 'إضافة المتابعة'}</Btn>
      </div>
    </>
  );
}

function Trackings({ projectId, trackings, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate, presetName, presetType }: {
  projectId: string; trackings: Tracking[];
  onSave: (t: Omit<Tracking, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void; presetName?: string; presetType?: string;
}) {
  const [filter, setFilter] = useState<'all' | TrackingStatus>('all');
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit'; tr: Tracking }>(null);
  const all = trackings.filter(t => t.projectId === projectId);
  const filtered = filter === 'all' ? all : all.filter(t => t.status === filter);
  const counts = {
    all: all.length,
    active: all.filter(t => t.status === 'active').length,
    expiring: all.filter(t => t.status === 'expiring').length,
    expired: all.filter(t => t.status === 'expired').length,
  };
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <PageHeader title="المتابعات والضمانات" subtitle="إدارة العقود والأصول والوثائق" action={<Btn size="sm" onClick={onOpenCreate}>+ إضافة متابعة</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { key: 'all', label: 'الكل', val: counts.all, color: '#6b7280', bg: '#f9fafb' },
          { key: 'active', label: 'نشط', val: counts.active, color: '#15803d', bg: '#f0fdf4' },
          { key: 'expiring', label: 'يوشك على الانتهاء', val: counts.expiring, color: '#a16207', bg: '#fffbeb' },
          { key: 'expired', label: 'منتهي', val: counts.expired, color: '#b91c1c', bg: '#fef2f2' },
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

      {filtered.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
          <div style={{ fontSize: 14 }}>لا توجد متابعات مطابقة</div>
        </Card>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {filtered.map(t => {
          const pct = t.status === 'expired' ? 0 : Math.min(100, Math.max(2, Math.round((t.daysLeft / 365) * 100)));
          const barColor = t.status === 'expired' ? '#ef4444' : t.status === 'expiring' ? '#f59e0b' : '#22c55e';
          return (
            <Card key={t.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.type}</div>
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
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
        <TrackingForm key={presetName ?? 'new'} projectId={projectId}
          initial={presetName ? { id: '', name: presetName, type: presetType ?? TRACKING_TYPES[0].id, icon: TRACKING_TYPES.find(x => x.id === presetType)?.icon ?? '🛡️', status: 'active', daysLeft: 0, expiryDate: '', projectId } : undefined}
          onSave={(t) => { onSave(t); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل المتابعة">
        {sheet?.mode === 'edit' && <TrackingForm key={sheet.tr.id} initial={sheet.tr} projectId={projectId} onSave={(t) => { onSave(t); close(); }} onCancel={close} />}
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
                <div><div style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div><div style={{ fontSize: 13, color: '#6b7280' }}>{t.type}</div></div>
                <div style={{ marginRight: 'auto' }}><StatusBadge status={t.status} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['تاريخ الانتهاء', t.expiryDate], ['المتبقي', t.status === 'expired' ? `منتهي منذ ${Math.abs(t.daysLeft)} يوم` : `${t.daysLeft} يوم`], ...(t.note ? [['ملاحظات', t.note]] : [])].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 9, borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ color: '#9ca3af', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 500, color: '#374151', textAlign: 'left' }}>{v}</span>
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
//  REQUESTS  (add by type / view / edit)
// ═══════════════════════════════════════════
function RequestForm({ initial, projectId, onSave, onCancel }: {
  initial?: RequestItem; projectId: string;
  onSave: (r: Omit<RequestItem, 'id'> & { id?: string }) => void; onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [type, setType] = useState(initial?.type ?? REQUEST_TYPES[0]);
  const [amount, setAmount] = useState<number | ''>(initial?.amount ?? '');
  const [requestedBy, setRequestedBy] = useState(initial?.requestedBy ?? 'محمد العمري');
  const [note, setNote] = useState(initial?.note ?? '');
  const valid = title.trim().length > 0 && amount !== '' && Number(amount) > 0;

  return (
    <>
      <Field label="نوع الطلب">
        <TypePicker value={type} onChange={setType} options={REQUEST_TYPES.map(t => ({ v: t, l: t }))} />
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
      <Field label="ملاحظات (اختياري)">
        <TextArea value={note} onChange={setNote} placeholder="مبرر الطلب أو تفاصيل..." />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" style={{ flex: 1 }} onClick={onCancel}>إلغاء</Btn>
        <Btn disabled={!valid} style={{ flex: 1 }} onClick={() => onSave({
          id: initial?.id, title: title.trim(), type, amount: amount === '' ? 0 : amount,
          requestedBy, status: initial?.status ?? 'pending', date: initial?.date ?? today(), projectId, note,
        })}>{initial ? 'حفظ التعديلات' : 'إرسال الطلب'}</Btn>
      </div>
    </>
  );
}

function Requests({ projectId, requests, onDecide, onSave, onDelete, openCreate, onOpenCreate, onCloseCreate }: {
  projectId: string; requests: RequestItem[];
  onDecide: (id: string, status: RequestStatus) => void;
  onSave: (r: Omit<RequestItem, 'id'> & { id?: string }) => void; onDelete: (id: string) => void;
  openCreate: boolean; onOpenCreate: () => void; onCloseCreate: () => void;
}) {
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [sheet, setSheet] = useState<null | { mode: 'view' | 'edit'; req: RequestItem }>(null);
  const reqs = requests.filter(r => r.projectId === projectId);
  const filtered = filter === 'all' ? reqs : reqs.filter(r => r.status === filter);
  const close = () => setSheet(null);

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <PageHeader title="الطلبات والموافقات" subtitle="إدارة دورة الاعتماد" action={<Btn size="sm" onClick={onOpenCreate}>+ طلب جديد</Btn>} />

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f3f4f6', padding: 4, borderRadius: 12, width: 'fit-content', flexWrap: 'wrap' }}>
        {[['all', 'الكل'], ['pending', 'معلقة'], ['approved', 'معتمدة'], ['rejected', 'مرفوضة']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as any)} style={{
            padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
            background: filter === val ? '#fff' : 'transparent', color: filter === val ? '#111827' : '#6b7280',
            boxShadow: filter === val ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <Card style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 14 }}>لا توجد طلبات مطابقة</div>
          </Card>
        )}
        {filtered.map(r => (
          <Card key={r.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSheet({ mode: 'view', req: r })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 99 }}>{r.type}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>طلب بواسطة: {r.requestedBy} · {r.date}</div>
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{fmtNum(r.amount)}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>ر.س</div>
              </div>
            </div>
            {r.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => onDecide(r.id, 'approved')} style={{ flex: 1, padding: 8, borderRadius: 10, background: '#15803d', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✓ اعتماد</button>
                <button onClick={() => onDecide(r.id, 'rejected')} style={{ flex: 1, padding: 8, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ رفض</button>
                <button onClick={() => setSheet({ mode: 'edit', req: r })} style={{ padding: '8px 16px', borderRadius: 10, background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✎ تعديل</button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create */}
      <Sheet open={openCreate} onClose={onCloseCreate} title="طلب جديد">
        <RequestForm projectId={projectId} onSave={(r) => { onSave(r); onCloseCreate(); }} onCancel={onCloseCreate} />
      </Sheet>

      {/* Edit */}
      <Sheet open={sheet?.mode === 'edit'} onClose={close} title="تعديل الطلب">
        {sheet?.mode === 'edit' && <RequestForm key={sheet.req.id} initial={sheet.req} projectId={projectId} onSave={(r) => { onSave(r); close(); }} onCancel={close} />}
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
                <span style={{ fontSize: 11, background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 99 }}>{r.type}</span>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8', marginBottom: 16 }}>{fmt(r.amount)}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['مقدّم الطلب', r.requestedBy], ['التاريخ', r.date], ...(r.note ? [['ملاحظات', r.note]] : [])].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, paddingBottom: 9, borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ color: '#9ca3af', flexShrink: 0 }}>{k}</span><span style={{ fontWeight: 500, color: '#374151', textAlign: 'left' }}>{v}</span>
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
//  NOTIFICATIONS
// ═══════════════════════════════════════════
function Notifications({ notifs, onMarkRead, onMarkAll }: { notifs: Notif[]; onMarkRead: (id: string) => void; onMarkAll: () => void }) {
  const icons: Record<string, string> = { warning: '⚠️', info: 'ℹ️', danger: '🔴', success: '✅' };
  const colors: Record<string, string> = { warning: '#fffbeb', info: '#eff6ff', danger: '#fef2f2', success: '#f0fdf4' };
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <PageHeader title="الإشعارات والتنبيهات" action={<Btn size="sm" variant="outline" onClick={onMarkAll}>✓ تعليم الكل كمقروء</Btn>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} onClick={() => onMarkRead(n.id)} style={{
            background: n.read ? '#fff' : colors[n.type], borderRadius: 14, padding: '14px 18px', cursor: 'pointer',
            border: `1px solid ${n.read ? '#f1f5f9' : 'transparent'}`, display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all .2s',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{icons[n.type]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 14, color: '#111827' }}>{n.title}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginRight: 10 }}>{n.time}</div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{n.body}</div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: 99, background: '#2563eb', flexShrink: 0, marginTop: 5 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════
function Settings() {
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <PageHeader title="الإعدادات" />
      {[
        { title: 'الملف الشخصي', items: [{ label: 'الاسم الكامل', val: 'محمد العمري' }, { label: 'البريد الإلكتروني', val: 'mohammed@example.com' }, { label: 'رقم الجوال', val: '+966 50 123 4567' }] },
        { title: 'إعدادات الإشعارات', items: [{ label: 'إشعارات البريد الإلكتروني', val: 'مفعّل' }, { label: 'إشعارات واتساب', val: 'مفعّل' }, { label: 'إشعارات انتهاء الضمان', val: 'قبل 30 يوم' }] },
        { title: 'الأمان', items: [{ label: 'كلمة المرور', val: '••••••••' }, { label: 'التحقق الثنائي', val: 'مفعّل' }] },
      ].map(section => (
        <Card key={section.title} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>{section.title}</div>
          {section.items.map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9fafb' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{item.val}</span>
                <button style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>تعديل</button>
              </div>
            </div>
          ))}
        </Card>
      ))}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>إدارة البيانات</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <div>
            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>تصفير البيانات</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>حذف كل البيانات المحفوظة والعودة للبيانات الأولية</div>
          </div>
          <Btn variant="danger" size="sm" onClick={() => {
            if (confirm('سيتم حذف كل البيانات المحفوظة محلياً. متابعة؟')) {
              ['mz_projects', 'mz_transactions', 'mz_trackings', 'mz_requests', 'mz_documents', 'mz_notifs'].forEach(k => localStorage.removeItem(k));
              location.reload();
            }
          }}>🗑️ تصفير</Btn>
        </div>
      </Card>
    </div>
  );
}
// ═══════════════════════════════════════════
// ═══════════════════════════════════════════
//  APP ROOT
// ═══════════════════════════════════════════
const KEYFRAMES = `
@keyframes mzFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes mzSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
@keyframes mzPop { from { opacity: 0; transform: translateY(8px) scale(.9) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes mzPulse { 0%,100% { box-shadow: 0 6px 22px rgba(37,99,235,.45) } 50% { box-shadow: 0 6px 30px rgba(37,99,235,.7) } }
`;

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [projectId, setProjectId] = useState('p1');

  const [projects, setProjects] = usePersist<Project[]>('mz_projects', INITIAL_PROJECTS);
  const [transactions, setTransactions] = usePersist<Transaction[]>('mz_transactions', INITIAL_TRANSACTIONS);
  const [trackings, setTrackings] = usePersist<Tracking[]>('mz_trackings', INITIAL_TRACKINGS);
  const [requests, setRequests] = usePersist<RequestItem[]>('mz_requests', INITIAL_REQUESTS);
  const [documents, setDocuments] = usePersist<DocItem[]>('mz_documents', INITIAL_DOCUMENTS);
  const [notifs, setNotifs] = usePersist<Notif[]>('mz_notifs', INITIAL_NOTIFS);

  // create-sheet flags triggered by FAB / headers
  const [createTx, setCreateTx] = useState(false);
  const [createDoc, setCreateDoc] = useState(false);
  const [createTracking, setCreateTracking] = useState(false);
  const [createRequest, setCreateRequest] = useState(false);
  const [createProject, setCreateProject] = useState(false);
  const [trackingPreset, setTrackingPreset] = useState<{ name?: string; type?: string }>({});

  const unread = notifs.filter(n => !n.read).length;
  const markRead = (id: string) => setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  const decideRequest = (id: string, status: RequestStatus) => {
    const req = requests.find(r => r.id === id);
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
        body: `تم اعتماد "${req.title}" وإنشاء عملية مالية بمبلغ ${fmt(req.amount)}.`,
        time: 'الآن', read: false,
      };
      setNotifs(ns => [notif, ...ns]);
    }
    if (req && status === 'rejected') {
      const notif: Notif = {
        id: uid('n'), type: 'warning', title: 'تم رفض طلب',
        body: `تم رفض "${req.title}".`, time: 'الآن', read: false,
      };
      setNotifs(ns => [notif, ...ns]);
    }
  };

  // upsert helpers (id present = edit, absent = create)
  const saveProject = (p: Omit<Project, 'id'> & { id?: string }) =>
    setProjects(list => p.id ? list.map(x => x.id === p.id ? { ...x, ...p } as Project : x) : [...list, { ...p, id: uid('p') }]);
  const deleteProject = (id: string) => { setProjects(l => l.filter(x => x.id !== id)); if (projectId === id) setProjectId(projects.find(p => p.id !== id)?.id ?? ''); };

  const saveTx = (t: Omit<Transaction, 'id'> & { id?: string }) => {
    // Editing an existing transaction
    if (t.id) { setTransactions(list => list.map(x => x.id === t.id ? { ...x, ...t } as Transaction : x)); return; }
    // New transfer → create two linked records (out from source, in to target)
    if (t.type === 'transfer' && t.toProject) {
      const link = uid('lnk');
      const outTx: Transaction = { ...t, id: uid('t'), type: 'transfer', transferDir: 'out', linkId: link };
      const targetName = projects.find(p => p.id === t.toProject)?.name ?? '';
      const sourceName = projects.find(p => p.id === t.projectId)?.name ?? '';
      const inTx: Transaction = {
        ...t, id: uid('t'), projectId: t.toProject, toProject: t.projectId,
        type: 'transfer', transferDir: 'in', linkId: link,
        description: `تحويل وارد من ${sourceName}`,
      };
      outTx.description = t.description || `تحويل صادر إلى ${targetName}`;
      setTransactions(list => [inTx, outTx, ...list]);
      return;
    }
    // Normal income/expense
    setTransactions(list => [{ ...t, id: uid('t') }, ...list]);
  };
  const deleteTx = (id: string) => setTransactions(list => {
    const tx = list.find(x => x.id === id);
    if (tx?.linkId) return list.filter(x => x.linkId !== tx.linkId); // delete both sides of a transfer
    return list.filter(x => x.id !== id);
  });

  const saveTracking = (t: Omit<Tracking, 'id'> & { id?: string }) =>
    setTrackings(list => t.id ? list.map(x => x.id === t.id ? { ...x, ...t } as Tracking : x) : [{ ...t, id: uid('tr') }, ...list]);
  const deleteTracking = (id: string) => setTrackings(l => l.filter(x => x.id !== id));

  const saveRequest = (r: Omit<RequestItem, 'id'> & { id?: string }) =>
    setRequests(list => r.id ? list.map(x => x.id === r.id ? { ...x, ...r } as RequestItem : x) : [{ ...r, id: uid('r') }, ...list]);
  const deleteRequest = (id: string) => setRequests(l => l.filter(x => x.id !== id));

  const saveDoc = (d: Omit<DocItem, 'id'> & { id?: string }) =>
    setDocuments(list => d.id ? list.map(x => x.id === d.id ? { ...x, ...d } as DocItem : x) : [{ ...d, id: uid('d') }, ...list]);
  const deleteDoc = (id: string) => setDocuments(l => l.filter(x => x.id !== id));

  // document → action bridges
  const docAction = (action: 'tx' | 'tracking', doc: DocItem) => {
    if (action === 'tx') { setPage('finance'); setCreateTx(true); }
    else { setTrackingPreset({ name: doc.name, type: doc.type === 'عقد' ? 'عقد' : 'ضمان' }); setPage('trackings'); setCreateTracking(true); }
  };

  // FAB dispatcher
  const fabAction = (a: 'tx' | 'doc' | 'tracking' | 'request' | 'project') => {
    if (a === 'tx') { setPage('finance'); setCreateTx(true); }
    if (a === 'doc') { setPage('documents'); setCreateDoc(true); }
    if (a === 'tracking') { setTrackingPreset({}); setPage('trackings'); setCreateTracking(true); }
    if (a === 'request') { setPage('requests'); setCreateRequest(true); }
    if (a === 'project') { setPage('projects'); setCreateProject(true); }
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard projectId={projectId} onNav={setPage} projects={projects} transactions={transactions} trackings={trackings} requests={requests} onDecide={decideRequest} />;
      case 'projects': return <Projects projects={projects} transactions={transactions} onOpen={(id) => { setProjectId(id); setPage('finance'); }} onSave={saveProject} onDelete={deleteProject} />;
      case 'finance': return <Finance projectId={projectId} projects={projects} transactions={transactions} onSave={saveTx} onDelete={deleteTx} openCreate={createTx} onOpenCreate={() => setCreateTx(true)} onCloseCreate={() => setCreateTx(false)} />;
      case 'documents': return <Documents projectId={projectId} projects={projects} documents={documents} onSave={saveDoc} onDelete={deleteDoc} onAction={docAction} openCreate={createDoc} onOpenCreate={() => setCreateDoc(true)} onCloseCreate={() => setCreateDoc(false)} />;
      case 'trackings': return <Trackings projectId={projectId} trackings={trackings} onSave={saveTracking} onDelete={deleteTracking} openCreate={createTracking} onOpenCreate={() => { setTrackingPreset({}); setCreateTracking(true); }} onCloseCreate={() => { setCreateTracking(false); setTrackingPreset({}); }} presetName={trackingPreset.name} presetType={trackingPreset.type} />;
      case 'requests': return <Requests projectId={projectId} requests={requests} onDecide={decideRequest} onSave={saveRequest} onDelete={deleteRequest} openCreate={createRequest} onOpenCreate={() => setCreateRequest(true)} onCloseCreate={() => setCreateRequest(false)} />;
      case 'notifications': return <Notifications notifs={notifs} onMarkRead={markRead} onMarkAll={markAll} />;
      case 'settings': return <Settings />;
      default: return null;
    }
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'IBM Plex Sans Arabic', sans-serif", direction: 'rtl', background: '#f8f9fb' }}>
        <Sidebar page={page} onNav={setPage} projects={projects} projectId={projectId} onProject={setProjectId} unread={unread} />
        <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {renderPage()}
        </main>
        <ActionCenter unread={unread} onAction={fabAction} onNav={setPage} />
      </div>
    </>
  );
}
