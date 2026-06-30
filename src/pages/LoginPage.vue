<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import themeConfig from '@themeConfig'

const { t } = useI18n()
const router = useRouter()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

// تسجيل دخول وهمي (هيكل جاهز) — يدخل مباشرة للوحة التحكم
function submit() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
    router.push({ name: 'home' })
  }, 400)
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
        <input v-model="email" type="email" placeholder="you@example.com" />
      </label>

      <label class="field">
        <span>{{ t('auth.password') }}</span>
        <input v-model="password" type="password" placeholder="••••••••" />
      </label>

      <button class="app-btn" type="submit" :disabled="isLoading">
        {{ isLoading ? '...' : t('auth.enter') }}
      </button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.login-card {
  inline-size: 100%;
  max-inline-size: 380px;
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

    &:focus {
      outline: none;
      border-color: var(--primary);
    }
  }
}
</style>
