<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore, type CustomTheme } from '@/stores/SettingsStore'
import { THEME_PRESETS, SCREENS, PRICING_PLANS } from '@/constants'
import type { CustomLists, UserPrefs } from '@/interfaces/models'
import ToggleActivationSwitch from '@/components/shared/ToggleActivationSwitch.vue'
import IntegrationsPanel from '../components/IntegrationsPanel.vue'
import { resetPersistedData } from '@/plugins/persistence'

// إدارة البيانات: استعادة البيانات التجريبية (تفريغ الحفظ المحلي)
const confirmingReset = ref(false)
const resetting = ref(false)
async function doResetData() {
  resetting.value = true
  await resetPersistedData() // يفرّغ IndexedDB ثم يعيد التحميل لإعادة البذر
}

const settingsStore = useSettingsStore()
const { prefs, lists, help, themeMode, customTheme, hasCustomTheme, currentPlan, billing } = storeToRefs(settingsStore)

// حقول الألوان الدقيقة
const colorFields: { key: keyof CustomTheme; label: string; fallback: string }[] = [
  { key: 'primary', label: 'اللون الأساسي', fallback: '#2563eb' },
  { key: 'bg', label: 'لون الخلفية', fallback: themeMode.value === 'dark' ? '#0b0f17' : '#f8f9fb' },
  { key: 'surface', label: 'لون البطاقات', fallback: themeMode.value === 'dark' ? '#161b26' : '#ffffff' },
  { key: 'text', label: 'لون النصوص', fallback: themeMode.value === 'dark' ? '#f1f5f9' : '#111827' },
  { key: 'border', label: 'لون الحدود', fallback: themeMode.value === 'dark' ? '#2a3346' : '#e5e7eb' },
]

type Tab = 'prefs' | 'lists' | 'colors' | 'help' | 'integrations' | 'subscription'
const tab = ref<Tab>('prefs')
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'prefs', label: 'التفضيلات', icon: '⚙️' },
  { id: 'lists', label: 'القوائم المخصّصة', icon: '🏷️' },
  { id: 'colors', label: 'الألوان والثيم', icon: '🎨' },
  { id: 'help', label: 'شروحات الأقسام', icon: '💡' },
  { id: 'integrations', label: 'التكاملات', icon: '🔌' },
  { id: 'subscription', label: 'الاشتراك', icon: '💳' },
]

// مفاتيح التفضيلات المنطقية
const prefToggles: { key: keyof UserPrefs; label: string }[] = [
  { key: 'showStats', label: 'عرض بطاقات الإحصائيات' },
  { key: 'showCharts', label: 'عرض الرسوم البيانية' },
  { key: 'compactCards', label: 'بطاقات مدمجة' },
  { key: 'showQuickActions', label: 'عرض الإجراءات السريعة' },
  { key: 'confirmDelete', label: 'تأكيد قبل الحذف' },
]

// القوائم المخصّصة
const listMeta: { key: keyof CustomLists; title: string; icon: string }[] = [
  { key: 'txCategories', title: 'التصنيفات المالية', icon: '🏷️' },
  { key: 'projectTypes', title: 'أنواع المشاريع', icon: '🏢' },
  { key: 'docTypes', title: 'أنواع المستندات', icon: '📄' },
  { key: 'partyTypes', title: 'أنواع الأطراف', icon: '🤝' },
]
const newItem = reactive<Record<string, string>>({})
function addItem(key: keyof CustomLists) {
  settingsStore.addListItem(key, newItem[key] ?? '')
  newItem[key] = ''
}

// شروحات الأقسام — اختيار الشاشة من قائمة
const selectedScreen = ref(SCREENS[0].id)
watch(selectedScreen, (id) => settingsStore.ensureHelp(id), { immediate: true })
const selectedHelp = computed(() => help.value[selectedScreen.value])

// التكاملات (عرض فقط)
</script>

