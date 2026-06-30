<script setup lang="ts">
import { ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/SettingsStore'
import { PROJECT_COLORS } from '@/constants'
import type { CustomLists, HelpKey, UserPrefs } from '@/interfaces/models'
import ToggleActivationSwitch from '@/components/shared/ToggleActivationSwitch.vue'

const settingsStore = useSettingsStore()
const { prefs, lists, help, primaryColor } = storeToRefs(settingsStore)

type Tab = 'prefs' | 'lists' | 'colors' | 'help' | 'integrations' | 'subscription'
const tab = ref<Tab>('prefs')
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'prefs', label: 'التفضيلات', icon: '⚙️' },
  { id: 'lists', label: 'القوائم المخصّصة', icon: '🏷️' },
  { id: 'colors', label: 'الألوان', icon: '🎨' },
  { id: 'help', label: 'نصوص المساعدة', icon: '💡' },
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

const helpKeys = Object.keys(help.value) as HelpKey[]

// التكاملات (عرض فقط)
const integrations = [
  { name: 'البريد الإلكتروني', icon: '📧', desc: 'إشعارات عبر البريد', connected: false },
  { name: 'الرسائل النصية', icon: '💬', desc: 'تنبيهات SMS عند الاستحقاقات', connected: false },
  { name: 'التخزين السحابي', icon: '☁️', desc: 'نسخ احتياطي للمستندات', connected: false },
  { name: 'واتساب للأعمال', icon: '📱', desc: 'إشعارات عبر واتساب', connected: false },
]
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

        <!-- الألوان -->
        <div v-else-if="tab === 'colors'" class="app-card panel">
          <h2>اللون الأساسي للتطبيق</h2>
          <p class="muted">اختر اللون الذي يُطبَّق على الأزرار والروابط والعناصر النشطة.</p>
          <div class="color-grid">
            <button
              v-for="c in PROJECT_COLORS"
              :key="c"
              class="color-swatch"
              :class="{ 'is-active': primaryColor === c }"
              :style="{ background: c }"
              @click="settingsStore.setPrimaryColor(c)"
            >
              <span v-if="primaryColor === c">✓</span>
            </button>
          </div>
          <div class="custom-color">
            <label>لون مخصّص:</label>
            <input type="color" :value="primaryColor" @input="settingsStore.setPrimaryColor(($event.target as HTMLInputElement).value)" />
            <span class="custom-color__hex">{{ primaryColor }}</span>
          </div>
        </div>

        <!-- نصوص المساعدة -->
        <div v-else-if="tab === 'help'" class="app-card panel">
          <h2>إظهار نصوص المساعدة في الأقسام</h2>
          <p class="muted">تحكّم بظهور الشرح التوضيحي أعلى كل قسم.</p>
          <div v-for="k in helpKeys" :key="k" class="toggle-row">
            <span>{{ help[k].title }}</span>
            <ToggleActivationSwitch :model-value="help[k].show" @update:model-value="settingsStore.toggleHelp(k)" />
          </div>
        </div>

        <!-- التكاملات -->
        <div v-else-if="tab === 'integrations'" class="integrations">
          <div v-for="ig in integrations" :key="ig.name" class="app-card integration">
            <span class="integration__icon">{{ ig.icon }}</span>
            <div class="integration__info">
              <span class="integration__name">{{ ig.name }}</span>
              <span class="integration__desc">{{ ig.desc }}</span>
            </div>
            <button class="app-btn app-btn--outlined">ربط</button>
          </div>
        </div>

        <!-- الاشتراك -->
        <div v-else class="app-card panel subscription">
          <span class="subscription__badge">الباقة الحالية</span>
          <h2>الباقة الاحترافية</h2>
          <p class="muted">مشاريع غير محدودة · كل الموديولات · تصدير Excel/PDF · دعم أولوية</p>
          <ul class="subscription__features">
            <li>✅ مشاريع وأعضاء بلا حدود</li>
            <li>✅ الذمم والالتزامات والأصول</li>
            <li>✅ الاستبيانات والتقارير</li>
            <li>✅ سجل تدقيق كامل</li>
          </ul>
          <button class="app-btn">إدارة الاشتراك</button>
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

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-block-end: 20px;
}

.color-swatch {
  inline-size: 48px;
  block-size: 48px;
  border-radius: 14px;
  border: 3px solid transparent;
  color: #fff;
  font-size: 18px;
  font-weight: 700;

  &.is-active { border-color: var(--text); transform: scale(1.05); }
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 12px;

  label { font-size: 13px; color: var(--text-muted); }

  input { inline-size: 48px; block-size: 36px; border: none; background: none; }

  &__hex { font-size: 13px; font-weight: 600; }
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

.subscription {
  &__badge {
    display: inline-block;
    background: var(--primary-soft);
    color: var(--primary);
    font-size: 12px;
    font-weight: 600;
    padding: 4px 14px;
    border-radius: 20px;
    margin-block-end: 12px;
  }

  &__features {
    list-style: none;
    margin-block: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    li { font-size: 14px; }
  }
}
</style>
