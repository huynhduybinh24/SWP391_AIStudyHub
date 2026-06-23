import { apiClient } from '@/lib/axios'

export interface GoogleDriveStatus {
  connected: boolean
  googleEmail?: string
  connectedAt?: string
  storageMode: 'APP_OR_MOCK_DRIVE' | 'USER_DRIVE'
}

export interface GoogleDriveConnectUrlResponse {
  authorizationUrl: string
}

export async function getGoogleDriveStatus(): Promise<GoogleDriveStatus> {
  const response = await apiClient.get<GoogleDriveStatus>('/integrations/google-drive/status')
  return response.data
}

export async function connectGoogleDrive(): Promise<void> {
  const response = await apiClient.get<GoogleDriveConnectUrlResponse>('/integrations/google-drive/connect-url')
  if (response.data?.authorizationUrl) {
    window.location.href = response.data.authorizationUrl
  } else {
    throw new Error('Failed to retrieve authorization URL')
  }
}

export async function disconnectGoogleDrive(): Promise<void> {
  await apiClient.post('/integrations/google-drive/disconnect')
}
