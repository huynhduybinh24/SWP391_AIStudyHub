import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

const getProductionApiUrl = (): string => {
  const customViteUrl = import.meta.env.VITE_API_BASE_URL
  if (customViteUrl && customViteUrl.trim()) {
    return customViteUrl.trim()
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://swp391aistudyhub-production.up.railway.app/api'
  }
  return env.apiBaseUrl || 'https://swp391aistudyhub-production.up.railway.app/api'
}

export const apiClient = axios.create({
  baseURL: getProductionApiUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getProductionApiUrl()
  const token = useAuthStore.getState().tokens?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const user = useAuthStore.getState().user
  if (user && user.id) {
    config.headers['X-User-Id'] = String(user.id)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError['body']>) => {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const message = body?.message ?? error.message ?? 'Request failed'

    if (status === 401) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(new ApiError(message, status, body))
  },
)
