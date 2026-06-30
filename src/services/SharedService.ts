import type { AxiosPromise } from 'axios'
import axios from 'axios'

// خدمة مشتركة: حذف جماعي، تبديل التفعيل، الترتيب (جاهزة للربط بـ backend)
class SharedService {
  bulkDelete(model: string, ids: (number | string)[]): AxiosPromise {
    return axios.post(`${model}/bulk-delete`, { ids })
  }

  toggleActivation(model: string, id: number | string): AxiosPromise {
    return axios.patch(`${model}/${id}/toggle-activation`)
  }

  sort(model: string, ids: (number | string)[]): AxiosPromise {
    return axios.post(`${model}/sort`, { ids })
  }
}

export const sharedService = new SharedService()
export default sharedService
