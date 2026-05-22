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
          'w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 pr-10 text-base text-slate-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
          'dark:bg-slate-800 dark:border-slate-700 dark:text-white',
          error && 'border-danger focus-visible:ring-danger/30',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  ),
)
Select.displayName = 'Select'
