import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-base text-slate-900',
          'placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30',
          'dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500',
          'min-h-[100px] resize-y',
          error && 'border-danger focus-visible:ring-danger/30',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  ),
)
Textarea.displayName = 'Textarea'
