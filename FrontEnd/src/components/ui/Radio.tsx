import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer', className)}>
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <div className="h-4 w-4 rounded-full border border-border bg-white dark:bg-slate-900 transition-colors peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30"></div>
        <div className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
      </div>
      {label && <span className="text-sm font-medium text-body select-none">{label}</span>}
    </label>
  ),
)
Radio.displayName = 'Radio'
