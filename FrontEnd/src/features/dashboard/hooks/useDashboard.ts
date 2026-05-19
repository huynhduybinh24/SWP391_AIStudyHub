import { useAsyncQuery } from '@/hooks/useAsyncQuery'
import { dashboardService } from '@/features/dashboard/services/dashboardService'

export function useDashboard() {
  return useAsyncQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  })
}
