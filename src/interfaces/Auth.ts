// نموذج المستخدم والمصادقة (هيكل جاهز — غير مُفعّل إجبارياً حتى يتوفّر backend)
export interface DropdownMenuItem {
  id: number | string
  name: string
}

export interface User {
  id: number
  uuid: string
  name: string
  email: string
  image_path: string
  token: string
  created_at: string
  permissions: string[]
  roles: DropdownMenuItem[]
  apps: string[]
}

export interface LoginPayload {
  email: string
  password: string
}
