<script setup lang="ts">
import type { Attachment } from '@/interfaces/models'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'

// حقل المرفقات — معاينة داخل الجلسة (الرفع الفعلي عبر backend لاحقاً)
const props = withDefaults(
  defineProps<{ modelValue?: Attachment[]; readonly?: boolean }>(),
  { modelValue: () => [], readonly: false },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: Attachment[]): void }>()

// قراءة الملف كـ base64 ليُحفظ ويدوم (لا معاينة جلسة فقط)
function readAsDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(f)
  })
}

async function onFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  const files = Array.from(input.files)
  input.value = ''
  const added: Attachment[] = await Promise.all(
    files.map(async (f) => {
      const isImage = f.type.startsWith('image/')
      const dataUrl = await readAsDataUrl(f)
      return {
        id: uid('att'),
        name: f.name,
        kind: isImage ? 'image' : 'file',
        size: `${Math.round(f.size / 1024)} KB`,
        fileType: f.type,
        uploadDate: today(),
        dataUrl,
        preview: isImage ? dataUrl : undefined,
      } as Attachment
    }),
  )
  emit('update:modelValue', [...props.modelValue, ...added])
}

function remove(id: string) {
  emit('update:modelValue', props.modelValue.filter((a) => a.id !== id))
}
</script>

<template>
  <div class="attachments">
    <div v-if="modelValue.length" class="attachments__list">
      <div v-for="att in modelValue" :key="att.id" class="attachment">
        <img v-if="att.kind === 'image' && att.preview" :src="att.preview" :alt="att.name" />
        <span v-else class="attachment__icon">📎</span>
        <span class="attachment__name">{{ att.name }}</span>
        <span class="attachment__size">{{ att.size }}</span>
        <button v-if="!readonly" class="attachment__remove" @click="remove(att.id)">✕</button>
      </div>
    </div>

    <label v-if="!readonly" class="attachments__add">
      <input type="file" multiple hidden @change="onFiles" />
      ＋ إضافة مرفق
    </label>
  </div>
</template>

<style lang="scss" scoped>
.attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__add {
    align-self: flex-start;
    padding: 8px 14px;
    border: 1px dashed var(--border);
    border-radius: var(--radius-sm);
    color: var(--primary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
}

.attachment {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: var(--radius-sm);

  img {
    inline-size: 32px;
    block-size: 32px;
    object-fit: cover;
    border-radius: 6px;
  }

  &__icon {
    font-size: 18px;
  }

  &__name {
    flex: 1;
    font-size: 13px;
  }

  &__size {
    font-size: 12px;
    color: var(--text-muted);
  }

  &__remove {
    border: none;
    background: transparent;
    color: var(--error);
    font-size: 13px;
  }
}
</style>
