import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  icon?: ReactNode
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function SummaryCard({ title, icon, onClick, children, className }: SummaryCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={onClick ? { scale: 1.015, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 select-none flex flex-col justify-between min-h-[160px]",
        onClick && "cursor-pointer hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500/80",
        className
      )}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</span>
        {icon && (
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {children}
      </div>
    </motion.div>
  )
}
export default SummaryCard
