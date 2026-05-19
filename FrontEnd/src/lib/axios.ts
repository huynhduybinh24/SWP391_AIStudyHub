import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { ApiError } from '@/types/api'
import { useAuthStore } from '@/stores/authStore'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().tokens?.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
