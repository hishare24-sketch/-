<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { today } from '@/helpers/date'
import { uid } from '@/helpers/id'
import { fmtNum } from '@/helpers/format'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton } from '@/components/base'
import {
  DOC_TEMPLATES,
  exportTemplatePDF,
  type TemplateId,
  type QuoteData,
  type PaymentOrderData,
  type AgreementData,
} from '@/helpers/documents'

const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const documentsStore = useDocumentsStore()
const { projects } = storeToRefs(projectsStore)

// مرجع قصير للمستند
const shortRef = (p: string) => `${p}-${uid('').replace(/\D/g, '').slice(-5) || '10001'}`

const step = ref<'pick' | 'form'>('pick')
const selected = ref<TemplateId | null>(null)
const busy = ref(false)
const saveAsDoc = ref(true)
const savedMsg = ref('')

// نماذج البيانات لكل قالب
const quote = reactive<QuoteData>({
  ref: shortRef('QT'),
  date: today(),
  client: '',
  items: [{ desc: '', qty: 1, price: 0 }],
  vatPercent: 15,
  validity: '30 يوم',
  notes: '',
})
const payment = reactive<PaymentOrderData>({
  ref: shortRef('PO'),
  date: today(),
  payee: '',
  amount: 0,
  purpose: '',
  method: 'تحويل بنكي',
  project: projects.value[0]?.name ?? '',
  approver: '',
})
const agreement = reactive<AgreementData>({
  ref: shortRef('AG'),
  date: today(),
  party1: 'موازين',
  party2: '',
  subject: '',
  value: 0,
  startDate: today(),
  endDate: '',
  clauses: '',
})

const quoteTotal = computed(() => {
  const sub = quote.items.reduce((s, it) => s + Number(it.qty) * Number(it.price), 0)
  const vat = Math.round(sub * (Number(quote.vatPercent) / 100))
  return { sub, vat, total: sub + vat }
})

function pick(id: TemplateId) {
  selected.value = id
  step.value = 'form'
  savedMsg.value = ''
}
function addItem() {
  quote.items.push({ desc: '', qty: 1, price: 0 })
}
function removeItem(i: number) {
  if (quote.items.length > 1) quote.items.splice(i, 1)
}

const currentData = computed<QuoteData | PaymentOrderData | AgreementData>(() =>
  selected.value === 'quote' ? quote : selected.value === 'payment_order' ? payment : agreement,
)

const canExport = computed(() => {
  if (selected.value === 'quote') return quote.client.trim() !== '' && quote.items.some((it) => it.desc.trim())
  if (selected.value === 'payment_order') return payment.payee.trim() !== '' && payment.amount > 0
  return agreement.party2.trim() !== '' && agreement.subject.trim() !== ''
})

// حفظ نسخة كمستند داخل النظام (اختياري)
function maybeSaveDoc(label: string, projName: string) {
  if (!saveAsDoc.value) return
  const proj = projects.value.find((p) => p.name === projName) ?? projects.value[0]
  documentsStore.saveDoc({
    id: uid('d'),
    name: label,
    type: 'مستند رسمية',
    projectId: proj?.id ?? '',
    date: today(),
    size: '—',
    status: 'pending',
    aiRead: false,
    attachments: [],
  })
}

