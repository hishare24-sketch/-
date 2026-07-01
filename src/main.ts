import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from '@/router'
import i18n from '@/plugins/i18n'
import { persistencePlugin, hydrateStores } from '@/plugins/persistence'
import '@/plugins/vee-validate'
import '@/styles/styles.scss'

const app = createApp(App)

// تسجيل الإضافات بالترتيب المعتمد: Pinia ثم Router ثم i18n
const pinia = createPinia()
pinia.use(persistencePlugin) // حفظ تلقائي للمتاجر في IndexedDB
app.use(pinia)
app.use(router)
app.use(i18n)

// Axios يُستورد بعد Pinia لأنه يعتمد على المتاجر
import('@/plugins/axios')

// تمييه البيانات المحفوظة قبل التركيب (يبقى البذر عند غياب لقطة محفوظة)
hydrateStores().finally(() => app.mount('#app'))
