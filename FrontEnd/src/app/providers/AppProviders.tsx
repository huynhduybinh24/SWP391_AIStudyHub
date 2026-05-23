import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/app/router/routes'
import { ToastContainer } from '@/components/ui/Toast'
import { ThemeProvider } from '@/features/settings/components/ThemeProvider'
import { LanguageProvider } from '@/context/LanguageContext'

export function AppProviders() {
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
