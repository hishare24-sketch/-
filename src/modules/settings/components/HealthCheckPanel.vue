<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { runHealthCheck, type HealthIssue, type HealthLevel, type HealthTarget } from '@/composables/useHealthCheck'

const router = useRouter()
const projectsStore = useProjectsStore()

const issues = ref<HealthIssue[] | null>(null)
const running = ref(false)
const expanded = ref<string | null>(null)

function run() {
  running.value = true
  expanded.value = null
  // تأخير بسيط لإظهار حالة الفحص
  setTimeout(() => {
    issues.value = runHealthCheck()
    running.value = false
  }, 650)
}

const count = (l: HealthLevel) => issues.value?.filter((i) => i.level === l).length ?? 0

const META: Record<HealthLevel, { dot: string; c: string }> = {
  ok: { dot: '🟢', c: 'var(--ok-text)' },
  warning: { dot: '🟠', c: 'var(--warn-text)' },
  error: { dot: '🔴', c: 'var(--danger-text)' },
}

function toggle(i: HealthIssue) {
  if (i.level === 'ok' && !i.ai) return
  expanded.value = expanded.value === i.key ? null : i.key
}

// التنقّل حتى العنصر: ضبط المشروع النشط + إبراز العنصر عبر ?focus=
function goTo(t: HealthTarget) {
  if (t.projectId) projectsStore.setActiveProject(t.projectId)
  router.push({ name: t.route, params: t.params, query: t.focusId ? { focus: t.focusId } : {} })
}
</script>

<template>
  <div class="hc">
    <div class="hc__head">
      <div class="hc__title">
        <span class="hc__icon">🩺</span>
        <div>
          <h2>فحص اتساق الحسابات</h2>
          <span class="hc__sub">تدقيق منطقي للتأكد من سلامة الأرصدة والروابط عبر كل الأقسام</span>
        </div>
      </div>
      <button class="app-btn" :disabled="running" @click="run">{{ running ? 'جارٍ الفحص…' : '▶ تشغيل الفحص' }}</button>
    </div>

    <template v-if="issues">
      <!-- ملخّص -->
      <div class="hc__summary">
        <span class="pill pill--ok">🟢 {{ count('ok') }} سليم</span>
        <span v-if="count('warning')" class="pill pill--warn">🟠 {{ count('warning') }} تحذير</span>
        <span v-if="count('error')" class="pill pill--err">🔴 {{ count('error') }} خطأ</span>
      </div>

      <!-- الفحوصات -->
      <div class="hc__list">
        <div v-for="i in issues" :key="i.key" class="issue" :class="`is-${i.level}`">
          <button class="issue__head" :class="{ 'is-static': i.level === 'ok' && !i.ai }" @click="toggle(i)">
            <span class="issue__dot">{{ META[i.level].dot }}</span>
            <div class="issue__text">
              <span class="issue__title" :style="{ color: META[i.level].c }">{{ i.title }}</span>
              <span class="issue__detail">{{ i.detail }}</span>
            </div>
            <span v-if="i.level !== 'ok' || i.ai" class="issue__chev" :class="{ 'is-open': expanded === i.key }">▼</span>
          </button>

          <div v-if="expanded === i.key" class="issue__body">
            <div v-if="i.cause" class="ex"><span>🔎</span><div><b>السبب</b><p>{{ i.cause }}</p></div></div>
            <div v-if="i.why" class="ex"><span>❓</span><div><b>لماذا حدث</b><p>{{ i.why }}</p></div></div>
            <div v-if="i.fix" class="ex"><span>🛠️</span><div><b>طريقة المعالجة</b><p>{{ i.fix }}</p></div></div>
            <div v-if="i.ai" class="ai">
              <div class="ai__head"><span>🤖</span><b>توصية المساعد الذكي</b></div>
              <p>{{ i.ai }}</p>
            </div>
            <div v-if="i.targets?.length" class="targets">
              <span class="targets__label">الانتقال إلى العنصر:</span>
              <button v-for="(t, ti) in i.targets" :key="ti" class="target-btn" @click="goTo(t)">↗ {{ t.label }}</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!count('warning') && !count('error')" class="hc__clean">✅ كل الحسابات متسقة وسليمة</div>
    </template>

    <p v-else class="hc__hint">شغّل الفحص لتدقيق التحويلات وأرصدة الأعضاء والسجلات اليتيمة والذمم والالتزامات والمتابعات والأصول والطلبات.</p>
  </div>
</template>

<style lang="scss" scoped>
.hc {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }

  &__title { display: flex; align-items: center; gap: 12px; }
  &__icon { font-size: 24px; }
  h2 { font-size: 16px; font-weight: 700; }
  &__sub { font-size: 12.5px; color: var(--text-muted); }

  &__summary { display: flex; gap: 10px; flex-wrap: wrap; }
  &__list { display: flex; flex-direction: column; gap: 8px; }

  &__clean {
    text-align: center;
    padding: 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ok-text);
  }

  &__hint { font-size: 13px; color: var(--text-muted); line-height: 1.8; }
}

.pill {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 99px;

  &--ok { background: var(--ok-bg); color: var(--ok-text); }
  &--warn { background: var(--warn-bg); color: var(--warn-text); }
  &--err { background: var(--danger-bg); color: var(--danger-text); }
}

.issue {
  border-radius: 10px;
  overflow: hidden;

  &.is-ok { background: var(--ok-bg); }
  &.is-warning { background: var(--warn-bg); }
  &.is-error { background: var(--danger-bg); }

  &__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    inline-size: 100%;
    padding: 12px 14px;
    background: transparent;
    border: none;
    font-family: inherit;
    text-align: start;
    cursor: pointer;

    &.is-static { cursor: default; }
  }

  &__dot { font-size: 15px; flex-shrink: 0; }
  &__text { flex: 1; min-inline-size: 0; display: flex; flex-direction: column; gap: 2px; }
  &__title { font-size: 13px; font-weight: 700; }
  &__detail { font-size: 12px; color: var(--text); opacity: 0.8; line-height: 1.6; }

  &__chev {
    flex-shrink: 0;
    font-size: 10px;
    color: var(--text-muted);
    transition: transform 0.2s ease;
    &.is-open { transform: rotate(180deg); }
  }

  &__body {
    padding: 0 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.ex {
  display: flex;
  gap: 9px;

  span { font-size: 14px; flex-shrink: 0; }
  b { font-size: 11.5px; font-weight: 700; display: block; }
  p { font-size: 12px; color: var(--text); opacity: 0.85; line-height: 1.6; margin-block-start: 1px; }
}

.ai {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 11px 13px;

  &__head { display: flex; align-items: center; gap: 7px; margin-block-end: 5px; b { font-size: 12px; color: var(--purple-text); } }
  p { font-size: 12px; color: var(--text); opacity: 0.85; line-height: 1.7; }
}

.targets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;

  &__label { font-size: 11.5px; font-weight: 600; color: var(--text-muted); }
}

.target-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--primary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  max-inline-size: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover { background: var(--primary-soft); }
}
</style>
