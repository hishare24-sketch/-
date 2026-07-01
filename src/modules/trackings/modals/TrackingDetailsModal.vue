<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'
import { useToast } from '@/composables/useToast'
import { fmt } from '@/helpers/format'
import { today } from '@/helpers/date'
import { TRACKING_FIELD_SCHEMAS } from '@/constants'
import type { Tracking, CommitmentKind } from '@/interfaces/models'
import { analyzeTracking, type TrackingActionKind } from '../trackingsAI'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ tracking: Tracking; autoRenew?: boolean }>()
const emit = defineEmits<{ (e: 'edit', t: Tracking): void; (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const trackingsStore = useTrackingsStore()
const commitmentsStore = useCommitmentsStore()
const toast = useToast()

const project = computed(() => projectsStore.projectById(props.tracking.projectId))
const member = computed(() => (props.tracking.memberId ? projectsStore.memberById(props.tracking.memberId)?.name : null))
const specFields = computed(() => (TRACKING_FIELD_SCHEMAS[props.tracking.type] ?? []).filter((f) => props.tracking.specs?.[f.key]))

const badge = computed(() => {
  const t = props.tracking
  if (t.cancelled) return { label: 'ملغى', c: 'var(--text-muted)', bg: 'var(--surface-2)' }
  if (t.status === 'active') return { label: 'نشط', c: 'var(--ok-text)', bg: 'var(--ok-bg)' }
  if (t.status === 'expiring') return { label: 'يوشك على الانتهاء', c: 'var(--warn-text)', bg: 'var(--warn-bg)' }
  return { label: 'منتهٍ', c: 'var(--danger-text)', bg: 'var(--danger-bg)' }
})
const remaining = computed(() =>
  props.tracking.daysLeft < 0 ? `منتهٍ منذ ${Math.abs(props.tracking.daysLeft)} يوم` : `${props.tracking.daysLeft} يوم`,
)

// ── مساعد المتابعة الذكي (دورة AI تفاعلية) ──
const aiOpen = ref(false)
const insight = computed(() => analyzeTracking(props.tracking))
const hasFee = computed(() => (props.tracking.cost ?? 0) > 0)

// ── التجديد ──
const renewing = ref(false)
const newExpiry = ref(props.tracking.expiryDate || today())
const logFee = ref(false)
function confirmRenew() {
  trackingsStore.renewTracking(props.tracking.id, newExpiry.value, {
    feeAsExpense: logFee.value && hasFee.value ? props.tracking.cost : 0,
  })
  toast.success(logFee.value && hasFee.value ? 'تم التجديد وتسجيل الرسوم كمصروف' : 'تم تجديد المتابعة')
  renewing.value = false
}
function cancel() {
  trackingsStore.cancelTracking(props.tracking.id)
  toast.info('تم إلغاء المتابعة')
}

// إجراءات المساعد الذكي بنقرة واحدة
function runAiAction(kind: TrackingActionKind) {
  if (kind === 'renew') {
    newExpiry.value = insight.value.suggestedRenewalDate
    renewing.value = true
  } else if (kind === 'expense') {
    logFee.value = true
    newExpiry.value = insight.value.suggestedRenewalDate
    renewing.value = true
  } else if (kind === 'commitment') {
    convertToCommitment()
  } else if (kind === 'link') {
    toast.info('أضِف الوثيقة من زر «تعديل» ← المرفقات')
  }
}

// دمج مع قسم الالتزامات: تحويل المتابعة المتكرّرة لالتزام دوري
function convertToCommitment() {
  const t = props.tracking
  const kind: CommitmentKind = t.type === 'اشتراك' ? 'subscription' : 'obligation'
  const party =
    t.specs?.provider ?? t.specs?.insurer ?? t.specs?.party ?? t.specs?.seller ?? t.specs?.authority
  commitmentsStore.addCommitment({
    projectId: t.projectId,
    kind,
    direction: 'out',
    name: t.name,
    party,
    memberId: t.memberId,
    amount: t.cost ?? 0,
    freq: t.type === 'اشتراك' ? 'monthly' : 'yearly',
    startDate: today(),
    paidCount: 0,
    nextDue: insight.value.suggestedRenewalDate,
    active: true,
    payments: [],
    note: `مُحوّل من متابعة: ${t.name}`,
  })
  toast.success('تم إنشاء التزام دوري من هذه المتابعة')
}

onMounted(() => {
  if (props.autoRenew) {
    newExpiry.value = insight.value.suggestedRenewalDate
    renewing.value = true
  }
})
</script>

<template>
  <ModalShell :title="`${tracking.icon} ${tracking.name}`" @close="emit('close')">
    <div class="topbar">
      <span class="status-badge" :style="{ background: badge.bg, color: badge.c }">{{ badge.label }}</span>
      <span class="remain" :style="{ color: badge.c }">{{ remaining }}</span>
    </div>

    <!-- مركز الإجراءات -->
    <div class="hub">
      <button class="hub__btn hub__btn--primary" @click="renewing = !renewing">🔄 تجديد</button>
      <button class="hub__btn hub__btn--ai" @click="aiOpen = !aiOpen">🤖 مساعد ذكي</button>
      <button class="hub__btn" @click="emit('edit', tracking)">✎ تعديل</button>
      <button v-if="!tracking.cancelled" class="hub__btn" @click="cancel">🚫 إلغاء</button>
    </div>

    <!-- مساعد المتابعة الذكي (دورة AI تفاعلية) -->
    <div v-if="aiOpen" class="ai" :class="`ai--${insight.risk}`">
      <div class="ai__headline">{{ insight.headline }}</div>
      <ul class="ai__points">
        <li v-for="(p, i) in insight.points" :key="i">{{ p }}</li>
      </ul>
      <div class="ai__actions">
        <button v-for="a in insight.suggestedActions" :key="a.kind" class="ai__act" @click="runAiAction(a.kind)">
          <span class="ai__act-icon">{{ a.icon }}</span>
          <span class="ai__act-body">
            <span class="ai__act-label">{{ a.label }}</span>
            <span class="ai__act-desc">{{ a.desc }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- تجديد: تاريخ انتهاء جديد -->
    <div v-if="renewing" class="renew">
      <div class="renew__row">
        <input v-model="newExpiry" type="date" />
        <button class="app-btn app-btn--sm" @click="confirmRenew">تأكيد التجديد</button>
      </div>
      <label v-if="hasFee" class="renew__fee">
        <input v-model="logFee" type="checkbox" />
        سجّل رسوم التجديد ({{ fmt(tracking.cost!) }}) كمصروف في المالية
      </label>
    </div>

    <table class="rows">
      <tr><td class="rows__key">النوع</td><td>{{ tracking.type }}</td></tr>
      <tr><td class="rows__key">المشروع</td><td>{{ project?.name }}</td></tr>
      <tr><td class="rows__key">تاريخ الانتهاء</td><td>{{ tracking.expiryDate }}</td></tr>
      <tr v-for="f in specFields" :key="f.key"><td class="rows__key">{{ f.label }}</td><td>{{ tracking.specs?.[f.key] }}</td></tr>
      <tr v-if="tracking.cost != null"><td class="rows__key">تكلفة التجديد</td><td>{{ fmt(tracking.cost) }}</td></tr>
      <tr v-if="member"><td class="rows__key">المسؤول</td><td>{{ member }}</td></tr>
      <tr v-if="tracking.renewedCount"><td class="rows__key">عدد التجديدات</td><td>{{ tracking.renewedCount }}</td></tr>
      <tr v-if="tracking.note"><td class="rows__key">ملاحظات</td><td>{{ tracking.note }}</td></tr>
    </table>

    <div v-if="tracking.attachments?.length" class="atts">
      <span class="atts__label">المرفقات</span>
      <AttachmentsField :model-value="tracking.attachments" readonly />
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إغلاق</button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-block-end: 14px;
}

.status-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
.remain { font-size: 13px; font-weight: 600; }

.hub {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-block-end: 14px;
}

.hub__btn {
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;

  &:hover { border-color: var(--primary); color: var(--primary); }
  &--primary { background: var(--primary); color: #fff; border-color: var(--primary); &:hover { color: #fff; opacity: 0.9; } }
  &--ai { background: var(--purple-bg); color: var(--purple-text); border-color: transparent; &:hover { color: var(--purple-text); opacity: 0.85; } }
}

// ── مساعد ذكي ──
.ai {
  border: 1px solid var(--border);
  border-inline-start: 4px solid var(--purple-text);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-block-end: 16px;
  background: var(--purple-bg);

  &--high { border-inline-start-color: var(--danger-text); background: var(--danger-bg); }
  &--medium { border-inline-start-color: var(--warn-text); background: var(--warn-bg); }

  &__headline { font-size: 13.5px; font-weight: 700; margin-block-end: 8px; }

  &__points {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-block-end: 12px;

    li { font-size: 12px; color: var(--text); padding-inline-start: 14px; position: relative; }
    li::before { content: '•'; position: absolute; inset-inline-start: 0; color: var(--text-muted); }
  }

  &__actions { display: flex; flex-direction: column; gap: 8px; }

  &__act {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    text-align: start;
    cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease);

    &:hover { border-color: var(--primary); }
  }

  &__act-icon { font-size: 17px; flex-shrink: 0; }
  &__act-body { display: flex; flex-direction: column; min-inline-size: 0; }
  &__act-label { font-size: 12.5px; font-weight: 600; }
  &__act-desc { font-size: 11px; color: var(--text-muted); }
}

.renew {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-block-end: 16px;

  &__row { display: flex; gap: 8px; align-items: center; }

  &__fee {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text);
    cursor: pointer;

    input { inline-size: 15px; block-size: 15px; accent-color: var(--primary); }
  }

  input[type='date'] {
    flex: 1;
    inline-size: 100%;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.app-btn--sm { padding: 8px 14px; font-size: 12.5px; white-space: nowrap; }

.rows {
  inline-size: 100%;
  border-collapse: collapse;
  margin-block-end: 18px;

  td { padding: 9px 0; border-block-end: 1px solid var(--border); font-size: 14px; }
  &__key { color: var(--text-muted); inline-size: 140px; }
}

.atts {
  &__label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-block-end: 10px; }
}
</style>
