import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PaymentInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const PaymentInput = forwardRef<HTMLInputElement, PaymentInputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-11 rounded-lg bg-[#f5f7fb] dark:bg-slate-950 border border-slate-200/85 dark:border-slate-800 px-3.5 text-sm font-semibold text-slate-900 dark:text-white transition-all placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 dark:focus:ring-[#2563eb]/5',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10 dark:focus:ring-red-500/5',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-semibold mt-1">
            {error}
          </p>
        )}
      </div>
    )
  }
)

PaymentInput.displayName = 'PaymentInput'
