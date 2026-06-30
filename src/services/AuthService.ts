import type { AxiosPromise } from 'axios'
import axios from 'axios'
import type { LoginPayload } from '@/interfaces/Auth'

// خدمة المصادقة (جاهزة للربط بـ backend)
class AuthService {
  login(payload: LoginPayload): AxiosPromise {
    return axios.post('auth/login', payload)
  }

  logout(): AxiosPromise {
    return axios.post('auth/logout')
  }

  getPermissions(): AxiosPromise {
    return axios.get('auth/getMyPermissions')
  }
}

export const authService = new AuthService()
export default authService
