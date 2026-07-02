<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { useSurveysStore } from '@/stores/SurveysStore'
import { importXLSX } from '@/helpers/export'
import type { Survey } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import { BaseButton, BaseField, BaseInput } from '@/components/base'

const props = defineProps<{ survey: Survey }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()
const surveysStore = useSurveysStore()

const liveSurvey = computed(() => surveysStore.byId(props.survey.id) ?? props.survey)
const respondents = computed(() => liveSurvey.value.respondents ?? [])

type Tab = 'members' | 'manual' | 'excel'
const tab = ref<Tab>('members')

// من الأعضاء
const allMembers = computed(() => projectsStore.members)
const addedNames = computed(() => new Set(respondents.value.map((r) => r.name)))
function addMember(name: string, email: string) {
  surveysStore.addRespondent(props.survey.id, { name, email, source: 'member', responded: false })
}

// يدوي
const manual = reactive({ name: '', email: '' })
function addManual() {
  if (!manual.name.trim()) return
  surveysStore.addRespondent(props.survey.id, {
    name: manual.name.trim(),
    email: manual.email.trim() || undefined,
    source: 'manual',
    responded: false,
  })
  manual.name = ''
  manual.email = ''
}

// استيراد Excel
const importing = ref(false)
const importMsg = ref('')
async function onExcel(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importing.value = true
  importMsg.value = ''
  try {
    const rows = await importXLSX(file)
    let count = 0
    rows.forEach((row) => {
      // ابحث عن أعمدة الاسم/البريد بمرونة (عربي/إنجليزي)
      const name = row['الاسم'] ?? row['اسم'] ?? row['name'] ?? row['Name'] ?? Object.values(row)[0]
      const email = row['البريد'] ?? row['الإيميل'] ?? row['email'] ?? row['Email']
      if (name) {
        surveysStore.addRespondent(props.survey.id, {
          name: String(name).trim(),
          email: email ? String(email).trim() : undefined,
          source: 'excel',
          responded: false,
        })
        count++
      }
    })
    importMsg.value = `✅ تمت إضافة ${count} مستبين من الملف`
  } catch (err) {
    importMsg.value = `⚠️ ${(err as Error).message}`
  } finally {
    importing.value = false
    input.value = ''
  }
}

const sourceLabel: Record<string, string> = { member: 'عضو', manual: 'يدوي', excel: 'Excel', external: 'خارجي' }
</script>

<template>
  <ModalShell :title="`المستبينون · ${survey.title}`" wide @close="emit('close')">
    <div class="tabs">
      <button class="tabs__btn" :class="{ 'is-active': tab === 'members' }" @click="tab = 'members'">👥 من الأعضاء</button>
      <button class="tabs__btn" :class="{ 'is-active': tab === 'manual' }" @click="tab = 'manual'">✍️ إضافة يدوية</button>
      <button class="tabs__btn" :class="{ 'is-active': tab === 'excel' }" @click="tab = 'excel'">📄 استيراد Excel</button>
    </div>

    <!-- من الأعضاء -->
    <div v-if="tab === 'members'" class="members">
      <div v-for="m in allMembers" :key="m.id" class="mrow">
        <span class="mrow__name">{{ m.name }}</span>
        <span class="mrow__email">{{ m.email }}</span>
        <button v-if="addedNames.has(m.name)" class="mrow__added" disabled>✓ مُضاف</button>
        <BaseButton v-else variant="outlined" class="mrow__add" @click="addMember(m.name, m.email)">＋ إضافة</BaseButton>
      </div>
    </div>

    <!-- يدوي -->
    <div v-else-if="tab === 'manual'" class="manual">
      <BaseField label="الاسم"><BaseInput v-model="manual.name" placeholder="اسم المستبين" /></BaseField>
      <BaseField label="البريد (اختياري)"><BaseInput v-model="manual.email" type="email" placeholder="name@example.com" /></BaseField>
      <BaseButton :disabled="!manual.name.trim()" @click="addManual">＋ إضافة المستبين</BaseButton>
    </div>

    <!-- Excel -->
    <div v-else class="excel">
      <label class="excel__drop">
        <input type="file" accept=".xlsx,.xls,.csv" hidden @change="onExcel" />
        <span class="excel__icon">📄</span>
        <span>{{ importing ? 'جارٍ القراءة...' : 'اختر ملف Excel (عمود "الاسم" و"البريد")' }}</span>
      </label>
      <p v-if="importMsg" class="excel__msg">{{ importMsg }}</p>
      <p class="excel__hint">يدعم .xlsx / .csv — يبحث عن أعمدة بأسماء: الاسم / name و البريد / email.</p>
    </div>

    <!-- قائمة المستبينين الحاليين -->
    <div class="current">
      <span class="current__label">المستبينون الحاليون ({{ respondents.length }})</span>
      <div v-if="!respondents.length" class="current__empty">لا يوجد مستبينون بعد.</div>
      <div v-for="r in respondents" :key="r.id" class="resp">
        <span class="resp__status" :class="{ 'is-done': r.responded }">{{ r.responded ? '✅' : '⏳' }}</span>
        <div class="resp__info">
          <span class="resp__name">{{ r.name }}</span>
          <span class="resp__email">{{ r.email ?? '—' }}</span>
        </div>
        <span class="resp__source">{{ sourceLabel[r.source] }}</span>
        <button class="resp__del" aria-label="حذف المستجيب" @click="surveysStore.removeRespondent(survey.id, r.id)">✕</button>
      </div>
    </div>

    <template #footer>
      <BaseButton @click="emit('close')">إغلاق</BaseButton>
    </template>
  </ModalShell>
</template>

<style lang="scss" scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-block-end: 18px;
  background: var(--bg);
  padding: 4px;
  border-radius: 12px;
  flex-wrap: wrap;

  &__btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;

    &.is-active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }
  }
}

.members {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-block-size: 240px;
  overflow-y: auto;
}

.mrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-block-end: 1px solid var(--border);

  &__name { font-weight: 600; font-size: 13px; }
  &__email { flex: 1; font-size: 12px; color: var(--text-muted); }
  &__add { padding: 5px 12px; font-size: 12px; }
  &__added { border: none; background: var(--ok-bg); color: var(--ok-text); border-radius: 6px; padding: 5px 12px; font-size: 12px; font-weight: 600; }
}

.manual {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.excel {
  &__drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px;
    border: 2px dashed var(--border);
    border-radius: 14px;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 13px;
    background: var(--bg);

    &:hover { border-color: var(--primary); }
  }

  &__icon { font-size: 30px; }
  &__msg { margin-block-start: 12px; font-size: 13px; font-weight: 600; }
  &__hint { margin-block-start: 8px; font-size: 12px; color: var(--text-muted); }
}

.current {
  margin-block-start: 22px;
  padding-block-start: 18px;
  border-block-start: 1px solid var(--border);

  &__label { display: block; font-size: 13px; font-weight: 700; margin-block-end: 12px; }
  &__empty { font-size: 13px; color: var(--text-muted); }
}

.resp {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;

  &__status { font-size: 14px; }
  &__info { flex: 1; display: flex; flex-direction: column; }
  &__name { font-weight: 600; font-size: 13px; }
  &__email { font-size: 11px; color: var(--text-muted); }
  &__source { font-size: 11px; background: var(--bg); padding: 2px 10px; border-radius: 20px; color: var(--text-muted); }
  &__del { border: none; background: transparent; color: var(--text-muted); font-size: 13px; &:hover { color: var(--error); } }
}
</style>
