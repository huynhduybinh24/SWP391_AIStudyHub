import { Bell } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useToast } from '@/components/ui/Toast'
import { CustomSwitch } from './CustomSwitch'

export function NotificationCard() {
  const { notifications, updateNotifications } = useSettingsStore()
  const toast = useToast()

  const handleToggle = (key: 'emailNotifications' | 'pushNotifications') => {
    const nextVal = !notifications[key]
    updateNotifications({
      [key]: nextVal,
    })

    const title = key === 'emailNotifications' ? 'Email notifications' : 'Push notifications'
    if (nextVal) {
      toast.success(`${title} enabled`)
    } else {
      toast.success(`${title} disabled`)
    }
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
            <h3 id="email-notif-label" className="text-sm font-semibold text-foreground dark:text-slate-200">
              Email Notifications
            </h3>
            <p className="text-xs text-muted dark:text-slate-400">Receive weekly summaries and important alerts.</p>
          </div>
          <CustomSwitch
            checked={notifications.emailNotifications}
            onChange={() => handleToggle('emailNotifications')}
            aria-labelledby="email-notif-label"
          />
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 id="push-notif-label" className="text-sm font-semibold text-foreground dark:text-slate-200">
              Push Notifications
            </h3>
            <p className="text-xs text-muted dark:text-slate-400">Get immediate pings for AI assistance completion.</p>
          </div>
          <CustomSwitch
            checked={notifications.pushNotifications}
            onChange={() => handleToggle('pushNotifications')}
            aria-labelledby="push-notif-label"
          />
        </div>
      </div>
    </div>
  )
}

