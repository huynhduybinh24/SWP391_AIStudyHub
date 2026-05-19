import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'size-8 animate-spin rounded-full border-2 border-primary border-t-transparent',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}
