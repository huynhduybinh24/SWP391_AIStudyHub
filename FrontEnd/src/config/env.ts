export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://lumiedu-backend.onrender.com/api',
  FREE_STORAGE_LIMIT: 1,
  PRO_STORAGE_LIMIT: 5,
  PREMIUM_STORAGE_LIMIT: 50,
} as const
