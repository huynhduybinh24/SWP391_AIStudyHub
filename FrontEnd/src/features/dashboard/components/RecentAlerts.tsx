import { Card, CardTitle } from '@/components/ui/Card'
import type { AlertItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const dotColors = {
  info: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  neutral: 'bg-sky-400',
}

interface RecentAlertsProps {
  alerts: AlertItem[]
}

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  const { t } = useTranslation()

  // Map mock IDs to translated strings
  const getAlertTranslation = (alert: AlertItem) => {
    switch (alert.id) {
      case '1':
        return { title: t.dashboard.alert1, time: t.dashboard.time2h }
      case '2':
        return { title: t.dashboard.alert2, time: t.dashboard.time5h }
      case '3':
        return { title: t.dashboard.alert3, time: t.dashboard.time1d }
      case '4':
        return { title: t.dashboard.alert4, time: t.dashboard.time2d }
      default:
        return { title: alert.title, time: alert.time }
    }
  }

  return (
    <section className="col-span-3 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        {t.dashboard.recentAlerts}
      </CardTitle>
      <Card className="divide-y divide-slate-200 dark:divide-slate-800 p-2">
        {alerts.map((alert) => {
          const { title, time } = getAlertTranslation(alert)
          return (
            <article key={alert.id} className="flex gap-3 px-3 py-3">
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', dotColors[alert.variant])}
              />
              <div>
                <p className="text-sm text-body">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{time}</p>
              </div>
            </article>
          )
        })}
      </Card>
    </section>
  )
}

