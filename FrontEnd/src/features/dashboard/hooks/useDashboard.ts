import { useAsyncQuery } from '@/hooks/useAsyncQuery'
import { dashboardService } from '@/features/dashboard/services/dashboardService'
import { useAuthStore } from '@/stores/authStore'

export function useDashboard() {
  const user = useAuthStore((s) => s.user)
  return useAsyncQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => dashboardService.getDashboard(),
    enabled: !!user?.id,
  })
}
