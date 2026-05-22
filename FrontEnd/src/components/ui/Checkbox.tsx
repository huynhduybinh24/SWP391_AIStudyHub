import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded border border-border bg-white transition-colors peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"></div>
          <svg
            className="absolute inset-0 h-4 w-4 pointer-events-none stroke-white opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        {label && <span className="text-sm font-medium text-body select-none">{label}</span>}
      </label>
      {error && <p className="ml-6 text-sm text-danger">{error}</p>}
    </div>
  ),
)
Checkbox.displayName = 'Checkbox'
