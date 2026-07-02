<script setup lang="ts">
import { reactive } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSettingsStore } from '@/stores/SettingsStore'
import { PROJECT_ICONS, PROJECT_COLORS } from '@/constants'
import { uid } from '@/helpers/id'
import type { Project } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton, BaseField, BaseInput, BaseSelect, BaseTextarea } from '@/components/base'

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
    <BaseField label="اسم المشروع">
      <BaseInput v-model="form.name" placeholder="مثال: شركة النخيل" />
    </BaseField>

    <BaseField label="النوع">
      <BaseSelect v-model="form.type">
        <option v-for="t in settingsStore.lists.projectTypes" :key="t" :value="t">{{ t }}</option>
      </BaseSelect>
    </BaseField>

    <BaseField tag="div" label="الأيقونة">
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
    </BaseField>

    <BaseField tag="div" label="اللون">
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
    </BaseField>

    <BaseField label="الرصيد الافتتاحي (ر.س)">
      <BaseInput v-model.number="form.balance" type="number" placeholder="0" />
    </BaseField>

    <BaseField label="الوصف (اختياري)">
      <BaseTextarea v-model="form.description" :rows="2" placeholder="وصف موجز للمشروع" />
    </BaseField>

    <template #footer>
      <BaseButton variant="ghost" @click="close">إلغاء</BaseButton>
      <BaseButton :disabled="!form.name.trim()" @click="save">
        {{ project ? 'حفظ التعديلات' : 'إضافة المشروع' }}
      </BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
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
