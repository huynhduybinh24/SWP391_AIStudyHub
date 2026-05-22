import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'

export function NotificationCard() {
  const { notifications, updateNotifications } = useSettingsStore()

  const handleToggle = (key: 'emailNotifications' | 'pushNotifications') => {
    updateNotifications({
      [key]: !notifications[key],
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
          <Bell className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">Notifications</h2>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">Email Notifications</h3>
            <p className="text-xs text-muted dark:text-slate-400">Receive weekly summaries and important alerts.</p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('emailNotifications')}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 ${
              notifications.emailNotifications ? 'bg-[#2563eb]' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <motion.div
              layout
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {notifications.emailNotifications && (
                <svg className="h-3 w-3 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </motion.div>
          </button>
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground dark:text-slate-200">Push Notifications</h3>
            <p className="text-xs text-muted dark:text-slate-400">Get immediate pings for AI assistance completion.</p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('pushNotifications')}
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 ${
              notifications.pushNotifications ? 'bg-[#2563eb]' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <motion.div
              layout
              className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {notifications.pushNotifications && (
                <svg className="h-3 w-3 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </motion.div>
          </button>
        </div>
      </div>
    </div>
  )
}
