import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { ApiError } from '@/types/api'

export function useAsyncQuery<TData>(
  options: UseQueryOptions<TData, ApiError>,
) {
  return useQuery(options)
}
