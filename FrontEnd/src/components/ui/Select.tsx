import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-lg border border-border bg-surface px-3 py-3 pr-10 text-base text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          error && 'border-danger focus-visible:ring-danger/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  ),
)
Select.displayName = 'Select'
