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

  return (
    <section className="col-span-3 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        {t.dashboard.recentAlerts}
      </CardTitle>
      <Card className="divide-y divide-slate-200 dark:divide-slate-800 p-2">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t.notificationsPage.noNotifications}
          </div>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className="flex gap-3 px-3 py-3">
              <span
                className={cn('mt-1.5 size-2 shrink-0 rounded-full', dotColors[alert.variant])}
              />
              <div>
                <p className="text-sm text-body">{alert.title}</p>
                <p className="mt-0.5 text-xs text-muted">{alert.time}</p>
              </div>
            </article>
          ))
        )}
      </Card>
    </section>
  )
}

