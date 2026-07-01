<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { MEMBER_TXN_TYPES, CURRENT_USER } from '@/constants'
import { uid } from '@/helpers/id'
import { today } from '@/helpers/date'
import { fmtNum } from '@/helpers/format'
import type { MemberTxnType, Attachment } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'
import AttachmentsField from '@/components/shared/AttachmentsField.vue'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()

// أعضاء المشروع (عدا المالك)
const projMembers = computed(() =>
  projectsStore.membersByProject(props.projectId).filter((m) => m.role !== 'owner'),
)

const form = reactive({
  memberId: projMembers.value[0]?.id ?? '',
  type: 'custody' as MemberTxnType,
  amount: null as number | null,
  note: '',
  attachments: [] as Attachment[],
})

const valid = computed(() => form.memberId && form.amount != null && form.amount > 0)

function save() {
  if (!valid.value) return
  const info = MEMBER_TXN_TYPES.find((t) => t.id === form.type)!
  projectsStore.addMemberTxn({
    id: uid('mt'),
    projectId: props.projectId,
    memberId: form.memberId,
    type: form.type,
    amount: Number(form.amount),
    note: form.note.trim() || undefined,
    date: today(),
    status: 'accepted',
    direction: info.direction,
    attachments: form.attachments,
    createdBy: CURRENT_USER,
  })
  emit('close')
}
</script>

<template>
  <ModalShell title="حركة رصيد عضو" @close="emit('close')">
    <div v-if="!projMembers.length" class="empty">
      لا يوجد أعضاء (غير المالك) في هذا المشروع. أضِف عضواً أولاً.
    </div>

    <template v-else>
      <div class="field">
        <label>العضو</label>
        <select v-model="form.memberId">
          <option v-for="m in projMembers" :key="m.id" :value="m.id">
            {{ m.name }} (رصيد: {{ fmtNum(m.balance ?? 0) }})
          </option>
        </select>
      </div>

      <div class="field">
        <label>نوع الحركة</label>
        <div class="types">
          <button
            v-for="t in MEMBER_TXN_TYPES"
            :key="t.id"
            type="button"
            class="type"
            :class="{ 'is-active': form.type === t.id }"
            @click="form.type = t.id"
          >
            <span class="type__icon">{{ t.icon }}</span>
            <div class="type__info">
              <span class="type__label">{{ t.label }}</span>
              <span class="type__desc">{{ t.desc }}</span>
            </div>
            <span class="type__dir" :class="t.direction">
              {{ t.direction === 'to_member' ? '+ للعضو' : '− من العضو' }}
            </span>
          </button>
        </div>
      </div>

      <div class="field">
        <label>المبلغ (ر.س)</label>
        <input v-model.number="form.amount" type="number" placeholder="0" />
      </div>

      <div class="field">
        <label>ملاحظات (اختياري)</label>
        <textarea v-model="form.note" rows="2"></textarea>
      </div>

      <div class="field">
        <label>المرفقات (صور / ملفات)</label>
        <AttachmentsField v-model="form.attachments" />
      </div>
    </template>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button v-if="projMembers.length" class="app-btn" :disabled="!valid" @click="save">حفظ الحركة</button>
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

    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

.empty {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}

.types {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  text-align: start;
  cursor: pointer;

  &.is-active {
    border-color: var(--primary);
    background: var(--primary-soft);
  }

  &__icon {
    font-size: 20px;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
  }

  &__desc {
    font-size: 11px;
    color: var(--text-muted);
  }

  &__dir {
    font-size: 11px;
    font-weight: 600;

    &.to_member {
      color: var(--ok-text);
    }

    &.from_member {
      color: var(--danger-text);
    }
  }
}
</style>
