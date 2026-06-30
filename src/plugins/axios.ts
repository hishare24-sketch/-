import axios from 'axios'
import { useAuthStore } from '@/stores/AuthStore'

// إعداد Axios الأساسي — يحقن التوكن ويعالج 401 (جاهز للربط بـ backend لاحقاً)
axios.defaults.baseURL = import.meta.env.VITE_BASE_API_URL || '/api'

axios.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  const token = authStore.getToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['platform'] = 'dashboard'
  return config
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const authStore = useAuthStore()
      authStore.clearAuthUser()
    }
    return Promise.reject(error)
  },
)

export default axios
