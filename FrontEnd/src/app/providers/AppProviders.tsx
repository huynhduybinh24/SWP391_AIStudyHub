import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/app/router/routes'
import { ToastContainer } from '@/components/ui/Toast'
import { ThemeProvider } from '@/features/settings/components/ThemeProvider'
import { LanguageProvider } from '@/context/LanguageContext'
import { realtimeNotificationManager } from '@/features/notifications/services/notificationRealtime'
import { checkAndPurgeExpiredLogs } from '@/services/activityLogService'

export function AppProviders() {
  useEffect(() => {
    // Establish connection to real WebSocket or fallback to simulator on mount
    realtimeNotificationManager.connect()

    // Run initial expired logs check
    checkAndPurgeExpiredLogs()

    // Run background expired logs check every 30 seconds
    const interval = setInterval(() => {
      checkAndPurgeExpiredLogs()
    }, 30000)

    return () => {
      realtimeNotificationManager.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <RouterProvider router={router} />
          <ToastContainer />
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

