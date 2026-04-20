import { api } from './client'

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export const authApi = {
  login: (dto: LoginDto) =>
    api.post<AuthResponse>('/auth/login', dto),
}