async function doExport() {
  if (!selected.value || !canExport.value) return
  busy.value = true
  try {
    await exportTemplatePDF(selected.value, currentData.value)
    if (selected.value === 'quote') maybeSaveDoc(`عرض سعر — ${quote.client}`, payment.project)
    else if (selected.value === 'payment_order') maybeSaveDoc(`أمر دفع — ${payment.payee}`, payment.project)
    else maybeSaveDoc(`اتفاقية — ${agreement.subject}`, agreement.party1)
    savedMsg.value = saveAsDoc.value ? 'تم تصدير الـ PDF وحفظ نسخة في المستندات ✅' : 'تم تصدير الـ PDF ✅'
  } catch (e) {
    savedMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalShell :title="step === 'pick' ? 'توليد مستند من قالب' : `توليد: ${DOC_TEMPLATES.find((t) => t.id === selected)?.label}`" wide @close="emit('close')">
    <!-- اختيار القالب -->
    <div v-if="step === 'pick'" class="picker">
      <button v-for="t in DOC_TEMPLATES" :key="t.id" class="tpl" @click="pick(t.id)">
        <span class="tpl__icon">{{ t.icon }}</span>
        <span class="tpl__label">{{ t.label }}</span>
        <span class="tpl__desc">{{ t.desc }}</span>
      </button>
    </div>

    <!-- النموذج -->
    <div v-else class="form">
      <button class="back-link" @click="step = 'pick'">‹ تغيير القالب</button>

      <!-- عرض سعر -->
      <template v-if="selected === 'quote'">
        <div class="grid2">
          <div class="field"><label>رقم العرض</label><input v-model="quote.ref" type="text" /></div>
          <div class="field"><label>التاريخ</label><input v-model="quote.date" type="date" /></div>
        </div>
        <div class="field"><label>العميل / الجهة</label><input v-model="quote.client" type="text" placeholder="اسم العميل" /></div>

        <div class="items">
          <div class="items__head"><span>البنود</span><button class="mini" @click="addItem">＋ بند</button></div>
          <div v-for="(it, i) in quote.items" :key="i" class="item-row">
            <input v-model="it.desc" type="text" placeholder="الوصف" class="item-row__desc" />
            <input v-model.number="it.qty" type="number" min="0" placeholder="كمية" class="item-row__num" />
            <input v-model.number="it.price" type="number" min="0" placeholder="السعر" class="item-row__num" />
            <span class="item-row__total">{{ fmtNum(Number(it.qty) * Number(it.price)) }}</span>
            <button class="item-row__x" :disabled="quote.items.length === 1" @click="removeItem(i)">✕</button>
          </div>
        </div>

        <div class="grid2">
          <div class="field"><label>الضريبة %</label><input v-model.number="quote.vatPercent" type="number" min="0" /></div>
          <div class="field"><label>صلاحية العرض</label><input v-model="quote.validity" type="text" /></div>
        </div>
        <div class="field"><label>ملاحظات وشروط</label><textarea v-model="quote.notes" rows="3" placeholder="شروط الدفع، التسليم..." /></div>

        <div class="totals">
          <span>المجموع الفرعي: <b>{{ fmtNum(quoteTotal.sub) }}</b></span>
          <span>الضريبة: <b>{{ fmtNum(quoteTotal.vat) }}</b></span>
          <span class="totals__grand">الإجمالي: <b>{{ fmtNum(quoteTotal.total) }} ر.س</b></span>
        </div>
      </template>

      <!-- أمر دفع -->
      <template v-else-if="selected === 'payment_order'">
        <div class="grid2">
          <div class="field"><label>رقم الأمر</label><input v-model="payment.ref" type="text" /></div>
          <div class="field"><label>التاريخ</label><input v-model="payment.date" type="date" /></div>
        </div>
        <div class="field"><label>المستفيد</label><input v-model="payment.payee" type="text" placeholder="اسم المستفيد" /></div>
        <div class="grid2">
          <div class="field"><label>المبلغ (ر.س)</label><input v-model.number="payment.amount" type="number" min="0" /></div>
          <div class="field">
            <label>طريقة الدفع</label>
            <select v-model="payment.method"><option>تحويل بنكي</option><option>شيك</option><option>نقد</option></select>
          </div>
        </div>
        <div class="field">
          <label>المشروع</label>
          <select v-model="payment.project"><option v-for="p in projects" :key="p.id" :value="p.name">{{ p.icon }} {{ p.name }}</option></select>
        </div>
        <div class="field"><label>بيان الدفع</label><input v-model="payment.purpose" type="text" placeholder="سبب الصرف" /></div>
        <div class="field"><label>المُعتمِد</label><input v-model="payment.approver" type="text" placeholder="اسم المعتمِد" /></div>
      </template>

      <!-- اتفاقية -->
      <template v-else>
        <div class="grid2">
          <div class="field"><label>رقم الاتفاقية</label><input v-model="agreement.ref" type="text" /></div>
          <div class="field"><label>التاريخ</label><input v-model="agreement.date" type="date" /></div>
        </div>
        <div class="field"><label>الموضوع / العنوان</label><input v-model="agreement.subject" type="text" placeholder="موضوع الاتفاقية" /></div>
        <div class="grid2">
          <div class="field"><label>الطرف الأول</label><input v-model="agreement.party1" type="text" /></div>
          <div class="field"><label>الطرف الثاني</label><input v-model="agreement.party2" type="text" /></div>
        </div>
        <div class="grid2">
          <div class="field"><label>القيمة (ر.س)</label><input v-model.number="agreement.value" type="number" min="0" /></div>
          <div class="field"><label>من تاريخ</label><input v-model="agreement.startDate" type="date" /></div>
        </div>
        <div class="field"><label>إلى تاريخ</label><input v-model="agreement.endDate" type="date" /></div>
        <div class="field"><label>البنود (بند في كل سطر)</label><textarea v-model="agreement.clauses" rows="5" placeholder="يلتزم الطرف الأول بـ...&#10;يلتزم الطرف الثاني بـ..." /></div>
      </template>

      <label class="save-toggle">
        <input v-model="saveAsDoc" type="checkbox" />
        💾 حفظ نسخة في قائمة المستندات
      </label>
      <div v-if="savedMsg" class="saved-msg">{{ savedMsg }}</div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إغلاق</BaseButton>
      <BaseButton v-if="step === 'form'" :disabled="!canExport || busy" @click="doExport">
        {{ busy ? 'جارٍ التصدير…' : '⬇ تصدير PDF' }}
      </BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
// اختيار القالب
.picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
}

.tpl {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 22px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;

  &:hover { border-color: var(--primary); background: var(--primary-soft); }

  &__icon { font-size: 30px; }
  &__label { font-weight: 700; font-size: 15px; }
  &__desc { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
}

.back-link {
  background: none;
  border: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  margin-block-end: 14px;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 520px) { grid-template-columns: 1fr; }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 14px;

  label { font-size: 13px; font-weight: 500; color: var(--text-muted); }

  input,
  select,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }

  textarea { resize: vertical; }
}

// بنود عرض السعر
.items {
  margin-block-end: 14px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted);
    margin-block-end: 8px;
  }
}

.mini {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--primary);
  border-radius: 8px;
  padding: 4px 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-block-end: 6px;

  input {
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }

  &__desc { flex: 1; min-inline-size: 0; }
  &__num { inline-size: 72px; }
  &__total { inline-size: 84px; text-align: end; font-size: 12px; font-weight: 600; color: var(--text-muted); }
  &__x {
    border: none;
    background: var(--danger-bg);
    color: var(--danger-text);
    border-radius: 6px;
    inline-size: 28px;
    block-size: 28px;
    cursor: pointer;
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

.totals {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-muted);

  b { color: var(--text); }
  &__grand { margin-inline-start: auto; b { color: var(--primary); } }
}

.save-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--purple-text);
  background: var(--purple-bg);
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-block-start: 8px;

  input { inline-size: 16px; block-size: 16px; }
}

.saved-msg {
  margin-block-start: 12px;
  padding: 10px 14px;
  background: var(--ok-bg);
  color: var(--ok-text);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
}
</style>
