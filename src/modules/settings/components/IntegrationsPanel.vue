<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useDocumentsStore } from '@/stores/DocumentsStore'
import { useTrackingsStore } from '@/stores/TrackingsStore'
import { useCommitmentsStore } from '@/stores/CommitmentsStore'

// ملاحظة: كل الإجراءات هنا محاكاة واجهة — التكامل الفعلي يتطلب خادم backend
type ActionKind = 'sync' | 'message' | 'reminders'

interface Integration {
  id: string
  name: string
  icon: string
  desc: string
  action: string
  kind: ActionKind
}

const INTEGRATIONS: Integration[] = [
  { id: 'drive', name: 'التخزين السحابي (Drive)', icon: '☁️', desc: 'مزامنة المستندات وملفات Excel مع Google Drive', action: 'مزامنة الآن', kind: 'sync' },
  { id: 'email', name: 'البريد الإلكتروني', icon: '📧', desc: 'إرسال الإشعارات والتقارير عبر البريد', action: 'إرسال تجريبي', kind: 'message' },
  { id: 'whatsapp', name: 'واتساب للأعمال', icon: '📱', desc: 'تنبيهات الاستحقاقات عبر واتساب', action: 'إرسال تجريبي', kind: 'message' },
  { id: 'sms', name: 'الرسائل النصية (SMS)', icon: '💬', desc: 'تنبيهات فورية عند الاستحقاقات', action: 'إرسال تجريبي', kind: 'message' },
  { id: 'reminders', name: 'التذكيرات التلقائية', icon: '⏰', desc: 'جدولة تذكيرات دورية بالاستحقاقات القادمة', action: 'جدولة التذكيرات', kind: 'reminders' },
]

const documentsStore = useDocumentsStore()
const trackingsStore = useTrackingsStore()
const commitmentsStore = useCommitmentsStore()

// عناصر تستحق تذكيراً (بيانات حقيقية من التطبيق)
const dueItems = computed(() => {
  const tracks = trackingsStore.trackings.filter((t) => t.status === 'expiring' || t.status === 'expired').length
  const commits = commitmentsStore.commitments.filter((c) => c.active).length
  return { tracks, commits, total: tracks + commits }
})

const connected = reactive<Record<string, boolean>>({})
const busy = reactive<Record<string, boolean>>({})

interface LogEntry {
  time: string
  text: string
  status: 'ok' | 'info'
}
const log = ref<LogEntry[]>([])
function addLog(text: string, status: LogEntry['status'] = 'ok') {
  const time = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  log.value.unshift({ time, text, status })
  if (log.value.length > 30) log.value.pop()
}

function toggleConnect(ig: Integration) {
  connected[ig.id] = !connected[ig.id]
  addLog(`${connected[ig.id] ? 'تم ربط' : 'تم فصل'} «${ig.name}» (محاكاة)`, 'info')
}

// محاكاة إجراء غير متزامن مع مؤشر انتظار
function simulate(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runAction(ig: Integration) {
  if (!connected[ig.id] || busy[ig.id]) return
  busy[ig.id] = true
  try {
    await simulate(900)
    if (ig.kind === 'sync') {
      addLog(`مزامنة ${documentsStore.documents.length} مستنداً مع ${ig.name} — اكتملت (محاكاة)`)
    } else if (ig.kind === 'message') {
      addLog(`تم إرسال رسالة تجريبية عبر «${ig.name}» (محاكاة)`)
    } else {
      addLog(`جُدولت تذكيرات لـ ${dueItems.value.total} استحقاقاً (${dueItems.value.tracks} متابعة + ${dueItems.value.commits} التزام) — محاكاة`)
    }
  } finally {
    busy[ig.id] = false
  }
}
</script>

<template>
  <div class="integrations">
    <!-- وسم المحاكاة -->
    <div class="sim-banner">
      🧪 <b>محاكاة واجهة</b> — هذه التكاملات تعرض تجربة الاستخدام الكاملة، ويصبح تنفيذها فعلياً عند ربط خادم backend
      (OAuth ومزوّدات الإرسال والمُجدوِل).
    </div>

    <div class="ig-grid">
      <div v-for="ig in INTEGRATIONS" :key="ig.id" class="app-card ig" :class="{ 'is-on': connected[ig.id] }">
        <span class="ig__icon">{{ ig.icon }}</span>
        <div class="ig__info">
          <span class="ig__name">
            {{ ig.name }}
            <span v-if="connected[ig.id]" class="ig__dot" title="مرتبط (محاكاة)" />
          </span>
          <span class="ig__desc">{{ ig.desc }}</span>
          <span v-if="ig.kind === 'reminders' && connected[ig.id]" class="ig__hint">
            {{ dueItems.total }} استحقاقاً بانتظار التذكير
          </span>
        </div>
        <div class="ig__actions">
          <button
            v-if="connected[ig.id]"
            class="app-btn app-btn--sm"
            :disabled="busy[ig.id]"
            @click="runAction(ig)"
          >
            {{ busy[ig.id] ? '…' : ig.action }}
          </button>
          <button
            class="app-btn app-btn--sm"
            :class="connected[ig.id] ? 'app-btn--ghost' : 'app-btn--outlined'"
            @click="toggleConnect(ig)"
          >
            {{ connected[ig.id] ? 'فصل' : 'ربط' }}
          </button>
        </div>
      </div>
    </div>

    <!-- سجل النشاط -->
    <div class="app-card ig-log">
      <div class="ig-log__head">
        <span>سجل النشاط</span>
        <button v-if="log.length" class="clear" @click="log = []">مسح</button>
      </div>
      <div v-if="!log.length" class="ig-log__empty">لا يوجد نشاط بعد — اربط تكاملاً وجرّب إجراءً.</div>
      <div v-for="(e, i) in log" :key="i" class="ig-log__row">
        <span class="ig-log__time">{{ e.time }}</span>
        <span class="ig-log__dot" :class="`is-${e.status}`" />
        <span class="ig-log__text">{{ e.text }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.integrations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sim-banner {
  padding: 12px 16px;
  background: var(--purple-bg);
  color: var(--purple-text);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  line-height: 1.8;
}

.ig-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.ig {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  transition: border-color 0.15s ease;

  &.is-on { border-color: var(--primary); }

  &__icon { font-size: 26px; flex-shrink: 0; }

  &__info { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; gap: 3px; }

  &__name {
    font-weight: 700;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__dot {
    inline-size: 8px;
    block-size: 8px;
    border-radius: 50%;
    background: var(--ok-text);
  }

  &__desc { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
  &__hint { font-size: 11.5px; color: var(--primary); font-weight: 600; margin-block-start: 2px; }

  &__actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
}

.app-btn--sm { padding: 6px 14px; font-size: 12px; }

.ig-log {
  padding: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
    margin-block-end: 12px;
  }

  &__empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-block-end: 1px solid var(--border);
    font-size: 12.5px;

    &:last-child { border-block-end: none; }
  }

  &__time { color: var(--text-muted); font-size: 11px; font-variant-numeric: tabular-nums; flex-shrink: 0; }

  &__dot {
    inline-size: 7px;
    block-size: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &.is-ok { background: var(--ok-text); }
    &.is-info { background: var(--info-text); }
  }

  &__text { flex: 1; }
}

.clear {
  background: none;
  border: none;
  color: var(--primary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
</style>
