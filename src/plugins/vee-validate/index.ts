import { defineRule, configure } from 'vee-validate'
import { required, email, min, max, confirmed } from '@vee-validate/rules'
import { localize, setLocale } from '@vee-validate/i18n'
import ar from '@vee-validate/i18n/dist/locale/ar.json'
import en from '@vee-validate/i18n/dist/locale/en.json'

// تسجيل قواعد التحقق العامة
defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('confirmed', confirmed)

configure({
  generateMessage: localize({ ar, en }),
  validateOnInput: true,
})

setLocale('ar')

export {}
