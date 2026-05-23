import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

export interface StatisticItem {
  id: string
  label: string
  value: string | number
  description: string
  route: string
}

interface StatisticsCardProps {
  item: StatisticItem
  icon: LucideIcon
  onClick: () => void
  onViewDetails: () => void
}

export function StatisticsCard({ item, icon: Icon, onClick, onViewDetails }: StatisticsCardProps) {
  const isStorage = item.id === 'storageUsed'

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      role="button"
      tabIndex={0}
      aria-label={`View ${item.label} stats`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500/80 transition-all select-none min-h-[160px]"
    >
      {/* Top Section */}
      <div className="flex items-start justify-between w-full">
        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
          <Icon className="size-5" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          type="button"
          aria-label={`View details for ${item.label}`}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors uppercase tracking-wider cursor-pointer py-1 px-2 rounded-md hover:bg-blue-50/55 dark:hover:bg-blue-950/20"
        >
          View Details
        </button>
      </div>

      {/* Value and Description Section */}
      <div className="mt-4 space-y-1">
        <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight">
          {item.value}
        </p>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-105">
            {item.label}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {item.description}
          </p>
        </div>

        {/* Progress Bar for Storage Used Card */}
        {isStorage && (
          <div className="pt-2 w-full">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={36} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: '36%' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
