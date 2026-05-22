import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/app/router/routes'
import { ToastContainer } from '@/components/ui/Toast'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

export function AppProviders() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  useEffect(() => {
    // Initial theme sync when the application mounts or theme changes
    setTheme(theme)
  }, [theme, setTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ToastContainer />
    </QueryClientProvider>
  )
}
