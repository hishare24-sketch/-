// إعداد ESLint (flat config) — Vue 3 + TypeScript
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'legacy/**'] },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    rules: {
      // أسماء مكوّنات أحادية الكلمة مقبولة في هذا المشروع (Tooltip, Sparkline...)
      'vue/multi-word-component-names': 'off',
      // props اختيارية بنمط TS (?:) لا تحتاج قيمًا افتراضية إلزامية
      'vue/require-default-prop': 'off',
      // القوالب العربية الطويلة تُدار يدويًّا — لا قواعد تنسيق صارمة
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/attributes-order': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      // any مسموح تكتيكيًّا (يُشدَّد لاحقًا)
      '@typescript-eslint/no-explicit-any': 'off',
      // متغيّرات _ تُتجاهل
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
