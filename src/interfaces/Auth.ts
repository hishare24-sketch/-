// نموذج المستخدم والمصادقة
import type { MemberRole } from '@/interfaces/models'

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
  /** الدور الأساسي — يشتق منه مجموعة الصلاحيات (وضع عدم وجود backend) */
  role: MemberRole
}

export interface LoginPayload {
  email: string
  password: string
}
