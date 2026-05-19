import { Spinner } from '@/components/ui/Spinner'

export function LoadingOverlay({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
      <Spinner />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
