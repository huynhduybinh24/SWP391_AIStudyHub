import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-3 py-3 text-base text-foreground',
          'placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          error && 'border-danger focus-visible:ring-danger/30',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  ),
)
Input.displayName = 'Input'
