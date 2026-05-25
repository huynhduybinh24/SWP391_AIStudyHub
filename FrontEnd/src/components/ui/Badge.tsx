import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-icon-bg text-primary dark:bg-slate-800 dark:text-blue-400',
  pdf: 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
  word: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  image: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
} as const

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
