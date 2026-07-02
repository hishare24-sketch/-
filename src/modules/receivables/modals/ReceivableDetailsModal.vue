<script setup lang="ts">
import { computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useReceivablesStore } from '@/stores/ReceivablesStore'
import { recvPaid, recvRemaining } from '@/helpers/calc'
import { fmt, fmtNum } from '@/helpers/format'
import { exportPDF, docHTML } from '@/helpers/export'
import { useToast } from '@/composables/useToast'
import { RECEIVABLE_STATUS } from '@/constants'
import type { Receivable, ReceivableStatus } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'
import { BaseButton } from '@/components/base'

const props = defineProps<{ receivable: Receivable }>()
const emit = defineEmits<{ (e: 'pay', r: Receivable): void; (e: 'edit', r: Receivable): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const receivablesStore = useReceivablesStore()
const toast = useToast()
const isRecv = computed(() => props.receivable.kind === 'receivable')
const statusMeta = computed(() => RECEIVABLE_STATUS[props.receivable.status])
const canPay = computed(() => !['settled', 'written_off', 'cancelled'].includes(props.receivable.status))

// إجراءات تغيير الحالة المتاحة حسب الحالة الراهنة
const statusActions = computed(() => {
  const s = props.receivable.status
  const acts: { to: ReceivableStatus; label: string }[] = []
  if (s !== 'disputed' && s !== 'settled') acts.push({ to: 'disputed', label: '⚖️ نزاع' })
  if (s !== 'written_off') acts.push({ to: 'written_off', label: '✖️ إعدام' })
  if (s !== 'cancelled') acts.push({ to: 'cancelled', label: '🚫 إلغاء' })
  if (s !== 'open' && s !== 'partial' && s !== 'settled') acts.push({ to: 'open', label: '↺ إعادة فتح' })
  return acts
})
function setStatus(to: ReceivableStatus) {
  receivablesStore.setReceivableStatus(props.receivable.id, to)
}
const paid = computed(() => recvPaid(props.receivable))
const remaining = computed(() => recvRemaining(props.receivable))
const project = computed(() => projectsStore.projectById(props.receivable.projectId))

function exportStatement() {
  const r = props.receivable
  const payRows = r.payments.length
    ? r.payments.map((p) => `<tr><td style="padding:6px 0">${p.date}</td><td style="padding:6px 0">${p.note ?? '—'}</td><td style="padding:6px 0;text-align:left;font-weight:600">${fmtNum(p.amount)} ر.س</td></tr>`).join('')
    : '<tr><td colspan="3" style="padding:10px 0;color:#999">لا توجد دفعات</td></tr>'
  const body = `
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
      <tr><td style="padding:6px 0;color:#666;width:140px">الطرف</td><td style="font-weight:600">${r.party}</td></tr>
      <tr><td style="padding:6px 0;color:#666">المشروع</td><td>${project.value?.name ?? '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#666">النوع</td><td>${isRecv.value ? 'ذمة مدينة (لنا)' : 'ذمة دائنة (علينا)'}</td></tr>
      <tr><td style="padding:6px 0;color:#666">المبلغ الأصلي</td><td style="font-weight:600">${fmtNum(r.amount)} ر.س</td></tr>
    </table>
    <div style="font-weight:700;margin-bottom:8px">سجل الدفعات</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;border-top:1px solid #ddd">${payRows}</table>
    <table style="width:100%;border-collapse:collapse;font-size:16px;margin-top:16px">
      <tr><td style="padding:6px 0;font-weight:700">المدفوع</td><td style="text-align:left;font-weight:700;color:var(--ok-text)">${fmtNum(paid.value)} ر.س</td></tr>
      <tr><td style="padding:6px 0;font-weight:800;border-top:2px solid #2563eb">المتبقّي</td><td style="text-align:left;font-weight:800;border-top:2px solid #2563eb;color:var(--danger-text)">${fmtNum(remaining.value)} ر.س</td></tr>
    </table>`
  exportPDF(`كشف_حساب_${r.party}`, docHTML({ title: 'كشف حساب ذمة', subtitle: r.party, body }))
    .then(() => toast.success('تم تصدير كشف الحساب'))
    .catch((e) => toast.error(e.message))
}
</script>

<template>
  <ModalShell :title="receivable.party" @close="emit('close')">
    <div class="topbar">
      <span class="status-badge" :style="{ background: statusMeta.bg, color: statusMeta.color }">{{ statusMeta.label }}</span>
      <div class="hub">
        <button class="hub__btn" @click="emit('edit', receivable)">✎ تعديل</button>
        <button v-for="a in statusActions" :key="a.to" class="hub__btn" @click="setStatus(a.to)">{{ a.label }}</button>
      </div>
    </div>

    <div class="summary">
      <div class="summary__item">
        <span>الأصلي</span><strong>{{ fmt(receivable.amount) }}</strong>
      </div>
      <div class="summary__item is-paid">
        <span>المدفوع</span><strong>{{ fmt(paid) }}</strong>
      </div>
      <div class="summary__item is-remaining">
        <span>المتبقّي</span><strong>{{ fmt(remaining) }}</strong>
      </div>
    </div>

    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ isRecv ? '📥 مدينة (لنا)' : '📤 دائنة (علينا)' }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr v-if="receivable.dueDate"><td class="rows__key">الاستحقاق</td><td>{{ receivable.dueDate }}</td></tr>
      <tr v-if="receivable.invoiceNo"><td class="rows__key">رقم الفاتورة</td><td>{{ receivable.invoiceNo }}</td></tr>
      <tr v-if="receivable.terms"><td class="rows__key">شروط السداد</td><td>{{ receivable.terms }}</td></tr>
      <tr v-if="receivable.note"><td class="rows__key">ملاحظات</td><td>{{ receivable.note }}</td></tr>
    </table>

    <div class="payments">
      <span class="payments__label">سجل الدفعات ({{ receivable.payments.length }})</span>
      <div v-if="!receivable.payments.length" class="payments__empty">لا توجد دفعات بعد.</div>
      <div v-for="p in receivable.payments" :key="p.id" class="payment">
        <span class="payment__dot" />
        <div class="payment__info">
          <span class="payment__amount">{{ fmt(p.amount) }}</span>
          <span class="payment__meta">
            {{ p.date }}{{ p.source ? ` · ${p.source}` : '' }}{{ p.note ? ` · ${p.note}` : '' }}
            <span v-if="p.attachments?.length" class="payment__att">📎 {{ p.attachments.length }}</span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="receivable.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="receivable.attachments" readonly />
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">إغلاق</BaseButton>
      <BaseButton variant="outlined" @click="exportStatement">⬇ كشف حساب PDF</BaseButton>
      <BaseButton v-if="canPay" @click="emit('pay', receivable)">
        {{ isRecv ? 'تحصيل' : 'سداد' }}
      </BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-block-end: 16px;
  flex-wrap: wrap;
}

.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
}

.hub {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hub__btn {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  &:hover { border-color: var(--primary); color: var(--primary); }
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-block-end: 18px;

  &__item {
    background: var(--bg);
    border-radius: var(--radius-sm);
    padding: 12px;
    text-align: center;

    span { display: block; font-size: 11px; color: var(--text-muted); margin-block-end: 4px; }
    strong { font-size: 15px; }

    &.is-paid strong { color: var(--ok-text); }
    &.is-remaining strong { color: var(--danger-text); }
  }
}

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }

  &__key { color: var(--text-muted); inline-size: 120px; }
}

.payments {
  &__label { display: block; font-size: 13px; font-weight: 600; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
}

.payment {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-block: 8px;

  &__dot {
    inline-size: 10px;
    block-size: 10px;
    border-radius: 50%;
    background: var(--primary);
    flex-shrink: 0;
  }

  &__info { display: flex; flex-direction: column; }
  &__amount { font-weight: 600; font-size: 14px; }
  &__meta { font-size: 12px; color: var(--text-muted); }
}

.atts {
  margin-block-start: 18px;

  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