<template>
  <section class="settings">
    <header class="settings__header">
      <h1>الإعدادات</h1>
      <p>التفضيلات والقوائم المخصّصة والألوان والتكاملات</p>
    </header>

    <div class="settings__body">
      <!-- التبويبات الجانبية -->
      <nav class="settings__tabs">
        <button v-for="t in TABS" :key="t.id" class="stab" :class="{ 'is-active': tab === t.id }" @click="tab = t.id">
          <span>{{ t.icon }}</span>{{ t.label }}
        </button>
      </nav>

      <div class="settings__content">
        <!-- التفضيلات -->
        <div v-if="tab === 'prefs'" class="app-card panel">
          <h2>تفضيلات العرض</h2>
          <div v-for="p in prefToggles" :key="p.key" class="toggle-row">
            <span>{{ p.label }}</span>
            <ToggleActivationSwitch
              :model-value="prefs[p.key] as boolean"
              @update:model-value="settingsStore.setPref(p.key, $event as never)"
            />
          </div>
          <div class="toggle-row">
            <span>الفترة الافتراضية للوحة التحكم</span>
            <select :value="prefs.defaultPeriod" class="select" @change="settingsStore.setPref('defaultPeriod', ($event.target as HTMLSelectElement).value)">
              <option value="1w">آخر أسبوع</option>
              <option value="1m">آخر شهر</option>
              <option value="6m">آخر 6 أشهر</option>
              <option value="12m">آخر سنة</option>
            </select>
          </div>
        </div>

        <!-- إدارة البيانات -->
        <div v-if="tab === 'prefs'" class="app-card panel">
          <h2>إدارة البيانات</h2>
          <p class="data-note">
            💾 تُحفظ بياناتك تلقائياً في هذا المتصفح (IndexedDB) وتبقى بعد إغلاق التطبيق أو تحديث الصفحة — بما فيها المرفقات.
            الاستعادة تُرجِع البيانات التجريبية الأصلية وتمسح تعديلاتك المحفوظة.
          </p>
          <div class="data-actions">
            <template v-if="!confirmingReset">
              <button class="app-btn app-btn--outlined" @click="confirmingReset = true">↺ استعادة البيانات التجريبية</button>
            </template>
            <template v-else>
              <span class="data-confirm">هل أنت متأكد؟ ستُمسح تعديلاتك المحفوظة.</span>
              <button class="app-btn app-btn--danger" :disabled="resetting" @click="doResetData">نعم، استعادة</button>
              <button class="app-btn app-btn--ghost" :disabled="resetting" @click="confirmingReset = false">إلغاء</button>
            </template>
          </div>
        </div>

        <!-- القوائم المخصّصة -->
        <div v-else-if="tab === 'lists'" class="lists">
          <div v-for="lm in listMeta" :key="lm.key" class="app-card panel">
            <h2>{{ lm.icon }} {{ lm.title }}</h2>
            <div class="chips">
              <span v-for="item in lists[lm.key]" :key="item" class="chip">
                {{ item }}
                <button class="chip__x" @click="settingsStore.removeListItem(lm.key, item)">✕</button>
              </span>
            </div>
            <div class="add-row">
              <input v-model="newItem[lm.key]" type="text" placeholder="إضافة عنصر..." @keyup.enter="addItem(lm.key)" />
              <button class="app-btn" @click="addItem(lm.key)">＋</button>
            </div>
          </div>
        </div>

        <!-- الألوان والثيم -->
        <div v-else-if="tab === 'colors'" class="theme">
          <!-- الوضع الفاتح/الداكن -->
          <div class="app-card panel">
            <div class="mode-row">
              <div>
                <h2 style="margin: 0">الوضع العام</h2>
                <span class="muted" style="margin: 0">{{ themeMode === 'dark' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري' }}</span>
              </div>
              <ToggleActivationSwitch :model-value="themeMode === 'dark'" @update:model-value="settingsStore.toggleThemeMode()" />
            </div>
          </div>

          <!-- لوحات جاهزة -->
          <div class="app-card panel">
            <h2>🎨 لوحات جاهزة</h2>
            <p class="muted">اختر لوناً أساسياً بنقرة واحدة.</p>
            <div class="presets">
              <button
                v-for="p in THEME_PRESETS"
                :key="p.id"
                class="preset"
                :class="{ 'is-active': (customTheme.primary ?? '#2563eb') === p.primary }"
                :style="(customTheme.primary ?? '#2563eb') === p.primary ? { borderColor: p.primary, background: p.primary + '15' } : {}"
                @click="settingsStore.setPreset(p.id === 'blue' ? undefined : p.primary)"
              >
                <span class="preset__dot" :style="{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }" />
                {{ p.name }}
              </button>
            </div>
          </div>

          <!-- تخصيص دقيق -->
          <div class="app-card panel">
            <h2>🛠️ تخصيص دقيق</h2>
            <p class="muted">تحكّم بكل لون على حدة.</p>
            <div class="fine">
              <div v-for="f in colorFields" :key="f.key" class="fine-row">
                <span>{{ f.label }}</span>
                <div class="fine-row__controls">
                  <button v-if="customTheme[f.key]" class="reset-dot" title="إعادة للافتراضي" @click="settingsStore.setCustomColor(f.key, undefined)">↺</button>
                  <input type="color" :value="customTheme[f.key] ?? f.fallback" @input="settingsStore.setCustomColor(f.key, ($event.target as HTMLInputElement).value)" />
                </div>
              </div>
            </div>
          </div>

          <!-- معاينة حيّة -->
          <div class="app-card panel">
            <h2>معاينة حيّة</h2>
            <div class="preview">
              <span class="app-btn">زر أساسي</span>
              <span class="preview__card">بطاقة</span>
              <a class="preview__link">رابط ملوّن</a>
            </div>
          </div>

          <button class="app-btn app-btn--outlined reset-all" :disabled="!hasCustomTheme" @click="settingsStore.resetTheme()">
            ↺ العودة للألوان الافتراضية
          </button>
        </div>

        <!-- شروحات الأقسام (قابلة للتحرير) -->
        <div v-else-if="tab === 'help'" class="help-edit">
          <div class="app-card panel help-intro">
            <h2>💡 شروحات الأقسام</h2>
            <p class="muted" style="margin: 0">
              اختر الشاشة من القائمة واكتب الشرح — ستظهر أيقونة (ⓘ) بجانب عنوان تلك الشاشة، وعند النقر عليها يرى المستخدم الشرح في نافذة منبثقة.
            </p>
          </div>

          <!-- اختيار الشاشة -->
          <div class="app-card panel">
            <div class="field">
              <label>اختر الشاشة</label>
              <select v-model="selectedScreen">
                <option v-for="s in SCREENS" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
            </div>

            <div v-if="selectedHelp" class="help-card">
              <div class="help-card__head">
                <input v-model="selectedHelp.title" class="help-card__title" placeholder="عنوان الشرح" />
                <div class="help-card__toggle">
                  <span>{{ selectedHelp.show ? 'ظاهر' : 'مخفي' }}</span>
                  <ToggleActivationSwitch :model-value="selectedHelp.show" @update:model-value="settingsStore.toggleHelp(selectedScreen)" />
                </div>
              </div>
              <textarea v-model="selectedHelp.body" rows="5" class="help-card__body" placeholder="اكتب نص الشرح الذي سيظهر للمستخدم..."></textarea>
              <div class="help-card__foot">
                <button class="restore-btn" @click="settingsStore.resetHelp(selectedScreen)">استعادة النص الافتراضي</button>
                <span class="help-card__preview">
                  معاينة: <span class="help-card__chip">ⓘ</span> بجانب عنوان "{{ SCREENS.find((s) => s.id === selectedScreen)?.label }}"
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- التكاملات -->
        <IntegrationsPanel v-else-if="tab === 'integrations'" />

        <!-- الاشتراك والباقات -->
        <div v-else class="plans">
          <!-- مبدّل الفوترة -->
          <div class="billing">
            <button class="billing__btn" :class="{ 'is-active': billing === 'monthly' }" @click="settingsStore.setBilling('monthly')">شهري</button>
            <button class="billing__btn" :class="{ 'is-active': billing === 'yearly' }" @click="settingsStore.setBilling('yearly')">
              سنوي <span class="billing__save">وفّر شهرين</span>
            </button>
          </div>

          <div class="plans__grid">
            <div
              v-for="plan in PRICING_PLANS"
              :key="plan.id"
              class="plan app-card"
              :class="{ 'is-current': plan.id === currentPlan, 'is-featured': !!plan.tag }"
              :style="plan.tag ? { borderColor: plan.color } : {}"
            >
              <span v-if="plan.tag" class="plan__tag" :style="{ background: plan.color }">{{ plan.tag }}</span>

              <span class="plan__name" :style="{ color: plan.color }">{{ plan.name }}</span>
              <span class="plan__tagline">{{ plan.tagline }}</span>

              <div class="plan__price">
                <template v-if="(billing === 'monthly' ? plan.monthly : plan.yearly) === 0">
                  <span class="plan__amount">مجاناً</span>
                </template>
                <template v-else>
                  <span class="plan__amount">{{ billing === 'monthly' ? plan.monthly : plan.yearly }}</span>
                  <span class="plan__unit">ر.س / {{ billing === 'monthly' ? 'شهر' : 'سنة' }}</span>
                </template>
              </div>

              <ul class="plan__features">
                <li v-for="f in plan.features" :key="f">✓ {{ f }}</li>
              </ul>

              <button
                v-if="plan.id === currentPlan"
                class="app-btn app-btn--outlined plan__btn"
                disabled
              >
                ✓ باقتك الحالية
              </button>
              <button
                v-else
                class="app-btn plan__btn"
                :style="{ background: plan.color }"
                @click="settingsStore.setPlan(plan.id)"
              >
                {{ plan.monthly === 0 ? 'التحويل للمجانية' : 'الترقية' }}
              </button>
            </div>
          </div>

          <p class="plans__note">💳 الدفع آمن · يمكنك تغيير أو إلغاء باقتك في أي وقت · الأسعار شاملة ضريبة القيمة المضافة.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.settings {
  max-inline-size: 1000px;

  &__header {
    margin-block-end: 20px;

    h1 { font-size: 22px; font-weight: 700; }
    p { color: var(--text-muted); font-size: 14px; margin-block-start: 4px; }
  }

  &__body {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 20px;

    @media (max-width: 760px) {
      grid-template-columns: 1fr;
    }
  }

  &__tabs {
    display: flex;
    flex-direction: column;
    gap: 4px;

    @media (max-width: 760px) {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
}

.stab {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  text-align: start;

  &:hover { background: var(--primary-soft); }
  &.is-active { background: var(--primary); color: #fff; }
}

.panel {
  padding: 24px;

  h2 { font-size: 16px; font-weight: 700; margin-block-end: 14px; }
}

.muted {
  color: var(--text-muted);
  font-size: 13px;
  margin-block-end: 16px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-block-end: 1px solid var(--border);
  font-size: 14px;

  &:last-child { border-block-end: none; }
}

// إدارة البيانات
.data-note {
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-muted);
  margin-block-end: 16px;
}

.data-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.data-confirm {
  font-size: 13px;
  font-weight: 600;
  color: var(--danger-text);
}

.app-btn--danger {
  background: var(--error);
  color: #fff;
}

.select {
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  font-family: inherit;
  font-size: 13px;
  background: var(--surface);
}

.lists,
.integrations {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-block-end: 14px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--bg);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;

  &__x {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 11px;

    &:hover { color: var(--error); }
  }
}

.add-row {
  display: flex;
  gap: 8px;

  input {
    flex: 1;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    &:focus { outline: none; border-color: var(--primary); }
  }
}

// ── الثيم ──
.theme {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 99px;
  border: 2px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;

  &.is-active { font-weight: 700; }

  &__dot {
    inline-size: 18px;
    block-size: 18px;
    border-radius: 99px;
    flex-shrink: 0;
  }
}

.fine {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fine-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13.5px;

  &__controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  input[type='color'] {
    inline-size: 44px;
    block-size: 32px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: none;
    padding: 2px;
    cursor: pointer;
  }
}

.reset-dot {
  inline-size: 26px;
  block-size: 26px;
  border: none;
  border-radius: 7px;
  background: var(--bg);
  color: var(--text-muted);
  font-size: 12px;
}

.preview {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;

  &__card {
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 8px 18px;
    border-radius: 10px;
    font-size: 13px;
  }

  &__link {
    color: var(--primary);
    font-size: 13px;
    font-weight: 600;
  }
}

.reset-all {
  inline-size: 100%;

  &:disabled { opacity: 0.5; }
}

// ── شروحات الأقسام ──
.help-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-intro { padding: 20px 24px; }

.help-card {
  padding: 16px 18px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-block-end: 10px;
  }

  &__title {
    flex: 1;
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
    background: transparent;
    border: none;
    border-block-end: 1px solid transparent;
    font-family: inherit;
    padding: 2px 0;

    &:focus { outline: none; border-block-end-color: var(--border); }
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    font-size: 11.5px;
    color: var(--text-muted);
  }

  &__body {
    inline-size: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    font-family: inherit;
    font-size: 12.5px;
    line-height: 1.8;
    background: var(--bg);
    color: var(--text);
    resize: vertical;

    &:focus { outline: none; border-color: var(--primary); }
  }

  &__foot {
    margin-block-start: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__preview {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 18px;
    block-size: 18px;
    border-radius: 50%;
    background: var(--primary-soft);
    color: var(--primary);
    font-weight: 700;
    font-size: 11px;
  }
}

.restore-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--text-muted);
  font-family: inherit;
}

.integration {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;

  &__icon { font-size: 26px; }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__name { font-weight: 600; font-size: 14px; }
  &__desc { font-size: 12px; color: var(--text-muted); }
}

// ── الباقات ──
.plans {
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  &__note {
    margin-block-start: 18px;
    font-size: 12px;
    color: var(--text-muted);
    text-align: center;
  }
}

.billing {
  display: inline-flex;
  gap: 4px;
  background: var(--bg);
  border-radius: 12px;
  padding: 4px;
  margin-block-end: 20px;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }

  &__save {
    font-size: 11px;
    background: var(--ok-bg);
    color: var(--ok-text);
    padding: 1px 8px;
    border-radius: 20px;
  }
}

.plan {
  position: relative;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;

  &.is-featured { border-width: 2px; }
  &.is-current { background: var(--primary-soft); }

  &__tag {
    position: absolute;
    inset-block-start: -10px;
    inset-inline-start: 50%;
    transform: translateX(50%);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 14px;
    border-radius: 20px;
  }

  &__name { font-size: 18px; font-weight: 800; }
  &__tagline { font-size: 12px; color: var(--text-muted); margin-block-end: 16px; }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-block-end: 18px;
    padding-block-end: 16px;
    border-block-end: 1px solid var(--border);
  }

  &__amount { font-size: 30px; font-weight: 800; }
  &__unit { font-size: 12px; color: var(--text-muted); }

  &__features {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;
    margin-block-end: 18px;

    li { font-size: 13px; color: var(--text); }
  }

  &__btn {
    inline-size: 100%;

    &:disabled { opacity: 0.7; cursor: default; }
  }
}
</style>
