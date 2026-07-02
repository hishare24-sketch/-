<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/AuthStore'
import { BaseButton } from '@/components/base'
import { DEMO_USERS, ROLES } from '@/constants'
import themeConfig from '@themeConfig'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')

function redirectAfterLogin() {
  const redirect = route.query.redirect as string | undefined
  if (redirect) router.replace(redirect)
  else router.replace({ name: 'dashboard-page' })
}

function submit() {
  error.value = ''
  isLoading.value = true
  // محاكاة تأخير الشبكة
  setTimeout(() => {
    const res = authStore.login({ email: email.value, password: password.value })
    isLoading.value = false
    if (res.ok) redirectAfterLogin()
    else error.value = res.error ?? 'تعذّر تسجيل الدخول'
  }, 350)
}

// دخول سريع بحساب تجريبي (وضع بلا backend)
function quickLogin(demoEmail: string) {
  email.value = demoEmail
  password.value = '123456'
  submit()
}

function roleLabel(role: string) {
  return ROLES.find((r) => r.id === role)?.label ?? role
}
</script>

<template>
  <div class="login-card app-card">
    <div class="login-card__brand">
      <span class="login-card__logo">{{ themeConfig.app.logo }}</span>
      <h1>{{ t('app.name') }}</h1>
      <p>{{ t('app.subtitle') }}</p>
    </div>

    <form class="login-form" @submit.prevent="submit">
      <label class="field">
        <span>{{ t('auth.email') }}</span>
        <input v-model="email" type="email" placeholder="you@example.com" autocomplete="username" />
      </label>

      <label class="field">
        <span>{{ t('auth.password') }}</span>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
        />
      </label>

      <p v-if="error" class="login-error">⚠️ {{ error }}</p>

      <BaseButton type="submit" block :disabled="isLoading">
        {{ isLoading ? '...' : t('auth.enter') }}
      </BaseButton>
    </form>

    <div class="login-demo">
      <span class="login-demo__hint">حسابات تجريبية للدخول السريع</span>
      <div class="login-demo__grid">
        <button
          v-for="u in DEMO_USERS"
          :key="u.email"
          type="button"
          class="login-demo__btn"
          :disabled="isLoading"
          @click="quickLogin(u.email)"
        >
          <strong>{{ roleLabel(u.role) }}</strong>
          <small>{{ u.name }}</small>
        </button>
      </div>
      <span class="login-demo__pass">كلمة المرور لكل الحسابات: <code>123456</code></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-card {
  inline-size: 100%;
  max-inline-size: 400px;
  padding: 32px;

  &__brand {
    text-align: center;
    margin-block-end: 24px;

    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      margin-block: 8px 2px;
    }

    p {
      color: var(--text-muted);
      font-size: 13px;
    }
  }

  &__logo {
    font-size: 40px;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);

  input {
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 14px;
    color: var(--text);
    inline-size: 100%;

    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}

.login-error {
  margin: 0;
  padding: 9px 12px;
  border-radius: var(--radius-sm);
  background: var(--danger-bg);
  color: var(--danger-text);
  font-size: 13px;
  font-weight: 500;
}

.login-demo {
  margin-block-start: 24px;
  padding-block-start: 20px;
  border-block-start: 1px solid var(--border);
  text-align: center;

  &__hint {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-block-end: 12px;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  &__btn {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--bg);
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    strong {
      font-size: 13px;
      color: var(--text);
    }

    small {
      font-size: 11px;
      color: var(--text-muted);
    }

    &:hover:not(:disabled) {
      border-color: var(--primary);
      background: var(--primary-soft);
    }

    &:disabled {
      opacity: 0.6;
      cursor: default;
    }
  }

  &__pass {
    display: block;
    margin-block-start: 12px;
    font-size: 11px;
    color: var(--text-muted);

    code {
      font-family: monospace;
      background: var(--surface-2);
      padding: 1px 6px;
      border-radius: 4px;
    }
  }
}
</style>
