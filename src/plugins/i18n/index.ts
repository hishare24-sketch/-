import { createI18n } from 'vue-i18n'
import ar from './locales/ar.json'
import en from './locales/en.json'
import themeConfig from '@themeConfig'

export const i18n = createI18n({
  legacy: false,
  locale: themeConfig.app.defaultLocale,
  fallbackLocale: 'en',
  messages: { ar, en },
})

export default i18n
