import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from '@/router'
import i18n from '@/plugins/i18n'
import '@/plugins/vee-validate'
import '@/styles/styles.scss'

const app = createApp(App)

// تسجيل الإضافات بالترتيب المعتمد: Pinia ثم Router ثم i18n
app.use(createPinia())
app.use(router)
app.use(i18n)

// Axios يُستورد بعد Pinia لأنه يعتمد على المتاجر
import('@/plugins/axios')

app.mount('#app')
