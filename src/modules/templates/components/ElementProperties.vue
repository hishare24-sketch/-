<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TemplateElement } from '@/interfaces/models'
import { elementTypeMeta } from '../constants'
import { improveText, TEXT_TONES, type TextTone } from '../templatesAI'
import { BaseButton } from '@/components/base'

const props = defineProps<{ element: TemplateElement }>()
const emit = defineEmits<{ (e: 'update', patch: Partial<TemplateElement>): void }>()

const meta = computed(() => elementTypeMeta(props.element.type))

// أنواع بها إدخال من المستخدم (إلزامي/نص مساعد)
const isInput = computed(() =>
  ['short_text', 'long_text', 'number', 'date', 'dropdown', 'checkbox', 'computed'].includes(props.element.type),
)
const isText = computed(() => ['paragraph', 'heading', 'short_text', 'long_text'].includes(props.element.type))

// options / columns كنصّ متعدّد الأسطر
const optionsText = computed({
  get: () => (props.element.options ?? []).join('\n'),
  set: (v: string) => emit('update', { options: v.split('\n').map((s) => s.trim()).filter(Boolean) }),
})
const columnsText = computed({
  get: () => (props.element.columns ?? []).join('\n'),
  set: (v: string) => emit('update', { columns: v.split('\n').map((s) => s.trim()).filter(Boolean) }),
})

function set<K extends keyof TemplateElement>(key: K, value: TemplateElement[K]) {
  emit('update', { [key]: value } as Partial<TemplateElement>)
}

// كاتب النصوص الذكي (محاكاة) — يعيد صياغة نص الفقرة حسب النبرة
const tone = ref<TextTone>('رسمية')
function enhance() {
  emit('update', { label: improveText(props.element.label, tone.value) })
}

// رفع صورة كـ base64 (تُحفظ مع القالب)
function onImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = () => emit('update', { src: reader.result as string })
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="props">
    <div class="props__head">
      <span class="props__icon">{{ meta?.icon }}</span>
      <span class="props__type">{{ meta?.label }}</span>
    </div>

    <!-- التسمية (لكل العناصر) -->
    <div class="f">
      <label>التسمية</label>
      <input :value="element.label" type="text" @input="set('label', ($event.target as HTMLInputElement).value)" />
    </div>

    <!-- إدخال المستخدم -->
    <template v-if="isInput">
      <div class="f">
        <label>النص المساعد (Placeholder)</label>
        <input :value="element.placeholder ?? ''" type="text" @input="set('placeholder', ($event.target as HTMLInputElement).value)" />
      </div>
      <label class="chk">
        <input type="checkbox" :checked="!!element.required" @change="set('required', ($event.target as HTMLInputElement).checked)" />
        حقل إلزامي
      </label>
      <div class="f">
        <label>القيمة الافتراضية</label>
        <input :value="element.defaultValue ?? ''" type="text" @input="set('defaultValue', ($event.target as HTMLInputElement).value)" />
      </div>
    </template>

    <!-- كاتب النصوص الذكي (للفقرات) -->
    <div v-if="element.type === 'paragraph'" class="ai-text">
      <label>✨ تحسين النص <span class="ai-text__tag">🧪 محاكاة</span></label>
      <div class="ai-text__row">
        <select v-model="tone">
          <option v-for="t in TEXT_TONES" :key="t" :value="t">{{ t }}</option>
        </select>
        <BaseButton class="ai-text__btn" @click="enhance">✨ تحسين</BaseButton>
      </div>
    </div>

    <!-- تنسيق النص -->
    <template v-if="isText">
      <div class="row">
        <div class="f">
          <label>حجم الخط</label>
          <input :value="element.fontSize ?? ''" type="number" min="8" max="72" placeholder="14" @input="set('fontSize', Number(($event.target as HTMLInputElement).value) || undefined)" />
        </div>
        <div class="f">
          <label>اللون</label>
          <input :value="element.color ?? '#111827'" type="color" @input="set('color', ($event.target as HTMLInputElement).value)" />
        </div>
      </div>
      <div class="f">
        <label>المحاذاة</label>
        <select :value="element.align ?? 'start'" @change="set('align', ($event.target as HTMLSelectElement).value as TemplateElement['align'])">
          <option value="start">بداية</option>
          <option value="center">وسط</option>
          <option value="end">نهاية</option>
        </select>
      </div>
      <div class="toggles">
        <label class="chk">
          <input type="checkbox" :checked="!!element.bold" @change="set('bold', ($event.target as HTMLInputElement).checked)" /> غامق
        </label>
        <label class="chk">
          <input type="checkbox" :checked="!!element.italic" @change="set('italic', ($event.target as HTMLInputElement).checked)" /> مائل
        </label>
      </div>
    </template>

    <!-- رقمي -->
    <template v-if="element.type === 'number' || element.type === 'computed'">
      <div class="f">
        <label>تنسيق الرقم</label>
        <select :value="element.numberFormat ?? 'integer'" @change="set('numberFormat', ($event.target as HTMLSelectElement).value as TemplateElement['numberFormat'])">
          <option value="integer">عدد صحيح</option>
          <option value="decimal">عشري</option>
          <option value="currency">عملة</option>
          <option value="percent">نسبة %</option>
        </select>
      </div>
    </template>
    <template v-if="element.type === 'number'">
      <div class="row">
        <div class="f"><label>الحد الأدنى</label><input :value="element.min ?? ''" type="number" @input="set('min', Number(($event.target as HTMLInputElement).value))" /></div>
        <div class="f"><label>الحد الأعلى</label><input :value="element.max ?? ''" type="number" @input="set('max', Number(($event.target as HTMLInputElement).value))" /></div>
      </div>
    </template>

    <!-- حقل محسوب -->
    <div v-if="element.type === 'computed'" class="f">
      <label>الصيغة</label>
      <input :value="element.formula ?? ''" type="text" placeholder="مثال: السعر × الكمية" @input="set('formula', ($event.target as HTMLInputElement).value)" />
    </div>

    <!-- تاريخ -->
    <div v-if="element.type === 'date'" class="f">
      <label>نوع التقويم</label>
      <select :value="element.dateFormat ?? 'gregorian'" @change="set('dateFormat', ($event.target as HTMLSelectElement).value as TemplateElement['dateFormat'])">
        <option value="gregorian">ميلادي</option>
        <option value="hijri">هجري</option>
      </select>
    </div>

    <!-- قائمة منسدلة -->
    <div v-if="element.type === 'dropdown'" class="f">
      <label>الخيارات (خيار في كل سطر)</label>
      <textarea v-model="optionsText" rows="4" placeholder="خيار 1&#10;خيار 2" />
    </div>

    <!-- صورة -->
    <template v-if="element.type === 'image'">
      <div class="f">
        <label>نوع الصورة</label>
        <select :value="element.imageKind ?? 'logo'" @change="set('imageKind', ($event.target as HTMLSelectElement).value as TemplateElement['imageKind'])">
          <option value="logo">شعار</option>
          <option value="signature">توقيع</option>
          <option value="stamp">ختم</option>
          <option value="barcode">باركود</option>
        </select>
      </div>
      <div class="f">
        <label>الصورة</label>
        <div v-if="element.src" class="img-preview">
          <img :src="element.src" alt="" />
          <button class="img-remove" @click="set('src', undefined)">✕ إزالة</button>
        </div>
        <label class="upload">
          <input type="file" accept="image/*" @change="onImage" />
          <span>{{ element.src ? 'استبدال الصورة' : '⬆ رفع صورة (شعار/ختم…)' }}</span>
        </label>
      </div>
    </template>

    <!-- جداول -->
    <div v-if="element.type === 'table' || element.type === 'items_table'" class="f">
      <label>الأعمدة (عمود في كل سطر)</label>
      <textarea v-model="columnsText" rows="4" placeholder="الوصف&#10;الكمية&#10;السعر" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.props {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-block-end: 12px;
    margin-block-end: 12px;
    border-block-end: 1px solid var(--border);
  }
  &__icon { font-size: 20px; }
  &__type { font-weight: 700; font-size: 14px; }
}

