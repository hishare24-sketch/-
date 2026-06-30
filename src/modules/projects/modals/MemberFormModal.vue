<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useProjectsStore } from '@/stores/ProjectsStore'
import { ROLES, PERMISSIONS, ROLE_PERMS } from '@/constants'
import { uid } from '@/helpers/id'
import type { Member, MemberRole } from '@/interfaces/models'
import ModalShell from '@/components/shared/ModalShell.vue'

const props = defineProps<{ projectId: string; member: Member | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const projectsStore = useProjectsStore()

const form = reactive({
  name: props.member?.name ?? '',
  email: props.member?.email ?? '',
  role: (props.member?.role ?? 'member') as MemberRole,
})
const perms = ref<string[]>(props.member?.permissions ? [...props.member.permissions] : [...ROLE_PERMS.member])

function pickRole(r: MemberRole) {
  form.role = r
  perms.value = [...ROLE_PERMS[r]]
}
function togglePerm(id: string) {
  if (form.role === 'owner') return
  perms.value = perms.value.includes(id)
    ? perms.value.filter((x) => x !== id)
    : [...perms.value, id]
}

function save() {
  if (!form.name.trim() || !form.email.trim()) return
  const finalPerms = form.role === 'owner' ? ROLE_PERMS.owner : perms.value
  if (props.member) {
    projectsStore.updateMember({ ...props.member, name: form.name.trim(), email: form.email.trim(), role: form.role, permissions: finalPerms })
  } else {
    projectsStore.addMember({
      id: uid('m'),
      projectId: props.projectId,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      permissions: finalPerms,
      balance: 0,
      status: 'active',
    })
  }
  emit('close')
}
</script>

<template>
  <ModalShell :title="member ? 'تعديل العضو' : 'إضافة عضو'" @close="emit('close')">
    <div class="field">
      <label>اسم العضو</label>
      <input v-model="form.name" type="text" placeholder="مثال: أحمد العلي" />
    </div>
    <div class="field">
      <label>البريد الإلكتروني</label>
      <input v-model="form.email" type="email" placeholder="name@example.com" />
    </div>

    <div class="field">
      <label>نوع التمكين (الدور)</label>
      <div class="roles">
        <button
          v-for="r in ROLES"
          :key="r.id"
          type="button"
          class="role"
          :class="{ 'is-active': form.role === r.id }"
          :style="form.role === r.id ? { borderColor: r.color, background: r.color + '12' } : {}"
          @click="pickRole(r.id)"
        >
          <span class="role__dot" :style="{ background: r.color }" />
          <div class="role__info">
            <span class="role__label">{{ r.label }}</span>
            <span class="role__desc">{{ r.desc }}</span>
          </div>
          <span v-if="form.role === r.id" class="role__check" :style="{ color: r.color }">✓</span>
        </button>
      </div>
    </div>

    <div class="field">
      <label>الصلاحيات التفصيلية</label>
      <div class="perms">
        <button
          v-for="p in PERMISSIONS"
          :key="p.id"
          type="button"
          class="perm"
          :class="{ 'is-on': perms.includes(p.id), 'is-locked': form.role === 'owner' }"
          @click="togglePerm(p.id)"
        >
          <span>{{ p.label }}</span>
          <span class="perm__switch" :class="{ 'is-on': perms.includes(p.id) }" />
        </button>
      </div>
      <p v-if="form.role === 'owner'" class="hint">المالك يملك جميع الصلاحيات تلقائياً.</p>
    </div>

    <template #footer>
      <button class="app-btn app-btn--ghost" @click="emit('close')">إلغاء</button>
      <button class="app-btn" :disabled="!form.name.trim() || !form.email.trim()" @click="save">
        {{ member ? 'حفظ التعديلات' : 'إضافة العضو' }}
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

  input {
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

.roles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  text-align: start;
  cursor: pointer;

  &__dot {
    inline-size: 10px;
    block-size: 10px;
    border-radius: 50%;
    flex-shrink: 0;
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

  &__check {
    font-weight: 700;
  }
}

.perms {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: inherit;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;

  &.is-on {
    background: var(--primary-soft);
  }

  &.is-locked {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &__switch {
    inline-size: 36px;
    block-size: 20px;
    border-radius: 99px;
    background: var(--border);
    position: relative;
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      inset-block-start: 2px;
      inset-inline-end: 2px;
      inline-size: 16px;
      block-size: 16px;
      border-radius: 50%;
      background: #fff;
      transition: inset-inline-end 0.15s;
    }

    &.is-on {
      background: var(--primary);

      &::after {
        inset-inline-end: 18px;
      }
    }
  }
}

.hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-block-start: 6px;
}
</style>
