import { CalendarDays, Sparkles, BookOpen, Clock } from 'lucide-react'
import { useProfileStore } from '../stores/profileStore'
import { motion } from 'framer-motion'

export function StatsCard() {
  const { statistics } = useProfileStore()

  const items = [
    {
      label: 'STUDY PLANS',
      value: statistics.studyPlans,
      icon: CalendarDays,
      bg: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
      textColor: 'text-slate-800 dark:text-slate-200',
      labelColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      label: 'AI SUMMARIES',
      value: statistics.aiSummaries,
      icon: Sparkles,
      bg: 'bg-[#3155F6] text-white shadow-md shadow-blue-500/20',
      iconBg: 'bg-white/15 text-white',
      textColor: 'text-white',
      labelColor: 'text-white/70',
    },
    {
      label: 'STUDY HOURS',
      value: `${statistics.studyHours}h`,
      icon: Clock,
      bg: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      textColor: 'text-slate-800 dark:text-slate-200',
      labelColor: 'text-slate-400 dark:text-slate-500',
    },
    {
      label: 'ASSIGNMENTS',
      value: statistics.assignments,
      icon: BookOpen,
      bg: 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      textColor: 'text-slate-800 dark:text-slate-200',
      labelColor: 'text-slate-400 dark:text-slate-500',
    },
  ]

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800/80">
      <h3 className="text-base font-bold text-[#0b1c30] dark:text-white mb-4">Statistics</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <motion.div
            key={item.label}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`rounded-2xl p-4 flex flex-col justify-between min-h-[120px] transition-colors ${item.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${item.iconBg}`}>
                <item.icon className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className={`text-2xl font-bold tracking-tight ${item.textColor}`}>{item.value}</p>
              <p className={`text-[10px] font-bold tracking-wider mt-1 uppercase ${item.labelColor}`}>
                {item.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
