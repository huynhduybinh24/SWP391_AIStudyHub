import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { calculateStorageUsage } from '@/utils/storageFormat'

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
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isStorage = item.id === 'storageUsed'

  const totalMb = getStorageLimitByPlan(user?.plan)
  const totalGb = totalMb / 1024
  const usedMb = user?.plan === 'pro' 
    ? 2457.6 
    : (user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')
      ? 8192
      : 8
  const usedGb = usedMb / 1024
  const usageInfo = calculateStorageUsage(usedMb, totalMb)
  const percentage = usageInfo.percentage

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
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
      className={`flex flex-col justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm cursor-pointer hover:shadow-md transition-all select-none min-h-[160px] ${
        isStorage 
          ? 'hover:border-indigo-500 dark:hover:border-indigo-500/80 hover:shadow-indigo-500/5' 
          : 'hover:border-blue-500 dark:hover:border-blue-500/80 hover:shadow-blue-500/5'
      }`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between w-full">
        <div className={`p-2.5 rounded-xl shrink-0 ${
          isStorage 
            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' 
            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
        }`}>
          <Icon className="size-5" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails()
          }}
          type="button"
          aria-label={`${t.profile.viewDetails} for ${item.label}`}
          className={`text-[11px] font-bold transition-colors uppercase tracking-wider cursor-pointer py-1 px-2 rounded-md ${
            isStorage 
              ? 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-55/40 dark:hover:bg-indigo-950/20' 
              : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-55/40 dark:hover:bg-blue-950/20'
          }`}
        >
          {t.profile.viewDetails}
        </button>
      </div>

      {/* Value and Description Section */}
      <div className="mt-4 space-y-1">
        <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
          isStorage 
            ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400' 
            : 'text-blue-600 dark:text-blue-500'
        }`}>
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
          <div className="pt-3 w-full space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-wide uppercase text-slate-450 dark:text-slate-500">
              <span>{percentage}% {language === 'vi' ? 'Đã dùng' : 'Used'}</span>
              <span>{totalGb - usedGb < 0.5 ? 'Full' : `${(totalGb - usedGb).toFixed(1)} GB ${language === 'vi' ? 'trống' : 'free'}`}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-850/20" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full transition-all duration-500 ${
                  percentage > 90 
                    ? 'bg-gradient-to-r from-rose-500 to-red-600' 
                    : percentage > 75 
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500' 
                      : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