.f {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-block-end: 12px;

  label { font-size: 12px; font-weight: 500; color: var(--text-muted); }

  input,
  select,
  textarea {
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    inline-size: 100%;
    max-inline-size: 100%;
    background: var(--surface);
    color: var(--text);
    &:focus { outline: none; border-color: var(--primary); }
  }
  input[type='color'] { padding: 2px; block-size: 36px; }
  textarea { resize: vertical; }
}

.row {
  display: flex;
  gap: 10px;
  .f { flex: 1; min-inline-size: 0; }
}

.toggles { display: flex; gap: 16px; margin-block-end: 12px; }

.chk {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--text);
  margin-block-end: 12px;
  cursor: pointer;
  input { inline-size: 15px; block-size: 15px; }
}

.img-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-block-end: 8px;

  img { max-block-size: 54px; max-inline-size: 120px; object-fit: contain; border: 1px solid var(--border); border-radius: 6px; padding: 4px; background: #fff; }
}
.img-remove {
  border: none;
  background: var(--danger-bg);
  color: var(--danger-text);
  border-radius: 6px;
  padding: 5px 10px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}
.upload {
  display: block;
  padding: 9px 12px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  &:hover { background: var(--primary-soft); border-color: var(--primary); }
  input { display: none; }
}

.ai-text {
  margin-block-end: 12px;
  padding: 10px;
  background: var(--purple-bg);
  border-radius: var(--radius-sm);

  label { display: block; font-size: 12px; font-weight: 600; color: var(--purple-text); margin-block-end: 8px; }
  &__tag { font-weight: 400; color: var(--text-muted); }
  &__row { display: flex; gap: 6px; }
  select { flex: 1; padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: inherit; font-size: 13px; background: var(--surface); color: var(--text); }
  &__btn { padding: 7px 12px; font-size: 13px; }
}
</style>
