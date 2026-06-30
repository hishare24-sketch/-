<script setup lang="ts">
import { reactive } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { PROJECT_ICONS, PROJECT_COLORS } from '@/constants'
import { uid } from '@/helpers/id'
import type { Project } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ show: boolean; project: Project | null }>()
const emit = defineEmits<{ (e: 'update:show', v: boolean): void }>()

const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()

const form = reactive<Project>(
  props.project
    ? { ...props.project }
    : {
        id: '',
        name: '',
        icon: PROJECT_ICONS[0],
        color: PROJECT_COLORS[0],
        balance: 0,
        type: settingsStore.lists.projectTypes[0],
        description: '',
      },
)

function close() {
  emit('update:show', false)
}

function save() {
  if (!form.name.trim()) return
  if (props.project) {
    projectsStore.updateProject({ ...form })
  } else {
    projectsStore.addProject({ ...form, id: uid('p') })
  }
  close()
}
</script>

<template>
  <ModalShell :title="project ? 'تعديل المشروع' : 'مشروع جديد'" @close="close">
    <div class="field">
      <label>اسم المشروع</label>
      <input v-model="form.name" type="text" placeholder="مثال: شركة النخيل" />
    </div>

    <div class="field">
      <label>النوع</label>
      <select v-model="form.type">
        <option v-for="t in settingsStore.lists.projectTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div class="field">
      <label>الأيقونة</label>
      <div class="picker">
        <button
          v-for="ic in PROJECT_ICONS"
          :key="ic"
          type="button"
          class="picker__item"
          :class="{ 'is-active': form.icon === ic }"
          @click="form.icon = ic"
        >
          {{ ic }}
        </button>
      </div>
    </div>

    <div class="field">
      <label>اللون</label>
      <div class="picker">
        <button
          v-for="c in PROJECT_COLORS"
          :key="c"
          type="button"
          class="picker__color"
          :class="{ 'is-active': form.color === c }"
          :style="{ background: c }"
          @click="form.color = c"
        />
      </div>
    </div>

    <div class="field">
      <label>الرصيد الافتتاحي (ر.س)</label>
      <input v-model.number="form.balance" type="number" placeholder="0" />
    </div>

    <div class="field">
      <label>الوصف (اختياري)</label>
      <textarea v-model="form.description" rows="2" placeholder="وصف موجز للمشروع"></textarea>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="close">إلغاء</button>
      <button class="app-btn" :disabled="!form.name.trim()" @click="save">
        {{ project ? 'حفظ التعديلات' : 'إضافة المشروع' }}
      </button>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-block-end: 16px;

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }

  input,
  select,
  textarea {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    color: var(--text);

    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

.picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__item {
    inline-size: 40px;
    block-size: 40px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    font-size: 20px;

    &.is-active {
      border-color: var(--primary);
      background: var(--primary-soft);
    }
  }

  &__color {
    inline-size: 32px;
    block-size: 32px;
    border-radius: 50%;
    border: 2px solid transparent;

    &.is-active {
      border-color: var(--text);
      transform: scale(1.1);
    }
  }
}
</style>
