<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/SettingsStore'
import { docHTML } from '@/helpers/export'
import { quoteBody, type QuoteData } from '@/helpers/documents'
import { today } from '@/helpers/date'
import { BaseButton } from '@/components/base'

const settingsStore = useSettingsStore()
const { docBranding } = storeToRefs(settingsStore)

// نموذج معاينة تمثيلي
const sample: QuoteData = {
  ref: 'QT-10001',
  date: today(),
  client: 'مؤسسة الرواد التجارية',
  items: [
    { desc: 'توريد أجهزة حاسب', qty: 3, price: 4200 },
    { desc: 'تركيب وتشغيل', qty: 1, price: 1500 },
  ],
  vatPercent: 15,
  validity: '30 يوم',
  notes: 'الأسعار شاملة الضمان لمدة سنة.',
}

// المعاينة تتفاعل مع الهوية الحالية
const previewHtml = computed(() =>
  docHTML({
    title: 'عرض سعر',
    subtitle: sample.client,
    body: quoteBody(sample),
    brand: docBranding.value.brand,
    tagline: docBranding.value.tagline,
    accent: docBranding.value.accent,
    footer: docBranding.value.footer,
    logo: docBranding.value.logo,
  }),
)

const fields = [
  { key: 'logo', label: 'الشعار (رمز/إيموجي)', placeholder: 'مثال: ⚖️', type: 'text' },
  { key: 'brand', label: 'اسم الجهة', placeholder: 'موازين', type: 'text' },
  { key: 'tagline', label: 'الوصف تحت الاسم', placeholder: 'نظام الإدارة المالية والتشغيلية', type: 'text' },
  { key: 'footer', label: 'سطر التذييل (اختياري)', placeholder: 'العنوان · الهاتف · الرقم الضريبي', type: 'text' },
] as const
</script>

<template>
  <div class="editor">
    <div class="editor__hint">
      🎨 تُطبَّق هذه الهوية على <b>كل مستندات الـ PDF</b> (عروض الأسعار، أوامر الدفع، الاتفاقيات، الفواتير، الكشوفات).
    </div>

    <div class="editor__grid">
      <!-- الحقول -->
      <div class="app-card controls">
        <div v-for="f in fields" :key="f.key" class="field">
          <label>{{ f.label }}</label>
          <input
            :value="docBranding[f.key]"
            type="text"
            :placeholder="f.placeholder"
            @input="settingsStore.setBrandingField(f.key, ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="field">
          <label>اللون الأساسي</label>
          <div class="color-row">
            <input
              type="color"
              :value="docBranding.accent"
              @input="settingsStore.setBrandingField('accent', ($event.target as HTMLInputElement).value)"
            />
            <span class="color-row__val">{{ docBranding.accent }}</span>
          </div>
        </div>

        <BaseButton variant="ghost" @click="settingsStore.resetBranding()">↺ استعادة الافتراضي</BaseButton>
      </div>

      <!-- المعاينة الحيّة -->
      <div class="preview">
        <span class="preview__label">معاينة حيّة</span>
        <div class="preview__paper" v-html="previewHtml" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor__hint {
  padding: 12px 16px;
  background: var(--info-bg);
  color: var(--info-text);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  line-height: 1.8;
}

.editor__grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 720px) { grid-template-columns: 1fr; }
}

.controls {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label { font-size: 12.5px; font-weight: 500; color: var(--text-muted); }

  input[type='text'] {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
}

.color-row {
  display: flex;
  align-items: center;
  gap: 10px;

  input[type='color'] {
    inline-size: 46px;
    block-size: 38px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: none;
    cursor: pointer;
  }

  &__val { font-size: 13px; color: var(--text-muted); font-family: monospace; }
}

.preview {
  &__label {
    display: block;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text-muted);
    margin-block-end: 8px;
  }

  // ورقة بيضاء ثابتة (مخرجات PDF بخلفية بيضاء دائماً)
  &__paper {
    background: #fff;
    color: #111;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 28px;
    box-shadow: var(--shadow);
    overflow-x: auto;
    font-family: Tahoma, Arial, sans-serif;
    direction: rtl;
  }
}
</style>
