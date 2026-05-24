export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  FREE_STORAGE_LIMIT: 10,
  PRO_STORAGE_LIMIT: 50,
} as const
