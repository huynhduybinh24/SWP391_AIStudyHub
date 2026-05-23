import { Card, CardTitle } from '@/components/ui/Card'
import type { AlertItem } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

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
  return (
    <section className="col-span-3 space-y-4">
      <CardTitle className="normal-case tracking-normal text-base font-bold text-foreground">
        Recent Alerts
      </CardTitle>
      <Card className="divide-y divide-slate-200 dark:divide-slate-800 p-2">
        {alerts.map((alert) => (
          <article key={alert.id} className="flex gap-3 px-3 py-3">
            <span
              className={cn('mt-1.5 size-2 shrink-0 rounded-full', dotColors[alert.variant])}
            />
            <div>
              <p className="text-sm text-body">{alert.title}</p>
              <p className="mt-0.5 text-xs text-muted">{alert.time}</p>
            </div>
          </article>
        ))}
      </Card>
    </section>
  )
}
